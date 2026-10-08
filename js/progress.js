import {
    getTasks,
    getStudySessions,
    getPlannerSessions
} from "./storage.js";

export function initializeProgress() {
    if (!document.getElementById("progress-stats")) {
        return;
    }

    renderProgress(getTasks(), getStudySessions(), getPlannerSessions());

    document.addEventListener("tasks:changed", refreshProgress);
    document.addEventListener("planner:changed", refreshProgress);
}

function refreshProgress() {
    renderProgress(getTasks(), getStudySessions(), getPlannerSessions());
}

function renderProgress(tasks, studySessions, plannerSessions) {
    const completedSessions = studySessions.filter(isCompletedSession);
    const week = getCurrentWeek();
    const weeklySessions = completedSessions.filter(session => {
        return isDateInRange(session.date, week.start, week.end);
    });
    const weeklyTasks = tasks.filter(task => {
        return task.dueDate && isDateInRange(task.dueDate, week.start, week.end);
    });
    const completedTasks = tasks.filter(task => task.completed === true);
    const completedWeeklyTasks = weeklyTasks.filter(task => task.completed === true);
    const totalStudyMinutes = sumMinutes(weeklySessions);
    const totalTasks = tasks.length;
    const completionRate = totalTasks
        ? Math.round((completedTasks.length / totalTasks) * 100)
        : 0;

    renderStats({
        totalStudyMinutes,
        sessionCount: weeklySessions.length,
        completedTaskCount: completedWeeklyTasks.length,
        completionRate,
        plannerSessionCount: plannerSessions.length
    });
    renderWeekChart(weeklySessions, week);
    renderTaskCompletion(completedTasks.length, totalTasks, completionRate);
    renderSubjects(completedSessions, tasks);
    renderActivity(completedSessions, tasks);
    refreshIcons();
}

function renderStats(stats) {
    const container = document.getElementById("progress-stats");

    if (!container) {
        return;
    }

    container.innerHTML = [
        ["clock-3", "Study time", formatDuration(stats.totalStudyMinutes), "completed this week"],
        ["list-checks", "Sessions", stats.sessionCount, "completed this week"],
        ["check-circle-2", "Tasks completed", stats.completedTaskCount, "due this week"],
        ["chart-no-axes-combined", "Completion rate", `${stats.completionRate}%`, "of all tasks"]
    ].map(([icon, label, value, description]) => `
        <article class="stat-card progress-stat-card">
            <div class="stat-card-header">
                <span class="stat-label">${label}</span>
                <span class="stat-icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            </div>
            <strong class="stat-value">${value}</strong>
            <p class="stat-description">${description}</p>
        </article>
    `).join("");
}

function renderWeekChart(sessions, week) {
    const container = document.getElementById("progress-week-chart");

    if (!container) {
        return;
    }

    const dailyMinutes = week.days.map(day => {
        return sessions
            .filter(session => session.date === day.date)
            .reduce((total, session) => total + Number(session.durationMinutes || 0), 0);
    });
    const maximum = Math.max(...dailyMinutes, 1);

    container.innerHTML = week.days.map((day, index) => `
        <div class="progress-day-bar">
            <div class="progress-day-label">
                <span>${day.label}</span>
                <strong>${formatDuration(dailyMinutes[index])}</strong>
            </div>
            <div class="progress-bar-track" role="progressbar" aria-label="${day.label} study time" aria-valuemin="0" aria-valuemax="${maximum}" aria-valuenow="${dailyMinutes[index]}">
                <span class="progress-bar-value" style="width: ${(dailyMinutes[index] / maximum) * 100}%"></span>
            </div>
        </div>
    `).join("");
}

function renderTaskCompletion(completedCount, totalCount, percentage) {
    const container = document.getElementById("progress-task-completion");

    if (!container) {
        return;
    }

    if (!totalCount) {
        container.innerHTML = createEmptyState(
            "clipboard-check",
            "No tasks yet",
            "Add tasks to start tracking completion."
        );
        return;
    }

    container.innerHTML = `
        <div class="progress-completion-summary">
            <strong>${completedCount} completed</strong>
            <span>${totalCount} total</span>
        </div>
        <div class="progress-completion-track" role="progressbar" aria-label="Task completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}">
            <span style="width: ${percentage}%"></span>
        </div>
        <strong class="progress-completion-percent">${percentage}% completion</strong>
    `;
}

