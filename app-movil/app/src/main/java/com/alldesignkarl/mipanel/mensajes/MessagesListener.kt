package com.alldesignkarl.mipanel.mensajes

import android.app.ActivityOptions
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.ConcurrentHashMap

/**
 * Recibe los avisos del móvil (cuando le das "Acceso a notificaciones" a Mi Panel) y se queda
 * con los mensajes de WhatsApp, Discord, Telegram… y las llamadas perdidas.
 */
class MessagesListener : NotificationListenerService() {

    override fun onListenerConnected() {
        // Los avisos que ya estaban en la barra al dar el permiso o al reiniciar el móvil.
        runCatching { activeNotifications }.getOrNull()?.forEach { handle(it) }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        handle(sbn)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        contentIntents.remove(sbn.key)
    }

    private fun handle(sbn: StatusBarNotification) {
        if (sbn.packageName == packageName) return
        val items = runCatching { MessageParser.parse(MessageParser.fromStatusBar(sbn)) }.getOrNull().orEmpty()
        if (items.isEmpty()) return
        sbn.notification.contentIntent?.let { contentIntents[sbn.key] = it }
        if (MessageStore.get(this).add(items)) onChange?.invoke()
    }

    companion object {
        /** Lo pone la pantalla mientras está abierta, para enseñar los mensajes al momento. */
        @Volatile var onChange: (() -> Unit)? = null

        private val contentIntents = ConcurrentHashMap<String, PendingIntent>()

        /** Abre la conversación (como al tocar el aviso) o, si ya no está, la app. */
        fun open(context: Context, item: MessageItem?): Boolean {
            if (item == null) return false
            contentIntents[item.key]?.let { pending ->
                val options = if (Build.VERSION.SDK_INT >= 34) {
                    ActivityOptions.makeBasic()
                        .setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
                        .toBundle()
                } else {
                    null
                }
                if (runCatching { pending.send(context, 0, null, null, null, null, options) }.isSuccess) return true
            }
            val launch = context.packageManager.getLaunchIntentForPackage(item.pkg) ?: return false
            return runCatching { context.startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }.isSuccess
        }
    }
}
