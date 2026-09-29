// =========================================================
// STUDYFLOW — APPLICATION ENTRY POINT
// =========================================================

import { renderSidebar } from "./components/sidebar.js";
import { renderHeader } from "./components/header.js";
import {
    initializeTheme,
    toggleTheme
} from "./theme.js";
import {
    addTask,
    getTasks,
    getPlannerSessions,
    getCurrentAccount,
    clearSession
} from "./storage.js";
import { initializeTasks } from "./tasks.js";
import { initializePlanner } from "./planner.js";
import { initializeStudy } from "./study.js";
import { initializeProgress } from "./progress.js";
import { initializeSettingsPage } from "./settings.js";
import { initializeCommandPalette, openCommandPalette } from "./components/command-palette.js";
import { initializeSettingsModal } from "./components/settingsModal.js";
import { showToast } from "./components/toast.js";

let currentAccount = null;

document.addEventListener("DOMContentLoaded", () => {

    // Every app page requires a signed-in account. Studyflow has no
    // backend, so "signed in" just means there's a matching account
    // in this browser's localStorage — see storage.js.
    currentAccount = getCurrentAccount();

    if (!currentAccount) {
        window.location.href = "welcome.html";
        return;
    }

    initializeTheme();

    renderSidebar(currentAccount);
    renderHeader();

    initializeIcons();

    initializeDashboard();
    initializeThemeToggle();
    initializeAccountMenu();
    initializeQuickAdd();
    initializeTasks();
    initializePlanner();
    initializeStudy();
    initializeProgress();
    initializeSettingsPage();
    initializeCommandPalette();
    initializeSettingsModal();

    // Wire command palette button in header
    const cmdBtn = document.getElementById("cmd-palette-trigger-btn");
    if (cmdBtn) {
        cmdBtn.addEventListener("click", openCommandPalette);
    }

    document.addEventListener("tasks:changed", initializeDashboard);
    document.addEventListener("planner:changed", initializeDashboard);

    console.log("Studyflow initialized");
});


// =========================================================
// ACCOUNT MENU / LOG OUT
// =========================================================

function initializeAccountMenu() {

    document.addEventListener("click", event => {

        const logoutButton =
            event.target.closest("#sidebar-logout");

        if (!logoutButton) {
            return;
        }

        clearSession();
        window.location.href = "welcome.html";
    });
}

// =========================================================
// ICONS
// =========================================================

function initializeIcons() {

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

}


// =========================================================
// DASHBOARD
// =========================================================

function initializeDashboard() {

    const dateElement =
        document.getElementById("current-date");

    const greetingElement =
        document.getElementById("greeting");

    if (dateElement && greetingElement) {
        const now = new Date();

        const dateFormatter = new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );

        dateElement.textContent = dateFormatter.format(now);

        const hour = now.getHours();
        let greeting;

        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 18) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }

        const firstName = currentAccount?.name?.trim().split(" ")[0];

        greetingElement.textContent = firstName
            ? `${greeting}, ${firstName}`
            : greeting;
    }

    const tasks = getTasks();

    updateDashboardStats(tasks);
    renderDashboardTasks(tasks);
    renderDashboardDeadlines(tasks);
    renderDashboardSessions(getPlannerSessions());
}

