package com.alldesignkarl.mipanel.notas

import com.alldesignkarl.mipanel.datos.LocalDateSerializer
import kotlinx.serialization.Serializable
import java.text.Collator
import java.text.Normalizer
import java.time.LocalDate
import java.util.Locale

/** Una nota (de 0 a 10) de una asignatura. */
@Serializable
data class Grade(
    val id: String,
    val subject: String,
    val value: Double,
    /** Opcional: "Examen tema 3", "Trabajo"... */
    val description: String = "",
    @Serializable(with = LocalDateSerializer::class)
    val date: LocalDate,
    val createdAt: Long,
)

data class SubjectSummary(
    /** Clave para agrupar: sin mayúsculas, tildes ni espacios de más. */
    val key: String,
    val name: String,
    /** Media aritmética de todas sus notas: un 4 y un 5 dan 4,5. */
    val average: Double,
    /** De la más reciente a la más antigua. */
    val grades: List<Grade>,
)

const val MAX_GRADE = 10.0
const val PASS_GRADE = 5.0

/** "Matemáticas", " matematicas " y "MATEMÁTICAS" son la misma asignatura. */
fun subjectKey(name: String): String =
    Normalizer.normalize(name.trim().replace(Regex("\\s+"), " "), Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .lowercase(Locale.ROOT)

/** Escrita bonita: sin espacios de más y con la primera letra en mayúscula. */
fun cleanSubjectName(name: String): String =
    name.trim().replace(Regex("\\s+"), " ").replaceFirstChar { it.titlecase(Locale.forLanguageTag("es-ES")) }

private val spanishOrder: Collator = Collator.getInstance(Locale.forLanguageTag("es-ES")).apply {
    strength = Collator.PRIMARY
}

/** Agrupa las notas por asignatura y calcula la media de cada una (orden alfabético). */
fun List<Grade>.bySubject(): List<SubjectSummary> =
    groupBy { subjectKey(it.subject) }
        .map { (key, grades) ->
            val newestFirst = grades.sortedWith(compareByDescending<Grade> { it.date }.thenByDescending { it.createdAt })
            val name = cleanSubjectName(grades.maxBy { it.createdAt }.subject)
            SubjectSummary(
                key = key,
                name = name,
                average = grades.map { it.value }.average(),
                grades = newestFirst,
            )
        }
        .sortedWith { a, b -> spanishOrder.compare(a.name, b.name) }

/** Media general: la media de las medias de cada asignatura. */
fun List<SubjectSummary>.overallAverage(): Double? =
    if (isEmpty()) null else map { it.average }.average()

/** Nombre de la nota en el sistema español. */
fun gradeLabel(value: Double): String = when {
    value < PASS_GRADE -> "Suspenso"
    value < 6 -> "Aprobado"
    value < 7 -> "Bien"
    value < 9 -> "Notable"
    else -> "Sobresaliente"
}

/** Acepta "4,5" o "4.5"; null si no es un número entre 0 y 10. */
fun parseGrade(text: String): Double? =
    text.trim().replace(',', '.').toDoubleOrNull()?.takeIf { it in 0.0..MAX_GRADE }
