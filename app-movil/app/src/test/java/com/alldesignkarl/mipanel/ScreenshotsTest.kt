package com.alldesignkarl.mipanel

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.alldesignkarl.mipanel.estado.BatteryInfo
import com.alldesignkarl.mipanel.estado.BluetoothState
import com.alldesignkarl.mipanel.estado.BtDevice
import com.alldesignkarl.mipanel.estado.ChargeState
import com.alldesignkarl.mipanel.estado.DeviceInfo
import com.alldesignkarl.mipanel.estado.DeviceKind
import com.alldesignkarl.mipanel.estado.NetKind
import com.alldesignkarl.mipanel.estado.NetworkInfo
import com.alldesignkarl.mipanel.estado.SpeedTestState
import com.alldesignkarl.mipanel.estado.StatusActions
import com.alldesignkarl.mipanel.estado.StatusContent
import com.alldesignkarl.mipanel.estado.WifiDetails
import com.alldesignkarl.mipanel.notas.Grade
import com.alldesignkarl.mipanel.notas.GradesContent
import com.alldesignkarl.mipanel.notas.GradesUiState
import com.alldesignkarl.mipanel.notas.bySubject
import com.alldesignkarl.mipanel.notas.overallAverage
import com.alldesignkarl.mipanel.recordatorio.ReminderSettings
import com.alldesignkarl.mipanel.tareas.CelebrationContent
import com.alldesignkarl.mipanel.tareas.Task
import com.alldesignkarl.mipanel.tareas.TaskActions
import com.alldesignkarl.mipanel.tareas.TasksContent
import com.alldesignkarl.mipanel.tareas.TasksUiState
import com.alldesignkarl.mipanel.tareas.dayOverview
import com.alldesignkarl.mipanel.tareas.doneSorted
import com.alldesignkarl.mipanel.tareas.pendingSorted
import com.alldesignkarl.mipanel.tareas.withPagesAdded
import com.alldesignkarl.mipanel.ui.MiPanelTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.time.LocalDate

