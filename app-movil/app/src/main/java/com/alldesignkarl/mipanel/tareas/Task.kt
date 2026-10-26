package com.alldesignkarl.mipanel.tareas

import com.alldesignkarl.mipanel.datos.LocalDateSerializer
import kotlinx.serialization.Serializable
import java.time.LocalDate

/**
 * Una tarea de la lista. Si [totalPages] es 0 es una tarea normal (se marca como hecha);
 * si tiene páginas, se va completando a medida que se estudian.
 */
@Serializable
data class Task(
    val id: String,
    val title: String,
    /** Detalles libres que escribes en la tarea. */
    val notes: String = "",
    @Serializable(with = LocalDateSerializer::class)
    val examDate: LocalDate? = null,
    val totalPages: Int = 0,
    val pagesDone: Int = 0,
    val createdAt: Long,
    val completedAt: Long? = null,
    /** Páginas estudiadas cada día, con la fecha en formato ISO ("2026-10-26"). */
    val dailyLog: Map<String, Int> = emptyMap(),
)
