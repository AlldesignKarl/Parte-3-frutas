package com.alldesignkarl.mipanel.ui

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import com.alldesignkarl.mipanel.R
import com.alldesignkarl.mipanel.estado.StatusScreen
import com.alldesignkarl.mipanel.notas.GradesScreen
import com.alldesignkarl.mipanel.tareas.TasksScreen

enum class Section(val label: String, @DrawableRes val icon: Int) {
    STATUS("Estado", R.drawable.ic_dashboard),
    TASKS("Tareas", R.drawable.ic_book),
    GRADES("Notas", R.drawable.ic_chart),
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AppRoot(section: Section, onSectionChange: (Section) -> Unit) {
    Scaffold(
        contentWindowInsets = WindowInsets(0),
        bottomBar = {
            NavigationBar {
                Section.entries.forEach { item ->
                    NavigationBarItem(
                        selected = item == section,
                        onClick = { onSectionChange(item) },
                        icon = { Icon(painterResource(item.icon), contentDescription = null) },
                        label = { Text(item.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(
            Modifier
                .padding(padding)
                .consumeWindowInsets(padding)
        ) {
            when (section) {
                Section.STATUS -> StatusScreen()
                Section.TASKS -> TasksScreen()
                Section.GRADES -> GradesScreen()
            }
        }
    }
}