function renderSubjects(sessions, tasks) {
    const container = document.getElementById("progress-subjects");

    if (!container) {
        return;
    }

    const subjects = new Map();

    sessions.forEach(session => {
        const task = tasks.find(item => item.id === session.taskId);
        const subject = session.subject || task?.subject || "Other study";
        const currentMinutes = subjects.get(subject) || 0;
        subjects.set(subject, currentMinutes + Number(session.durationMinutes || 0));
    });

    const orderedSubjects = [...subjects.entries()]
        .sort((a, b) => b[1] - a[1]);

    if (!orderedSubjects.length) {
        container.innerHTML = createEmptyState(
            "book-open",
            "No subject data yet",
            "Your subject breakdown will appear after completed study sessions."
        );
        return;
    }

    const maximum = orderedSubjects[0][1] || 1;
    container.innerHTML = orderedSubjects.map(([subject, minutes]) => `
        <div class="progress-subject-row">
            <div class="progress-subject-heading">
                <strong>${escapeHTML(subject)}</strong>
                <span>${formatDuration(minutes)}</span>
            </div>
            <div class="progress-subject-track" aria-hidden="true">
                <span style="width: ${(minutes / maximum) * 100}%"></span>
            </div>
        </div>
    `).join("");
}

function renderActivity(sessions, tasks) {
    const container = document.getElementById("progress-activity");

    if (!container) {
        return;
    }

    const recentSessions = [...sessions]
        .sort((a, b) => getSessionTimestamp(b).localeCompare(getSessionTimestamp(a)))
        .slice(0, 5);

    if (!recentSessions.length) {
        container.innerHTML = createEmptyState(
            "clock-3",
            "No study activity yet",
            "Complete a study session to start building your progress history."
        );
        return;
    }

    container.innerHTML = recentSessions.map(session => {
        const task = tasks.find(item => item.id === session.taskId);
        const title = session.title || task?.name || "Study session";
        const dateLabel = formatActivityDate(session.date);

        return `
            <div class="progress-activity-item">
                <span class="progress-activity-icon" aria-hidden="true"><i data-lucide="check-circle-2"></i></span>
                <div class="progress-activity-content">
                    <strong>${escapeHTML(title)}</strong>
                    <span>${formatDuration(session.durationMinutes)} · ${dateLabel}${session.startTime ? ` · ${escapeHTML(session.startTime)}` : ""}</span>
                </div>
            </div>
        `;
    }).join("");
}

function createEmptyState(icon, title, description) {
    return `
        <div class="progress-empty-state">
            <span class="empty-state-icon"><i data-lucide="${icon}"></i></span>
            <strong>${title}</strong>
            <p>${description}</p>
        </div>
    `;
}

function getCurrentWeek(date = new Date()) {
    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = current.getDay();
    const daysFromMonday = (day + 6) % 7;
    const startDate = new Date(current);
    startDate.setDate(current.getDate() - daysFromMonday);

    const days = Array.from({ length: 7 }, (_, index) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + index);

        return {
            date: getLocalDateString(dayDate),
            label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dayDate)
        };
    });

    return {
        start: days[0].date,
        end: days[6].date,
        days
    };
}

function isDateInRange(date, start, end) {
    return date >= start && date <= end;
}

function isCompletedSession(session) {
    return session.status === "Completed" || session.completed === true;
}

function sumMinutes(sessions) {
    return sessions.reduce(
        (total, session) => total + Number(session.durationMinutes || 0),
        0
    );
}

function getSessionTimestamp(session) {
    return `${session.date || ""}T${session.startTime || "00:00"}`;
}

function formatActivityDate(dateString) {
    if (!dateString) {
        return "Unknown date";
    }

    const today = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);

    if (dateString === today) {
        return "Today";
    }

    if (dateString === yesterday) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(new Date(`${dateString}T00:00:00`));
}

function formatDuration(minutes) {
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

function refreshIcons() {
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
        lucide.createIcons();
    }
}
