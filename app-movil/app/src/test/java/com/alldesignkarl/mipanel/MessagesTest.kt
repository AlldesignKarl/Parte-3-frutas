package com.alldesignkarl.mipanel

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.alldesignkarl.mipanel.mensajes.MessageItem
import com.alldesignkarl.mipanel.mensajes.MessageParser
import com.alldesignkarl.mipanel.mensajes.MessageStore
import com.alldesignkarl.mipanel.mensajes.RawMessage
import com.alldesignkarl.mipanel.mensajes.RawNotification
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class MessagesTest {
    private val now = 1_790_000_000_000L

    @Test
    fun whatsappGroupMessagesComeOneByOneWithTheirSender() {
        val n = RawNotification(
            pkg = "com.whatsapp", key = "0|com.whatsapp|1|familia", postTime = now, category = "msg",
            title = "Familia", conversationTitle = "Familia",
            messages = listOf(
                RawMessage("Mamá", "¿Vienes a comer?", now - 60_000),
                RawMessage(null, "Sí, a las 2", now - 30_000),
                RawMessage("Papá", "Vale 👍", now),
            ),
        )
        val items = MessageParser.parse(n)
        assertEquals(listOf("Mamá", "Tú", "Papá"), items.map { it.sender })
        assertTrue(items.all { it.chat == "Familia" && it.app == "WhatsApp" && it.kind == "mensaje" })
        // El mismo aviso actualizado con un mensaje más no repite los de antes
        val again = MessageParser.parse(n.copy(messages = n.messages + RawMessage("Mamá", "Genial", now + 1000)))
        val store = MessageStore(File.createTempFile("mensajes", ".json").apply { delete() })
        assertTrue(store.add(items))
        assertTrue(store.add(again))
        assertEquals(4, store.all().size)
        assertFalse(store.add(again))
        assertEquals("Genial", store.all().first().text)
    }

    @Test
    fun summariesOngoingAndOtherAppsAreIgnored() {
        val base = RawNotification(pkg = "com.whatsapp", key = "k", postTime = now, title = "WhatsApp", text = "5 mensajes nuevos")
        assertTrue(MessageParser.parse(base.copy(groupSummary = true)).isEmpty())
        assertTrue(MessageParser.parse(base).isEmpty()) // solo un recuento
        assertTrue(MessageParser.parse(base.copy(title = "Ana", text = "Llamada en curso", ongoing = true)).isEmpty())
        assertTrue(MessageParser.parse(base.copy(category = "service", title = "WhatsApp", text = "Buscando mensajes nuevos")).isEmpty())
        assertTrue(MessageParser.parse(base.copy(pkg = "com.spotify.music", title = "Canción", text = "Artista")).isEmpty())
        // Un mensaje que dice "perdida" no es una llamada
        val lost = MessageParser.parse(base.copy(title = "Ana", text = "He perdido las llaves"))
        assertEquals("mensaje", lost.single().kind)
    }

    @Test
    fun discordPlainNotificationIsAMessage() {
        val n = RawNotification(pkg = "com.discord", key = "d", postTime = now, title = "Leo (#general, Amigos)", text = "¿Jugamos luego?")
        val item = MessageParser.parse(n).single()
        assertEquals("Discord", item.app)
        assertEquals("Leo (#general, Amigos)", item.chat)
        assertEquals("¿Jugamos luego?", item.text)
    }

    @Test
    fun missedCallsFromThePhoneAndFromWhatsapp() {
        val samsung = MessageParser.parse(
            RawNotification(pkg = "com.samsung.android.dialer", key = "c", postTime = now, title = "Llamada perdida", text = "Mamá"),
        ).single()
        assertEquals("llamada", samsung.kind)
        assertEquals("Mamá", samsung.chat)
        assertEquals("Teléfono", samsung.app)

        val byCategory = MessageParser.parse(
            RawNotification(pkg = "com.google.android.dialer", key = "c2", postTime = now, category = "missed_call", title = "600 123 456", text = "Llamada perdida"),
        ).single()
        assertEquals("600 123 456", byCategory.chat)

        val whatsapp = MessageParser.parse(
            RawNotification(pkg = "com.whatsapp", key = "w", postTime = now, category = "call", title = "Ana", text = "Llamada de voz perdida"),
        ).single()
        assertEquals("llamada", whatsapp.kind)
        assertEquals("WhatsApp", whatsapp.app)
        assertEquals("Ana", whatsapp.chat)

        // Un aviso del teléfono que no es de llamada perdida (llamada entrante) no cuenta
        assertTrue(
            MessageParser.parse(RawNotification(pkg = "com.samsung.android.dialer", key = "x", postTime = now, title = "Mamá", text = "Llamada entrante", ongoing = true)).isEmpty(),
        )
    }

    @Test
    fun storeKeepsTheNewestAndSurvivesRestart() {
        val file = File(ApplicationProvider.getApplicationContext<android.content.Context>().filesDir, "prueba-mensajes.json")
        file.delete()
        val store = MessageStore(file)
        val many = (1..MessageStore.MAX_ITEMS + 20).map { i ->
            MessageItem("id$i", "com.whatsapp", "WhatsApp", "mensaje", "Ana", "Ana", "hola $i", now + i, "k")
        }
        assertTrue(store.add(many))
        assertEquals(MessageStore.MAX_ITEMS, store.all().size)
        assertEquals("hola ${MessageStore.MAX_ITEMS + 20}", store.all().first().text)
        val reopened = MessageStore(file)
        assertEquals(MessageStore.MAX_ITEMS, reopened.all().size)
        assertEquals("id${MessageStore.MAX_ITEMS + 20}", reopened.find("id${MessageStore.MAX_ITEMS + 20}")?.id)
        reopened.clear()
        assertTrue(MessageStore(file).all().isEmpty())
    }
}
