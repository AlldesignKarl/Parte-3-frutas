package com.alldesignkarl.mipanel.mensajes

import android.content.Context
import org.json.JSONArray
import java.io.File

/**
 * Los últimos mensajes y llamadas perdidas, guardados solo en el móvil (en la carpeta privada
 * de la app: ninguna otra app los puede leer y no se suben a ningún sitio).
 */
class MessageStore internal constructor(private val file: File) {
    private val items = ArrayList<MessageItem>() // del más reciente al más antiguo

    init {
        runCatching {
            if (file.exists()) {
                val array = JSONArray(file.readText())
                for (i in 0 until array.length()) items += MessageItem.fromJson(array.getJSONObject(i))
            }
        }
    }

    /** Añade los nuevos (los repetidos se ignoran). Devuelve si ha cambiado algo. */
    @Synchronized
    fun add(newItems: List<MessageItem>): Boolean {
        val ids = items.mapTo(HashSet()) { it.id }
        var changed = false
        for (item in newItems) {
            if (ids.add(item.id)) {
                items += item
                changed = true
            }
        }
        if (!changed) return false
        items.sortByDescending { it.time }
        while (items.size > MAX_ITEMS) items.removeAt(items.lastIndex)
        save()
        return true
    }

    @Synchronized
    fun all(): List<MessageItem> = items.toList()

    @Synchronized
    fun find(id: String): MessageItem? = items.firstOrNull { it.id == id }

    @Synchronized
    fun clear() {
        items.clear()
        save()
    }

    @Synchronized
    fun toJson(): String = JSONArray().apply { items.forEach { put(it.toJson()) } }.toString()

    private fun save() {
        runCatching {
            val tmp = File(file.path + ".tmp")
            tmp.writeText(toJson())
            if (!tmp.renameTo(file)) {
                file.writeText(tmp.readText())
                tmp.delete()
            }
        }
    }

    companion object {
        const val MAX_ITEMS = 300

        @Volatile private var instance: MessageStore? = null

        fun get(context: Context): MessageStore = instance ?: synchronized(this) {
            instance ?: MessageStore(File(context.applicationContext.filesDir, "mensajes.json")).also { instance = it }
        }
    }
}
