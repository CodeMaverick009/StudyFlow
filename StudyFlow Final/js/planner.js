import {
    getTasks,
    updateTask,
    getPlannerSessions
} from "./storage.js";

let currentDate = new Date();
let selectedTaskId = null;
let selectedDateForModal = null;

export function initializePlanner() {
    if (!document.getElementById("planner-grid")) return;
    initializePlannerControls();
    renderPlanner();
}

function initializePlannerControls() {
    document.getElementById("planner-previous-month")?.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderPlanner();
    });
    document.getElementById("planner-next-month")?.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderPlanner();
    });
    document.getElementById("planner-today-button")?.addEventListener("click", () => {
        const today = new Date();
        currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        renderPlanner();
    });
    document.getElementById("planner-add-task")?.addEventListener("click", () => { window.location.href = "tasks.html?add=1"; });
    document.getElementById("planner-task-details-close")?.addEventListener("click", closeTaskDetails);
    document.querySelectorAll("[data-close-planner-details]").forEach(element => element.addEventListener("click", closeTaskDetails));
    document.getElementById("planner-task-details-edit")?.addEventListener("click", () => {
        if (selectedTaskId) window.location.href = `tasks.html?edit=${encodeURIComponent(selectedTaskId)}`;
    });

    // Day modal controls
    document.getElementById("planner-day-modal-close")?.addEventListener("click", closeDayDetails);
    document.querySelectorAll("[data-close-planner-day]").forEach(element => element.addEventListener("click", closeDayDetails));
    document.getElementById("planner-day-modal-add-task")?.addEventListener("click", () => {
        if (selectedDateForModal) {
            window.location.href = `tasks.html?add=1&date=${encodeURIComponent(selectedDateForModal)}`;
        } else {
            window.location.href = "tasks.html?add=1";
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (document.getElementById("planner-task-details-modal")?.classList.contains("is-open")) closeTaskDetails();
            if (document.getElementById("planner-day-modal")?.classList.contains("is-open")) closeDayDetails();
        }
    });
    document.addEventListener("tasks:changed", renderPlanner);
}

function renderPlanner() {
    document.getElementById("planner-month-title").textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentDate);
    renderCalendar();
    renderUpcoming();
    createIcons();
}

function renderCalendar() {
    const grid = document.getElementById("planner-grid");
    const tasks = getTasks();
    const plannerSessions = getPlannerSessions();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = "";
    for (let day = firstWeekday - 1; day >= 0; day--) html += createCalendarDay(new Date(year, month, -day), tasks, plannerSessions, true);
    for (let day = 1; day <= daysInMonth; day++) html += createCalendarDay(new Date(year, month, day), tasks, plannerSessions, false);
    const remaining = Math.ceil((firstWeekday + daysInMonth) / 7) * 7 - firstWeekday - daysInMonth;
    for (let day = 1; day <= remaining; day++) html += createCalendarDay(new Date(year, month + 1, day), tasks, plannerSessions, true);
    grid.innerHTML = html;
    initializeCalendarTaskActions();
}

function initializeCalendarTaskActions() {
    document.querySelectorAll(".planner-task").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            openTaskDetails(button.dataset.taskId);
        });
    });

    document.querySelectorAll(".planner-session").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();

            if (button.dataset.taskId) {
                openTaskDetails(button.dataset.taskId);
            }
        });
    });

    document.querySelectorAll(".planner-day").forEach(day => {
        day.addEventListener("click", (event) => {
            if (event.target.closest(".planner-task") || event.target.closest(".planner-session")) {
                return;
            }
            openDayDetails(day.dataset.date);
        });
    });
}

function createCalendarDay(date, tasks, plannerSessions, outsideMonth) {
    const dateString = formatDate(date);
    const isToday = dateString === formatDate(new Date());
    const dayTasks = tasks.filter(task => task.dueDate === dateString).sort((a, b) => Number(b.priority === "High") - Number(a.priority === "High"));
    const sessionsForDay = plannerSessions
        .filter(session => session.date === dateString)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    const totalCount = dayTasks.length + sessionsForDay.length;
    const overflowCount = totalCount > 2 ? totalCount - 2 : 0;

    const taskMarkup = dayTasks.map(task => `<button type="button" class="planner-task ${task.completed ? "is-completed" : ""} ${task.priority === "High" ? "is-high-priority" : ""}" data-task-id="${escapeHTML(task.id)}" title="${escapeHTML(task.name || task.title || "Untitled Task")}"><span class="planner-task-indicator"></span><span class="planner-task-name">${escapeHTML(task.name || task.title || "Untitled Task")}</span></button>`).join("");
    const sessionMarkup = sessionsForDay.map(session => `<button type="button" class="planner-session ${session.status === "Completed" ? "is-completed" : ""} ${session.status === "In progress" ? "is-in-progress" : ""}" data-task-id="${escapeHTML(session.taskId || "")}" title="${escapeHTML(session.title || "Study session")}"><span class="planner-session-time">${escapeHTML(session.startTime || "")}</span><span class="planner-session-main"><strong>${escapeHTML(session.title || "Study session")}</strong><span>${escapeHTML(session.durationMinutes || 0)} min · ${escapeHTML(session.status || "Planned")}</span></span></button>`).join("");

    return `<div class="planner-day ${outsideMonth ? "is-outside-month" : ""} ${isToday ? "is-today" : ""}" data-date="${dateString}" title="Click to view day schedule modal">
        <div class="planner-day-header">
            <span class="planner-day-number">${date.getDate()}</span>
            ${isToday ? '<span class="planner-today-label">Today</span>' : ""}
        </div>
        <div class="planner-day-tasks">${sessionMarkup}${taskMarkup}</div>
        ${overflowCount > 0 ? `<div class="planner-day-more-indicator">+${overflowCount} more</div>` : ""}
    </div>`;
}

