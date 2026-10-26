package com.alldesignkarl.mipanel.tareas

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.alldesignkarl.mipanel.MiPanelApp
import com.alldesignkarl.mipanel.recordatorio.ReminderScheduler
import com.alldesignkarl.mipanel.recordatorio.ReminderSettings
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID

data class TasksUiState(
    val loading: Boolean = true,
    val today: LocalDate = LocalDate.now(),
    val pending: List<Task> = emptyList(),
    val done: List<Task> = emptyList(),
    val overview: DayOverview = DayOverview(0, 0),
)

/** Lo que se rellena en el editor de tareas. */
data class TaskDraft(
    val id: String?,
    val title: String,
    val notes: String,
    val examDate: LocalDate?,
    val totalPages: Int,
    val pagesDone: Int,
)

sealed interface TaskEvent {
    /** Se acaba de terminar una tarea: toca celebrarlo. */
    data class Completed(val task: Task) : TaskEvent

    data class Deleted(val task: Task) : TaskEvent

    data class Progress(val before: Task, val after: Task) : TaskEvent
}

class TasksViewModel(app: Application) : AndroidViewModel(app) {
    private val miPanel = app as MiPanelApp
    private val repository = miPanel.tasks
    private val settingsStore = miPanel.settings

    /** La fecha de hoy, que cambia sola a medianoche. */
    private val today: Flow<LocalDate> = flow {
        while (true) {
            emit(LocalDate.now())
            delay(30_000)
        }
    }.distinctUntilChanged()

    val state: StateFlow<TasksUiState> = combine(repository.items, today) { tasks, day ->
        if (tasks == null) {
            TasksUiState(loading = true, today = day)
        } else {
            TasksUiState(
                loading = false,
                today = day,
                pending = tasks.pendingSorted(),
                done = tasks.doneSorted(),
                overview = tasks.dayOverview(day),
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), TasksUiState())

    val reminder: StateFlow<ReminderSettings> = settingsStore.reminder

    private val _events = Channel<TaskEvent>(Channel.BUFFERED)
    val events: Flow<TaskEvent> = _events.receiveAsFlow()

    fun save(draft: TaskDraft) = viewModelScope.launch {
        val now = System.currentTimeMillis()
        var before: Task? = null
        var after: Task? = null
        repository.update { tasks ->
            if (draft.id == null) {
                val created = Task(id = UUID.randomUUID().toString(), title = "", createdAt = now)
                    .edited(draft.title, draft.notes, draft.examDate, draft.totalPages, draft.pagesDone, now)
                after = created
                tasks + created
            } else {
                tasks.map { task ->
                    if (task.id != draft.id) {
                        task
                    } else {
                        before = task
                        task.edited(draft.title, draft.notes, draft.examDate, draft.totalPages, draft.pagesDone, now)
                            .also { after = it }
                    }
                }
            }
        }
        val finished = after
        // Si al editar ya llegas al total, también cuenta como terminada.
        if (finished != null && finished.isDone && before?.isDone == false) {
            _events.send(TaskEvent.Completed(finished))
        }
    }

    fun addPages(id: String, delta: Int) = changeTask(id) { it.withPagesAdded(delta, LocalDate.now(), System.currentTimeMillis()) }

    fun setPages(id: String, value: Int) = changeTask(id) { it.withPagesDone(value, LocalDate.now(), System.currentTimeMillis()) }

    fun toggleDone(id: String) = changeTask(id) { it.toggledDone(System.currentTimeMillis()) }

    fun delete(id: String) = viewModelScope.launch {
        var removed: Task? = null
        repository.update { tasks ->
            removed = tasks.firstOrNull { it.id == id }
            tasks.filterNot { it.id == id }
        }
        removed?.let { _events.send(TaskEvent.Deleted(it)) }
    }

    /** Deshacer: vuelve a dejar la tarea tal y como estaba (o la recupera si se borró). */
    fun restore(task: Task) = viewModelScope.launch {
        repository.update { tasks ->
            if (tasks.any { it.id == task.id }) tasks.map { if (it.id == task.id) task else it } else tasks + task
        }
    }

    fun setReminder(settings: ReminderSettings) {
        settingsStore.setReminder(settings)
        ReminderScheduler.apply(getApplication(), settings)
    }

    private fun changeTask(id: String, change: (Task) -> Task) = viewModelScope.launch {
        var before: Task? = null
        var after: Task? = null
        repository.update { tasks ->
            tasks.map { task ->
                if (task.id == id) {
                    before = task
                    change(task).also { after = it }
                } else {
                    task
                }
            }
        }
        val old = before ?: return@launch
        val new = after ?: return@launch
        if (old == new) return@launch
        if (!old.isDone && new.isDone) {
            _events.send(TaskEvent.Completed(new))
        } else {
            _events.send(TaskEvent.Progress(old, new))
        }
    }
}
