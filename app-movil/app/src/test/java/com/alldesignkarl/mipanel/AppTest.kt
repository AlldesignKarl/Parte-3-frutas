package com.alldesignkarl.mipanel

import android.webkit.WebView
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf

@RunWith(AndroidJUnit4::class)
class AppTest {
    @Test
    fun onlyMiPanelPagesCanUseThePhone() {
        assertTrue(WebBridge.isAppUrl(WebBridge.APP_URL))
        assertTrue(WebBridge.isAppUrl("${WebBridge.APP_URL}?pestana=dinero#x"))
        assertFalse(WebBridge.isAppUrl("https://raw.githack.com/otra/persona/main/index.html"))
        assertFalse(WebBridge.isAppUrl("https://raw.githack.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/../../../otro/index.html"))
        assertFalse(WebBridge.isAppUrl("https://raw.githack.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/%2e%2e/x.html"))
        assertFalse(WebBridge.isAppUrl("http://raw.githack.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/index.html"))
        assertFalse(WebBridge.isAppUrl("https://evil.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/index.html"))
        assertFalse(WebBridge.isAppUrl("https://user@raw.githack.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/index.html"))
        assertFalse(WebBridge.isAppUrl("about:blank"))
        assertFalse(WebBridge.isAppUrl(null))
        assertTrue(WebBridge.isAppOrigin("https://raw.githack.com"))
        assertTrue(WebBridge.isAppOrigin("https://raw.githack.com/"))
        assertFalse(WebBridge.isAppOrigin("https://evil.com/"))
    }

    @Test
    fun appOpensMiPanelWithThePhoneBridge() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        val web: WebView = activity.web
        val shadow = shadowOf(web)
        assertEquals(WebBridge.APP_URL, shadow.lastLoadedUrl)
        assertTrue(web.settings.javaScriptEnabled)
        assertTrue(web.settings.domStorageEnabled)
        assertNotNull(shadow.getJavascriptInterface(WebBridge.NAME))
    }

    @Test
    fun bridgeGivesNothingToOtherPages() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        val bridge = shadowOf(activity.web).getJavascriptInterface(WebBridge.NAME) as WebBridge
        bridge.pageUrl = "https://evil.com/"
        bridge.shared = SharedFile("extracto.csv", "text/csv", "YQ==")
        assertEquals("[]", bridge.messages())
        assertEquals(null, bridge.takeSharedFile())
        assertFalse(bridge.hasMessageAccess())
        bridge.pageUrl = WebBridge.APP_URL
        assertEquals("[]", bridge.messages())
        val shared = bridge.takeSharedFile()
        assertTrue(shared!!.contains("extracto.csv"))
        assertEquals(null, bridge.takeSharedFile()) // solo una vez
    }
}