function updateDashboardStats(tasks) {
    const todayString = getLocalDateString();
    const plannerSessions = getPlannerSessions();

    const todaysTasks = tasks.filter(task => {
        return task.dueDate === todayString;
    });

    const completedToday = todaysTasks.filter(task => {
        return task.completed === true;
    });

    const upcomingTasks = tasks.filter(task => {
        return task.dueDate > todayString && task.completed === false;
    });

    const plannedStudyTime = plannerSessions
        .filter(session => session.date === todayString)
        .reduce((total, session) => {
            return total + Number(session.durationMinutes || 0);
        }, 0);

    const completedTasks = tasks.filter(task => {
        return task.completed === true;
    }).length;

    const weeklyProgress = tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    const taskCount = document.getElementById("today-task-count");
    const studyTime = document.getElementById("study-time");
    const upcomingCount = document.getElementById("upcoming-count");
    const progress = document.getElementById("weekly-progress");
    const completedText = document.querySelector("[data-today-completed]");

    if (taskCount) {
        taskCount.textContent = todaysTasks.length;
    }

    if (studyTime) {
        studyTime.textContent = formatDashboardDuration(plannedStudyTime);
    }

    if (upcomingCount) {
        upcomingCount.textContent = upcomingTasks.length;
    }

    if (progress) {
        progress.textContent = `${weeklyProgress}%`;
    }

    if (completedText) {
        completedText.textContent = `${completedToday.length} completed`;
    }
}

function renderDashboardTasks(tasks) {
    const container = document.getElementById("today-tasks");

    if (!container) {
        return;
    }

    const todayTasks = tasks.filter(task => {
        return task.dueDate === getLocalDateString();
    });

    if (!todayTasks.length) {
        renderDashboardEmptyState(
            container,
            "circle-check",
            "No tasks for today",
            "You can enjoy a lighter day or add a new task."
        );
        return;
    }

    container.className = "dashboard-item-list";
    container.innerHTML = todayTasks.map(task => `
        <div class="dashboard-item ${task.completed ? "is-completed" : ""}">
            <span class="dashboard-item-marker" aria-hidden="true">
                ${task.completed ? '<i data-lucide="check"></i>' : ""}
            </span>
            <div class="dashboard-item-content">
                <strong>${escapeHTML(task.name || task.title || "Untitled Task")}</strong>
                <span>
                    ${task.subject ? `${escapeHTML(task.subject)} · ` : ""}
                    ${task.estimatedMinutes ? formatDashboardDuration(task.estimatedMinutes) : "No estimate"}
                </span>
            </div>
            <span class="dashboard-item-status">
                ${task.completed ? "Completed" : "Due today"}
            </span>
        </div>
    `).join("");

    initializeIcons();
}

function renderDashboardDeadlines(tasks) {
    const container = document.getElementById("upcoming-deadlines");

    if (!container) {
        return;
    }

    const today = getLocalDateString();
    const upcomingTasks = tasks
        .filter(task => task.dueDate > today && task.completed === false)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (!upcomingTasks.length) {
        renderDashboardEmptyState(
            container,
            "clock-3",
            "No upcoming deadlines",
            "Your future deadlines will appear here."
        );
        return;
    }

    container.className = "dashboard-item-list";
    container.innerHTML = upcomingTasks.map(task => `
        <div class="dashboard-item">
            <span class="dashboard-item-marker" aria-hidden="true">
                <i data-lucide="calendar-clock"></i>
            </span>
            <div class="dashboard-item-content">
                <strong>${escapeHTML(task.name || task.title || "Untitled Task")}</strong>
                <span>
                    ${task.subject ? `${escapeHTML(task.subject)} · ` : ""}
                    ${formatDashboardDate(task.dueDate)}
                </span>
            </div>
            <span class="dashboard-item-status">Upcoming</span>
        </div>
    `).join("");

    initializeIcons();
}

function renderDashboardEmptyState(container, icon, title, description) {
    container.className = "empty-state";
    container.innerHTML = `
        <div class="empty-state-icon">
            <i data-lucide="${icon}" aria-hidden="true"></i>
        </div>
        <h3>${title}</h3>
        <p>${description}</p>
    `;
    initializeIcons();
}