function openDayDetails(dateString) {
    if (!dateString) return;
    selectedDateForModal = dateString;

    const modal = document.getElementById("planner-day-modal");
    const dateLabel = document.getElementById("planner-day-modal-date");
    const titleEl = document.getElementById("planner-day-modal-title");
    const summaryEl = document.getElementById("planner-day-modal-summary");
    const bodyEl = document.getElementById("planner-day-modal-body");

    if (!modal) return;

    const [year, month, day] = dateString.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const formattedTitle = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(dateObj);
    const isToday = dateString === formatDate(new Date());

    if (dateLabel) dateLabel.textContent = isToday ? "Today's Schedule" : "Scheduled Day";
    if (titleEl) titleEl.textContent = formattedTitle;

    const tasks = getTasks().filter(t => t.dueDate === dateString).sort((a, b) => Number(b.priority === "High") - Number(a.priority === "High"));
    const plannerSessions = getPlannerSessions().filter(s => s.date === dateString).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    const totalItems = tasks.length + plannerSessions.length;
    if (summaryEl) {
        summaryEl.textContent = totalItems === 0 
            ? "No tasks or focus sessions scheduled for this day." 
            : `${tasks.length} task${tasks.length === 1 ? "" : "s"} · ${plannerSessions.length} focus session${plannerSessions.length === 1 ? "" : "s"}`;
    }

    let html = "";

    if (totalItems === 0) {
        html = `<div class="planner-day-modal-empty">
            <p>Your schedule is clear for this day!</p>
        </div>`;
    } else {
        html += `<div class="planner-day-modal-list">`;
        if (plannerSessions.length > 0) {
            html += `<div class="planner-day-modal-section-title">Focus Sessions</div>`;
            html += plannerSessions.map(session => `
                <button type="button" class="planner-session ${session.status === "Completed" ? "is-completed" : ""} ${session.status === "In progress" ? "is-in-progress" : ""}" data-task-id="${escapeHTML(session.taskId || "")}" title="${escapeHTML(session.title || "Study session")}">
                    <span class="planner-session-time">${escapeHTML(session.startTime || "Planned")}</span>
                    <span class="planner-session-main">
                        <strong>${escapeHTML(session.title || "Study session")}</strong>
                        <span>${escapeHTML(session.durationMinutes || 0)} min · ${escapeHTML(session.status || "Planned")}</span>
                    </span>
                </button>
            `).join("");
        }

        if (tasks.length > 0) {
            html += `<div class="planner-day-modal-section-title">Tasks</div>`;
            html += tasks.map(task => `
                <button type="button" class="planner-task ${task.completed ? "is-completed" : ""} ${task.priority === "High" ? "is-high-priority" : ""}" data-task-id="${escapeHTML(task.id)}" title="${escapeHTML(task.name || task.title || "Untitled Task")}">
                    <span class="planner-task-indicator"></span>
                    <span class="planner-task-name">${escapeHTML(task.name || task.title || "Untitled Task")}</span>
                </button>
            `).join("");
        }
        html += `</div>`;
    }

    if (bodyEl) bodyEl.innerHTML = html;

    if (bodyEl) {
        bodyEl.querySelectorAll(".planner-task, .planner-session").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.dataset.taskId) {
                    closeDayDetails();
                    openTaskDetails(btn.dataset.taskId);
                }
            });
        });
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    createIcons();
}

