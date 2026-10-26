package com.alldesignkarl.mipanel.estado

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.LinkProperties
import android.net.wifi.ScanResult
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
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
import java.net.Inet4Address

enum class NetKind { WIFI, MOBILE, ETHERNET, OTHER, NONE }

data class WifiDetails(
    /** Nombre de la red, o null si Android no lo deja ver (falta permiso o ubicación). */
    val ssid: String?,
    val rssi: Int?,
    val linkMbps: Int?,
    val txMbps: Int?,
    val rxMbps: Int?,
    val frequencyMhz: Int?,
    val standard: String?,
) {
    val band: String?
        get() = when (frequencyMhz) {
            null -> null
            in 2400..2500 -> "2,4 GHz"
            in 4900..5900 -> "5 GHz"
            in 5925..7125 -> "6 GHz"
            else -> null
        }

    val channel: Int?
        get() = when (val f = frequencyMhz) {
            null -> null
            2484 -> 14
            in 2412..2472 -> (f - 2407) / 5
            in 5000..5900 -> (f - 5000) / 5
            in 5955..7115 -> (f - 5950) / 5
            else -> null
        }
}

data class NetworkInfo(
    val kind: NetKind,
    /** Android ha comprobado que hay salida real a internet. */
    val internet: Boolean,
    val metered: Boolean,
    val vpn: Boolean,
    val downKbps: Int?,
    val upKbps: Int?,
    val ipAddress: String?,
    val wifi: WifiDetails?,
    /** Barras de cobertura móvil (0-4) cuando se usan datos. */
    val mobileLevel: Int?,
    val hasLocationPermission: Boolean,
    val locationEnabled: Boolean,
)

/** Estado de la conexión: cambia al momento cuando Android avisa y se refresca cada 2 s. */
class NetworkMonitor(private val context: Context) {
    private val connectivity = context.getSystemService(ConnectivityManager::class.java)
    private val wifiManager = context.applicationContext.getSystemService(WifiManager::class.java)
    private val telephony = context.getSystemService(TelephonyManager::class.java)
    private val locationManager = context.getSystemService(LocationManager::class.java)

    fun flow(): Flow<NetworkInfo> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(snapshot())
            }

            override fun onLost(network: Network) {
                trySend(snapshot())
            }

            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                trySend(snapshot())
            }

            override fun onLinkPropertiesChanged(network: Network, lp: LinkProperties) {
                trySend(snapshot())
            }
        }
        val registered = runCatching { connectivity?.registerDefaultNetworkCallback(callback) }.isSuccess
        val ticker = launch {
            while (isActive) {
                trySend(snapshot())
                delay(2_000)
            }
        }
        awaitClose {
            ticker.cancel()
            if (registered) runCatching { connectivity?.unregisterNetworkCallback(callback) }
        }
    }.conflate().distinctUntilChanged().flowOn(Dispatchers.Default)

    private fun snapshot(): NetworkInfo {
        val network = connectivity?.activeNetwork
        val caps = network?.let { runCatching { connectivity?.getNetworkCapabilities(it) }.getOrNull() }
        val links = network?.let { runCatching { connectivity?.getLinkProperties(it) }.getOrNull() }

        val kind = when {
            caps == null -> NetKind.NONE
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetKind.WIFI
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetKind.MOBILE
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> NetKind.ETHERNET
            else -> NetKind.OTHER
        }

        val hasLocation = hasLocationPermission()
        return NetworkInfo(
            kind = kind,
            internet = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true,
            metered = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == false,
            vpn = caps?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true,
            downKbps = caps?.linkDownstreamBandwidthKbps?.takeIf { it > 0 },
            upKbps = caps?.linkUpstreamBandwidthKbps?.takeIf { it > 0 },
            ipAddress = links?.linkAddresses
                ?.map { it.address }
                ?.firstOrNull { it is Inet4Address && !it.isLoopbackAddress }
                ?.hostAddress,
            wifi = if (kind == NetKind.WIFI) wifiDetails(caps) else null,
            mobileLevel = if (kind == NetKind.MOBILE) mobileLevel() else null,
            hasLocationPermission = hasLocation,
            locationEnabled = locationManager?.let { LocationManagerCompat.isLocationEnabled(it) } == true,
        )
    }

    @Suppress("DEPRECATION")
    private fun wifiDetails(caps: NetworkCapabilities?): WifiDetails? {
        // connectionInfo sigue funcionando y es el único que da el nombre de la red con permiso de ubicación.
        val legacy = runCatching { wifiManager?.connectionInfo }.getOrNull()
        val modern = if (Build.VERSION.SDK_INT >= 29) caps?.transportInfo as? WifiInfo else null
        val info = legacy?.takeIf { it.rssi > INVALID_RSSI } ?: modern ?: legacy ?: return null

        val ssid = (legacy?.ssid ?: info.ssid)
            ?.removeSurrounding("\"")
            ?.takeIf { it.isNotBlank() && it != UNKNOWN_SSID }

        return WifiDetails(
            ssid = ssid,
            rssi = info.rssi.takeIf { it > INVALID_RSSI && it < 0 },
            linkMbps = info.linkSpeed.takeIf { it > 0 },
            txMbps = if (Build.VERSION.SDK_INT >= 29) info.txLinkSpeedMbps.takeIf { it > 0 } else null,
            rxMbps = if (Build.VERSION.SDK_INT >= 29) info.rxLinkSpeedMbps.takeIf { it > 0 } else null,
            frequencyMhz = info.frequency.takeIf { it > 0 },
            standard = if (Build.VERSION.SDK_INT >= 30) standardName(info.wifiStandard) else null,
        )
    }

    private fun mobileLevel(): Int? =
        if (Build.VERSION.SDK_INT >= 28) runCatching { telephony?.signalStrength?.level }.getOrNull() else null

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun standardName(standard: Int): String? = when (standard) {
        ScanResult.WIFI_STANDARD_LEGACY -> "WiFi 1-3"
        ScanResult.WIFI_STANDARD_11N -> "WiFi 4 (n)"
        ScanResult.WIFI_STANDARD_11AC -> "WiFi 5 (ac)"
        ScanResult.WIFI_STANDARD_11AX -> "WiFi 6 (ax)"
        ScanResult.WIFI_STANDARD_11AD -> "WiGig (ad)"
        WIFI_STANDARD_11BE -> "WiFi 7 (be)"
        else -> null
    }

    private companion object {
        const val INVALID_RSSI = -127
        const val UNKNOWN_SSID = "<unknown ssid>"
        /** ScanResult.WIFI_STANDARD_11BE (API 33). */
        const val WIFI_STANDARD_11BE = 8
    }
}

/** Calidad de la señal WiFi a partir de los dBm. */
enum class SignalQuality(val label: String) {
    EXCELLENT("Excelente"),
    GOOD("Buena"),
    FAIR("Regular"),
    WEAK("Débil"),
    BAD("Muy débil");

    companion object {
        fun fromRssi(rssi: Int): SignalQuality = when {
            rssi >= -55 -> EXCELLENT
            rssi >= -67 -> GOOD
            rssi >= -75 -> FAIR
            rssi >= -85 -> WEAK
            else -> BAD
        }

        /** -100 dBm = 0 %, -50 dBm o más = 100 %. */
        fun percent(rssi: Int): Int = ((rssi + 100) * 2).coerceIn(0, 100)

        /** Barras de 0 a 4. */
        fun bars(rssi: Int): Int = when (fromRssi(rssi)) {
            EXCELLENT -> 4
            GOOD -> 3
            FAIR -> 2
            WEAK -> 1
            BAD -> 0
        }
    }
}
