package com.alldesignkarl.mipanel.tareas

import android.Manifest
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.alldesignkarl.mipanel.R
import com.alldesignkarl.mipanel.recordatorio.Notifications
import com.alldesignkarl.mipanel.recordatorio.ReminderSettings
import com.alldesignkarl.mipanel.ui.BackupMenuButton
import com.alldesignkarl.mipanel.ui.LocalStatusColors
import com.alldesignkarl.mipanel.ui.Meter
import com.alldesignkarl.mipanel.util.Fmt
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Qué se está editando en el editor de tareas. */
sealed interface TaskEditorTarget {
    data object New : TaskEditorTarget
    data class Edit(val task: Task) : TaskEditorTarget
}

data class TaskActions(
    val onAdd: () -> Unit = {},
    val onEdit: (Task) -> Unit = {},
    val onDelete: (Task) -> Unit = {},
    val onAddPages: (Task, Int) -> Unit = { _, _ -> },
    val onLogProgress: (Task) -> Unit = {},
    val onToggle: (Task) -> Unit = {},
    val onReminder: () -> Unit = {},
)

@Composable
fun TasksScreen(vm: TasksViewModel = viewModel()) {
    val context = LocalContext.current
    val state by vm.state.collectAsStateWithLifecycle()
    val reminder by vm.reminder.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var editor by remember { mutableStateOf<TaskEditorTarget?>(null) }
    var progressFor by remember { mutableStateOf<String?>(null) }
    var celebrating by remember { mutableStateOf<Task?>(null) }
    var showReminder by rememberSaveable { mutableStateOf(false) }

    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }

    LaunchedEffect(vm) {
        vm.events.collect { event ->
            when (event) {
                is TaskEvent.Completed -> {
                    snackbar.currentSnackbarData?.dismiss()
                    celebrating = event.task
                    vibrateCelebration(context)
                }
                is TaskEvent.Deleted -> scope.launch {
                    snackbar.currentSnackbarData?.dismiss()
                    val result = snackbar.showSnackbar(
                        "Tarea borrada: ${event.task.title}",
                        actionLabel = "Deshacer",
                        duration = SnackbarDuration.Long,
                    )
                    if (result == SnackbarResult.ActionPerformed) vm.restore(event.task)
                }
                is TaskEvent.Progress -> scope.launch {
                    snackbar.currentSnackbarData?.dismiss()
                    val result = snackbar.showSnackbar(
                        progressMessage(event.before, event.after),
                        actionLabel = "Deshacer",
                        duration = SnackbarDuration.Short,
                    )
                    if (result == SnackbarResult.ActionPerformed) vm.restore(event.before)
                }
            }
        }
    }

    TasksContent(
        state = state,
        reminder = reminder,
        snackbar = snackbar,
        actions = TaskActions(
            onAdd = { editor = TaskEditorTarget.New },
            onEdit = { editor = TaskEditorTarget.Edit(it) },
            onDelete = { vm.delete(it.id) },
            onAddPages = { task, n -> vm.addPages(task.id, n) },
            onLogProgress = { progressFor = it.id },
            onToggle = { vm.toggleDone(it.id) },
            onReminder = { showReminder = true },
        ),
    )

    editor?.let { target ->
        TaskEditor(
            target = target,
            onClose = { editor = null },
            onSave = {
                vm.save(it)
                editor = null
            },
        )
    }

    progressFor?.let { id ->
        val task = (state.pending + state.done).firstOrNull { it.id == id }
        if (task == null) {
            progressFor = null
        } else {
            ProgressDialog(
                task = task,
                onDismiss = { progressFor = null },
                onSetTotal = {
                    vm.setPages(task.id, it)
                    progressFor = null
                },
            )
        }
    }

    celebrating?.let { task ->
        CelebrationDialog(task = task, today = state.today, onDismiss = { celebrating = null })
    }

    if (showReminder) {
        ReminderDialog(
            settings = reminder,
            canNotify = Notifications.canNotify(context),
            onDismiss = { showReminder = false },
            onSave = { settings ->
                if (settings.enabled && Build.VERSION.SDK_INT >= 33 && !Notifications.canNotify(context)) {
                    notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                vm.setReminder(settings)
                showReminder = false
            },
        )
    }
}

