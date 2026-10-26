package com.alldesignkarl.mipanel.estado

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.alldesignkarl.mipanel.R
import com.alldesignkarl.mipanel.ui.InfoGrid
import com.alldesignkarl.mipanel.ui.LabeledMeter
import com.alldesignkarl.mipanel.ui.LocalStatusColors
import com.alldesignkarl.mipanel.ui.Meter
import com.alldesignkarl.mipanel.ui.SectionCard
import com.alldesignkarl.mipanel.ui.batteryColor
import com.alldesignkarl.mipanel.util.Fmt

/** Acciones de la pantalla de estado (permisos, ajustes, test de velocidad). */
data class StatusActions(
    val requestBluetooth: () -> Unit = {},
    val bluetoothDenied: Boolean = false,
    val openBluetoothSettings: () -> Unit = {},
    val requestLocation: () -> Unit = {},
    val openLocationSettings: () -> Unit = {},
    val runSpeedTest: () -> Unit = {},
    val cancelSpeedTest: () -> Unit = {},
)

@Composable
fun StatusScreen(vm: StatusViewModel = viewModel()) {
    val context = LocalContext.current
    val battery by vm.battery.collectAsStateWithLifecycle()
    val bluetooth by vm.bluetooth.collectAsStateWithLifecycle()
    val network by vm.network.collectAsStateWithLifecycle()
    val device by vm.device.collectAsStateWithLifecycle()
    val speed by vm.speedTest.collectAsStateWithLifecycle()

    var bluetoothDenied by rememberSaveable { mutableStateOf(false) }
    var confirmMobileTest by remember { mutableStateOf(false) }

    val bluetoothPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        bluetoothDenied = !granted
    }
    val locationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { }

    val actions = StatusActions(
        requestBluetooth = {
            if (bluetoothDenied) {
                context.openAppSettings()
            } else if (Build.VERSION.SDK_INT >= 31) {
                bluetoothPermission.launch(Manifest.permission.BLUETOOTH_CONNECT)
            }
        },
        bluetoothDenied = bluetoothDenied,
        openBluetoothSettings = { context.openSettings(Settings.ACTION_BLUETOOTH_SETTINGS) },
        requestLocation = {
            locationPermission.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        },
        openLocationSettings = { context.openSettings(Settings.ACTION_LOCATION_SOURCE_SETTINGS) },
        runSpeedTest = {
            if (network?.kind == NetKind.MOBILE) confirmMobileTest = true else vm.runSpeedTest()
        },
        cancelSpeedTest = vm::cancelSpeedTest,
    )

    StatusContent(battery, bluetooth, network, device, speed, actions)

    if (confirmMobileTest) {
        AlertDialog(
            onDismissRequest = { confirmMobileTest = false },
            title = { Text("Estás con datos móviles") },
            text = { Text("El test descarga y sube datos durante unos segundos: puede gastar entre 20 y 150 MB de tu tarifa.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmMobileTest = false
                    vm.runSpeedTest()
                }) { Text("Medir igualmente") }
            },
            dismissButton = { TextButton(onClick = { confirmMobileTest = false }) { Text("Cancelar") } },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatusContent(
    battery: BatteryInfo?,
    bluetooth: BluetoothState,
    network: NetworkInfo?,
    device: DeviceInfo?,
    speed: SpeedTestState,
    actions: StatusActions,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mi móvil", fontWeight = FontWeight.SemiBold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item(key = "bateria") { BatteryCard(battery) }
            item(key = "bluetooth") { BluetoothCard(bluetooth, actions) }
            item(key = "red") { NetworkCard(network, speed, actions) }
            item(key = "movil") { DeviceCard(device) }
        }
    }
}

// ---------------------------------------------------------------- Batería

