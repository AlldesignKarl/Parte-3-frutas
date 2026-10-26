package com.alldesignkarl.mipanel.estado

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicLong
import kotlin.coroutines.coroutineContext
import kotlin.math.abs
import kotlin.random.Random

enum class SpeedPhase(val label: String) {
    PING("Midiendo ping…"),
    DOWNLOAD("Midiendo bajada…"),
    UPLOAD("Midiendo subida…"),
}

sealed interface SpeedTestState {
    data object Idle : SpeedTestState

    data class Running(
        val phase: SpeedPhase,
        /** Avance total de 0 a 1. */
        val progress: Float,
        val pingMs: Int? = null,
        val downMbps: Double? = null,
        val liveMbps: Double? = null,
    ) : SpeedTestState

    data class Done(
        val pingMs: Int,
        val jitterMs: Int,
        val downMbps: Double,
        val upMbps: Double?,
        val measuredAt: Long,
    ) : SpeedTestState

    data class Failed(val message: String) : SpeedTestState
}

/** Calidad de la conexión según el test de velocidad. */
fun SpeedTestState.Done.verdict(): Pair<String, String> = when {
    downMbps >= 100 && pingMs <= 40 -> "Muy rápida" to "Va sobrada para vídeo 4K, juegos online y videollamadas."
    downMbps >= 25 && pingMs <= 80 -> "Buena" to "Perfecta para series en HD, redes y videollamadas."
    downMbps >= 8 -> "Normal" to "Bien para navegar y vídeo; puede ir justa con varias cosas a la vez."
    downMbps >= 2 -> "Lenta" to "Vale para mensajes y webs; los vídeos pueden cargar a trozos."
    else -> "Muy lenta" to "Casi no va: prueba a acercarte al router o cambiar de red."
}

/**
 * Test de velocidad contra los servidores de speed.cloudflare.com:
 * ping (varias peticiones vacías), bajada y subida con varias conexiones a la vez.
 */
object SpeedTester {
    private const val BASE = "https://speed.cloudflare.com"
    private const val PING_SAMPLES = 8
    private const val DOWNLOAD_MS = 8_000L
    private const val UPLOAD_MS = 6_000L
    private const val DOWNLOAD_STREAMS = 4
    private const val UPLOAD_STREAMS = 2
    private const val MAX_DOWNLOAD_BYTES = 150_000_000L
    private const val MAX_UPLOAD_BYTES = 40_000_000L

    suspend fun run(onUpdate: (SpeedTestState.Running) -> Unit): SpeedTestState.Done = withContext(Dispatchers.IO) {
        onUpdate(SpeedTestState.Running(SpeedPhase.PING, 0f))
        val samples = mutableListOf<Double>()
        repeat(PING_SAMPLES) { i ->
            ensureActive()
            val start = System.nanoTime()
            emptyRequest()
            val ms = (System.nanoTime() - start) / 1_000_000.0
            if (i > 0) samples += ms // la primera incluye DNS y TLS, no cuenta
            onUpdate(SpeedTestState.Running(SpeedPhase.PING, 0.1f * (i + 1) / PING_SAMPLES))
        }
        val sorted = samples.sorted()
        val ping = sorted[sorted.size / 2]
        val jitter = samples.zipWithNext { a, b -> abs(a - b) }.average()

        val down = measure(
            phase = SpeedPhase.DOWNLOAD,
            durationMs = DOWNLOAD_MS,
            streams = DOWNLOAD_STREAMS,
            maxBytes = MAX_DOWNLOAD_BYTES,
            progressStart = 0.1f,
            progressSpan = 0.55f,
            pingMs = ping.toInt(),
            downMbps = null,
            onUpdate = onUpdate,
        ) { counter, deadline -> downloadStream(counter, deadline, MAX_DOWNLOAD_BYTES) }

        // Si la subida falla (algunas redes la bloquean) el resultado sigue valiendo.
        val up = try {
            measure(
                phase = SpeedPhase.UPLOAD,
                durationMs = UPLOAD_MS,
                streams = UPLOAD_STREAMS,
                maxBytes = MAX_UPLOAD_BYTES,
                progressStart = 0.65f,
                progressSpan = 0.35f,
                pingMs = ping.toInt(),
                downMbps = down,
                onUpdate = onUpdate,
            ) { counter, deadline -> uploadStream(counter, deadline, MAX_UPLOAD_BYTES / UPLOAD_STREAMS) }
        } catch (_: IOException) {
            null
        }

        SpeedTestState.Done(
            pingMs = ping.toInt(),
            jitterMs = jitter.toInt(),
            downMbps = down,
            upMbps = up,
            measuredAt = System.currentTimeMillis(),
        )
    }

