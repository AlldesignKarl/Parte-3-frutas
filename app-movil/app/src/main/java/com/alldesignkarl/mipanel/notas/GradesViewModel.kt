package com.alldesignkarl.mipanel.notas

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.alldesignkarl.mipanel.MiPanelApp
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID

data class GradesUiState(
    val loading: Boolean = true,
    val subjects: List<SubjectSummary> = emptyList(),
    val overall: Double? = null,
    val count: Int = 0,
)

data class GradeDraft(
    val id: String?,
    val subject: String,
    val value: Double,
    val description: String,
    val date: LocalDate,
)

class GradesViewModel(app: Application) : AndroidViewModel(app) {
    private val repository = (app as MiPanelApp).grades

    val state: StateFlow<GradesUiState> = repository.items.map { grades ->
        if (grades == null) {
            GradesUiState(loading = true)
        } else {
            val subjects = grades.bySubject()
            GradesUiState(
                loading = false,
                subjects = subjects,
                overall = subjects.overallAverage(),
                count = grades.size,
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), GradesUiState())

    private val _deleted = Channel<Grade>(Channel.BUFFERED)

    /** Nota recién borrada, para ofrecer "Deshacer". */
    val deleted: Flow<Grade> = _deleted.receiveAsFlow()

    fun save(draft: GradeDraft) = viewModelScope.launch {
        val subject = cleanSubjectName(draft.subject)
        repository.update { grades ->
            if (draft.id == null) {
                grades + Grade(
                    id = UUID.randomUUID().toString(),
                    subject = subject,
                    value = draft.value,
                    description = draft.description.trim(),
                    date = draft.date,
                    createdAt = System.currentTimeMillis(),
                )
            } else {
                grades.map {
                    if (it.id == draft.id) {
                        it.copy(subject = subject, value = draft.value, description = draft.description.trim(), date = draft.date)
                    } else {
                        it
                    }
                }
            }
        }
    }

    fun delete(id: String) = viewModelScope.launch {
        var removed: Grade? = null
        repository.update { grades ->
            removed = grades.firstOrNull { it.id == id }
            grades.filterNot { it.id == id }
        }
        removed?.let { _deleted.send(it) }
    }

    fun restore(grade: Grade) = viewModelScope.launch {
        repository.update { grades -> if (grades.any { it.id == grade.id }) grades else grades + grade }
    }
}
