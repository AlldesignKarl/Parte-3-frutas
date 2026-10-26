package com.alldesignkarl.mipanel.estado

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.conflate
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.roundToLong

enum class ChargeState { CHARGING, DISCHARGING, FULL, NOT_CHARGING, UNKNOWN }

enum class PowerSource(val label: String) {
    AC("Cargador"),
    USB("USB"),
    WIRELESS("Inalámbrica"),
    DOCK("Base"),
}

data class BatteryInfo(
    val percent: Int,
    val state: ChargeState,
    val source: PowerSource?,
    val temperatureC: Float?,
    val voltageV: Float?,
    /** Corriente en mA, siempre positiva: el sentido lo dice [state]. */
    val currentMa: Int?,
    val chargeMah: Int?,
    val health: String?,
    val technology: String?,
    val cycleCount: Int?,
    /** Tiempo hasta el 100 % (cargando) o tiempo de uso estimado (descargando). */
    val timeToFullMs: Long?,
    val timeLeftMs: Long?,
) {
    val isPlugged: Boolean get() = source != null
}

/**
 * Lee la batería del móvil: el sistema avisa cuando cambia el porcentaje y además
 * se consulta cada 2 s para que la corriente y la estimación de tiempo vayan al día.
 */
class BatteryMonitor(private val context: Context) {
    private val manager = context.getSystemService(BatteryManager::class.java)

    fun flow(): Flow<BatteryInfo> = callbackFlow {
        val lastIntent = AtomicReference<Intent?>(null)
        val smoother = CurrentSmoother()
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                lastIntent.set(intent)
                trySend(read(intent, smoother))
            }
        }
        val sticky = ContextCompat.registerReceiver(
            context,
            receiver,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
            ContextCompat.RECEIVER_EXPORTED,
        )
        if (sticky != null) {
            lastIntent.set(sticky)
            trySend(read(sticky, smoother))
        }
        val ticker = launch {
            while (isActive) {
                delay(2_000)
                lastIntent.get()?.let { trySend(read(it, smoother)) }
            }
        }
        awaitClose {
            ticker.cancel()
            runCatching { context.unregisterReceiver(receiver) }
        }
    }.conflate().distinctUntilChanged().flowOn(Dispatchers.Default)

    private fun read(intent: Intent, smoother: CurrentSmoother): BatteryInfo {
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val percent = if (level >= 0 && scale > 0) {
            (level * 100f / scale).roundToInt()
        } else {
            property(BatteryManager.BATTERY_PROPERTY_CAPACITY)?.takeIf { it in 0..100 } ?: 0
        }

        val plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0)
        val source = when {
            plugged and BatteryManager.BATTERY_PLUGGED_AC != 0 -> PowerSource.AC
            plugged and BatteryManager.BATTERY_PLUGGED_USB != 0 -> PowerSource.USB
            plugged and BatteryManager.BATTERY_PLUGGED_WIRELESS != 0 -> PowerSource.WIRELESS
            plugged and PLUGGED_DOCK != 0 -> PowerSource.DOCK
            else -> null
        }

        val state = when (intent.getIntExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_UNKNOWN)) {
            BatteryManager.BATTERY_STATUS_CHARGING -> ChargeState.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> ChargeState.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> ChargeState.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> ChargeState.NOT_CHARGING
            else -> if (source == null) ChargeState.DISCHARGING else ChargeState.UNKNOWN
        }

        val temperature = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
            .takeIf { it != Int.MIN_VALUE && it > -500 }
            ?.let { it / 10f }

        val voltage = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1)
            .takeIf { it > 0 }
            ?.let { if (it > 100) it / 1000f else it.toFloat() } // casi todos dan mV, alguno da V

        val currentMa = property(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)?.let { toMilliamps(it) }
        val averageMa = smoother.add(currentMa, charging = state == ChargeState.CHARGING)

        val chargeMah = property(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
            ?.takeIf { it > 0 }
            ?.let { it / 1000 }
            ?.takeIf { it in 50..50_000 }

        val health = when (intent.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "Buena"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "Sobrecalentada"
            BatteryManager.BATTERY_HEALTH_DEAD -> "Agotada"
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "Sobretensión"
            BatteryManager.BATTERY_HEALTH_COLD -> "Muy fría"
            BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE -> "Con fallos"
            else -> null
        }

        val technology = intent.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY)?.takeIf { it.isNotBlank() }

        val cycles = if (Build.VERSION.SDK_INT >= 34) {
            intent.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1).takeIf { it >= 0 }
        } else {
            null
        }

        val charging = state == ChargeState.CHARGING
        val timeToFull = if (charging) estimateTimeToFull(percent, chargeMah, averageMa) else null
        val timeLeft = if (state == ChargeState.DISCHARGING) estimateTimeLeft(chargeMah, averageMa) else null

        return BatteryInfo(
            percent = percent,
            state = state,
            source = source,
            temperatureC = temperature,
            voltageV = voltage,
            currentMa = currentMa?.let { abs(it) },
            chargeMah = chargeMah,
            health = health,
            technology = technology,
            cycleCount = cycles,
            timeToFullMs = timeToFull,
            timeLeftMs = timeLeft,
        )
    }

    private fun estimateTimeToFull(percent: Int, chargeMah: Int?, averageMa: Double?): Long? {
        if (Build.VERSION.SDK_INT >= 28) {
            val fromSystem = manager?.computeChargeTimeRemaining() ?: -1
            if (fromSystem > 0) return fromSystem
        }
        if (chargeMah == null || averageMa == null || averageMa < 50 || percent !in 1..99) return null
        val fullMah = chargeMah * 100.0 / percent
        val hours = (fullMah - chargeMah) / averageMa
        return (hours * 3_600_000).roundToLong().takeIf { it in 60_000..(24 * 3_600_000L) }
    }

    private fun estimateTimeLeft(chargeMah: Int?, averageMa: Double?): Long? {
        if (chargeMah == null || averageMa == null || averageMa < 20) return null
        val hours = chargeMah / averageMa
        return (hours * 3_600_000).roundToLong().takeIf { it in 60_000..(7 * 24 * 3_600_000L) }
    }

    private fun property(id: Int): Int? =
        manager?.getIntProperty(id)?.takeIf { it != Int.MIN_VALUE && it != 0 }

    /** Android pide microamperios, pero algunos fabricantes devuelven miliamperios. */
    private fun toMilliamps(raw: Int): Int = if (abs(raw) >= 10_000) raw / 1000 else raw

    /** Media móvil del consumo para que la estimación de tiempo no salte a cada segundo. */
    private class CurrentSmoother {
        private var average: Double? = null
        private var wasCharging: Boolean? = null

        @Synchronized
        fun add(currentMa: Int?, charging: Boolean): Double? {
            if (wasCharging != charging) {
                // Al enchufar o desenchufar el consumo cambia de golpe: se empieza de cero.
                average = null
                wasCharging = charging
            }
            if (currentMa == null) return average
            val value = abs(currentMa).toDouble()
            average = average?.let { it * 0.8 + value * 0.2 } ?: value
            return average
        }
    }

    private companion object {
        /** BatteryManager.BATTERY_PLUGGED_DOCK (API 33). */
        const val PLUGGED_DOCK = 8
    }
}
