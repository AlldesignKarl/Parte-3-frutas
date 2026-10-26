package com.alldesignkarl.mipanel.recordatorio

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ReminderSettings(
    val enabled: Boolean = false,
    val hour: Int = 20,
    val minute: Int = 0,
)

class SettingsStore(context: Context) {
    private val prefs = context.getSharedPreferences("ajustes", Context.MODE_PRIVATE)
    private val _reminder = MutableStateFlow(read())
    val reminder: StateFlow<ReminderSettings> = _reminder.asStateFlow()

    fun setReminder(settings: ReminderSettings) {
        prefs.edit()
            .putBoolean(KEY_ENABLED, settings.enabled)
            .putInt(KEY_HOUR, settings.hour)
            .putInt(KEY_MINUTE, settings.minute)
            .apply()
        _reminder.value = settings
    }

    private fun read() = ReminderSettings(
        enabled = prefs.getBoolean(KEY_ENABLED, false),
        hour = prefs.getInt(KEY_HOUR, 20),
        minute = prefs.getInt(KEY_MINUTE, 0),
    )

    private companion object {
        const val KEY_ENABLED = "recordatorio_activo"
        const val KEY_HOUR = "recordatorio_hora"
        const val KEY_MINUTE = "recordatorio_minuto"
    }
}
