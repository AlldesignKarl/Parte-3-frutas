package com.alldesignkarl.mipanel.notas

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.alldesignkarl.mipanel.R
import com.alldesignkarl.mipanel.ui.BackupMenuButton
import com.alldesignkarl.mipanel.ui.DateField
import com.alldesignkarl.mipanel.ui.FullScreenEditor
import com.alldesignkarl.mipanel.ui.SectionCard
import com.alldesignkarl.mipanel.ui.decimalOnly
import com.alldesignkarl.mipanel.util.Fmt
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import java.time.LocalDate

/** Qué se está editando: una nota nueva (quizá con la asignatura ya puesta) o una existente. */
sealed interface GradeEditorTarget {
    data class New(val subject: String = "") : GradeEditorTarget
    data class Edit(val grade: Grade) : GradeEditorTarget
}

@Composable
fun GradesScreen(vm: GradesViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var editor by remember { mutableStateOf<GradeEditorTarget?>(null) }

    LaunchedEffect(vm) {
        vm.deleted.collect { grade ->
            scope.launch {
                snackbar.currentSnackbarData?.dismiss()
                val result = snackbar.showSnackbar(
                    "Nota borrada (${grade.subject}: ${Fmt.grade(grade.value)})",
                    actionLabel = "Deshacer",
                    duration = SnackbarDuration.Long,
                )
                if (result == SnackbarResult.ActionPerformed) vm.restore(grade)
            }
        }
    }

    GradesContent(
        state = state,
        snackbar = snackbar,
        onAdd = { subject -> editor = GradeEditorTarget.New(subject) },
        onEdit = { editor = GradeEditorTarget.Edit(it) },
    )

    editor?.let { target ->
        GradeEditor(
            target = target,
            knownSubjects = state.subjects.map { it.name },
            onClose = { editor = null },
            onSave = {
                vm.save(it)
                editor = null
            },
            onDelete = { id ->
                vm.delete(id)
                editor = null
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradesContent(
    state: GradesUiState,
    snackbar: SnackbarHostState,
    onAdd: (subject: String) -> Unit,
    onEdit: (Grade) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notas", fontWeight = FontWeight.SemiBold) },
                actions = { BackupMenuButton() },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { onAdd("") },
                // El texto del botón no se anuncia por accesibilidad: la descripción va en el icono.
                icon = { Icon(Icons.Filled.Add, contentDescription = "Añadir nota") },
                text = { Text("Añadir nota") },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        if (!state.loading && state.subjects.isEmpty()) {
            EmptyGrades(Modifier.padding(padding))
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            state.overall?.let { overall ->
                item(key = "media") { OverallCard(overall, state.subjects.size, state.count) }
            }
            if (state.subjects.isNotEmpty()) {
                item(key = "grafica") {
                    SectionCard(icon = R.drawable.ic_chart, title = "Media por asignatura") {
                        AverageChart(state.subjects)
                    }
                }
                item(key = "titulo") {
                    Text(
                        "Asignaturas",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(start = 4.dp, top = 8.dp),
                    )
                }
            }
            items(state.subjects, key = { "asig-" + it.key }) { subject ->
                SubjectCard(subject, onAdd = { onAdd(subject.name) }, onEdit = onEdit)
            }
        }
    }
}

@Composable
private fun OverallCard(overall: Double, subjects: Int, count: Int) {
    SectionCard(icon = R.drawable.ic_school, title = "Media general") {
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                Fmt.grade(overall),
                fontSize = 56.sp,
                lineHeight = 56.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.width(12.dp))
            Text(
                gradeLabel(overall),
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            "Media de ${if (subjects == 1) "1 asignatura" else "$subjects asignaturas"} · " +
                if (count == 1) "1 nota apuntada" else "$count notas apuntadas",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun SubjectCard(subject: SubjectSummary, onAdd: () -> Unit, onEdit: (Grade) -> Unit) {
    SectionCard(
        icon = R.drawable.ic_book,
        title = subject.name,
        trailing = {
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    Fmt.grade(subject.average),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    gradeLabel(subject.average),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
    ) {
        subject.grades.forEachIndexed { index, grade ->
            if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable { onEdit(grade) }
                    .padding(vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    Fmt.grade(grade.value),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.width(52.dp),
                )
                Column(Modifier.weight(1f)) {
                    Text(
                        grade.description.ifBlank { "Nota" },
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Text(
                        Fmt.dateShort(grade.date) + " " + grade.date.year,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    "Editar",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = onAdd, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Añadir nota de ${subject.name}")
        }
    }
}

@Composable
private fun EmptyGrades(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                painterResource(R.drawable.ic_chart),
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(64.dp),
            )
            Spacer(Modifier.height(16.dp))
            Text("Aún no has apuntado notas", style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
            Spacer(Modifier.height(8.dp))
            Text(
                "Pulsa \"Añadir nota\", escribe la asignatura y la nota, y aquí verás la media de cada una en una gráfica.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun GradeEditor(
    target: GradeEditorTarget,
    knownSubjects: List<String>,
    onClose: () -> Unit,
    onSave: (GradeDraft) -> Unit,
    onDelete: (String) -> Unit,
) {
    val existing = (target as? GradeEditorTarget.Edit)?.grade
    var subject by rememberSaveable {
        mutableStateOf(existing?.subject ?: (target as? GradeEditorTarget.New)?.subject.orEmpty())
    }
    var value by rememberSaveable { mutableStateOf(existing?.let { Fmt.grade(it.value) } ?: "") }
    var description by rememberSaveable { mutableStateOf(existing?.description ?: "") }
    var date by remember { mutableStateOf(existing?.date ?: LocalDate.now()) }

    val parsed = parseGrade(value)
    val valueError = value.isNotBlank() && parsed == null
    val canSave = subject.isNotBlank() && parsed != null

    FullScreenEditor(
        title = if (existing == null) "Nueva nota" else "Editar nota",
        saveEnabled = canSave,
        onClose = onClose,
        onSave = {
            if (parsed != null) {
                onSave(GradeDraft(existing?.id, subject, parsed, description, date))
            }
        },
    ) {
        OutlinedTextField(
            value = subject,
            onValueChange = { subject = it.take(60) },
            label = { Text("Asignatura") },
            placeholder = { Text("Ej.: Matemáticas") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            modifier = Modifier.fillMaxWidth(),
        )
        val suggestions = knownSubjects.filter {
            subjectKey(it) != subjectKey(subject) && (subject.isBlank() || subjectKey(it).contains(subjectKey(subject)))
        }
        if (suggestions.isNotEmpty()) {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 4.dp),
            ) {
                items(suggestions) { name ->
                    SuggestionChip(onClick = { subject = name }, label = { Text(name) })
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = value,
            onValueChange = { value = decimalOnly(it) },
            label = { Text("Nota (de 0 a 10)") },
            placeholder = { Text("Ej.: 7,5") },
            isError = valueError,
            supportingText = {
                Text(
                    when {
                        valueError -> "Tiene que ser un número entre 0 y 10"
                        parsed != null -> gradeLabel(parsed)
                        else -> "Puedes poner decimales: 4,5"
                    }
                )
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(4.dp))
        OutlinedTextField(
            value = description,
            onValueChange = { description = it.take(80) },
            label = { Text("Qué era (opcional)") },
            placeholder = { Text("Ej.: Examen tema 3") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        DateField(label = "Fecha", date = date, onDateChange = { it?.let { d -> date = d } }, optional = false)
        if (existing != null) {
            Spacer(Modifier.height(24.dp))
            TextButton(
                onClick = { onDelete(existing.id) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Borrar esta nota", color = MaterialTheme.colorScheme.error) }
        }
    }
}