    private suspend fun measure(
        phase: SpeedPhase,
        durationMs: Long,
        streams: Int,
        maxBytes: Long,
        progressStart: Float,
        progressSpan: Float,
        pingMs: Int,
        downMbps: Double?,
        onUpdate: (SpeedTestState.Running) -> Unit,
        stream: suspend (AtomicLong, Long) -> Unit,
    ): Double = coroutineScope {
        val counter = AtomicLong(0)
        val start = System.nanoTime()
        val deadline = start + durationMs * 1_000_000
        val reporter = launch {
            while (isActive) {
                delay(250)
                val elapsed = (System.nanoTime() - start) / 1e9
                val fraction = (elapsed * 1000 / durationMs).toFloat().coerceIn(0f, 1f)
                onUpdate(
                    SpeedTestState.Running(
                        phase = phase,
                        progress = progressStart + progressSpan * fraction,
                        pingMs = pingMs,
                        downMbps = downMbps,
                        liveMbps = mbps(counter.get(), elapsed),
                    )
                )
            }
        }
        try {
            (1..streams).map {
                async {
                    // Si se corta una conexión se sigue con las demás; si fallan todas, no llega nada.
                    try {
                        stream(counter, deadline)
                    } catch (_: IOException) {
                    }
                }
            }.awaitAll()
        } finally {
            reporter.cancel()
        }
        val elapsed = (System.nanoTime() - start) / 1e9
        val bytes = counter.get().coerceAtMost(maxBytes)
        if (bytes == 0L) throw IOException("No ha llegado ningún dato")
        mbps(bytes, elapsed)
    }

    private fun emptyRequest() {
        val conn = open("$BASE/__down?bytes=0")
        try {
            if (conn.responseCode !in 200..299) throw IOException("HTTP ${conn.responseCode}")
            conn.inputStream.use { it.readBytes() }
        } catch (e: IOException) {
            conn.disconnect()
            throw e
        }
    }

    private suspend fun downloadStream(counter: AtomicLong, deadline: Long, maxBytes: Long) {
        val conn = open("$BASE/__down?bytes=${maxBytes / DOWNLOAD_STREAMS}")
        try {
            conn.inputStream.use { input ->
                val buffer = ByteArray(64 * 1024)
                while (System.nanoTime() < deadline && counter.get() < maxBytes) {
                    coroutineContext.ensureActive()
                    val read = input.read(buffer)
                    if (read < 0) break
                    counter.addAndGet(read.toLong())
                }
            }
        } finally {
            conn.disconnect()
        }
    }

    private suspend fun uploadStream(counter: AtomicLong, deadline: Long, maxBytes: Long) {
        val conn = open("$BASE/__up")
        conn.requestMethod = "POST"
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/octet-stream")
        conn.setChunkedStreamingMode(64 * 1024)
        val chunk = Random.nextBytes(64 * 1024)
        var sent = 0L
        try {
            conn.outputStream.use { out ->
                while (System.nanoTime() < deadline && sent < maxBytes) {
                    coroutineContext.ensureActive()
                    out.write(chunk)
                    sent += chunk.size
                    counter.addAndGet(chunk.size.toLong())
                }
            }
            conn.responseCode // espera a que el servidor confirme que lo ha recibido
        } finally {
            conn.disconnect()
        }
    }

    private fun open(url: String): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 6_000
            readTimeout = 10_000
            useCaches = false
            setRequestProperty("User-Agent", "MiPanel/1.0 (Android)")
        }

    private fun mbps(bytes: Long, seconds: Double): Double =
        if (seconds <= 0) 0.0 else bytes * 8 / seconds / 1_000_000
}
