package com.alldesignkarl.mipanel

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/** Recorre la app como lo haría una persona: crea una tarea, la termina y apunta notas. */
@RunWith(AndroidJUnit4::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp-xxhdpi")
class AppFlowTest {
    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun statusScreenShowsAllSections() {
        rule.onNodeWithText("Mi móvil").assertIsDisplayed()
        rule.onNodeWithText("Batería").assertIsDisplayed()
        rule.onNodeWithText("Cascos y Bluetooth").assertIsDisplayed()
    }

    @Test
    fun finishingAStudyTaskCelebrates() {
        rule.onNodeWithText("Tareas").performClick()
        rule.onNodeWithText("No tienes tareas").assertIsDisplayed()

        rule.onNodeWithContentDescription("Nueva tarea").performClick()
        rule.onNode(hasSetTextAction() and hasText("Qué tienes que hacer")).performTextInput("Estudiar Historia")
        rule.onNode(hasSetTextAction() and hasText("Páginas que hay que estudiar (opcional)")).performTextInput("12")
        rule.onNodeWithText("Guardar").performClick()
        rule.waitUntil(5_000) { rule.onAllNodesWithText("Estudiar Historia").fetchSemanticsNodes().isNotEmpty() }
        rule.onNodeWithText("0 de 12 págs").assertIsDisplayed()

        rule.onNodeWithText("+5").performClick()
        rule.waitUntil(5_000) { rule.onAllNodesWithText("5 de 12 págs").fetchSemanticsNodes().isNotEmpty() }

        rule.onNodeWithText("+10").performClick()
        rule.waitUntil(5_000) { rule.onAllNodesWithText("¡Terminado!").fetchSemanticsNodes().isNotEmpty() }
        rule.onNodeWithText("12 páginas estudiadas").assertIsDisplayed()
        rule.onNodeWithText("¡Genial!").performClick()

        rule.waitUntil(5_000) { rule.onAllNodesWithText("Terminadas (1)").fetchSemanticsNodes().isNotEmpty() }
    }

    @Test
    fun gradesAreAveragedPerSubject() {
        rule.onNodeWithText("Notas").performClick()
        rule.onNodeWithText("Aún no has apuntado notas").assertIsDisplayed()

        addGrade("Matemáticas", "4")
        addGrade("Matemáticas", "5")
        addGrade("Historia", "8,5")

        rule.waitUntil(5_000) {
            rule.onAllNodesWithContentDescription("Matemáticas: media 4,5", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }
        rule.onNodeWithContentDescription("Historia: media 8,5", substring = true).assertExists()
        // Media general = (4,5 + 8,5) / 2
        rule.onNodeWithText("6,5").assertIsDisplayed()
    }

    private fun addGrade(subject: String, value: String) {
        rule.onNodeWithContentDescription("Añadir nota").performClick()
        rule.onNode(hasSetTextAction() and hasText("Asignatura")).performTextInput(subject)
        rule.onNode(hasSetTextAction() and hasText("Nota (de 0 a 10)")).performTextInput(value)
        rule.onNodeWithText("Guardar").performClick()
        rule.waitUntil(5_000) { rule.onAllNodesWithText("Nueva nota").fetchSemanticsNodes().isEmpty() }
    }
}
