package com.alldesignkarl.mipanel.util

import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

/** Formatos en español, escritos a mano para que no dependan de cómo abrevie cada móvil. */
object Fmt {
    private val es = Locale.forLanguageTag("es-ES")
    private val shortDays = listOf("lun", "mar", "mié", "jue", "vie", "sáb", "dom")
    private val longDays = listOf("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo")
    private val shortMonths = listOf("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic")
    private val longMonths = listOf(
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    )

    fun decimal(value: Double, decimals: Int = 1): String = String.format(es, "%.${decimals}f", value)

    /** 3420 -> "3.420" */
    fun int(value: Long): String = String.format(es, "%,d", value)

    fun int(value: Int): String = int(value.toLong())

    /** Tamaños en GB/MB con base 1000, como los muestra Android en Ajustes. */
    fun bytes(bytes: Long): String {
        val gb = bytes / 1e9
        return if (gb >= 1) "${decimal(gb, if (gb >= 100) 0 else 1)} GB" else "${decimal(bytes / 1e6, 0)} MB"
    }

    /** "2 h 15 min", "45 min", "3 d 4 h" */
    fun duration(millis: Long): String {
        val totalMinutes = (millis / 60_000.0).roundToLong().coerceAtLeast(0)
        val days = totalMinutes / (60 * 24)
        val hours = (totalMinutes / 60) % 24
        val minutes = totalMinutes % 60
        return when {
            days > 0 -> if (hours > 0) "$days d $hours h" else "$days d"
            hours > 0 -> if (minutes > 0) "$hours h $minutes min" else "$hours h"
            else -> "${minutes.coerceAtLeast(1)} min"
        }
    }

    /** "lun 3 nov" */
    fun dateShort(date: LocalDate): String =
        "${shortDays[date.dayOfWeek.value - 1]} ${date.dayOfMonth} ${shortMonths[date.monthValue - 1]}"

    /** "lunes, 3 de noviembre de 2026" */
    fun dateLong(date: LocalDate): String =
        "${longDays[date.dayOfWeek.value - 1]}, ${date.dayOfMonth} de ${longMonths[date.monthValue - 1]} de ${date.year}"

    /** "3 nov" */
    fun dayMonth(date: LocalDate): String = "${date.dayOfMonth} ${shortMonths[date.monthValue - 1]}"

    fun time(epochMillis: Long, zone: ZoneId = ZoneId.systemDefault()): String {
        val t = Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalTime()
        return String.format(es, "%02d:%02d", t.hour, t.minute)
    }

    fun hourMinute(hour: Int, minute: Int): String = String.format(es, "%02d:%02d", hour, minute)

    /** "26 oct a las 19:42" (sin el día si es hoy: "hoy a las 19:42") */
    fun moment(epochMillis: Long, today: LocalDate, zone: ZoneId = ZoneId.systemDefault()): String {
        val date = Instant.ofEpochMilli(epochMillis).atZone(zone).toLocalDate()
        val day = when (date) {
            today -> "hoy"
            today.minusDays(1) -> "ayer"
            else -> "el " + dayMonth(date)
        }
        return "$day a las ${time(epochMillis, zone)}"
    }

    /** Notas y medias con hasta dos decimales y sin ceros sobrantes: 4,5 · 7 · 6,67 */
    fun grade(value: Double): String {
        val rounded = BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).stripTrailingZeros()
        return rounded.toPlainString().replace('.', ',')
    }

    fun pages(n: Int): String = if (abs(n) == 1) "$n pág" else "$n págs"

    /** "1 día" / "3 días" */
    fun days(n: Long): String = if (n == 1L) "1 día" else "$n días"
}
