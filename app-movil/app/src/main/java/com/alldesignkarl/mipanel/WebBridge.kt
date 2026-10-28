package com.alldesignkarl.mipanel

import android.Manifest
import android.os.Build
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat
import com.alldesignkarl.mipanel.mensajes.MessageStore
import com.alldesignkarl.mipanel.mensajes.MessagesListener
import org.json.JSONObject
import java.net.URI

/**
 * Lo que la página de Mi Panel puede pedirle al móvil (window.MiPanelAndroid en JavaScript).
 *
 * Solo responde a Mi Panel: si la vista mostrara cualquier otra página (que no debería, porque
 * los enlaces de fuera se abren en el navegador), no daría ningún dato.
 */
class WebBridge(private val activity: MainActivity, private val headphones: Headphones) {
    /** Página que se está mostrando (la ponen los avisos de la vista web). */
    @Volatile var pageUrl: String? = null

    /** Archivo compartido con la app que la página aún no ha recogido. */
    @Volatile var shared: SharedFile? = null

    private val store by lazy { MessageStore.get(activity) }

    private fun allowed() = isAppUrl(pageUrl)

    @JavascriptInterface
    fun appVersion(): String = if (allowed()) activity.appVersion() else ""

    // ---- Mensajes y llamadas perdidas

    @JavascriptInterface
    fun hasMessageAccess(): Boolean =
        allowed() && NotificationManagerCompat.getEnabledListenerPackages(activity).contains(activity.packageName)

    @JavascriptInterface
    fun openMessageAccess() {
        if (allowed()) activity.runOnUiThread { activity.openMessageAccess() }
    }

    @JavascriptInterface
    fun openAppSettings() {
        if (allowed()) activity.runOnUiThread { activity.openAppSettings() }
    }

    @JavascriptInterface
    fun messages(): String = if (allowed()) store.toJson() else "[]"

    @JavascriptInterface
    fun clearMessages() {
        if (allowed()) store.clear()
    }

    @JavascriptInterface
    fun openMessage(id: String): Boolean = allowed() && MessagesListener.open(activity, store.find(id))

    // ---- Móvil

    @JavascriptInterface
    fun setTorch(on: Boolean): Boolean = allowed() && Torch.set(activity, on)

    @JavascriptInterface
    fun keepScreenOn(on: Boolean) {
        if (allowed()) activity.runOnUiThread { activity.keepScreenOn(on) }
    }

    @JavascriptInterface
    fun saveFile(name: String, mime: String, text: String): Boolean = allowed() && Downloads.save(activity, name, mime, text)

    @JavascriptInterface
    fun headphones(): String = if (allowed()) headphones.json() else "{}"

    @JavascriptInterface
    fun requestBluetooth() {
        if (!allowed() || Build.VERSION.SDK_INT < 31) return
        activity.runOnUiThread {
            activity.withPermissions(arrayOf(Manifest.permission.BLUETOOTH_CONNECT)) {
                headphones.start()
                activity.emit("mipanel-cascos")
            }
        }
    }

    /** El archivo compartido (una vez): { name, type, data (base64) }, o null si no hay. */
    @JavascriptInterface
    fun takeSharedFile(): String? {
        if (!allowed()) return null
        val file = shared ?: return null
        shared = null
        return JSONObject().put("name", file.name).put("type", file.type).put("data", file.base64).toString()
    }

    companion object {
        const val NAME = "MiPanelAndroid"
        private const val HOST = "raw.githack.com"
        private const val PATH = "/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/"
        const val APP_URL = "https://$HOST${PATH}index.html"

        /** ¿Es una página de Mi Panel? (https, ese servidor y esa carpeta exactos). */
        fun isAppUrl(url: String?): Boolean {
            if (url.isNullOrBlank()) return false
            val uri = runCatching { URI(url).normalize() }.getOrNull() ?: return false
            val path = uri.rawPath ?: return false
            return uri.scheme == "https" &&
                uri.host == HOST &&
                (uri.port == -1 || uri.port == 443) &&
                uri.rawUserInfo == null &&
                path.startsWith(PATH) &&
                !path.contains("..") &&
                !path.contains("%2e", ignoreCase = true) &&
                !path.contains("%2f", ignoreCase = true)
        }

        /** Origen que pide la ubicación (solo el servidor de Mi Panel). */
        fun isAppOrigin(origin: String?): Boolean {
            val uri = runCatching { URI(origin ?: return false) }.getOrNull() ?: return false
            return uri.scheme == "https" && uri.host == HOST && (uri.port == -1 || uri.port == 443)
        }
    }
}