function renderDashboardSessions(plannerSessions) {
    const container = document.getElementById("today-sessions");

    if (!container) {
        return;
    }

    const todaySessions = plannerSessions
        .filter(session => session.date === getLocalDateString())
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    if (!todaySessions.length) {
        renderDashboardEmptyState(
            container,
            "clock-3",
            "No study sessions planned",
            "Use Plan My Day to create your study schedule."
        );
        return;
    }

    container.className = "dashboard-session-list";
    container.innerHTML = todaySessions.map(session => {
        const isBreak = session.taskId === null || session.subject === "Rest Break" || session.subject === "Break";
        return `
        <div class="dashboard-session-item ${session.status === "Completed" ? "is-completed" : ""} ${isBreak ? "is-break" : ""}">
            <div class="dashboard-session-time">
                <strong>${escapeHTML(session.startTime || "")}</strong>
                <span>${escapeHTML(session.endTime || "")}</span>
            </div>
            <div class="dashboard-session-content">
                <strong>${escapeHTML(session.title || "Study session")}</strong>
                <span>${escapeHTML(session.subject || "")} ${session.subject ? "·" : ""} ${formatDashboardDuration(session.durationMinutes)}</span>
            </div>
            ${isBreak
                ? '<span class="dashboard-session-status" style="color: var(--text-secondary);">Break</span>'
                : session.status === "Completed"
                ? '<span class="dashboard-session-status">Completed</span>'
                : '<a class="button button-secondary button-small dashboard-session-action" href="study.html">Start session</a>'}
        </div>
    `;
    }).join("");

    initializeIcons();
}

function formatDashboardDuration(minutes) {
    const total = Number(minutes) || 0;

    if (total < 60) {
        return `${total} min`;
    }

    const hours = Math.floor(total / 60);
    const remainingMinutes = total % 60;

    return remainingMinutes === 0
        ? `${hours}h`
        : `${hours}h ${remainingMinutes}m`;
}

function formatDashboardDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// =========================================================
// THEME TOGGLE
// =========================================================

function initializeThemeToggle() {

    document.addEventListener("click", event => {

        const themeToggle =
            event.target.closest("#theme-toggle");

        if (!themeToggle) {
            return;
        }

        toggleTheme();
    });
}
function initializeQuickAdd() {
    const openButton = document.getElementById("quick-add-button");
    const modal = document.getElementById("quick-add-modal");
    const form = document.getElementById("quick-add-form");
    const closeButton = document.getElementById("quick-add-close");

    if (!modal || !form) {
        return;
    }


    // Open modal

    openButton?.addEventListener("click", () => {
        openQuickAddModal();
    });


    // Close button

    closeButton?.addEventListener("click", () => {
        closeQuickAddModal();
    });


    // Backdrop / cancel buttons

    modal.querySelectorAll("[data-close-modal]").forEach(element => {
        element.addEventListener("click", () => {
            closeQuickAddModal();
        });
    });


    // Escape key

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            modal.classList.contains("is-open")
        ) {
            closeQuickAddModal();
        }
    });


    // Submit

    form.addEventListener("submit", event => {
        event.preventDefault();

        createTaskFromForm(form);
    });
}
function openQuickAddModal() {
    const modal = document.getElementById("quick-add-modal");

    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    const firstInput = document.getElementById("task-name");

    setTimeout(() => {
        firstInput?.focus();
    }, 100);
}
function closeQuickAddModal() {
    const modal = document.getElementById("quick-add-modal");
    const form = document.getElementById("quick-add-form");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

    form?.reset();
}
function createTaskFromForm(form) {
    const formData = new FormData(form);

    const task = {
        id: crypto.randomUUID(),

        name: formData.get("name").trim(),

        subject: formData.get("subject").trim(),

        type: formData.get("type"),

        dueDate: formData.get("dueDate"),

        estimatedMinutes: Number(
            formData.get("estimatedMinutes")
        ),

        difficulty: formData.get("difficulty"),

        priority: formData.get("priority") || "Normal",

        description:
            formData.get("description").trim(),

        completed: false,

        subtasks: [],

        materials: [],

        createdAt: new Date().toISOString()
    };

    addTask(task);

    document.dispatchEvent(new Event("tasks:changed"));

    console.log("Task created:", task);

    closeQuickAddModal();

    initializeDashboard();
}
