package com.alldesignkarl.mipanel.recordatorio

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.alldesignkarl.mipanel.MainActivity
import com.alldesignkarl.mipanel.MiPanelApp
import com.alldesignkarl.mipanel.R
import com.alldesignkarl.mipanel.tareas.dailyReminder
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.concurrent.TimeUnit

/** Programa el aviso diario: cada aviso deja programado el del día siguiente. */
object ReminderScheduler {
    private const val WORK_NAME = "recordatorio-diario"

    /** Al cambiar los ajustes: sustituye lo que hubiera programado. */
    fun apply(context: Context, settings: ReminderSettings) {
        val wm = WorkManager.getInstance(context)
        if (!settings.enabled) {
            wm.cancelUniqueWork(WORK_NAME)
            return
        }
        wm.enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request(settings))
    }

    /** Al abrir la app: lo programa solo si no había nada pendiente. */
    fun ensure(context: Context, settings: ReminderSettings) {
        if (!settings.enabled) return
        WorkManager.getInstance(context)
            .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.KEEP, request(settings))
    }

    /** Desde el propio aviso: encadena el siguiente sin cancelar el que se está ejecutando. */
    internal fun scheduleNext(context: Context, settings: ReminderSettings) {
        if (!settings.enabled) return
        WorkManager.getInstance(context)
            .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.APPEND_OR_REPLACE, request(settings))
    }

    private fun request(settings: ReminderSettings) =
        OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(millisUntil(settings.hour, settings.minute), TimeUnit.MILLISECONDS)
            .build()

    private fun millisUntil(hour: Int, minute: Int): Long {
        val now = LocalDateTime.now()
        var next = LocalDateTime.of(LocalDate.now(), LocalTime.of(hour, minute))
        // Margen de un minuto para que el aviso recién lanzado no se vuelva a programar para hoy.
        if (!next.isAfter(now.plusMinutes(1))) next = next.plusDays(1)
        return Duration.between(now, next).toMillis()
    }
}

class ReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val app = applicationContext as MiPanelApp
        val settings = app.settings.reminder.value
        if (!settings.enabled) return Result.success()
        val reminder = app.tasks.snapshot().dailyReminder(LocalDate.now())
        if (reminder != null) Notifications.showReminder(applicationContext, reminder.title, reminder.lines)
        ReminderScheduler.scheduleNext(applicationContext, settings)
        return Result.success()
    }
}

object Notifications {
    private const val CHANNEL_ID = "recordatorios"
    private const val REMINDER_ID = 1

    fun createChannel(context: Context) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Recordatorio de estudio",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply { description = "Aviso diario con las páginas que te tocan hoy" }
        context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }

    fun canNotify(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    fun showReminder(context: Context, title: String, lines: List<String>) {
        if (!canNotify(context)) return
        val open = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java)
                .putExtra(MainActivity.EXTRA_OPEN_TASKS, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val style = NotificationCompat.InboxStyle().setBigContentTitle(title)
        lines.forEach { style.addLine(it) }
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(lines.joinToString(" · "))
            .setStyle(style)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        try {
            NotificationManagerCompat.from(context).notify(REMINDER_ID, notification)
        } catch (_: SecurityException) {
            // Se quitó el permiso justo ahora: no pasa nada, mañana se vuelve a intentar.
        }
    }
}
