package com.alldesignkarl.mipanel

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.alldesignkarl.mipanel.ui.AppRoot
import com.alldesignkarl.mipanel.ui.MiPanelTheme
import com.alldesignkarl.mipanel.ui.Section

class MainActivity : ComponentActivity() {
    private var section by mutableStateOf(Section.STATUS)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        section = savedInstanceState?.getString(KEY_SECTION)
            ?.let { saved -> Section.entries.firstOrNull { it.name == saved } }
            ?: sectionFor(intent)
            ?: Section.STATUS
        setContent {
            MiPanelTheme {
                AppRoot(section = section, onSectionChange = { section = it })
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        sectionFor(intent)?.let { section = it }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_SECTION, section.name)
    }

    private fun sectionFor(intent: Intent?): Section? =
        if (intent?.getBooleanExtra(EXTRA_OPEN_TASKS, false) == true) Section.TASKS else null

    companion object {
        const val EXTRA_OPEN_TASKS = "abrir_tareas"
        private const val KEY_SECTION = "seccion"
    }
}
