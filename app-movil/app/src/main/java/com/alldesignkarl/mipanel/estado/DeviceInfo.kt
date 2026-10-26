package com.alldesignkarl.mipanel.estado

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.SystemClock

data class DeviceInfo(
    val model: String,
    val android: String,
    val storageFree: Long,
    val storageTotal: Long,
    val ramFree: Long,
    val ramTotal: Long,
    val uptimeMs: Long,
) {
    companion object {
        fun read(context: Context): DeviceInfo {
            val stat = runCatching { StatFs(Environment.getDataDirectory().path) }.getOrNull()
            val memory = ActivityManager.MemoryInfo()
            runCatching { context.getSystemService(ActivityManager::class.java)?.getMemoryInfo(memory) }
            val brand = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
            val model = if (Build.MODEL.startsWith(Build.MANUFACTURER, ignoreCase = true)) {
                Build.MODEL
            } else {
                "$brand ${Build.MODEL}"
            }
            return DeviceInfo(
                model = model,
                android = "Android ${Build.VERSION.RELEASE}",
                storageFree = stat?.availableBytes ?: 0,
                storageTotal = stat?.totalBytes ?: 0,
                ramFree = memory.availMem,
                ramTotal = memory.totalMem,
                uptimeMs = SystemClock.elapsedRealtime(),
            )
        }
    }
}
