package com.alldesignkarl.mipanel

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.provider.Settings
import android.util.Base64
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.WindowManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.alldesignkarl.mipanel.mensajes.MessagesListener

/**
 * Mi Panel como app Android: muestra la misma app web que se instala desde el navegador
 * (así se actualiza sola) y le da lo que una web no puede tener: los avisos de WhatsApp,
 * Discord y llamadas perdidas, la linterna de verdad, la batería de los cascos…
 */
class MainActivity : ComponentActivity() {
    lateinit var web: WebView
        private set
    private lateinit var bridge: WebBridge
    private lateinit var headphones: Headphones
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var permissionCallback: ((Boolean) -> Unit)? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        // Sin archivo (cancelado) se devuelve una lista vacía.
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data) ?: emptyArray())
        fileCallback = null
    }

    private val askPermissions = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val callback = permissionCallback
        permissionCallback = null
        callback?.invoke(result.isNotEmpty() && result.values.all { it })
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // De borde a borde, con la app dejando sitio a la barra de estado y a la de navegación.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        val root = FrameLayout(this).apply { setBackgroundColor(BACKGROUND) }
        web = WebView(this).apply { setBackgroundColor(BACKGROUND) }
        root.addView(web, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, keyboard.bottom))
            WindowInsetsCompat.CONSUMED
        }

        headphones = Headphones(this) { runOnUiThread { emit("mipanel-cascos") } }
        bridge = WebBridge(this, headphones)
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            setGeolocationEnabled(true)
            allowFileAccess = false
            setSupportZoom(false)
            userAgentString = "$userAgentString MiPanelApp/${appVersion()}"
        }
        web.addJavascriptInterface(bridge, WebBridge.NAME)
        web.webViewClient = AppClient()
        web.webChromeClient = ChromeClient()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // "Atrás" cierra primero las ventanas de la app; al final se va al fondo sin cerrarla.
                if (web.canGoBack()) web.goBack() else moveTaskToBack(true)
            }
        })

        receiveSharedFile(intent)
        web.loadUrl(WebBridge.APP_URL)
        headphones.start()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        receiveSharedFile(intent)
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        MessagesListener.onChange = { runOnUiThread { emit("mipanel-mensajes") } }
        // Al volver de los ajustes (permiso de avisos, Bluetooth…) la app lo vuelve a mirar.
        emit("mipanel-mensajes")
        headphones.start()
        emit("mipanel-cascos")
    }

    override fun onPause() {
        MessagesListener.onChange = null
        web.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        headphones.close()
        web.destroy()
        super.onDestroy()
    }

    /** Avisa a la página de algo (la página escucha estos eventos). */
    fun emit(event: String) {
        if (::web.isInitialized) web.evaluateJavascript("window.dispatchEvent(new Event('$event'))", null)
    }

    fun appVersion(): String =
        runCatching { packageManager.getPackageInfo(packageName, 0).versionName }.getOrNull() ?: "?"

    /** Pide permisos de Android y dice si los ha dado todos. */
    fun withPermissions(permissions: Array<String>, callback: (Boolean) -> Unit) {
        if (permissions.all { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED }) {
            callback(true)
            return
        }
        if (permissionCallback != null) {
            callback(false) // ya hay una petición en pantalla
            return
        }
        permissionCallback = callback
        askPermissions.launch(permissions)
    }

    fun openMessageAccess() {
        val component = ComponentName(this, MessagesListener::class.java)
        val detail = if (Build.VERSION.SDK_INT >= 30) {
            Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component.flattenToString())
        } else {
            null
        }
        for (intent in listOfNotNull(detail, Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))) {
            if (runCatching { startActivity(intent) }.isSuccess) return
        }
    }

    fun openAppSettings() {
        runCatching {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
        }
    }

    fun keepScreenOn(on: Boolean) {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    /** Un archivo compartido con Mi Panel (extracto de Revolut…): se guarda hasta que la página lo recoge. */
    private fun receiveSharedFile(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND) return
        val uri = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java) ?: return
        val bytes = runCatching { contentResolver.openInputStream(uri)?.use { it.readBytes() } }.getOrNull() ?: return
        if (bytes.isEmpty() || bytes.size > MAX_SHARED_BYTES) return
        val name = runCatching {
            contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                if (c.moveToFirst()) c.getString(0) else null
            }
        }.getOrNull() ?: "extracto"
        bridge.shared = SharedFile(name, intent.type.orEmpty(), Base64.encodeToString(bytes, Base64.NO_WRAP))
        emit("mipanel-compartido")
    }

    private inner class AppClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            if (WebBridge.isAppUrl(url.toString())) return false
            // Lo que no es Mi Panel se abre fuera (navegador, Revolut…), nunca dentro de la app.
            if (request.isForMainFrame && (url.scheme == "https" || url.scheme == "http")) {
                runCatching { startActivity(Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            }
            return true
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            bridge.pageUrl = url
        }

        override fun doUpdateVisitedHistory(view: WebView, url: String?, isReload: Boolean) {
            bridge.pageUrl = url
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            // Solo pasa la primera vez sin internet (luego la app abre desde su copia guardada).
            if (request.isForMainFrame) view.loadDataWithBaseURL(null, OFFLINE_PAGE, "text/html", "utf-8", null)
        }
    }

    private inner class ChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: FileChooserParams,
        ): Boolean {
            fileCallback?.onReceiveValue(emptyArray())
            fileCallback = callback
            val chooser = Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
            return try {
                pickFile.launch(chooser)
                true
            } catch (_: ActivityNotFoundException) {
                fileCallback = null
                false
            }
        }

        override fun onPermissionRequest(request: PermissionRequest) {
            runOnUiThread {
                val video = PermissionRequest.RESOURCE_VIDEO_CAPTURE
                if (!WebBridge.isAppUrl(bridge.pageUrl) || video !in request.resources) {
                    request.deny()
                    return@runOnUiThread
                }
                withPermissions(arrayOf(Manifest.permission.CAMERA)) { granted ->
                    if (granted) request.grant(arrayOf(video)) else request.deny()
                }
            }
        }

        override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
            if (!WebBridge.isAppOrigin(origin)) {
                callback.invoke(origin, false, false)
                return
            }
            withPermissions(arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION)) { granted ->
                callback.invoke(origin, granted, false)
            }
        }
    }

    private companion object {
        val BACKGROUND = Color.rgb(7, 10, 20) // #070A14, el fondo de la app
        const val MAX_SHARED_BYTES = 15_000_000

        val OFFLINE_PAGE = """
            <!doctype html><html lang="es"><head><meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>body{margin:0;min-height:100vh;display:grid;place-content:center;gap:12px;padding:32px;
            background:#070a14;color:#eef1ff;font:16px system-ui,sans-serif;text-align:center}
            h1{font-size:22px;margin:0}p{color:#a2abd0;margin:0}
            a{display:inline-block;margin-top:12px;padding:14px 22px;border-radius:99px;background:#3ee6ff;color:#06101f;
            font-weight:700;text-decoration:none}</style></head><body>
            <h1>Sin conexión</h1><p>La primera vez Mi Panel necesita internet para descargarse. Luego funciona sin conexión.</p>
            <a href="${WebBridge.APP_URL}">Probar otra vez</a></body></html>
        """.trimIndent()
    }
}

data class SharedFile(val name: String, val type: String, val base64: String)
