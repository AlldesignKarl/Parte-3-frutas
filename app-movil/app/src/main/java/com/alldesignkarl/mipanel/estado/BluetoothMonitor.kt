package com.alldesignkarl.mipanel.estado

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothA2dp
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothClass
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.conflate
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.lang.reflect.Method
import java.util.concurrent.ConcurrentHashMap

enum class DeviceKind { AUDIO, WATCH, OTHER }

data class BtDevice(
    val address: String,
    val name: String,
    val kind: DeviceKind,
    /** 0..100, o null si el dispositivo no comparte su batería con Android. */
    val battery: Int?,
)

sealed interface BluetoothState {
    data object Loading : BluetoothState
    data object Unsupported : BluetoothState
    data object NoPermission : BluetoothState
    data object Off : BluetoothState
    data class Ready(val devices: List<BtDevice>) : BluetoothState
}

/**
 * Dispositivos Bluetooth conectados (cascos, relojes...) y su batería.
 *
 * Android guarda la batería que informan los cascos (la misma que sale en Ajustes),
 * pero no la ofrece en su API pública: se lee con BluetoothDevice.getBatteryLevel()
 * por reflexión y, además, se escucha el aviso BATTERY_LEVEL_CHANGED que manda el sistema.
 */
class BluetoothMonitor(private val context: Context) {
    private val manager: BluetoothManager? = context.getSystemService(BluetoothManager::class.java)

    fun hasPermission(): Boolean =
        Build.VERSION.SDK_INT < 31 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) ==
            PackageManager.PERMISSION_GRANTED

    fun flow(): Flow<BluetoothState> {
        val adapter = manager?.adapter ?: return flowOf(BluetoothState.Unsupported)
        return callbackFlow {
            val reportedLevels = ConcurrentHashMap<String, Int>()
            val proxies = ConcurrentHashMap<Int, BluetoothProfile>()
            var proxiesRequested = false

            fun emitSnapshot() {
                trySend(snapshot(adapter, proxies, reportedLevels))
            }

            val listener = object : BluetoothProfile.ServiceListener {
                override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
                    proxies[profile] = proxy
                    emitSnapshot()
                }

                override fun onServiceDisconnected(profile: Int) {
                    proxies.remove(profile)
                    emitSnapshot()
                }
            }

            fun requestProxies() {
                if (proxiesRequested || !hasPermission()) return
                proxiesRequested = true
                for (profile in audioProfiles()) {
                    runCatching { adapter.getProfileProxy(context, listener, profile) }
                }
            }

            val receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    if (intent.action == ACTION_BATTERY_LEVEL_CHANGED) {
                        val device = IntentCompat.getParcelableExtra(
                            intent,
                            BluetoothDevice.EXTRA_DEVICE,
                            BluetoothDevice::class.java,
                        )
                        val level = intent.getIntExtra(EXTRA_BATTERY_LEVEL, -1)
                        val address = device?.let { runCatching { it.address }.getOrNull() }
                        if (address != null) {
                            if (level in 0..100) reportedLevels[address] = level else reportedLevels.remove(address)
                        }
                    }
                    requestProxies()
                    emitSnapshot()
                }
            }
            val filter = IntentFilter().apply {
                addAction(ACTION_BATTERY_LEVEL_CHANGED)
                addAction(BluetoothDevice.ACTION_ACL_CONNECTED)
                addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED)
                addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
                addAction(BluetoothA2dp.ACTION_CONNECTION_STATE_CHANGED)
                addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)
            }
            ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_EXPORTED)

            requestProxies()
            val ticker = launch {
                while (isActive) {
                    // Por si se acaba de dar el permiso o los cascos cambian de batería sin avisar.
                    requestProxies()
                    emitSnapshot()
                    delay(3_000)
                }
            }

            awaitClose {
                ticker.cancel()
                runCatching { context.unregisterReceiver(receiver) }
                proxies.forEach { (profile, proxy) -> runCatching { adapter.closeProfileProxy(profile, proxy) } }
            }
        }.conflate().distinctUntilChanged().flowOn(Dispatchers.Default)
    }

    @SuppressLint("MissingPermission")
    private fun snapshot(
        adapter: BluetoothAdapter,
        proxies: Map<Int, BluetoothProfile>,
        reportedLevels: Map<String, Int>,
    ): BluetoothState {
        if (!hasPermission()) return BluetoothState.NoPermission
        return try {
            if (!adapter.isEnabled) return BluetoothState.Off

            val connected = LinkedHashMap<String, Pair<BluetoothDevice, Boolean>>() // dispositivo, ¿es de audio?
            for ((_, proxy) in proxies) {
                runCatching { proxy.connectedDevices }.getOrNull()?.forEach { device ->
                    connected[device.address] = device to true
                }
            }
            runCatching { manager?.getConnectedDevices(BluetoothProfile.GATT) }.getOrNull()?.forEach { device ->
                connected.putIfAbsent(device.address, device to false)
            }
            runCatching { adapter.bondedDevices }.getOrNull()?.forEach { device ->
                if (device.isConnectedCompat()) connected.putIfAbsent(device.address, device to false)
            }

            val devices = connected.values.map { (device, viaAudioProfile) ->
                BtDevice(
                    address = device.address,
                    name = device.displayName(),
                    kind = device.kind(viaAudioProfile),
                    battery = device.batteryLevelCompat() ?: reportedLevels[device.address],
                )
            }.sortedWith(compareBy<BtDevice>({ it.kind.ordinal }, { it.name.lowercase() }))

            BluetoothState.Ready(devices)
        } catch (_: SecurityException) {
            BluetoothState.NoPermission
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
            ?: "Dispositivo Bluetooth"
    }

    @SuppressLint("MissingPermission")
    private fun BluetoothDevice.kind(viaAudioProfile: Boolean): DeviceKind {
        val major = runCatching { bluetoothClass?.majorDeviceClass }.getOrNull()
        return when {
            viaAudioProfile || major == BluetoothClass.Device.Major.AUDIO_VIDEO -> DeviceKind.AUDIO
            major == BluetoothClass.Device.Major.WEARABLE -> DeviceKind.WATCH
            else -> DeviceKind.OTHER
        }
    }

    private companion object {
        const val ACTION_BATTERY_LEVEL_CHANGED = "android.bluetooth.device.action.BATTERY_LEVEL_CHANGED"
        const val EXTRA_BATTERY_LEVEL = "android.bluetooth.device.extra.BATTERY_LEVEL"
    }
}

private val getBatteryLevelMethod: Method? by lazy {
    runCatching { BluetoothDevice::class.java.getMethod("getBatteryLevel") }.getOrNull()
}

private val isConnectedMethod: Method? by lazy {
    runCatching { BluetoothDevice::class.java.getMethod("isConnected") }.getOrNull()
}

/** Batería que el sistema conoce de este dispositivo (la que se ve en Ajustes > Bluetooth). */
private fun BluetoothDevice.batteryLevelCompat(): Int? =
    runCatching { getBatteryLevelMethod?.invoke(this) as? Int }.getOrNull()?.takeIf { it in 0..100 }

private fun BluetoothDevice.isConnectedCompat(): Boolean =
    runCatching { isConnectedMethod?.invoke(this) as? Boolean }.getOrNull() == true
