package com.alldesignkarl.mipanel

import android.app.Application
import com.alldesignkarl.mipanel.datos.JsonListStore
import com.alldesignkarl.mipanel.notas.Grade
import com.alldesignkarl.mipanel.recordatorio.Notifications
import com.alldesignkarl.mipanel.recordatorio.ReminderScheduler
import com.alldesignkarl.mipanel.recordatorio.SettingsStore
import com.alldesignkarl.mipanel.tareas.Task
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class MiPanelApp : Application() {
    private val appScope = CoroutineScope(SupervisorJob())

    lateinit var tasks: JsonListStore<Task>
        private set
    lateinit var grades: JsonListStore<Grade>
        private set
    lateinit var settings: SettingsStore
        private set

    override fun onCreate() {
        super.onCreate()
        tasks = JsonListStore(filesDir, "tareas.json", Task.serializer(), appScope)
        grades = JsonListStore(filesDir, "notas.json", Grade.serializer(), appScope)
        settings = SettingsStore(this)
        Notifications.createChannel(this)
        ReminderScheduler.ensure(this, settings.reminder.value)
    }
}
