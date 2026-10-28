package com.alldesignkarl.mipanel

import android.content.ContentValues
import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File

/** Linterna de verdad: el flash de atrás, que sigue encendido aunque salgas de la app. */
object Torch {
    fun set(context: Context, on: Boolean): Boolean = runCatching {
        val cameras = context.getSystemService(CameraManager::class.java) ?: return false
        val id = cameras.cameraIdList.firstOrNull { id ->
            val info = cameras.getCameraCharacteristics(id)
            info.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true &&
                info.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
        } ?: cameras.cameraIdList.firstOrNull { id ->
            cameras.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
        } ?: return false
        cameras.setTorchMode(id, on)
        true
    }.getOrDefault(false)
}

/** Guarda un archivo (la copia de seguridad) en la carpeta Descargas del móvil. */
object Downloads {
    fun save(context: Context, name: String, mime: String, text: String): Boolean = runCatching {
        val bytes = text.toByteArray(Charsets.UTF_8)
        val safeName = name.replace(Regex("[^A-Za-z0-9._-]"), "_").ifBlank { "mipanel.json" }
        if (Build.VERSION.SDK_INT >= 29) {
            val resolver = context.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, safeName)
                put(MediaStore.MediaColumns.MIME_TYPE, mime)
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return false
            resolver.openOutputStream(uri)?.use { it.write(bytes) } ?: return false
            values.clear()
            values.put(MediaStore.MediaColumns.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        } else {
            val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: return false
            File(dir, safeName).writeBytes(bytes)
        }
        true
    }.getOrDefault(false)
}