@Composable
private fun BatteryCard(info: BatteryInfo?) {
    SectionCard(icon = R.drawable.ic_battery, title = "Batería") {
        if (info == null) {
            Text("Leyendo la batería…", color = MaterialTheme.colorScheme.onSurfaceVariant)
            return@SectionCard
        }
        val color = batteryColor(info.percent)
        Row(verticalAlignment = Alignment.CenterVertically) {
            BatteryRing(info.percent, info.state == ChargeState.CHARGING, color, Modifier.size(136.dp))
            Spacer(Modifier.width(18.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    batteryHeadline(info),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = if (info.state == ChargeState.CHARGING || info.state == ChargeState.FULL) {
                        LocalStatusColors.current.good
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                )
                info.source?.let {
                    Text(
                        "Enchufado: ${it.label}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                batteryTime(info)?.let {
                    Spacer(Modifier.height(6.dp))
                    Text(it, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        val details = buildList {
            info.temperatureC?.let { add("Temperatura" to "${Fmt.decimal(it.toDouble())} °C") }
            info.voltageV?.let { add("Voltaje" to "${Fmt.decimal(it.toDouble(), 2)} V") }
            info.currentMa?.let {
                val direction = when (info.state) {
                    ChargeState.CHARGING -> "Entrando"
                    ChargeState.DISCHARGING -> "Consumo"
                    else -> "Corriente"
                }
                add(direction to "${Fmt.int(it)} mA")
            }
            info.chargeMah?.let { add("Carga actual" to "${Fmt.int(it)} mAh") }
            info.health?.let { add("Salud" to it) }
            info.cycleCount?.let { add("Ciclos de carga" to Fmt.int(it)) }
            info.technology?.let { add("Tipo" to it) }
        }
        InfoGrid(details)
    }
}

private fun batteryHeadline(info: BatteryInfo): String = when (info.state) {
    ChargeState.CHARGING -> "Cargando"
    ChargeState.FULL -> "Carga completa"
    ChargeState.NOT_CHARGING -> if (info.isPlugged) "Enchufado sin cargar" else "Sin cargar"
    ChargeState.DISCHARGING -> "Con batería"
    ChargeState.UNKNOWN -> "Estado desconocido"
}

private fun batteryTime(info: BatteryInfo): String? = when {
    info.timeToFullMs != null -> "Al 100 % en ${Fmt.duration(info.timeToFullMs)}"
    info.timeLeftMs != null -> "≈ ${Fmt.duration(info.timeLeftMs)} de uso con el consumo de ahora"
    info.state == ChargeState.NOT_CHARGING && info.isPlugged ->
        "El móvil ha pausado la carga (protección de batería o se ha calentado)"
    else -> null
}

@Composable
private fun BatteryRing(percent: Int, charging: Boolean, color: Color, modifier: Modifier = Modifier) {
    val animated by animateFloatAsState(percent / 100f, animationSpec = tween(700), label = "bateria")
    val track = MaterialTheme.colorScheme.surfaceContainerHighest
    Box(modifier, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val stroke = 14.dp.toPx()
            val inset = stroke / 2
            val arcSize = Size(size.width - stroke, size.height - stroke)
            drawArc(track, 0f, 360f, false, Offset(inset, inset), arcSize, style = Stroke(stroke))
            drawArc(
                color,
                -90f,
                360f * animated,
                false,
                Offset(inset, inset),
                arcSize,
                style = Stroke(stroke, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (charging) {
                Icon(
                    painterResource(R.drawable.ic_bolt),
                    contentDescription = "Cargando",
                    tint = color,
                    modifier = Modifier.size(22.dp),
                )
            }
            Text(
                "$percent %",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

// ---------------------------------------------------------------- Bluetooth

@Composable
private fun BluetoothCard(state: BluetoothState, actions: StatusActions) {
    SectionCard(icon = R.drawable.ic_headphones, title = "Cascos y Bluetooth") {
        when (state) {
            BluetoothState.Loading -> Hint("Buscando dispositivos…")
            BluetoothState.Unsupported -> Hint("Este móvil no tiene Bluetooth.")
            BluetoothState.NoPermission -> {
                Hint(
                    "Para ver tus cascos y su batería, la app necesita el permiso de " +
                        "\"Dispositivos cercanos\". Solo lo usa para leer lo que ya está conectado."
                )
                Spacer(Modifier.height(12.dp))
                Button(onClick = actions.requestBluetooth) {
                    Text(if (actions.bluetoothDenied) "Abrir ajustes para darlo" else "Dar permiso")
                }
            }
            BluetoothState.Off -> {
                Hint("El Bluetooth está apagado.")
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = actions.openBluetoothSettings) { Text("Abrir Bluetooth") }
            }
            is BluetoothState.Ready -> {
                if (state.devices.isEmpty()) {
                    Hint("No hay nada conectado ahora. Cuando conectes los cascos aparecerán aquí con su batería.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        state.devices.forEach { BtDeviceRow(it) }
                    }
                    if (state.devices.any { it.battery == null }) {
                        Spacer(Modifier.height(14.dp))
                        Text(
                            "Si sale \"batería no disponible\" es que ese aparato no le pasa su batería a Android " +
                                "(pasa con algunos cascos; la app de su marca sí suele mostrarla).",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun BtDeviceRow(device: BtDevice) {
    val icon = when (device.kind) {
        DeviceKind.AUDIO -> R.drawable.ic_headphones
        DeviceKind.WATCH -> R.drawable.ic_watch
        DeviceKind.OTHER -> R.drawable.ic_bluetooth
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            painterResource(icon),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(28.dp),
        )
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    device.name,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                )
                device.battery?.let {
                    Text(
                        "$it %",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = batteryColor(it),
                    )
                }
            }
            Spacer(Modifier.height(6.dp))
            if (device.battery != null) {
                Meter(device.battery / 100f, batteryColor(device.battery), height = 8)
            } else {
                Text(
                    "Batería no disponible",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

// ---------------------------------------------------------------- Red

@Composable
private fun NetworkCard(info: NetworkInfo?, speed: SpeedTestState, actions: StatusActions) {
    SectionCard(icon = R.drawable.ic_wifi, title = "WiFi e internet") {
        val status = LocalStatusColors.current
        when {
            info == null -> Hint("Comprobando la conexión…")
            info.kind == NetKind.NONE -> {
                Text(
                    "Sin conexión",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = status.bad,
                )
                Hint("No estás conectado ni a una WiFi ni a datos móviles.")
            }
            info.kind == NetKind.WIFI && info.wifi != null -> WifiDetailsBlock(info, info.wifi, actions)
            else -> OtherConnectionBlock(info)
        }

        if (info != null && info.kind != NetKind.NONE) {
            Spacer(Modifier.height(18.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(Modifier.height(16.dp))
            SpeedTestBlock(speed, actions)
        }
    }
}

@Composable
private fun WifiDetailsBlock(info: NetworkInfo, wifi: WifiDetails, actions: StatusActions) {
    val status = LocalStatusColors.current
    val rssi = wifi.rssi
    val quality = rssi?.let { SignalQuality.fromRssi(it) }
    val qualityColor = when (quality) {
        SignalQuality.EXCELLENT, SignalQuality.GOOD -> status.good
        SignalQuality.FAIR -> status.warning
        SignalQuality.WEAK, SignalQuality.BAD -> status.bad
        null -> status.neutral
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
        SignalBars(rssi?.let { SignalQuality.bars(it) } ?: 0, qualityColor, Modifier.size(width = 52.dp, height = 40.dp))
        Spacer(Modifier.width(16.dp))
        Column(Modifier.weight(1f)) {
            Text(
                "Señal ${quality?.label?.lowercase() ?: "desconocida"}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = qualityColor,
            )
            if (rssi != null) {
                Text(
                    "$rssi dBm · ${SignalQuality.percent(rssi)} % de intensidad",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
    Spacer(Modifier.height(12.dp))
    InternetLine(info)
    Spacer(Modifier.height(14.dp))

    val items = buildList {
        add("Red" to (wifi.ssid ?: "Oculta"))
        wifi.band?.let { band -> add("Banda" to (wifi.channel?.let { "$band · canal $it" } ?: band)) }
        wifi.standard?.let { add("Tipo" to it) }
        when {
            wifi.txMbps != null && wifi.rxMbps != null -> add("Enlace con el router" to "↓${wifi.rxMbps} ↑${wifi.txMbps} Mbps")
            wifi.linkMbps != null -> add("Enlace con el router" to "${wifi.linkMbps} Mbps")
        }
        info.ipAddress?.let { add("IP en la red" to it) }
        if (info.vpn) add("VPN" to "Activa")
    }
    InfoGrid(items)

    if (wifi.ssid == null) {
        Spacer(Modifier.height(10.dp))
        if (!info.hasLocationPermission) {
            TextButton(onClick = actions.requestLocation, contentPadding = PaddingValues(0.dp)) {
                Text("Ver el nombre de la WiFi (Android pide permiso de ubicación)")
            }
        } else if (!info.locationEnabled) {
            TextButton(onClick = actions.openLocationSettings, contentPadding = PaddingValues(0.dp)) {
                Text("Activa la ubicación para ver el nombre de la WiFi")
            }
        }
    }
}

@Composable
private fun OtherConnectionBlock(info: NetworkInfo) {
    val title = when (info.kind) {
        NetKind.MOBILE -> "Datos móviles"
        NetKind.ETHERNET -> "Cable (Ethernet)"
        else -> "Conectado"
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (info.kind == NetKind.MOBILE && info.mobileLevel != null) {
            SignalBars(info.mobileLevel, MaterialTheme.colorScheme.primary, Modifier.size(width = 52.dp, height = 40.dp))
            Spacer(Modifier.width(16.dp))
        }
        Column {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(
                "No estás en una WiFi" + if (info.mobileLevel != null) " · cobertura ${info.mobileLevel}/4" else "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
    Spacer(Modifier.height(12.dp))
    InternetLine(info)
    val items = buildList {
        info.downKbps?.let { add("Bajada estimada" to "${Fmt.decimal(it / 1000.0)} Mbps") }
        info.upKbps?.let { add("Subida estimada" to "${Fmt.decimal(it / 1000.0)} Mbps") }
        if (info.vpn) add("VPN" to "Activa")
    }
    if (items.isNotEmpty()) {
        Spacer(Modifier.height(14.dp))
        InfoGrid(items)
    }
}

@Composable
private fun InternetLine(info: NetworkInfo) {
    val status = LocalStatusColors.current
    if (info.internet) {
        Text("✓ Internet funciona", color = status.good, fontWeight = FontWeight.SemiBold)
    } else {
        Text(
            "⚠ Conectado, pero Android no consigue salir a internet",
            color = status.warning,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun SignalBars(bars: Int, color: Color, modifier: Modifier = Modifier) {
    val empty = MaterialTheme.colorScheme.surfaceContainerHighest
    Canvas(modifier) {
        val count = 4
        val gap = size.width * 0.08f
        val barWidth = (size.width - gap * (count - 1)) / count
        for (i in 0 until count) {
            val barHeight = size.height * (i + 1) / count
            drawRoundRect(
                color = if (i < bars) color else empty,
                topLeft = Offset(i * (barWidth + gap), size.height - barHeight),
                size = Size(barWidth, barHeight),
                cornerRadius = CornerRadius(barWidth / 3),
            )
        }
    }
}

@Composable
private fun SpeedTestBlock(state: SpeedTestState, actions: StatusActions) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(painterResource(R.drawable.ic_speed), contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(10.dp))
        Text("Test de velocidad", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
    }
    Spacer(Modifier.height(12.dp))
    when (state) {
        SpeedTestState.Idle -> {
            Hint("Mide el ping, la velocidad de bajada y la de subida (tarda unos 15 segundos).")
            Spacer(Modifier.height(12.dp))
            Button(onClick = actions.runSpeedTest, modifier = Modifier.fillMaxWidth()) { Text("Medir velocidad") }
        }
        is SpeedTestState.Running -> {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(state.phase.label, modifier = Modifier.weight(1f))
                state.liveMbps?.let {
                    Text(
                        "${Fmt.decimal(it)} Mbps",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
            Meter(state.progress, MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(12.dp))
            OutlinedButton(onClick = actions.cancelSpeedTest, modifier = Modifier.fillMaxWidth()) { Text("Cancelar") }
        }
        is SpeedTestState.Done -> {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SpeedStat("Ping", "${state.pingMs}", "ms", Modifier.weight(1f))
                SpeedStat("Bajada", Fmt.decimal(state.downMbps, if (state.downMbps >= 100) 0 else 1), "Mbps", Modifier.weight(1f))
                SpeedStat(
                    "Subida",
                    state.upMbps?.let { Fmt.decimal(it, if (it >= 100) 0 else 1) } ?: "—",
                    "Mbps",
                    Modifier.weight(1f),
                )
            }
            Spacer(Modifier.height(12.dp))
            val (title, explanation) = state.verdict()
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(explanation, style = MaterialTheme.typography.bodyMedium)
            Text(
                "Variación del ping: ${state.jitterMs} ms · medido a las ${Fmt.time(state.measuredAt)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(12.dp))
            FilledTonalButton(onClick = actions.runSpeedTest, modifier = Modifier.fillMaxWidth()) { Text("Repetir") }
        }
        is SpeedTestState.Failed -> {
            Text(state.message, color = LocalStatusColors.current.bad)
            Spacer(Modifier.height(12.dp))
            Button(onClick = actions.runSpeedTest, modifier = Modifier.fillMaxWidth()) { Text("Reintentar") }
        }
    }
}

@Composable
private fun SpeedStat(label: String, value: String, unit: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(unit, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ---------------------------------------------------------------- Móvil

@Composable
private fun DeviceCard(info: DeviceInfo?) {
    SectionCard(icon = R.drawable.ic_phone, title = "Este móvil") {
        if (info == null) {
            Hint("Leyendo…")
            return@SectionCard
        }
        val status = LocalStatusColors.current
        if (info.storageTotal > 0) {
            val used = 1f - info.storageFree.toFloat() / info.storageTotal
            LabeledMeter(
                label = "Almacenamiento",
                detail = "${Fmt.bytes(info.storageFree)} libres de ${Fmt.bytes(info.storageTotal)}",
                progress = used,
                color = if (used > 0.9f) status.bad else MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(14.dp))
        }
        if (info.ramTotal > 0) {
            val used = 1f - info.ramFree.toFloat() / info.ramTotal
            LabeledMeter(
                label = "Memoria RAM",
                detail = "${Fmt.bytes(info.ramFree)} libres de ${Fmt.bytes(info.ramTotal)}",
                progress = used,
                color = MaterialTheme.colorScheme.secondary,
            )
            Spacer(Modifier.height(14.dp))
        }
        InfoGrid(
            listOf(
                "Modelo" to info.model,
                "Sistema" to info.android,
                "Encendido desde hace" to Fmt.duration(info.uptimeMs),
            )
        )
    }
}

@Composable
private fun Hint(text: String) {
    Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

private fun Context.openSettings(action: String) {
    try {
        startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: ActivityNotFoundException) {
        openAppSettings()
    }
}

private fun Context.openAppSettings() {
    runCatching {
        startActivity(
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}