/**
 * Dibuja cada pantalla con datos de ejemplo y guarda una captura en build/capturas
 * (GitHub Actions las adjunta a cada compilación para poder revisarlas).
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w400dp-h1500dp-xhdpi")
class ScreenshotsTest {
    @get:Rule
    val rule = createAndroidComposeRule<ComponentActivity>()

    private val today = LocalDate.now()

    @Test
    fun estado() = capture("1-estado") {
        StatusContent(
            battery = BatteryInfo(
                percent = 83, state = ChargeState.DISCHARGING, source = null, temperatureC = 31.4f,
                voltageV = 4.12f, currentMa = 412, chargeMah = 3820, health = "Buena", technology = "Li-ion",
                cycleCount = 214, timeToFullMs = null, timeLeftMs = (9 * 60 + 20) * 60_000L,
            ),
            bluetooth = BluetoothState.Ready(
                listOf(
                    BtDevice("A", "Galaxy Buds2 Pro", DeviceKind.AUDIO, 64),
                    BtDevice("B", "Cascos JBL", DeviceKind.AUDIO, null),
                    BtDevice("C", "Reloj", DeviceKind.WATCH, 18),
                )
            ),
            network = NetworkInfo(
                kind = NetKind.WIFI, internet = true, metered = false, vpn = false, downKbps = 120_000,
                upKbps = 30_000, ipAddress = "192.168.1.34",
                wifi = WifiDetails("MiCasa_5G", -58, 866, 780, 866, 5180, "WiFi 6 (ax)"),
                mobileLevel = null, hasLocationPermission = true, locationEnabled = true,
            ),
            device = DeviceInfo(
                "Samsung SM-A546B", "Android 15", 41_300_000_000, 128_000_000_000,
                3_100_000_000, 8_000_000_000, (3 * 24 + 5) * 3_600_000L,
            ),
            speed = SpeedTestState.Done(18, 4, 245.3, 38.6, System.currentTimeMillis()),
            actions = StatusActions(),
        )
    }

    @Test
    fun estadoCargandoSinPermisos() = capture("2-estado-cargando") {
        StatusContent(
            battery = BatteryInfo(
                percent = 27, state = ChargeState.CHARGING, source = com.alldesignkarl.mipanel.estado.PowerSource.AC,
                temperatureC = 35.0f, voltageV = 4.31f, currentMa = 2350, chargeMah = 1300, health = "Buena",
                technology = "Li-ion", cycleCount = null, timeToFullMs = 52 * 60_000L, timeLeftMs = null,
            ),
            bluetooth = BluetoothState.NoPermission,
            network = NetworkInfo(
                kind = NetKind.MOBILE, internet = true, metered = true, vpn = false, downKbps = 45_000,
                upKbps = 9_000, ipAddress = null, wifi = null, mobileLevel = 3,
                hasLocationPermission = false, locationEnabled = true,
            ),
            device = null,
            speed = SpeedTestState.Running(
                com.alldesignkarl.mipanel.estado.SpeedPhase.DOWNLOAD, 0.4f, 23, null, 61.2,
            ),
            actions = StatusActions(),
        )
    }

    @Test
    fun tareas() {
        val historia = task("Estudiar Historia (tema 3 al 5)", 120, 45, examIn = 5, created = 1)
            .withPagesAdded(8, today, 10)
            .copy(notes = "Sin el anexo de mapas")
        val mates = task("Matemáticas: derivadas", 40, 10, examIn = 1, created = 2)
        val comprar = Task(id = "c", title = "Comprar folios y subrayadores", createdAt = 3)
        val ingles = task("Inglés: vocabulario unit 4", 20, 20, examIn = 2, created = 4)
            .copy(completedAt = System.currentTimeMillis() - 3_600_000)
        val tasks = listOf(historia, mates, comprar, ingles)
        capture("3-tareas") {
            TasksContent(
                state = TasksUiState(
                    loading = false,
                    today = today,
                    pending = tasks.pendingSorted(),
                    done = tasks.doneSorted(),
                    overview = tasks.dayOverview(today),
                ),
                reminder = ReminderSettings(enabled = true),
                snackbar = SnackbarHostState(),
                actions = TaskActions(),
            )
        }
    }

    @Test
    fun terminado() = capture("4-terminado", atMillis = 1_400) {
        // Fondo oscurecido como el del diálogo real.
        Box(Modifier.fillMaxSize().background(Color(0x99000000))) {
            CelebrationContent(
                task = task("Estudiar Historia (tema 3 al 5)", 120, 120, examIn = 3, created = 1)
                    .copy(completedAt = System.currentTimeMillis()),
                today = today,
                onDismiss = {},
            )
        }
    }

    @Test
    fun notas() {
        var n = 0L
        fun g(subject: String, value: Double, description: String = "") =
            Grade(id = "${n++}", subject = subject, value = value, description = description, date = today.minusDays(n), createdAt = n)
        val grades = listOf(
            g("Matemáticas", 4.0, "Examen tema 1"), g("Matemáticas", 5.0, "Examen tema 2"),
            g("Historia", 7.5), g("Historia", 8.0),
            g("Inglés", 9.25, "Speaking"),
            g("Lengua Castellana y Literatura", 6.0),
            g("Física y Química", 3.5),
            g("Educación Física", 10.0),
        )
        val subjects = grades.bySubject()
        capture("5-notas") {
            GradesContent(
                state = GradesUiState(loading = false, subjects = subjects, overall = subjects.overallAverage(), count = grades.size),
                snackbar = SnackbarHostState(),
                onAdd = {},
                onEdit = {},
            )
        }
    }

    @Test
    fun notasModoOscuro() {
        val grades = listOf(
            Grade("1", "Matemáticas", 4.0, date = today, createdAt = 1),
            Grade("2", "Matemáticas", 5.0, date = today, createdAt = 2),
            Grade("3", "Historia", 8.5, date = today, createdAt = 3),
        )
        val subjects = grades.bySubject()
        capture("6-notas-oscuro", dark = true) {
            GradesContent(
                state = GradesUiState(loading = false, subjects = subjects, overall = subjects.overallAverage(), count = 3),
                snackbar = SnackbarHostState(),
                onAdd = {},
                onEdit = {},
            )
        }
    }

    private fun task(title: String, total: Int, done: Int, examIn: Long?, created: Long) = Task(
        id = title,
        title = title,
        examDate = examIn?.let { today.plusDays(it) },
        totalPages = total,
        pagesDone = done,
        createdAt = created,
    )

    private fun capture(name: String, dark: Boolean = false, atMillis: Long? = null, content: @Composable () -> Unit) {
        // Para el confeti: se para el reloj a mitad de la animación.
        if (atMillis != null) rule.mainClock.autoAdvance = false
        rule.setContent {
            // Colores fijos de la app (en el móvil real se usan los del fondo de pantalla).
            MiPanelTheme(darkTheme = dark, dynamicColor = false) { content() }
        }
        if (atMillis != null) rule.mainClock.advanceTimeBy(atMillis) else rule.waitForIdle()
        // Se dibuja la ventana directamente en un Bitmap (captureToImage espera un redibujado
        // que en Robolectric no llega).
        val view = rule.activity.window.decorView
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        rule.runOnUiThread { view.draw(Canvas(bitmap)) }
        val dir = File("build/capturas").apply { mkdirs() }
        File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}
