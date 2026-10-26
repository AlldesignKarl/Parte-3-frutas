package com.alldesignkarl.mipanel.tareas

import java.time.LocalDate
import java.time.temporal.ChronoUnit

val Task.hasPages: Boolean get() = totalPages > 0

val Task.isDone: Boolean get() = completedAt != null

val Task.remainingPages: Int get() = (totalPages - pagesDone).coerceAtLeast(0)

val Task.progress: Float
    get() = when {
        hasPages -> (pagesDone.toFloat() / totalPages).coerceIn(0f, 1f)
        isDone -> 1f
        else -> 0f
    }

/** Días que faltan para el examen (0 = hoy, negativo = ya pasó), o null si no tiene fecha. */
fun Task.daysUntilExam(today: LocalDate): Long? =
    examDate?.let { ChronoUnit.DAYS.between(today, it) }

fun Task.pagesOn(day: LocalDate): Int = dailyLog[day.toString()] ?: 0

/**
 * Días que quedan para estudiar contando hoy y sin contar el día del examen.
 * Si el examen es hoy, queda 1 (hoy). Si ya pasó, null.
 */
fun Task.studyDaysLeft(today: LocalDate): Int? {
    val days = daysUntilExam(today) ?: return null
    if (days < 0) return null
    return days.coerceAtLeast(1).toInt()
}

/**
 * Páginas que tocan hoy para llegar al examen con todo estudiado.
 * Se calcula con lo que quedaba al empezar el día, así el objetivo no cambia mientras estudias.
 */
fun Task.goalToday(today: LocalDate): Int? {
    if (!hasPages || isDone) return null
    val days = studyDaysLeft(today) ?: return null
    val remainingAtStartOfDay = (totalPages - (pagesDone - pagesOn(today))).coerceIn(0, totalPages)
    return ceilDiv(remainingAtStartOfDay, days)
}

/** Ritmo necesario desde ahora mismo (lo que queda repartido en los días que quedan). */
fun Task.pagesPerDayFromNow(today: LocalDate): Int? {
    if (!hasPages || isDone) return null
    val days = studyDaysLeft(today) ?: return null
    return ceilDiv(remainingPages, days)
}

/** Fija las páginas estudiadas (se recorta entre 0 y el total) y lo apunta en el día de hoy. */
fun Task.withPagesDone(value: Int, today: LocalDate, now: Long): Task {
    if (!hasPages) return this
    val clamped = value.coerceIn(0, totalPages)
    val delta = clamped - pagesDone
    if (delta == 0) return this
    val key = today.toString()
    val log = dailyLog + (key to (dailyLog[key] ?: 0) + delta)
    val finished = clamped >= totalPages
    return copy(
        pagesDone = clamped,
        dailyLog = log,
        completedAt = if (finished) completedAt ?: now else null,
    )
}

fun Task.withPagesAdded(delta: Int, today: LocalDate, now: Long): Task =
    withPagesDone(pagesDone + delta, today, now)

/** Marca o desmarca una tarea sin páginas. */
fun Task.toggledDone(now: Long): Task =
    if (isDone) copy(completedAt = null) else copy(completedAt = now)

/**
 * Aplica los cambios del editor. Las páginas que ya traías al crear o editar la tarea
 * no cuentan como estudiadas hoy.
 */
fun Task.edited(
    title: String,
    notes: String,
    examDate: LocalDate?,
    totalPages: Int,
    pagesDone: Int,
    now: Long,
): Task {
    val total = totalPages.coerceAtLeast(0)
    val done = if (total > 0) pagesDone.coerceIn(0, total) else 0
    val completed = when {
        total > 0 -> if (done >= total) completedAt ?: now else null
        this.totalPages > 0 -> null // antes tenía páginas y ahora no: vuelve a estar pendiente
        else -> completedAt
    }
    return copy(
        title = title.trim(),
        notes = notes.trim(),
        examDate = examDate,
        totalPages = total,
        pagesDone = done,
        completedAt = completed,
    )
}

/** Pendientes: primero las de examen más cercano; las que no tienen fecha, al final. */
fun List<Task>.pendingSorted(): List<Task> =
    filterNot { it.isDone }.sortedWith(
        compareBy<Task>({ it.examDate == null }, { it.examDate }, { it.createdAt })
    )

fun List<Task>.doneSorted(): List<Task> =
    filter { it.isDone }.sortedByDescending { it.completedAt }

data class DayOverview(val pagesToday: Int, val goalToday: Int)

/** Resumen de hoy sumando todas las tareas de estudio con fecha de examen. */
fun List<Task>.dayOverview(today: LocalDate): DayOverview {
    var studied = 0
    var goal = 0
    for (task in this) {
        if (!task.hasPages) continue
        val todayGoal = if (task.isDone) null else task.goalToday(today)
        val pages = task.pagesOn(today).coerceAtLeast(0)
        if (todayGoal != null) {
            goal += todayGoal
            studied += pages
        } else if (task.isDone && pages > 0) {
            // Terminada hoy: lo estudiado hoy cuenta para el objetivo del día.
            goal += pages
            studied += pages
        }
    }
    return DayOverview(pagesToday = studied, goalToday = goal)
}

data class Reminder(val title: String, val lines: List<String>)

/** Texto del recordatorio diario, o null si hoy no queda nada por estudiar. */
fun List<Task>.dailyReminder(today: LocalDate): Reminder? {
    val pending = pendingSorted().filter { it.hasPages }
    val lines = mutableListOf<String>()
    var total = 0
    for (task in pending) {
        val goal = task.goalToday(today) ?: continue
        val left = (goal - task.pagesOn(today)).coerceAtLeast(0)
        if (left == 0) continue
        total += left
        val days = task.daysUntilExam(today) ?: continue
        lines += "${task.title}: $left págs (examen ${relativeDay(days)})"
    }
    if (lines.isEmpty()) return null
    val title = if (total == 1) "Hoy te toca 1 página" else "Hoy te tocan $total páginas"
    return Reminder(title, lines)
}

/** "hoy", "mañana", "en 5 días", "hace 2 días". */
fun relativeDay(days: Long): String = when {
    days == 0L -> "hoy"
    days == 1L -> "mañana"
    days == -1L -> "ayer"
    days > 1 -> "en $days días"
    else -> "hace ${-days} días"
}

private fun ceilDiv(a: Int, b: Int): Int = if (a <= 0) 0 else (a + b - 1) / b
