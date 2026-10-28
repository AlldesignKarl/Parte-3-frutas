package com.alldesignkarl.mipanel

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothA2dp
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothHeadset
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import org.json.JSONArray
import org.json.JSONObject
import java.lang.reflect.Method
import java.util.concurrent.ConcurrentHashMap

/**
 * Cascos conectados y su batería (la misma que sale en Ajustes > Bluetooth).
 *
 * Android la guarda pero no la da en su API pública: se lee con BluetoothDevice.getBatteryLevel()
 * por reflexión y, además, se escucha el aviso BATTERY_LEVEL_CHANGED que manda el sistema.
 */
class Headphones(private val context: Context, private val onChange: () -> Unit) {
    private val manager: BluetoothManager? = context.getSystemService(BluetoothManager::class.java)
    private val proxies = ConcurrentHashMap<Int, BluetoothProfile>()
    private val reported = ConcurrentHashMap<String, Int>()
    private var receiver: BroadcastReceiver? = null

    private val listener = object : BluetoothProfile.ServiceListener {
        override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
            proxies[profile] = proxy
            onChange()
        }

        override fun onServiceDisconnected(profile: Int) {
            proxies.remove(profile)
            onChange()
        }
    }

    fun hasPermission(): Boolean =
        Build.VERSION.SDK_INT < 31 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED

    /** Empieza a escuchar (se puede llamar varias veces; si aún no hay permiso, no hace nada). */
    @SuppressLint("MissingPermission")
    fun start() {
        val adapter = manager?.adapter ?: return
        if (!hasPermission()) return
        if (receiver == null) {
            val r = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    if (intent.action == ACTION_BATTERY_LEVEL_CHANGED) {
                        val device = IntentCompat.getParcelableExtra(intent, BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
                        val level = intent.getIntExtra(EXTRA_BATTERY_LEVEL, -1)
                        val address = device?.let { runCatching { it.address }.getOrNull() }
                        if (address != null) {
                            if (level in 0..100) reported[address] = level else reported.remove(address)
                        }
                    }
                    onChange()
                }
            }
            val filter = IntentFilter().apply {
                addAction(ACTION_BATTERY_LEVEL_CHANGED)
                addAction(BluetoothDevice.ACTION_ACL_CONNECTED)
                addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED)
                addAction(BluetoothA2dp.ACTION_CONNECTION_STATE_CHANGED)
                addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)
            }
            ContextCompat.registerReceiver(context, r, filter, ContextCompat.RECEIVER_EXPORTED)
            receiver = r
        }
        for (profile in audioProfiles()) {
            if (!proxies.containsKey(profile)) runCatching { adapter.getProfileProxy(context, listener, profile) }
        }
    }

    fun close() {
        receiver?.let { runCatching { context.unregisterReceiver(it) } }
        receiver = null
        val adapter = manager?.adapter
        proxies.forEach { (profile, proxy) -> runCatching { adapter?.closeProfileProxy(profile, proxy) } }
        proxies.clear()
    }

    /** { permission, on, devices: [{ name, battery }] } */
    @SuppressLint("MissingPermission")
    fun json(): String {
        val adapter = manager?.adapter ?: return JSONObject().put("supported", false).toString()
        if (!hasPermission()) return JSONObject().put("supported", true).put("permission", false).toString()
        val out = JSONObject().put("supported", true).put("permission", true)
        return try {
            out.put("on", adapter.isEnabled)
            val connected = LinkedHashMap<String, BluetoothDevice>()
            for (proxy in proxies.values) {
                runCatching { proxy.connectedDevices }.getOrNull()?.forEach { connected[it.address] = it }
            }
            val devices = JSONArray()
            for (device in connected.values) {
                val battery = device.batteryLevelCompat() ?: reported[device.address]
                devices.put(JSONObject().put("name", device.displayName()).put("battery", battery ?: JSONObject.NULL))
            }
            out.put("devices", devices).toString()
        } catch (_: SecurityException) {
            JSONObject().put("supported", true).put("permission", false).toString()
        }
    }

    private fun audioProfiles(): List<Int> = buildList {
        add(BluetoothProfile.A2DP)
        add(BluetoothProfile.HEADSET)
        if (Build.VERSION.SDK_INT >= 29) add(BluetoothProfile.HEARING_AID)
        if (Build.VERSION.SDK_INT >= 33) add(BluetoothProfile.LE_AUDIO)
    }

    @SuppressLint("MissingPermission")
    private fun BluetoothDevice.displayName(): String {
        val alias = if (Build.VERSION.SDK_INT >= 30) runCatching { alias }.getOrNull() else null
        return alias?.takeIf { it.isNotBlank() }
            ?: runCatching { name }.getOrNull()?.takeIf { it.isNotBlank() }
            ?: "Cascos"
    }

    private companion object {
        const val ACTION_BATTERY_LEVEL_CHANGED = "android.bluetooth.device.action.BATTERY_LEVEL_CHANGED"
        const val EXTRA_BATTERY_LEVEL = "android.bluetooth.device.extra.BATTERY_LEVEL"
    }
}

private val getBatteryLevelMethod: Method? by lazy {
    runCatching { BluetoothDevice::class.java.getMethod("getBatteryLevel") }.getOrNull()
}

private fun BluetoothDevice.batteryLevelCompat(): Int? =
    runCatching { getBatteryLevelMethod?.invoke(this) as? Int }.getOrNull()?.takeIf { it in 0..100 }