function closeDayDetails() {
    const modal = document.getElementById("planner-day-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function renderUpcoming() {
    const container = document.getElementById("planner-upcoming-list");
    const today = formatDate(new Date());
    const tasks = getTasks().filter(task => !task.completed && task.dueDate >= today).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    if (!tasks.length) {
        container.innerHTML = '<div class="planner-upcoming-empty"><div class="empty-state-icon"><i data-lucide="calendar-check"></i></div><h3>No upcoming tasks</h3><p>Your upcoming deadlines will appear here.</p></div>';
        return;
    }
    container.innerHTML = tasks.map(task => `<button type="button" class="planner-upcoming-item" data-upcoming-task="${escapeHTML(task.id)}"><span class="planner-upcoming-date"><strong>${formatShortDate(task.dueDate)}</strong></span><span class="planner-upcoming-main"><strong>${escapeHTML(task.name || task.title || "Untitled Task")}</strong><span>${escapeHTML(task.subject || "No subject")}</span></span>${task.priority === "High" ? '<span class="task-priority priority-high">High priority</span>' : ""}<i data-lucide="chevron-right" aria-hidden="true"></i></button>`).join("");
    container.querySelectorAll("[data-upcoming-task]").forEach(item => item.addEventListener("click", () => openTaskDetails(item.dataset.upcomingTask)));
}

function openTaskDetails(taskId) {
    const task = getTasks().find(item => item.id === taskId);
    const modal = document.getElementById("planner-task-details-modal");
    if (!task || !modal) return;
    selectedTaskId = taskId;
    document.getElementById("planner-task-details-title").textContent = task.name || task.title || "Untitled Task";
    document.getElementById("planner-task-details-subject").textContent = task.subject || "No subject";
    document.getElementById("planner-task-details-type").textContent = task.type || "Task";
    document.getElementById("planner-task-details-due").textContent = formatDueDate(task.dueDate);
    document.getElementById("planner-task-details-time").textContent = formatMinutes(task.estimatedMinutes) || "-";
    document.getElementById("planner-task-details-difficulty").textContent = task.difficulty || "-";
    document.getElementById("planner-task-details-priority").textContent = task.priority || "Normal";
    const descriptionSection = document.getElementById("planner-task-details-description-section");
    const description = document.getElementById("planner-task-details-description");
    description.textContent = task.description || "";
    descriptionSection.hidden = !task.description?.trim();
    renderPlannerSubtasks(task);
    renderPlannerMaterials(task);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    createIcons();
}

function renderPlannerSubtasks(task) {
    const section = document.getElementById("planner-task-details-subtasks-section");
    const container = document.getElementById("planner-task-details-subtasks");
    const count = document.getElementById("planner-task-details-subtask-count");
    const subtasks = task.subtasks || [];
    if (!subtasks.length) {
        section.hidden = true;
        return;
    }
    section.hidden = false;
    count.textContent = `${subtasks.filter(subtask => subtask.completed).length}/${subtasks.length} completed`;
    container.innerHTML = subtasks.map(subtask => `<label class="detail-subtask"><input type="checkbox" data-planner-detail-subtask="${escapeHTML(subtask.id)}" ${subtask.completed ? "checked" : ""}><span class="${subtask.completed ? "completed" : ""}">${escapeHTML(subtask.text)}</span></label>`).join("");
    container.querySelectorAll("[data-planner-detail-subtask]").forEach(input => input.addEventListener("change", event => {
        const updatedSubtasks = subtasks.map(subtask => subtask.id === event.target.dataset.plannerDetailSubtask ? { ...subtask, completed: event.target.checked } : subtask);
        updateTask(task.id, { subtasks: updatedSubtasks });
        openTaskDetails(task.id);
        renderPlanner();
    }));
}

function renderPlannerMaterials(task) {
    const section = document.getElementById("planner-task-details-materials-section");
    const container = document.getElementById("planner-task-details-materials");
    const materials = task.materials || [];
    if (!materials.length) {
        section.hidden = true;
        return;
    }
    section.hidden = false;
    container.innerHTML = materials.map(material => material.url
        ? `<a class="detail-material" href="${escapeHTML(material.url)}" target="_blank" rel="noopener noreferrer"><span class="detail-material-icon"><i data-lucide="external-link"></i></span><span>${escapeHTML(material.name)}</span></a>`
        : `<div class="detail-material"><span class="detail-material-icon"><i data-lucide="paperclip"></i></span><span>${escapeHTML(material.name)}</span></div>`
    ).join("");
}

function closeTaskDetails() {
    const modal = document.getElementById("planner-task-details-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    selectedTaskId = null;
}

function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDueDate(value) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "No date"; }
function formatShortDate(value) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`)) : "-"; }
function formatMinutes(value) { const minutes = Number(value); if (!minutes) return ""; const hours = Math.floor(minutes / 60); return minutes < 60 ? `${minutes} min` : (minutes % 60 ? `${hours} hr ${minutes % 60} min` : `${hours} hr`); }
function escapeHTML(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function createIcons() { if (typeof lucide !== "undefined") lucide.createIcons(); }
