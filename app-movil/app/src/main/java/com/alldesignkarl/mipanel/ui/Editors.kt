package com.alldesignkarl.mipanel.ui

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.alldesignkarl.mipanel.util.Fmt
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/** Editor a pantalla completa con "X" para cerrar y "Guardar" arriba. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullScreenEditor(
    title: String,
    saveEnabled: Boolean,
    onClose: () -> Unit,
    onSave: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text(title, fontWeight = FontWeight.SemiBold) },
                        navigationIcon = {
                            IconButton(onClick = onClose) { Icon(Icons.Filled.Close, contentDescription = "Cerrar") }
                        },
                        actions = {
                            TextButton(onClick = onSave, enabled = saveEnabled) { Text("Guardar") }
                        },
                    )
                },
            ) { padding ->
                Column(
                    Modifier
                        .padding(padding)
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    content = content,
                )
            }
        }
    }
}

/** Campo de fecha que abre el calendario. Con [optional] se puede dejar vacío. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(
    label: String,
    date: LocalDate?,
    onDateChange: (LocalDate?) -> Unit,
    modifier: Modifier = Modifier,
    optional: Boolean = true,
    supportingText: String? = null,
) {
    var open by remember { mutableStateOf(false) }
    // El campo es de solo lectura: al tocarlo se abre el calendario.
    val interaction = remember { MutableInteractionSource() }
    LaunchedEffect(interaction) {
        interaction.interactions.collect { if (it is PressInteraction.Release) open = true }
    }
    OutlinedTextField(
        value = date?.let { Fmt.dateLong(it) } ?: "",
        onValueChange = {},
        readOnly = true,
        label = { Text(label) },
        placeholder = { Text("Sin fecha") },
        supportingText = supportingText?.let { { Text(it) } },
        trailingIcon = {
            if (optional && date != null) {
                IconButton(onClick = { onDateChange(null) }) { Icon(Icons.Filled.Close, contentDescription = "Quitar fecha") }
            } else {
                IconButton(onClick = { open = true }) { Icon(Icons.Filled.DateRange, contentDescription = "Elegir fecha") }
            }
        },
        modifier = modifier.fillMaxWidth(),
        singleLine = true,
        interactionSource = interaction,
    )
    if (open) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = (date ?: LocalDate.now()).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let {
                        onDateChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate())
                    }
                    open = false
                }) { Text("Aceptar") }
            },
            dismissButton = { TextButton(onClick = { open = false }) { Text("Cancelar") } },
        ) {
            DatePicker(state = state, showModeToggle = false)
        }
    }
}

/** Solo deja escribir cifras (y como mucho [maxLength]). */
fun digitsOnly(text: String, maxLength: Int = 5): String = text.filter(Char::isDigit).take(maxLength)

/** Para notas: cifras y una coma o punto decimal. */
fun decimalOnly(text: String): String {
    val cleaned = StringBuilder()
    var separator = false
    for (c in text) {
        when {
            c.isDigit() -> cleaned.append(c)
            (c == ',' || c == '.') && !separator -> {
                separator = true
                cleaned.append(',')
            }
        }
    }
    return cleaned.take(5).toString()
}
