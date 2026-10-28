package com.alldesignkarl.mipanel.mensajes

import android.app.Notification
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import org.json.JSONObject

/** Un mensaje o una llamada perdida, tal como lo muestra Mi Panel. */
data class MessageItem(
    val id: String,
    val pkg: String,
    val app: String,
    /** "mensaje" o "llamada" */
    val kind: String,
    /** Chat o grupo (en una llamada, quién llamó) */
    val chat: String,
    val sender: String,
    val text: String,
    val time: Long,
    /** Aviso del que viene (para abrir la conversación) */
    val key: String,
) {
    fun toJson(): JSONObject = JSONObject()
        .put("id", id).put("pkg", pkg).put("app", app).put("kind", kind).put("chat", chat)
        .put("sender", sender).put("text", text).put("time", time).put("key", key)

    companion object {
        fun fromJson(o: JSONObject) = MessageItem(
            id = o.getString("id"),
            pkg = o.optString("pkg"),
            app = o.optString("app"),
            kind = o.optString("kind", "mensaje"),
            chat = o.optString("chat"),
            sender = o.optString("sender"),
            text = o.optString("text"),
            time = o.optLong("time"),
            key = o.optString("key"),
        )
    }
}

/** Lo que interesa de un aviso de Android (separado del aviso para poder probarlo). */
data class RawNotification(
    val pkg: String,
    val key: String,
    val postTime: Long,
    val category: String? = null,
    val title: String? = null,
    val text: String? = null,
    val bigText: String? = null,
    val conversationTitle: String? = null,
    val messages: List<RawMessage> = emptyList(),
    val groupSummary: Boolean = false,
    val ongoing: Boolean = false,
)

/** Un mensaje de un aviso con varios (MessagingStyle). sender null = lo has mandado tú. */
data class RawMessage(val sender: String?, val text: String?, val time: Long)

object MessageParser {
    /** Apps de mensajes que se leen (las demás se ignoran). */
    val MESSAGE_APPS = linkedMapOf(
        "com.whatsapp" to "WhatsApp",
        "com.whatsapp.w4b" to "WhatsApp Business",
        "com.discord" to "Discord",
        "org.telegram.messenger" to "Telegram",
        "com.instagram.android" to "Instagram",
        "com.snapchat.android" to "Snapchat",
        "com.google.android.apps.messaging" to "Mensajes",
        "com.samsung.android.messaging" to "Mensajes",
    )

    /** Apps del teléfono (llamadas perdidas). */
    private val CALL_APPS = setOf(
        "com.samsung.android.dialer",
        "com.samsung.android.incallui",
        "com.google.android.dialer",
        "com.android.dialer",
        "com.android.server.telecom",
        "com.android.incallui",
    )

    /** Avisos que no son mensajes: "buscando mensajes nuevos", llamadas en curso, subidas… */
    private val SKIP_CATEGORIES = setOf("service", "progress", "status", "sys", "transport", "call", "navigation", "alarm", "promo", "recommendation")

    private val MISSED = Regex("perdid|missed", RegexOption.IGNORE_CASE)
    /** En apps de mensajes (WhatsApp: "Llamada de voz perdida") hace falta que hable de una llamada. */
    private val MISSED_CALL = Regex("llamada.{0,20}perdid|perdid.{0,20}llamada|missed.{0,12}call", RegexOption.IGNORE_CASE)
    private val COUNT_ONLY = Regex("^\\d+\\s+(mensajes|nuevos mensajes|messages|new messages|chats)\\b.*", RegexOption.IGNORE_CASE)

    fun parse(n: RawNotification): List<MessageItem> {
        if (n.groupSummary || n.ongoing) return emptyList()
        val messagingApp = MESSAGE_APPS[n.pkg]
        val callApp = n.pkg in CALL_APPS
        if (messagingApp == null && !callApp && n.category != "missed_call") return emptyList()

        // Llamada perdida: por su categoría (Android 11+) o por el texto del aviso del teléfono / de WhatsApp.
        val texts = listOfNotNull(n.title, n.text)
        val mentionsMissed = if (callApp) texts.any { MISSED.containsMatchIn(it) } else texts.any { MISSED_CALL.containsMatchIn(it) }
        if (n.category == "missed_call" || (mentionsMissed && n.messages.isEmpty())) {
            val who = when {
                n.title != null && MISSED.containsMatchIn(n.title) -> n.text ?: n.title
                else -> n.title ?: n.text
            }?.let(::clean)?.takeIf { it.isNotEmpty() } ?: "Número oculto"
            val app = messagingApp ?: "Teléfono"
            return listOf(
                MessageItem(
                    id = "llamada|${n.pkg}|$who|${n.postTime / 60_000}",
                    pkg = n.pkg, app = app, kind = "llamada", chat = who, sender = who,
                    text = clean(listOfNotNull(n.title, n.text).firstOrNull { MISSED.containsMatchIn(it) } ?: "Llamada perdida"),
                    time = n.postTime, key = n.key,
                ),
            )
        }
        if (messagingApp == null) return emptyList()
        if (n.category != null && n.category in SKIP_CATEGORIES) return emptyList()

        if (n.messages.isNotEmpty()) {
            val chat = clean(n.conversationTitle ?: n.title ?: messagingApp)
            return n.messages.filter { !it.text.isNullOrBlank() }.map { m ->
                val sender = m.sender?.let(::clean) ?: "Tú"
                val time = if (m.time > 0) m.time else n.postTime
                MessageItem(
                    id = "${n.pkg}|$chat|$sender|$time|${m.text.hashCode()}",
                    pkg = n.pkg, app = messagingApp, kind = "mensaje", chat = chat, sender = sender,
                    text = clean(m.text), time = time, key = n.key,
                )
            }
        }
        val text = (n.bigText ?: n.text)?.let(::clean).orEmpty()
        val title = n.title?.let(::clean).orEmpty()
        if (text.isEmpty() || title.isEmpty() || COUNT_ONLY.matches(text)) return emptyList()
        return listOf(
            MessageItem(
                id = "${n.pkg}|$title|${text.hashCode()}|${n.key.hashCode()}",
                pkg = n.pkg, app = messagingApp, kind = "mensaje", chat = title, sender = title,
                text = text, time = n.postTime, key = n.key,
            ),
        )
    }

    /** Aviso de Android → datos para parse(). */
    fun fromStatusBar(sbn: StatusBarNotification): RawNotification {
        val n = sbn.notification
        val extras = n.extras
        val style = runCatching { NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(n) }.getOrNull()
        return RawNotification(
            pkg = sbn.packageName,
            key = sbn.key,
            postTime = sbn.postTime,
            category = n.category,
            title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
            text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
            bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString(),
            conversationTitle = style?.conversationTitle?.toString(),
            messages = style?.messages?.map { RawMessage(it.person?.name?.toString(), it.text?.toString(), it.timestamp) }.orEmpty(),
            groupSummary = (n.flags and Notification.FLAG_GROUP_SUMMARY) != 0,
            ongoing = sbn.isOngoing,
        )
    }

    private fun clean(s: CharSequence?): String = s?.toString()?.trim()?.take(600).orEmpty()
}