private fun progressMessage(before: Task, after: Task): String = when {
    after.hasPages -> {
        val delta = after.pagesDone - before.pagesDone
        val sign = if (delta > 0) "+" else ""
        "$sign${Fmt.pages(delta)} en ${after.title} · llevas ${after.pagesDone}/${after.totalPages}"
    }
    after.isDone -> "Hecha: ${after.title}"
    else -> "Pendiente otra vez: ${after.title}"
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksContent(
    state: TasksUiState,
    reminder: ReminderSettings,
    snackbar: SnackbarHostState,
    actions: TaskActions,
) {
    var showDone by rememberSaveable { mutableStateOf(false) }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tareas", fontWeight = FontWeight.SemiBold) },
                actions = {
                    IconButton(onClick = actions.onReminder) {
                        Icon(
                            painterResource(R.drawable.ic_alarm),
                            contentDescription = "Recordatorio diario",
                            tint = if (reminder.enabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    BackupMenuButton()
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = actions.onAdd,
                // El texto del botón no se anuncia por accesibilidad: la descripción va en el icono.
                icon = { Icon(Icons.Filled.Add, contentDescription = "Nueva tarea") },
                text = { Text("Nueva tarea") },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        if (!state.loading && state.pending.isEmpty() && state.done.isEmpty()) {
            EmptyTasks(Modifier.padding(padding))
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.overview.goalToday > 0) {
                item(key = "hoy") { TodayCard(state) }
            }
            if (state.pending.isEmpty() && state.done.isNotEmpty()) {
                item(key = "todo-hecho") {
                    Text(
                        "¡No tienes nada pendiente! 🎉",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(8.dp),
                    )
                }
            }
            items(state.pending, key = { it.id }) { task ->
                TaskCard(task, state.today, actions, Modifier.animateItem())
            }
            if (state.done.isNotEmpty()) {
                item(key = "cabecera-hechas") {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { showDone = !showDone }
                            .padding(horizontal = 8.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "Terminadas (${state.done.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f),
                        )
                        Icon(
                            if (showDone) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                            contentDescription = if (showDone) "Ocultar terminadas" else "Ver terminadas",
                        )
                    }
                }
                if (showDone) {
                    items(state.done, key = { it.id }) { task ->
                        DoneTaskCard(task, state.today, actions, Modifier.animateItem())
                    }
                }
            }
        }
    }
}

@Composable
private fun TodayCard(state: TasksUiState) {
    val overview = state.overview
    val reached = overview.pagesToday >= overview.goalToday
    val status = LocalStatusColors.current
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
        ),
    ) {
        Column(Modifier.padding(20.dp)) {
            Text("Hoy", style = MaterialTheme.typography.labelLarge)
            Text(
                if (reached) {
                    "¡Objetivo cumplido! ${overview.pagesToday} págs"
                } else {
                    "Llevas ${overview.pagesToday} de ${overview.goalToday} págs"
                },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(10.dp))
            Meter(
                overview.pagesToday.toFloat() / overview.goalToday,
                if (reached) status.good else MaterialTheme.colorScheme.primary,
            )
            state.pending.firstOrNull { it.examDate != null }?.let { next ->
                val days = next.daysUntilExam(state.today) ?: return@let
                if (days < 0) return@let
                Spacer(Modifier.height(10.dp))
                Text(
                    "Próximo examen: ${next.title}, ${relativeDay(days)}",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

@Composable
private fun TaskCard(task: Task, today: LocalDate, actions: TaskActions, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .animateContentSize(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow),
    ) {
        Column(Modifier.padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (!task.hasPages) {
                    Checkbox(checked = false, onCheckedChange = { actions.onToggle(task) })
                    Spacer(Modifier.width(4.dp))
                }
                Text(
                    task.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                )
                TaskMenu(task, actions)
            }
            Column(Modifier.padding(end = 12.dp)) {
                ExamChip(task, today)
                if (task.notes.isNotBlank()) {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        task.notes,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (task.hasPages) {
                    Spacer(Modifier.height(14.dp))
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            "${task.pagesDone} de ${task.totalPages} págs",
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            "${(task.progress * 100).toInt()} %",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Meter(task.progress, MaterialTheme.colorScheme.primary, height = 12)
                    Spacer(Modifier.height(10.dp))
                    StudyPlan(task, today)
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(1, 5, 10).forEach { n ->
                            FilledTonalButton(
                                onClick = { actions.onAddPages(task, n) },
                                contentPadding = PaddingValues(horizontal = 12.dp),
                                modifier = Modifier.weight(1f),
                            ) { Text("+$n") }
                        }
                        OutlinedButton(
                            onClick = { actions.onLogProgress(task) },
                            contentPadding = PaddingValues(horizontal = 12.dp),
                            modifier = Modifier.weight(1.6f),
                        ) { Text("Anotar…") }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudyPlan(task: Task, today: LocalDate) {
    val status = LocalStatusColors.current
    val days = task.daysUntilExam(today)
    val perDay = task.pagesPerDayFromNow(today)
    val goal = task.goalToday(today)
    val doneToday = task.pagesOn(today).coerceAtLeast(0)
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        when {
            days == null -> Text(
                "Te quedan ${Fmt.pages(task.remainingPages)}. Pon fecha de examen para saber cuántas tocan al día.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            days < 0 -> Text(
                "El examen ya pasó · te quedaron ${Fmt.pages(task.remainingPages)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            perDay != null -> {
                val dayWord = if (days <= 1) "hoy" else "al día"
                Text(
                    "Te quedan ${Fmt.pages(task.remainingPages)} → $perDay $dayWord",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
        if (goal != null && goal > 0) {
            val reached = doneToday >= goal
            Text(
                if (reached) "✓ Objetivo de hoy cumplido ($doneToday de $goal)" else "Hoy: $doneToday de $goal págs",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = if (reached) status.good else MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

@Composable
private fun ExamChip(task: Task, today: LocalDate) {
    val exam = task.examDate ?: return
    val days = task.daysUntilExam(today) ?: return
    val status = LocalStatusColors.current
    val (text, color) = when {
        days < 0 -> "Examen: ${Fmt.dateShort(exam)} (ya pasó)" to status.neutral
        days == 0L -> "¡Examen hoy!" to status.bad
        days == 1L -> "Examen mañana · ${Fmt.dateShort(exam)}" to status.bad
        days <= 3 -> "Examen ${Fmt.dateShort(exam)} · en $days días" to status.warning
        else -> "Examen ${Fmt.dateShort(exam)} · en $days días" to MaterialTheme.colorScheme.primary
    }
    Row(
        Modifier
            .padding(top = 6.dp)
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(R.drawable.ic_event), contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun TaskMenu(task: Task, actions: TaskActions) {
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { open = true }) { Icon(Icons.Filled.MoreVert, contentDescription = "Opciones") }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            DropdownMenuItem(text = { Text("Editar") }, onClick = {
                open = false
                actions.onEdit(task)
            })
            if (task.hasPages) {
                DropdownMenuItem(text = { Text("Corregir páginas") }, onClick = {
                    open = false
                    actions.onLogProgress(task)
                })
            }
            if (!task.hasPages && task.isDone) {
                DropdownMenuItem(text = { Text("Marcar como pendiente") }, onClick = {
                    open = false
                    actions.onToggle(task)
                })
            }
            DropdownMenuItem(text = { Text("Borrar") }, onClick = {
                open = false
                actions.onDelete(task)
            })
        }
    }
}

@Composable
private fun DoneTaskCard(task: Task, today: LocalDate, actions: TaskActions, modifier: Modifier = Modifier) {
    val status = LocalStatusColors.current
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
    ) {
        Row(
            Modifier.padding(start = 16.dp, end = 4.dp, top = 8.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.CheckCircle, contentDescription = "Terminada", tint = status.good)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium)
                Text(
                    completionLine(task, today),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            TaskMenu(task, actions)
        }
    }
}

/** "Terminada hoy a las 19:42 · 120 págs · 3 días antes del examen" */
fun completionLine(task: Task, today: LocalDate): String {
    val completedAt = task.completedAt ?: return "Terminada"
    val parts = mutableListOf("Terminada ${Fmt.moment(completedAt, today)}")
    if (task.hasPages) parts += Fmt.pages(task.totalPages)
    val exam = task.examDate
    if (exam != null) {
        val finishedOn = java.time.Instant.ofEpochMilli(completedAt).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
        val margin = java.time.temporal.ChronoUnit.DAYS.between(finishedOn, exam)
        parts += when {
            margin > 0 -> "${Fmt.days(margin)} antes del examen"
            margin == 0L -> "el día del examen"
            else -> "después del examen"
        }
    }
    return parts.joinToString(" · ")
}

@Composable
private fun EmptyTasks(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                painterResource(R.drawable.ic_book),
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(64.dp),
            )
            Spacer(Modifier.height(16.dp))
            Text("No tienes tareas", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(8.dp))
            Text(
                "Pulsa \"Nueva tarea\" y apunta lo que tengas que estudiar, la fecha del examen y cuántas páginas son.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

private fun vibrateCelebration(context: Context) {
    val vibrator = if (Build.VERSION.SDK_INT >= 31) {
        context.getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
        context.getSystemService(Vibrator::class.java)
    }
    runCatching {
        vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 60, 90, 60, 90, 180), -1))
    }
}
