package com.alldesignkarl.mipanel.tareas

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimeInput
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.alldesignkarl.mipanel.recordatorio.ReminderSettings
import com.alldesignkarl.mipanel.ui.DateField
import com.alldesignkarl.mipanel.ui.FullScreenEditor
import com.alldesignkarl.mipanel.ui.digitsOnly
import com.alldesignkarl.mipanel.util.Fmt
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

// ---------------------------------------------------------------- Editor de tareas

@Composable
fun TaskEditor(
    target: TaskEditorTarget,
    onClose: () -> Unit,
    onSave: (TaskDraft) -> Unit,
) {
    val existing = (target as? TaskEditorTarget.Edit)?.task
    var title by rememberSaveable { mutableStateOf(existing?.title ?: "") }
    var notes by rememberSaveable { mutableStateOf(existing?.notes ?: "") }
    var exam by remember { mutableStateOf(existing?.examDate) }
    var total by rememberSaveable { mutableStateOf(existing?.totalPages?.takeIf { it > 0 }?.toString() ?: "") }
    var done by rememberSaveable { mutableStateOf(existing?.pagesDone?.takeIf { it > 0 }?.toString() ?: "") }

    val totalPages = total.toIntOrNull() ?: 0
    val pagesDone = done.toIntOrNull() ?: 0
    val doneTooHigh = totalPages > 0 && pagesDone > totalPages
    val canSave = title.isNotBlank() && !doneTooHigh

    FullScreenEditor(
        title = if (existing == null) "Nueva tarea" else "Editar tarea",
        saveEnabled = canSave,
        onClose = onClose,
        onSave = { onSave(TaskDraft(existing?.id, title, notes, exam, totalPages, pagesDone)) },
    ) {
        OutlinedTextField(
            value = title,
            onValueChange = { title = it.take(80) },
            label = { Text("Qué tienes que hacer") },
            placeholder = { Text("Ej.: Estudiar Historia, tema 3") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        DateField(
            label = "Día del examen (opcional)",
            date = exam,
            onDateChange = { exam = it },
            supportingText = exam?.let { relativeDay(ChronoUnit.DAYS.between(LocalDate.now(), it)).replaceFirstChar { c -> c.uppercase() } },
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = total,
            onValueChange = { total = digitsOnly(it) },
            label = { Text("Páginas que hay que estudiar (opcional)") },
            supportingText = { Text("Déjalo vacío si no va por páginas: se marcará como hecha y ya.") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
        if (totalPages > 0) {
            Spacer(Modifier.height(4.dp))
            OutlinedTextField(
                value = done,
                onValueChange = { done = digitsOnly(it) },
                label = { Text("Páginas que ya llevas") },
                placeholder = { Text("0") },
                isError = doneTooHigh,
                supportingText = if (doneTooHigh) {
                    { Text("No puedes llevar más páginas que el total") }
                } else {
                    null
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            val preview = previewPlan(totalPages, pagesDone, exam)
            if (preview != null) {
                Spacer(Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text(preview, modifier = Modifier.padding(14.dp), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it.take(400) },
            label = { Text("Detalles (opcional)") },
            placeholder = { Text("Ej.: Entra del tema 3 al 5, sin el anexo") },
            minLines = 2,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(24.dp))
    }
}

private fun previewPlan(total: Int, done: Int, exam: LocalDate?): String? {
    if (exam == null || done >= total) return null
    val draft = Task(id = "", title = "", examDate = exam, totalPages = total, pagesDone = done, createdAt = 0)
    val today = LocalDate.now()
    val days = draft.studyDaysLeft(today) ?: return "El examen ya ha pasado."
    val perDay = draft.pagesPerDayFromNow(today) ?: return null
    return if (days == 1) {
        "Tendrías que estudiar las ${total - done} págs hoy."
    } else {
        "Tendrías que estudiar unas $perDay págs al día durante $days días."
    }
}

// ---------------------------------------------------------------- Anotar progreso

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgressDialog(task: Task, onDismiss: () -> Unit, onSetTotal: (Int) -> Unit) {
    var addMode by rememberSaveable { mutableStateOf(true) }
    var text by rememberSaveable { mutableStateOf("") }
    val number = text.toIntOrNull()
    val result = when {
        number == null -> null
        addMode -> task.pagesDone + number
        else -> number
    }?.coerceIn(0, task.totalPages)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(task.title) },
        text = {
            Column {
                Text("Llevas ${task.pagesDone} de ${task.totalPages} págs.")
                Spacer(Modifier.height(14.dp))
                SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                    SegmentedButton(
                        selected = addMode,
                        onClick = {
                            addMode = true
                            text = ""
                        },
                        shape = SegmentedButtonDefaults.itemShape(0, 2),
                    ) { Text("Sumar") }
                    SegmentedButton(
                        selected = !addMode,
                        onClick = {
                            addMode = false
                            text = task.pagesDone.toString()
                        },
                        shape = SegmentedButtonDefaults.itemShape(1, 2),
                    ) { Text("Total") }
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = digitsOnly(it) },
                    label = { Text(if (addMode) "Páginas que acabas de estudiar" else "Páginas estudiadas en total") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    supportingText = result?.let { { Text("Quedarás en $it de ${task.totalPages}") } },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { result?.let(onSetTotal) }, enabled = result != null) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
    )
}

// ---------------------------------------------------------------- ¡Terminado!

@Composable
fun CelebrationDialog(task: Task, today: LocalDate, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        CelebrationContent(task, today, onDismiss)
    }
}

@Composable
fun CelebrationContent(task: Task, today: LocalDate, onDismiss: () -> Unit) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Confetti(Modifier.fillMaxSize())
        Card(
            modifier = Modifier
                .padding(24.dp)
                .widthIn(max = 420.dp),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        ) {
            Column(
                Modifier.padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("🎉", fontSize = 64.sp)
                Text(
                    "¡Terminado!",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "Has terminado «${task.title}»",
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center,
                )
                if (task.hasPages) {
                    Text(
                        "${task.totalPages} páginas estudiadas",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
                celebrationExamLine(task, today)?.let {
                    Text(it, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
                }
                task.completedAt?.let {
                    Text(
                        "Terminado a las ${Fmt.time(it)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.height(8.dp))
                Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("¡Genial!") }
            }
        }
    }
}

private fun celebrationExamLine(task: Task, today: LocalDate): String? {
    val days = task.daysUntilExam(today) ?: return null
    return when {
        days > 1 -> "Y faltan $days días para el examen: tiempo de sobra para repasar."
        days == 1L -> "Y el examen es mañana: ¡justo a tiempo! Mucha suerte."
        days == 0L -> "El examen es hoy: ¡a por todas!"
        else -> null
    }
}

private class Particle(
    val x: Float,
    val delay: Float,
    val speed: Float,
    val drift: Float,
    val phase: Float,
    val size: Float,
    val spin: Float,
    val color: Color,
)

private val confettiColors = listOf(
    Color(0xFF6366F1), Color(0xFF22C55E), Color(0xFFF59E0B),
    Color(0xFFEC4899), Color(0xFF0EA5E9), Color(0xFFEF4444),
)

/** Confeti que cae una vez (unos 4 s) y se para. */
@Composable
private fun Confetti(modifier: Modifier = Modifier) {
    val particles = remember {
        val random = Random(42)
        List(90) {
            Particle(
                x = random.nextFloat(),
                delay = random.nextFloat() * 0.35f,
                speed = 0.8f + random.nextFloat() * 0.6f,
                drift = 10f + random.nextFloat() * 30f,
                phase = random.nextFloat() * 2 * PI.toFloat(),
                size = 6f + random.nextFloat() * 8f,
                spin = random.nextFloat() * 720f - 360f,
                color = confettiColors[it % confettiColors.size],
            )
        }
    }
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) { progress.animateTo(1f, tween(durationMillis = 4000, easing = LinearEasing)) }
    Canvas(modifier) {
        val t = progress.value
        if (t >= 1f) return@Canvas
        particles.forEach { p ->
            val local = ((t - p.delay) / (1f - p.delay)).coerceIn(0f, 1f)
            if (local <= 0f) return@forEach
            val y = -40f + local * p.speed * (size.height + 80f)
            val x = p.x * size.width + sin(p.phase + local * 10f) * p.drift * density
            val w = p.size * density
            rotate(degrees = p.spin * local, pivot = Offset(x, y)) {
                drawRect(p.color, topLeft = Offset(x - w / 2, y - w / 4), size = Size(w, w / 2))
            }
        }
    }
}

// ---------------------------------------------------------------- Recordatorio

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReminderDialog(
    settings: ReminderSettings,
    canNotify: Boolean,
    onDismiss: () -> Unit,
    onSave: (ReminderSettings) -> Unit,
) {
    var enabled by rememberSaveable { mutableStateOf(settings.enabled) }
    val time = rememberTimePickerState(initialHour = settings.hour, initialMinute = settings.minute, is24Hour = true)
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Recordatorio diario") },
        text = {
            Column {
                Text("Cada día a esta hora te aviso de las páginas que te tocan para llegar a los exámenes.")
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Avisarme", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    Switch(checked = enabled, onCheckedChange = { enabled = it })
                }
                if (enabled) {
                    Spacer(Modifier.height(16.dp))
                    TimeInput(state = time)
                    if (!canNotify) {
                        Text(
                            "Al guardar, Android te pedirá permiso para mostrar notificaciones.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(ReminderSettings(enabled, time.hour, time.minute)) }) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
    )
}
