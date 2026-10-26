package com.alldesignkarl.mipanel.datos

import android.content.Context
import android.net.Uri
import com.alldesignkarl.mipanel.MiPanelApp
import com.alldesignkarl.mipanel.notas.Grade
import com.alldesignkarl.mipanel.tareas.Task
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException
import java.time.LocalDate

@Serializable
private data class BackupFile(
    val app: String = "MiPanel",
    val version: Int = 1,
    val createdAt: Long,
    val tasks: List<Task> = emptyList(),
    val grades: List<Grade> = emptyList(),
)

data class ImportResult(val tasks: Int, val grades: Int)

/** Copia de seguridad de tareas y notas en un archivo JSON que eliges tú (Descargas, Drive...). */
object Backup {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        prettyPrint = true
    }

    fun suggestedName(today: LocalDate = LocalDate.now()): String = "mipanel-copia-$today.json"

    suspend fun export(context: Context, uri: Uri) = withContext(Dispatchers.IO) {
        val app = context.applicationContext as MiPanelApp
        val backup = BackupFile(
            createdAt = System.currentTimeMillis(),
            tasks = app.tasks.snapshot(),
            grades = app.grades.snapshot(),
        )
        val bytes = json.encodeToString(BackupFile.serializer(), backup).encodeToByteArray()
        val out = context.contentResolver.openOutputStream(uri, "w") ?: throw IOException("No se pudo abrir el archivo")
        out.use { it.write(bytes) }
    }

    /** Añade lo que hay en la copia; si una tarea o nota ya existe, se queda la versión de la copia. */
    suspend fun import(context: Context, uri: Uri): ImportResult = withContext(Dispatchers.IO) {
        val app = context.applicationContext as MiPanelApp
        val input = context.contentResolver.openInputStream(uri) ?: throw IOException("No se pudo abrir el archivo")
        val text = input.use { it.readBytes().decodeToString() }
        val backup = try {
            json.decodeFromString(BackupFile.serializer(), text)
        } catch (e: Exception) {
            throw IOException("Ese archivo no es una copia de Mi Panel", e)
        }
        app.tasks.update { merge(it, backup.tasks, Task::id) }
        app.grades.update { merge(it, backup.grades, Grade::id) }
        ImportResult(tasks = backup.tasks.size, grades = backup.grades.size)
    }

    private fun <T> merge(current: List<T>, imported: List<T>, id: (T) -> String): List<T> {
        val importedIds = imported.mapTo(HashSet(), id)
        return current.filterNot { id(it) in importedIds } + imported
    }
}
