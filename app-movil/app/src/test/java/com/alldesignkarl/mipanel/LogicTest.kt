package com.alldesignkarl.mipanel

import com.alldesignkarl.mipanel.notas.Grade
import com.alldesignkarl.mipanel.notas.bySubject
import com.alldesignkarl.mipanel.notas.gradeLabel
import com.alldesignkarl.mipanel.notas.overallAverage
import com.alldesignkarl.mipanel.notas.parseGrade
import com.alldesignkarl.mipanel.tareas.Task
import com.alldesignkarl.mipanel.tareas.dailyReminder
import com.alldesignkarl.mipanel.tareas.dayOverview
import com.alldesignkarl.mipanel.tareas.edited
import com.alldesignkarl.mipanel.tareas.goalToday
import com.alldesignkarl.mipanel.tareas.isDone
import com.alldesignkarl.mipanel.tareas.pagesOn
import com.alldesignkarl.mipanel.tareas.pagesPerDayFromNow
import com.alldesignkarl.mipanel.tareas.pendingSorted
import com.alldesignkarl.mipanel.tareas.remainingPages
import com.alldesignkarl.mipanel.tareas.toggledDone
import com.alldesignkarl.mipanel.tareas.withPagesAdded
import com.alldesignkarl.mipanel.tareas.withPagesDone
import com.alldesignkarl.mipanel.util.Fmt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class LogicTest {
    private val today = LocalDate.of(2026, 10, 26)

    private fun study(total: Int, done: Int = 0, examInDays: Long? = 5) = Task(
        id = "t",
        title = "Historia",
        examDate = examInDays?.let { today.plusDays(it) },
        totalPages = total,
        pagesDone = done,
        createdAt = 0,
    )

    @Test
    fun pagesPerDaySplitsRemainingBetweenDaysBeforeExam() {
        val task = study(total = 100, done = 20, examInDays = 4)
        // Quedan 80 págs y 4 días (hoy, mañana, pasado y el siguiente): 20 al día.
        assertEquals(20, task.goalToday(today))
        assertEquals(20, task.pagesPerDayFromNow(today))
    }

    @Test
    fun goalTodayDoesNotMoveWhileStudyingToday() {
        val start = study(total = 100, done = 20, examInDays = 4)
        val after = start.withPagesAdded(15, today, now = 1)
        assertEquals(20, after.goalToday(today))
        assertEquals(15, after.pagesOn(today))
        assertEquals(65, after.remainingPages)
    }

    @Test
    fun examTodayMeansEverythingToday() {
        assertEquals(30, study(total = 50, done = 20, examInDays = 0).goalToday(today))
    }

    @Test
    fun pastExamHasNoGoal() {
        assertNull(study(total = 50, done = 20, examInDays = -1).goalToday(today))
    }

    @Test
    fun reachingTotalCompletesAndGoingBackReopens() {
        val almost = study(total = 10, done = 8)
        val done = almost.withPagesAdded(5, today, now = 42)
        assertEquals(10, done.pagesDone)
        assertTrue(done.isDone)
        assertEquals(42L, done.completedAt)
        assertEquals(2, done.pagesOn(today))

        val reopened = done.withPagesDone(7, today, now = 50)
        assertFalse(reopened.isDone)
        assertEquals(-1, reopened.pagesOn(today))
    }

    @Test
    fun simpleTasksToggle() {
        val task = Task(id = "a", title = "Comprar folios", createdAt = 0)
        assertTrue(task.toggledDone(5).isDone)
        assertFalse(task.toggledDone(5).toggledDone(6).isDone)
    }

    @Test
    fun editingCanCompleteOrReopen() {
        val task = study(total = 100, done = 60)
        assertTrue(task.edited("Historia", "", task.examDate, 60, 60, now = 9).isDone)
        val withoutPages = task.copy(completedAt = 3).edited("Historia", "", null, 0, 0, now = 9)
        assertFalse(withoutPages.isDone)
    }

    @Test
    fun pendingSortedByClosestExamThenNoDate() {
        val a = study(100, examInDays = 10).copy(id = "a")
        val b = study(100, examInDays = 2).copy(id = "b")
        val c = study(100, examInDays = null).copy(id = "c")
        val d = study(100, done = 100, examInDays = 1).copy(id = "d", completedAt = 1)
        assertEquals(listOf("b", "a", "c"), listOf(a, b, c, d).pendingSorted().map { it.id })
    }

    @Test
    fun overviewAndReminder() {
        val historia = study(total = 100, done = 20, examInDays = 4).withPagesAdded(5, today, 1)
        val mates = study(total = 30, done = 0, examInDays = 1).copy(id = "m", title = "Mates")
        val tasks = listOf(historia, mates)
        val overview = tasks.dayOverview(today)
        assertEquals(5, overview.pagesToday)
        assertEquals(20 + 30, overview.goalToday)

        val reminder = tasks.dailyReminder(today)
        assertNotNull(reminder)
        assertEquals("Hoy te tocan 45 páginas", reminder!!.title)
        // Primero el examen más cercano.
        assertEquals("Mates: 30 págs (examen mañana)", reminder.lines[0])
        assertEquals("Historia: 15 págs (examen en 4 días)", reminder.lines[1])
    }

    @Test
    fun averagesPerSubject() {
        fun g(subject: String, value: Double, created: Long) =
            Grade(id = "$created", subject = subject, value = value, date = today, createdAt = created)

        val subjects = listOf(
            g("Matemáticas", 4.0, 1),
            g(" matematicas ", 5.0, 2),
            g("Historia", 7.0, 3),
            g("Historia", 8.0, 4),
            g("Historia", 8.0, 5),
            g("Inglés", 10.0, 6),
        ).bySubject()

        assertEquals(listOf("Historia", "Inglés", "Matematicas"), subjects.map { it.name })
        val mates = subjects.last()
        assertEquals(4.5, mates.average, 1e-9)
        assertEquals("4,5", Fmt.grade(mates.average))
        assertEquals("7,67", Fmt.grade(subjects[0].average))
        assertEquals("10", Fmt.grade(subjects[1].average))
        assertEquals((4.5 + 23.0 / 3 + 10.0) / 3, subjects.overallAverage()!!, 1e-9)
        assertEquals("Suspenso", gradeLabel(4.5))
        assertEquals("Notable", gradeLabel(7.67))
    }

    @Test
    fun parsesSpanishDecimals() {
        assertEquals(4.5, parseGrade("4,5")!!, 1e-9)
        assertEquals(7.25, parseGrade(" 7.25 ")!!, 1e-9)
        assertNull(parseGrade("11"))
        assertNull(parseGrade("-1"))
        assertNull(parseGrade("hola"))
    }

    @Test
    fun formats() {
        assertEquals("lun 26 oct", Fmt.dateShort(today))
        assertEquals("2 h 15 min", Fmt.duration(135 * 60_000L))
        assertEquals("3 d 4 h", Fmt.duration((3 * 24 + 4) * 3_600_000L))
        assertEquals("3.420", Fmt.int(3420))
        assertEquals("34,2 GB", Fmt.bytes(34_200_000_000))
    }
}
