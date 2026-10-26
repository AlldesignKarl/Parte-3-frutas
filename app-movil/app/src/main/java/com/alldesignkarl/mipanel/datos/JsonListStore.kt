package com.alldesignkarl.mipanel.datos

import android.util.AtomicFile
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Guarda una lista en un JSON dentro del almacenamiento privado de la app.
 * Solo se lee desde este móvil; Android lo incluye en la copia de seguridad de Google.
 */
class JsonListStore<T>(
    directory: File,
    fileName: String,
    itemSerializer: KSerializer<T>,
    scope: CoroutineScope,
) {
    private val file = AtomicFile(File(directory, fileName))
    private val corruptCopy = File(directory, "$fileName.corrupto")
    private val serializer = Stored.serializer(itemSerializer)
    private val mutex = Mutex()

    private val _items = MutableStateFlow<List<T>?>(null)

    /** null mientras se carga del disco. */
    val items: StateFlow<List<T>?> = _items.asStateFlow()

    init {
        scope.launch(Dispatchers.IO) { snapshot() }
    }

    /** Lista actual (la carga si aún no se había leído). */
    suspend fun snapshot(): List<T> = mutex.withLock { loadedLocked() }

    /** Aplica un cambio y lo guarda. Devuelve la lista nueva. */
    suspend fun update(transform: (List<T>) -> List<T>): List<T> = mutex.withLock {
        val next = transform(loadedLocked())
        _items.value = next
        withContext(Dispatchers.IO) { write(next) }
        next
    }

    private suspend fun loadedLocked(): List<T> =
        _items.value ?: withContext(Dispatchers.IO) { read() }.also { _items.value = it }

    private fun read(): List<T> {
        if (!file.baseFile.exists()) return emptyList()
        return try {
            json.decodeFromString(serializer, file.readFully().decodeToString()).items
        } catch (e: Exception) {
            // No se borra nada: se guarda una copia del archivo para poder recuperarlo.
            Log.e(TAG, "No se pudo leer ${file.baseFile.name}", e)
            runCatching { file.baseFile.copyTo(corruptCopy, overwrite = true) }
            emptyList()
        }
    }

    private fun write(items: List<T>) {
        val out = file.startWrite()
        try {
            out.write(json.encodeToString(serializer, Stored(items = items)).encodeToByteArray())
            file.finishWrite(out)
        } catch (e: Exception) {
            file.failWrite(out)
            Log.e(TAG, "No se pudo guardar ${file.baseFile.name}", e)
        }
    }

    @Serializable
    private data class Stored<E>(val version: Int = 1, val items: List<E>)

    private companion object {
        const val TAG = "JsonListStore"
        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
            prettyPrint = true
        }
    }
}
