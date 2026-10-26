package com.alldesignkarl.mipanel.notas

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import com.alldesignkarl.mipanel.util.Fmt
import kotlin.math.roundToInt

private val RowHeight = 40.dp
private val BarThickness = 16.dp
private val AxisHeight = 24.dp
private val ValueSpace = 44.dp

/**
 * Gráfica de barras horizontales: una fila por asignatura con su media de 0 a 10.
 * Línea fina en el 5 (aprobado). Tocando una barra se ven sus notas debajo.
 */
@Composable
fun AverageChart(subjects: List<SubjectSummary>, modifier: Modifier = Modifier) {
    var selectedKey by remember { mutableStateOf<String?>(null) }
    val selected = subjects.firstOrNull { it.key == selectedKey }

    val measurer = rememberTextMeasurer()
    val colors = MaterialTheme.colorScheme
    val bar = colors.primary
    val grid = colors.outlineVariant
    val highlight = colors.surfaceContainerHighest
    val labelStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.onSurface)
    val valueStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.onSurface, fontWeight = FontWeight.SemiBold)
    val axisStyle = MaterialTheme.typography.labelSmall.copy(color = colors.onSurfaceVariant)
    val description = subjects.joinToString("; ") { "${it.name}: media ${Fmt.grade(it.average)}" }

    Column(modifier) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(RowHeight * subjects.size + AxisHeight)
                .semantics { contentDescription = "Gráfica de medias. $description" }
                .pointerInput(subjects) {
                    detectTapGestures { offset ->
                        val row = (offset.y / RowHeight.toPx()).toInt()
                        val tapped = subjects.getOrNull(row)?.key
                        selectedKey = if (tapped == null || tapped == selectedKey) null else tapped
                    }
                },
        ) {
            val rowH = RowHeight.toPx()
            val labelWidth = (size.width * 0.34f).coerceAtMost(150.dp.toPx())
            val plotStart = labelWidth + 10.dp.toPx()
            val plotEnd = size.width - ValueSpace.toPx()
            val plotWidth = (plotEnd - plotStart).coerceAtLeast(1f)
            fun x(value: Double) = plotStart + (value / MAX_GRADE).toFloat() * plotWidth
            val plotBottom = rowH * subjects.size

            subjects.forEachIndexed { i, subject ->
                if (subject.key == selectedKey) {
                    drawRoundRect(
                        highlight,
                        topLeft = Offset(0f, i * rowH),
                        size = Size(size.width, rowH),
                        cornerRadius = CornerRadius(8.dp.toPx()),
                    )
                }
            }

            // Rejilla: finas y sólidas en 0, 5 (aprobado) y 10.
            for (tick in listOf(0.0, PASS_GRADE, MAX_GRADE)) {
                drawLine(grid, Offset(x(tick), 0f), Offset(x(tick), plotBottom), strokeWidth = 1.dp.toPx())
                val text = measurer.measure(if (tick == PASS_GRADE) "5 aprobado" else Fmt.grade(tick), axisStyle)
                val left = (x(tick) - text.size.width / 2f).coerceIn(0f, size.width - text.size.width)
                drawText(text, topLeft = Offset(left, plotBottom + 4.dp.toPx()))
            }

            subjects.forEachIndexed { i, subject ->
                val centerY = i * rowH + rowH / 2

                val label = measurer.measure(
                    subject.name,
                    labelStyle,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                    constraints = Constraints(maxWidth = labelWidth.roundToInt().coerceAtLeast(1)),
                )
                drawText(label, topLeft = Offset(0f, centerY - label.size.height / 2f))

                // Barra con el extremo redondeado y la base recta, saliendo de 0.
                val thickness = BarThickness.toPx()
                val end = x(subject.average).coerceAtLeast(plotStart + 1f)
                val radius = CornerRadius(4.dp.toPx())
                val path = Path().apply {
                    addRoundRect(
                        RoundRect(
                            left = plotStart,
                            top = centerY - thickness / 2,
                            right = end,
                            bottom = centerY + thickness / 2,
                            topLeftCornerRadius = CornerRadius.Zero,
                            topRightCornerRadius = radius,
                            bottomRightCornerRadius = radius,
                            bottomLeftCornerRadius = CornerRadius.Zero,
                        )
                    )
                }
                drawPath(path, bar)

                val value = measurer.measure(Fmt.grade(subject.average), valueStyle)
                drawText(value, topLeft = Offset(end + 6.dp.toPx(), centerY - value.size.height / 2f))
            }
        }

        if (selected != null) {
            Spacer(Modifier.height(8.dp))
            val notes = selected.grades.joinToString(" · ") { Fmt.grade(it.value) }
            Text(
                "${selected.name}: ${selected.grades.size} " +
                    (if (selected.grades.size == 1) "nota" else "notas") +
                    " ($notes) → media ${Fmt.grade(selected.average)}, ${gradeLabel(selected.average).lowercase()}",
                style = MaterialTheme.typography.bodyMedium,
            )
        } else {
            Spacer(Modifier.height(4.dp))
            Text(
                "Toca una barra para ver sus notas.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
