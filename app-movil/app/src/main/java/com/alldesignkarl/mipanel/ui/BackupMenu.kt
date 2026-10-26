package com.alldesignkarl.mipanel.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.alldesignkarl.mipanel.datos.Backup
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

/** Botón ⋮ de la barra de arriba con la opción de copia de seguridad. */
@Composable
fun BackupMenuButton() {
    var menu by remember { mutableStateOf(false) }
    var dialog by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, contentDescription = "Más opciones") }
        DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
            DropdownMenuItem(
                text = { Text("Copia de seguridad") },
                onClick = {
                    menu = false
                    dialog = true
                },
            )
        }
    }
    if (dialog) BackupDialog(onDismiss = { dialog = false })
}

@Composable
private fun BackupDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var message by remember { mutableStateOf<String?>(null) }

    val exporter = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            message = try {
                Backup.export(context, uri)
                "✓ Copia guardada"
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                "No se pudo guardar: ${e.message}"
            }
        }
    }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            message = try {
                val result = Backup.import(context, uri)
                "✓ Recuperadas ${result.tasks} tareas y ${result.grades} notas"
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                "No se pudo recuperar: ${e.message}"
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Copia de seguridad") },
        text = {
            Column {
                Text(
                    "Guarda tus tareas y notas en un archivo (en Descargas, Drive...). " +
                        "Si algún día tienes que reinstalar la app, las recuperas desde aquí."
                )
                Spacer(Modifier.height(16.dp))
                Button(onClick = { exporter.launch(Backup.suggestedName()) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Guardar copia")
                }
                OutlinedButton(onClick = { importer.launch(arrayOf("*/*")) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Recuperar una copia")
                }
                message?.let {
                    Spacer(Modifier.height(12.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Cerrar") } },
    )
}
