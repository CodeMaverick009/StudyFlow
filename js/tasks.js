import { getTasks, addTask, updateTask, deleteTask } from "./storage.js";
import { showToast } from "./components/toast.js";
import { showConfirm } from "./components/confirmModal.js";
import { validateTaskName, validateTaskDescription, updateCharCounters } from "./validation.js";

let allTasks = [];
let editorSubtasks = [];
let editorMaterials = [];
let editingTaskId = null;
let detailsTaskId = null;

export function initializeTasks() {
    if (!document.getElementById("tasks-list")) return;
    initializeTaskControls();
    document.addEventListener("tasks:changed", renderTasks);
    renderTasks();

}

function initializeTaskControls() {
    document.getElementById("task-search")?.addEventListener("input", renderTasks);
    document.getElementById("task-status-filter")?.addEventListener("change", renderTasks);
    document.getElementById("task-sort")?.addEventListener("change", renderTasks);
    initializeTaskEditor();
    initializeTaskDetails();
    initializeTaskEditorFromURL();
}

function initializeTaskEditorFromURL() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const selectedDate = params.get("date");
    const shouldAdd = params.get("add") === "1";

    if (editId) {
        const task = getTasks().find(item => item.id === editId);
        if (!task) return;
        openTaskEditor(editId);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (selectedDate || shouldAdd) {
        openTaskEditor();

        if (selectedDate) {
            const dueDateInput = document.getElementById("editor-task-due-date");
            if (dueDateInput) dueDateInput.value = selectedDate;
        }

        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function openQuickAddModal() {
    const modal = document.getElementById("quick-add-modal");

    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => {
        document.getElementById("task-name")?.focus();
    }, 100);
}

function closeTaskEditor() {
    const modal = document.getElementById("task-editor-modal");
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    editorSubtasks = [];
    editorMaterials = [];
    editingTaskId = null;
    updateCharCounters(modal);
}

function renderTasks() {
    allTasks = getTasks();
    const tasksList = document.getElementById("tasks-list");
    const emptyState = document.getElementById("tasks-empty");
    if (!tasksList || !emptyState) return;

    const searchValue = document.getElementById("task-search")?.value.trim().toLowerCase() || "";
    const status = document.getElementById("task-status-filter")?.value || "all";
    const sort = document.getElementById("task-sort")?.value || "due-asc";
    let filteredTasks = [...allTasks];

    if (searchValue) {
        filteredTasks = filteredTasks.filter(task => {
            const searchable = [task.name, task.subject, task.type].map(value => value?.toLowerCase() || "");
            return searchable.some(value => value.includes(searchValue));
        });
    }
    if (status === "active") filteredTasks = filteredTasks.filter(task => task.completed !== true);
    if (status === "completed") filteredTasks = filteredTasks.filter(task => task.completed === true);

    filteredTasks.sort((a, b) => {
        if (sort === "due-asc") return new Date(a.dueDate) - new Date(b.dueDate);
        if (sort === "priority") return ({ High: 1, Normal: 2, Low: 3 }[a.priority] || 2) - ({ High: 1, Normal: 2, Low: 3 }[b.priority] || 2);
        if (sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "name") return (a.name || "").localeCompare(b.name || "");
        return 0;
    });
    updateTaskSummary();

    if (!filteredTasks.length) {
        tasksList.innerHTML = "";
        emptyState.hidden = false;
        updateEmptyState(searchValue, status);
        createIcons();
        return;
    }
    emptyState.hidden = true;
    tasksList.innerHTML = filteredTasks.map(createTaskHTML).join("");
    initializeTaskActions();
    createIcons();
}

function createTaskHTML(task) {
    const taskName = task.name || task.title || "Untitled Task";
    return `<article class="task-item ${task.completed ? "is-completed" : ""}" data-task-id="${escapeHTML(task.id)}" tabindex="0">
        <button type="button" class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle" aria-label="${task.completed ? "Mark task as incomplete" : "Mark task as complete"}">${task.completed ? '<i data-lucide="check"></i>' : ""}</button>
        <div class="task-main"><div class="task-title-row"><h3 class="task-title">${escapeHTML(taskName)}</h3>${task.priority === "High" ? '<span class="task-priority priority-high">High priority</span>' : ""}</div>
        <div class="task-meta">${task.subject ? `<span class="task-meta-item"><i data-lucide="book-open"></i>${escapeHTML(task.subject)}</span>` : ""}${task.type ? `<span class="task-meta-item"><i data-lucide="tag"></i>${escapeHTML(task.type)}</span>` : ""}${task.estimatedMinutes ? `<span class="task-meta-item"><i data-lucide="clock-3"></i>${formatMinutes(task.estimatedMinutes)}</span>` : ""}</div></div>
        <div class="task-due"><span class="task-due-label">Due</span><span class="task-due-date">${formatDueDate(task.dueDate)}</span></div>
        <div class="task-actions"><button type="button" class="icon-button" data-action="edit" aria-label="Edit ${escapeHTML(taskName)}" title="Edit task"><i data-lucide="pencil"></i></button><button type="button" class="icon-button" data-action="delete" aria-label="Delete ${escapeHTML(taskName)}" title="Delete task"><i data-lucide="trash-2"></i></button></div>
    </article>`;
}

function initializeTaskActions() {
    document.querySelectorAll(".task-item").forEach(taskElement => {
        const taskId = taskElement.dataset.taskId;
        taskElement.addEventListener("click", event => {
            if (!event.target.closest("[data-action]")) openTaskDetails(taskId);
        });
        taskElement.addEventListener("keydown", event => {
            if ((event.key === "Enter" || event.key === " ") && !event.target.closest("[data-action]")) {
                event.preventDefault();
                openTaskDetails(taskId);
            }
        });
    });
    document.querySelectorAll(".task-item [data-action]").forEach(button => button.addEventListener("click", event => {
        event.stopPropagation();
        const taskId = event.currentTarget.closest(".task-item")?.dataset.taskId;
        if (!taskId) return;
        const action = event.currentTarget.dataset.action;
        if (action === "toggle") toggleTask(taskId);
        if (action === "delete") removeTask(taskId);
        if (action === "edit") openTaskEditor(taskId);
    }));
}

function toggleTask(taskId) {
    const task = allTasks.find(item => item.id === taskId);
    if (!task) return;
    updateTask(taskId, { completed: !task.completed });
    document.dispatchEvent(new Event("tasks:changed"));
    renderTasks();
}

async function removeTask(taskId) {
    const task = allTasks.find(item => item.id === taskId);
    if (!task) return;
    const taskName = task.name || task.title || "this task";
    const confirmed = await showConfirm({
        title: "Delete Task",
        message: `Are you sure you want to delete "${taskName}"? This action cannot be undone.`,
        confirmText: "Delete Task",
        confirmButtonClass: "button-danger",
        icon: "trash-2"
    });
    if (!confirmed) return;
    deleteTask(taskId);
    showToast({ message: "Task deleted", type: "info" });
    document.dispatchEvent(new Event("tasks:changed"));
    renderTasks();
}

function updateTaskSummary() {
    const completed = allTasks.filter(task => task.completed === true).length;
    const values = [["tasks-total", allTasks.length], ["tasks-active", allTasks.length - completed], ["tasks-completed", completed]];
    values.forEach(([id, value]) => { const element = document.getElementById(id); if (element) element.textContent = value; });
}

function updateEmptyState(searchValue, status) {
    const title = document.getElementById("tasks-empty-title");
    const text = document.getElementById("tasks-empty-text");
    const button = document.getElementById("tasks-empty-add");
    if (!title || !text || !button) return;
    if (searchValue) { title.textContent = "No matching tasks"; text.textContent = "Try changing your search or filters."; button.hidden = true; return; }
    if (status === "completed") { title.textContent = "No completed tasks"; text.textContent = "Completed tasks will appear here."; button.hidden = true; return; }
    if (status === "active") { title.textContent = "No active tasks"; text.textContent = "You've completed everything for now."; button.hidden = true; return; }
    title.textContent = "No tasks yet"; text.textContent = "Add your first task to get started."; button.hidden = false;
}

function formatDueDate(dateString) {
    if (!dateString) return "No date";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMinutes(minutes) {
    const value = Number(minutes);
    if (!value) return "";
    if (value < 60) return `${value} min`;
    const hours = Math.floor(value / 60), remainder = value % 60;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function escapeHTML(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function createIcons() { if (typeof lucide !== "undefined") lucide.createIcons(); }

/* =========================================================
   Task Editor
========================================================= */

function initializeTaskEditor() {
    const form = document.getElementById("task-editor-form");
    const addSubtaskButton = document.getElementById("add-subtask-button");
    const addMaterialButton = document.getElementById("add-material-button");
    const closeButton = document.getElementById("task-editor-close");
    if (!form) return;

    document.getElementById("tasks-add-button")?.addEventListener("click", () => openTaskEditor());
    document.getElementById("tasks-empty-add")?.addEventListener("click", () => openTaskEditor());
    closeButton?.addEventListener("click", closeTaskEditor);
    document.querySelectorAll("[data-close-task-editor]").forEach(element => element.addEventListener("click", closeTaskEditor));
    document.addEventListener("keydown", event => {
        const modal = document.getElementById("task-editor-modal");
        if (event.key === "Escape" && modal?.classList.contains("is-open")) closeTaskEditor();
    });
    addSubtaskButton?.addEventListener("click", () => {
        editorSubtasks.push({ id: crypto.randomUUID(), text: "", completed: false });
        renderEditorSubtasks();
    });
    addMaterialButton?.addEventListener("click", () => {
        editorMaterials.push({ id: crypto.randomUUID(), name: "", url: "" });
        renderEditorMaterials();
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        createTaskFromEditor(form);
    });
}

function openTaskEditor(taskId = null) {
    const modal = document.getElementById("task-editor-modal");
    const form = document.getElementById("task-editor-form");
    const subtitle = modal?.querySelector(".modal-header p");
    const submitButton = form?.querySelector("button[type='submit']");
    if (!modal || !form) return;

    editingTaskId = taskId;
    if (taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task) return;
        document.getElementById("task-editor-title").textContent = "Edit task";
        if (subtitle) subtitle.textContent = "Update the details of this task.";
        if (submitButton) submitButton.innerHTML = '<i data-lucide="check"></i>Save changes';
        document.getElementById("editor-task-name").value = task.name || "";
        document.getElementById("editor-task-subject").value = task.subject || "";
        document.getElementById("editor-task-type").value = task.type || "";
        document.getElementById("editor-task-due-date").value = task.dueDate || "";
        document.getElementById("editor-task-time").value = task.estimatedMinutes || "";
        document.getElementById("editor-task-difficulty").value = task.difficulty || "";
        document.getElementById("editor-task-priority").value = task.priority || "Normal";
        document.getElementById("editor-task-description").value = task.description || "";
        editorSubtasks = structuredClone(task.subtasks || []);
        editorMaterials = structuredClone(task.materials || []);
    } else {
        form.reset();
        document.getElementById("task-editor-title").textContent = "Add task";
        if (subtitle) subtitle.textContent = "Create a task with all the details you need.";
        if (submitButton) submitButton.innerHTML = '<i data-lucide="check"></i>Create task';
        editorSubtasks = [];
        editorMaterials = [];
    }
    renderEditorSubtasks();
    renderEditorMaterials();
    updateCharCounters(modal);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(() => document.getElementById("editor-task-name")?.focus(), 100);
    createIcons();
}

function renderEditorSubtasks() {
    const container = document.getElementById("subtasks-list");
    if (!container) return;
    container.innerHTML = editorSubtasks.map((subtask, index) => `
        <div class="editor-list-item subtask-editor-item" data-subtask-index="${index}">
            <span class="editor-list-icon" aria-hidden="true"><i data-lucide="list-check"></i></span>
            <input type="text" class="editor-list-input" value="${escapeHTML(subtask.text)}" placeholder="e.g. Read chapter 4" data-subtask-input>
            <button type="button" class="editor-list-remove" data-remove-subtask aria-label="Remove subtask" title="Remove subtask"><i data-lucide="x"></i></button>
        </div>`).join("");
    container.querySelectorAll("[data-subtask-input]").forEach((input, index) => input.addEventListener("input", event => { editorSubtasks[index].text = event.target.value; }));
    container.querySelectorAll("[data-remove-subtask]").forEach(button => button.addEventListener("click", event => {
        const index = Number(event.currentTarget.closest(".subtask-editor-item")?.dataset.subtaskIndex);
        editorSubtasks.splice(index, 1);
        renderEditorSubtasks();
    }));
    createIcons();
}

function renderEditorMaterials() {
    const container = document.getElementById("materials-list");
    if (!container) return;
    container.innerHTML = editorMaterials.map((material, index) => `
        <div class="editor-list-item material-editor-item" data-material-index="${index}">
            <span class="editor-list-icon" aria-hidden="true"><i data-lucide="paperclip"></i></span>
            <div class="material-editor-fields">
                <input type="text" class="editor-list-input" value="${escapeHTML(material.name)}" placeholder="Material name" data-material-name>
                <input type="url" class="editor-list-input material-url-input" value="${escapeHTML(material.url)}" placeholder="https://example.com" data-material-url>
            </div>
            <button type="button" class="editor-list-remove" data-remove-material aria-label="Remove material" title="Remove material"><i data-lucide="x"></i></button>
        </div>`).join("");
    container.querySelectorAll("[data-material-name]").forEach((input, index) => input.addEventListener("input", event => { editorMaterials[index].name = event.target.value; }));
    container.querySelectorAll("[data-material-url]").forEach((input, index) => input.addEventListener("input", event => { editorMaterials[index].url = event.target.value; }));
    container.querySelectorAll("[data-remove-material]").forEach(button => button.addEventListener("click", event => {
        const index = Number(event.currentTarget.closest(".material-editor-item")?.dataset.materialIndex);
        editorMaterials.splice(index, 1);
        renderEditorMaterials();
    }));
    createIcons();
}

function createTaskFromEditor(form) {
    const formData = new FormData(form);
    const rawName = formData.get("name");
    const rawDescription = formData.get("description");

    const nameValidation = validateTaskName(rawName);
    if (!nameValidation.isValid) {
        showToast({ message: nameValidation.error, type: "error" });
        document.getElementById("editor-task-name")?.focus();
        return;
    }

    const descValidation = validateTaskDescription(rawDescription);
    if (!descValidation.isValid) {
        showToast({ message: descValidation.error, type: "error" });
        document.getElementById("editor-task-description")?.focus();
        return;
    }

    const taskData = {
        name: nameValidation.value,
        subject: formData.get("subject").trim(),
        type: formData.get("type"),
        dueDate: formData.get("dueDate"),
        estimatedMinutes: Number(formData.get("estimatedMinutes")),
        difficulty: formData.get("difficulty"),
        priority: formData.get("priority") || "Normal",
        description: descValidation.value,
        subtasks: editorSubtasks.filter(subtask => subtask.text.trim()).map(subtask => ({ ...subtask, text: subtask.text.trim(), completed: subtask.completed === true })),
        materials: editorMaterials.filter(material => material.name.trim()).map(material => ({ ...material, name: material.name.trim(), url: material.url.trim() })),
    };
    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
    } else {
        addTask({ id: crypto.randomUUID(), ...taskData, completed: false, createdAt: new Date().toISOString() });
    }
    document.dispatchEvent(new Event("tasks:changed"));
    closeTaskEditor();
    renderTasks();
}

/* =========================================================
   Task Details
========================================================= */

function openTaskDetails(taskId) {
    const task = getTasks().find(item => item.id === taskId);
    const modal = document.getElementById("task-details-modal");
    if (!task || !modal) return;

    detailsTaskId = taskId;
    document.getElementById("task-details-title").textContent = task.name || task.title || "Untitled Task";
    document.getElementById("task-details-subject").textContent = task.subject || "No subject";
    document.getElementById("task-details-type").textContent = task.type || "Task";
    document.getElementById("task-details-due").textContent = formatDueDate(task.dueDate);
    document.getElementById("task-details-time").textContent = formatMinutes(task.estimatedMinutes) || "-";
    document.getElementById("task-details-difficulty").textContent = task.difficulty || "-";
    document.getElementById("task-details-priority").textContent = task.priority || "Normal";

    const descriptionSection = document.getElementById("task-details-description-section");
    const description = document.getElementById("task-details-description");
    if (task.description?.trim()) {
        description.textContent = task.description;
        descriptionSection.hidden = false;
    } else {
        descriptionSection.hidden = true;
    }
    renderTaskDetailsSubtasks(task);
    renderTaskDetailsMaterials(task);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    createIcons();
}

function closeTaskDetails() {
    const modal = document.getElementById("task-details-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    detailsTaskId = null;
}

function renderTaskDetailsSubtasks(task) {
    const section = document.getElementById("task-details-subtasks-section");
    const container = document.getElementById("task-details-subtasks");
    const count = document.getElementById("task-details-subtask-count");
    const subtasks = task.subtasks || [];
    if (!subtasks.length) {
        section.hidden = true;
        return;
    }
    section.hidden = false;
    count.textContent = `${subtasks.filter(subtask => subtask.completed).length}/${subtasks.length} completed`;
    container.innerHTML = subtasks.map(subtask => `
        <label class="detail-subtask">
            <input type="checkbox" data-detail-subtask="${escapeHTML(subtask.id)}" ${subtask.completed ? "checked" : ""}>
            <span class="${subtask.completed ? "completed" : ""}">${escapeHTML(subtask.text)}</span>
        </label>`).join("");
    container.querySelectorAll("[data-detail-subtask]").forEach(input => input.addEventListener("change", event => {
        const updatedSubtasks = subtasks.map(subtask => subtask.id === event.target.dataset.detailSubtask ? { ...subtask, completed: event.target.checked } : subtask);
        updateTask(task.id, { subtasks: updatedSubtasks });
        openTaskDetails(task.id);
        renderTasks();
    }));
}

function renderTaskDetailsMaterials(task) {
    const section = document.getElementById("task-details-materials-section");
    const container = document.getElementById("task-details-materials");
    const materials = task.materials || [];
    if (!materials.length) {
        section.hidden = true;
        return;
    }
    section.hidden = false;
    container.innerHTML = materials.map(material => {
        const name = escapeHTML(material.name);
        if (material.url) {
            return `<a class="detail-material" href="${escapeHTML(material.url)}" target="_blank" rel="noopener noreferrer"><span class="detail-material-icon"><i data-lucide="external-link"></i></span><span>${name}</span></a>`;
        }
        return `<div class="detail-material"><span class="detail-material-icon"><i data-lucide="paperclip"></i></span><span>${name}</span></div>`;
    }).join("");
}

function initializeTaskDetails() {
    const modal = document.getElementById("task-details-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-close-task-details]").forEach(element => element.addEventListener("click", closeTaskDetails));
    document.getElementById("task-details-close")?.addEventListener("click", closeTaskDetails);
    document.getElementById("task-details-edit")?.addEventListener("click", () => {
        const taskId = detailsTaskId;
        closeTaskDetails();
        if (taskId) openTaskEditor(taskId);
    });
    document.getElementById("task-details-delete")?.addEventListener("click", async () => {
        const task = getTasks().find(item => item.id === detailsTaskId);
        if (!task) return;
        const taskName = task.name || task.title || "this task";
        const confirmed = await showConfirm({
            title: "Delete Task",
            message: `Are you sure you want to delete "${taskName}"? This action cannot be undone.`,
            confirmText: "Delete Task",
            confirmButtonClass: "button-danger",
            icon: "trash-2"
        });
        if (!confirmed) return;
        deleteTask(task.id);
        closeTaskDetails();
        showToast({ message: "Task deleted", type: "info" });
        renderTasks();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) closeTaskDetails();
    });
}
