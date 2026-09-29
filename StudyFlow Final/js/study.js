// =========================================================
// STUDYFLOW — STUDY PAGE
// =========================================================

import {
    getTasks,
    addTask,
    getStudySessions,
    addStudySession,
    getStudyRoutine,
    saveStudyRoutine,
    getPlannerSessions,
    savePlannerSessions
} from "./storage.js";
import { playAmbientSound, stopAmbientSound, setAmbientVolume } from "./ambientAudio.js";
import { showToast } from "./components/toast.js";
import { showConfirm } from "./components/confirmModal.js";


// =========================================================
// STATE
// =========================================================

let selectedDuration = 25;
let activeSession = null;
let timerInterval = null;
let remainingSeconds = 0;


// =========================================================
// INITIALIZATION
// =========================================================

export function initializeStudy() {
    const studyPage = document.querySelector(".study-page");

    if (!studyPage) {
        return;
    }

    initializeTaskSelector();
    initializeDurationSelector();
    initializeStudyTimeDropdowns();
    initializePlanModal();
    initializeStudyButtons();
    initializeAmbientAudioControls();
    initializeQuickNotes();

    renderStudyPage();

    document.addEventListener("tasks:changed", () => {
        initializeTaskSelector();
        renderStudyPage();
    });

    console.log("Study page initialized");
}


// =========================================================
// PAGE RENDERING
// =========================================================

function renderStudyPage() {
    const tasks = getTasks();
    const sessions = getStudySessions();

    renderTodayStats(tasks, sessions);
    renderUpcomingTasks(tasks);
    renderTodaySessions(tasks, sessions);
    renderTodayRoutine();

    refreshIcons();
}


// =========================================================
// TASK SELECTOR
// =========================================================

function initializeTaskSelector() {
    const select = document.getElementById("study-task-select");

    if (!select) {
        return;
    }

    const tasks = getTasks();

    const activeTasks = tasks
        .filter(task => task.completed !== true)
        .sort(sortTasksByDueDate);

    const currentValue = select.value;

    select.innerHTML = `
        <option value="">Select a task</option>
        ${activeTasks.map(task => `
            <option value="${escapeAttribute(task.id)}">
                ${escapeHTML(task.name || task.title || "Untitled Task")}
                ${task.subject ? ` — ${escapeHTML(task.subject)}` : ""}
            </option>
        `).join("")}
    `;

    if (
        currentValue &&
        activeTasks.some(task => task.id === currentValue)
    ) {
        select.value = currentValue;
    }
}


// =========================================================
// DURATION SELECTOR
// =========================================================

function initializeDurationSelector() {
    const durationButtons =
        document.querySelectorAll(".study-duration-option");

    const customDuration =
        document.getElementById("study-custom-duration");

    const customInput =
        document.getElementById("study-custom-duration-input");

    durationButtons.forEach(button => {
        button.addEventListener("click", () => {

            durationButtons.forEach(item => {
                item.classList.remove("is-selected");
            });

            button.classList.add("is-selected");

            const duration = button.dataset.duration;

            if (duration === "custom") {

                customDuration?.removeAttribute("hidden");

                setTimeout(() => {
                    customInput?.focus();
                }, 50);

                return;
            }

            customDuration?.setAttribute("hidden", "");

            selectedDuration = Number(duration);
        });
    });
}


// =========================================================
// GET SELECTED DURATION
// =========================================================

function getSelectedDuration() {
    const selectedButton =
        document.querySelector(
            ".study-duration-option.is-selected"
        );

    if (!selectedButton) {
        return 25;
    }

    if (selectedButton.dataset.duration === "custom") {

        const customInput =
            document.getElementById(
                "study-custom-duration-input"
            );

        const value = Number(customInput?.value);

        if (!Number.isFinite(value) || value <= 0) {
            return null;
        }

        return Math.min(Math.round(value), 240);
    }

    return Number(selectedButton.dataset.duration);
}


// =========================================================
// TODAY'S STATISTICS
// =========================================================

function renderTodayStats(tasks, sessions) {
    const today = getLocalDateString();

    const todaysSessions = sessions.filter(session => {
        return session.date === today;
    });

    const completedSessions = todaysSessions.filter(session => {
        return session.completed === true;
    });

    const studyTime = todaysSessions.reduce((total, session) => {
        return total + Number(session.durationMinutes || 0);
    }, 0);

    const plannedToday = getPlannedStudyTime(tasks, today);

    setText(
        "study-today-time",
        formatDuration(studyTime)
    );

    setText(
        "study-today-sessions",
        todaysSessions.length
    );

    setText(
        "study-today-completed",
        completedSessions.length
    );

    setText(
        "study-today-planned",
        formatDuration(plannedToday)
    );
}


// =========================================================
// UPCOMING TASKS
// =========================================================

function renderUpcomingTasks(tasks) {
    const container =
        document.getElementById("study-upcoming-list");

    if (!container) {
        return;
    }

    const today = getLocalDateString();

    const upcomingTasks = tasks
        .filter(task => {
            return (
                task.completed !== true &&
                task.dueDate &&
                task.dueDate >= today
            );
        })
        .sort(sortTasksByDueDate)
        .slice(0, 5);

    if (upcomingTasks.length === 0) {

        container.innerHTML = `
            <div class="study-inline-empty">
                <i data-lucide="check-circle-2"></i>

                <span>
                    No upcoming tasks need your attention.
                </span>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML = upcomingTasks.map(task => {

        const dueText = formatDueDate(task.dueDate);

        return `
            <div class="study-upcoming-item">

                <div class="study-upcoming-content">

                    <h3 class="study-upcoming-title">
                        ${escapeHTML(task.name || task.title || "Untitled Task")}
                    </h3>

                    <div class="study-upcoming-meta">

                        ${
                            task.subject
                                ? `<span>${escapeHTML(task.subject)}</span>`
                                : ""
                        }

                        ${
                            task.subject
                                ? `<span aria-hidden="true">·</span>`
                                : ""
                        }

                        <span class="study-upcoming-date">
                            ${escapeHTML(dueText)}
                        </span>

                        ${
                            task.estimatedMinutes
                                ? `
                                    <span aria-hidden="true">·</span>
                                    <span>
                                        ${task.estimatedMinutes} min
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>

                <button
                    type="button"
                    class="button button-secondary study-quick-start"
                    data-task-id="${escapeAttribute(task.id)}"
                >
                    <i data-lucide="play"></i>
                    <span>Start</span>
                </button>

            </div>
        `;
    }).join("");

    container
        .querySelectorAll(".study-quick-start")
        .forEach(button => {

            button.addEventListener("click", () => {

                const taskId = button.dataset.taskId;

                const select =
                    document.getElementById(
                        "study-task-select"
                    );

                if (select) {
                    select.value = taskId;
                }

                const sessionCard =
                    document.querySelector(
                        ".study-session-card"
                    );

                sessionCard?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                setTimeout(() => {
                    document
                        .getElementById("study-start-button")
                        ?.focus();
                }, 350);
            });
        });

    refreshIcons();
}


// =========================================================
// TODAY'S SESSION HISTORY
// =========================================================

function renderTodaySessions(tasks, sessions) {
    const container =
        document.getElementById("study-history-list");

    const emptyState =
        document.getElementById("study-history-empty");

    if (!container) {
        return;
    }

    const today = getLocalDateString();

    const todaysSessions = sessions
        .filter(session => session.date === today)
        .sort((a, b) => {
            return getSessionSortTime(b)
                .localeCompare(getSessionSortTime(a));
        });

    if (todaysSessions.length === 0) {

        container.innerHTML = "";

        emptyState?.removeAttribute("hidden");

        return;
    }

    emptyState?.setAttribute("hidden", "");

    container.innerHTML = todaysSessions.map(session => {

        const task =
            tasks.find(item => item.id === session.taskId);

        const taskName =
            task?.name || "Study session";

        const subject =
            task?.subject || "";

        const sessionType =
            formatSessionType(session.sessionType);

        const status =
            session.completed === true
                ? "Completed"
                : "In progress";

        const statusClass =
            session.completed === true
                ? "is-completed"
                : "is-active";

        return `
            <div class="study-history-item">

                <div class="study-history-main">

                    <h3 class="study-history-title">
                        ${escapeHTML(taskName)}
                    </h3>

                    <p class="study-history-meta">
                        ${
                            subject
                                ? `${escapeHTML(subject)} · `
                                : ""
                        }
                        ${
                            session.startTime
                                ? escapeHTML(session.startTime)
                                : ""
                        }
                        ${
                            sessionType
                                ? ` · ${escapeHTML(sessionType)}`
                                : ""
                        }
                    </p>

                </div>

                <span class="study-history-duration">
                    ${formatDuration(session.durationMinutes)}
                </span>

                <span
                    class="study-history-status ${statusClass}"
                >
                    ${status}
                </span>

            </div>
        `;
    }).join("");

    refreshIcons();
}


// =========================================================
// TODAY'S ROUTINE
// =========================================================

function renderTodayRoutine() {
    const routine = getStudyRoutine();
    const plannerSessions = getPlannerSessions();
    const container = document.getElementById("study-routine-list");
    const emptyState = document.getElementById("study-routine-empty");
    const today = getLocalDateString();

    if (!container) {
        return;
    }

    if (!routine || routine.date !== today || !routine.items?.length) {
        container.innerHTML = "";
        emptyState?.removeAttribute("hidden");
        renderRoutineProgress();
        return;
    }

    emptyState?.setAttribute("hidden", "");
    container.innerHTML = routine.items.map(item => {
        const plannerSession = plannerSessions.find(session => session.id === item.id);
        const status = plannerSession?.status || item.status || "Planned";
        const isBreak = item.type === "break" || item.taskId === null || item.subject === "Break" || item.subject === "Rest Break";

        return `
        <div class="study-routine-item ${isBreak ? "is-break" : ""} ${status === "Completed" ? "is-completed" : ""}">
            <div class="study-routine-time">${escapeHTML(item.startTime)}</div>
            <div class="study-routine-content">
                <h3 class="study-routine-title">${escapeHTML(item.title)}</h3>
                <p class="study-routine-meta">
                    ${escapeHTML(item.subject || "")}
                    ${item.durationMinutes ? ` <span class="study-routine-meta-separator">·</span> ${item.durationMinutes} min` : ""}
                </p>
            </div>
            <span class="study-routine-badge ${isBreak ? "" : (status === "Completed" ? "study-badge" : "")}">
                ${isBreak ? "Break" : escapeHTML(status)}
            </span>
        </div>
    `;
    }).join("");

    renderRoutineProgress();
    refreshIcons();
}


// =========================================================
// ROUTINE PROGRESS
// =========================================================

function renderRoutineProgress() {
    const routine = getStudyRoutine();
    const plannerSessions = getPlannerSessions();
    const today = getLocalDateString();

    const progressBar = document.getElementById("study-routine-progress-bar");
    const progressText = document.getElementById("study-routine-progress-text");
    const progressContainer = document.querySelector(".study-routine-progress .progress-bar");

    if (!routine || routine.date !== today || !routine.items?.length) {
        if (progressBar) progressBar.style.width = "0%";
        if (progressText) progressText.textContent = "0%";
        progressContainer?.setAttribute("aria-valuenow", "0");
        return;
    }

    const studyItems = routine.items.filter(item => item.type !== "break" && item.taskId !== null);
    if (!studyItems.length) {
        if (progressBar) progressBar.style.width = "0%";
        if (progressText) progressText.textContent = "0%";
        progressContainer?.setAttribute("aria-valuenow", "0");
        return;
    }

    const completedCount = studyItems.filter(item => {
        const session = plannerSessions.find(s => s.id === item.id);
        return (session?.status || item.status) === "Completed";
    }).length;

    const percentage = Math.round((completedCount / studyItems.length) * 100);

    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}%`;
    progressContainer?.setAttribute("aria-valuenow", String(percentage));
}


// =========================================================
// PLANNED STUDY TIME
// =========================================================

function getPlannedStudyTime(tasks, today) {
    return getPlannerSessions()
        .filter(session => session.date === today)
        .reduce((total, task) => {
            return total + Number(task.durationMinutes || 0);
        }, 0);
}


// =========================================================
// CUSTOM STUDY TIME DROPDOWNS
// =========================================================

function initializeStudyTimeDropdowns() {
    const dropdowns = document.querySelectorAll(".study-time-select");

    if (!dropdowns.length) {
        return;
    }

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector(".study-time-select-trigger");
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const valueElement = dropdown.querySelector(".study-time-select-value");
        const menu = dropdown.querySelector(".study-time-select-menu");

        if (!trigger || !hiddenInput || !valueElement || !menu) {
            return;
        }

        const times = [];

        for (let hour = 0; hour < 24; hour += 1) {
            for (let minute = 0; minute < 60; minute += 30) {
                times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
            }
        }

        menu.innerHTML = times.map(time => {
            const selected = time === hiddenInput.value;
            const label = formatStudyTime(time);

            return `
                <button
                    type="button"
                    class="study-time-option ${selected ? "is-selected" : ""}"
                    data-time="${time}"
                    role="option"
                    aria-selected="${selected}"
                >
                    <span>${label}</span>
                    <span class="study-time-option-check">${selected ? "✓" : ""}</span>
                </button>
            `;
        }).join("");

        valueElement.textContent = formatStudyTime(hiddenInput.value);

        trigger.addEventListener("click", event => {
            event.stopPropagation();
            closeAllStudyTimeDropdowns(dropdown);

            if (dropdown.classList.contains("is-open")) {
                closeStudyTimeDropdown(dropdown);
            } else {
                openStudyTimeDropdown(dropdown);
            }
        });

        menu.addEventListener("click", event => {
            const option = event.target.closest(".study-time-option");

            if (!option) {
                return;
            }

            const time = option.dataset.time;
            hiddenInput.value = time;
            valueElement.textContent = formatStudyTime(time);

            menu.querySelectorAll(".study-time-option").forEach(item => {
                const selected = item.dataset.time === time;
                item.classList.toggle("is-selected", selected);
                item.setAttribute("aria-selected", String(selected));

                const check = item.querySelector(".study-time-option-check");
                if (check) {
                    check.textContent = selected ? "✓" : "";
                }
            });

            closeStudyTimeDropdown(dropdown);
            validateStudyPlanAvailability({ showError: false });
        });
    });

    document.addEventListener("click", () => {
        closeAllStudyTimeDropdowns();
    });
}

function openStudyTimeDropdown(dropdown) {
    const trigger = dropdown.querySelector(".study-time-select-trigger");
    const menu = dropdown.querySelector(".study-time-select-menu");

    dropdown.classList.add("is-open");
    trigger?.setAttribute("aria-expanded", "true");

    if (menu) {
        menu.hidden = false;
    }
}

function closeStudyTimeDropdown(dropdown) {
    const trigger = dropdown.querySelector(".study-time-select-trigger");
    const menu = dropdown.querySelector(".study-time-select-menu");

    dropdown.classList.remove("is-open");
    trigger?.setAttribute("aria-expanded", "false");

    if (menu) {
        menu.hidden = true;
    }
}

function closeAllStudyTimeDropdowns(except = null) {
    document.querySelectorAll(".study-time-select.is-open").forEach(dropdown => {
        if (dropdown !== except) {
            closeStudyTimeDropdown(dropdown);
        }
    });
}

function formatStudyTime(time) {
    const [hourString, minute] = time.split(":");
    const hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${minute} ${period}`;
}


// =========================================================
// PLAN MODAL
// =========================================================

function initializePlanModal() {
    const openButtons = [
        document.getElementById("study-plan-button"),
        document.getElementById("study-empty-plan-button")
    ].filter(Boolean);

    const modal =
        document.getElementById("study-plan-modal");

    const closeButton =
        document.getElementById("study-plan-close");

    const cancelButton =
        document.getElementById("study-plan-cancel");

    const form =
        document.getElementById("study-plan-form");

    if (!modal) {
        return;
    }

    openButtons.forEach(button => {
        button.addEventListener("click", () => {
            openPlanModal();
        });
    });

    closeButton?.addEventListener("click", closePlanModal);

    cancelButton?.addEventListener("click", closePlanModal);

    modal
        .querySelectorAll("[data-close-study-modal]")
        .forEach(element => {
            element.addEventListener(
                "click",
                closePlanModal
            );
        });

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            modal.classList.contains("is-open")
        ) {
            closePlanModal();
        }
    });

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const availability = validateStudyPlanAvailability();

        if (!availability) {
            return;
        }

        const routine = generateTodayRoutine(availability);

        closePlanModal();
        console.log("Generated routine:", routine);
        renderStudyPage();
    });
}


// =========================================================
// ROUTINE GENERATOR
// =========================================================

function generateTodayRoutine(availability) {
    const today = getLocalDateString();
    const priorityOrder = { High: 0, Normal: 1, Low: 2 };
    const sessionLength = document.getElementById("study-plan-session-length")?.value || "flexible";
    const breakLength = Number(document.getElementById("study-plan-break")?.value || 10);
    const availableTasks = getTasks()
        .filter(task => task.completed !== true && task.dueDate && task.dueDate >= today)
        .sort((a, b) => {
            const priorityDifference = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
            return priorityDifference || a.dueDate.localeCompare(b.dueDate);
        });

    let nextStartMinutes = availability.startMinutes;
    const items = [];

    availableTasks.forEach((task, index) => {
        const durationMinutes = sessionLength === "flexible"
            ? Number(task.estimatedMinutes || 25)
            : Number(sessionLength);

        if (nextStartMinutes + durationMinutes > availability.endMinutes) {
            return;
        }

        const startHour = Math.floor(nextStartMinutes / 60);
        const startMinute = nextStartMinutes % 60;

        items.push({
            id: crypto.randomUUID(),
            taskId: task.id,
            type: "study",
            startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
            title: task.name || task.title || "Study session",
            subject: task.subject || "",
            durationMinutes,
            status: "Planned"
        });

        nextStartMinutes += durationMinutes;

        // Insert break session in between study sessions if user selected a break > 0 and time permits
        if (breakLength > 0 && index < availableTasks.length - 1 && nextStartMinutes + breakLength <= availability.endMinutes) {
            const breakHour = Math.floor(nextStartMinutes / 60);
            const breakMinute = nextStartMinutes % 60;

            items.push({
                id: crypto.randomUUID(),
                taskId: null,
                type: "break",
                startTime: `${String(breakHour).padStart(2, "0")}:${String(breakMinute).padStart(2, "0")}`,
                title: "Rest & Recharge Break",
                subject: "Rest Break",
                durationMinutes: breakLength,
                status: "Planned"
            });

            nextStartMinutes += breakLength;
        }
    });

    const routine = saveStudyRoutine({
        id: crypto.randomUUID(),
        date: today,
        generatedAt: new Date().toISOString(),
        availableFrom: availability.start,
        availableUntil: availability.end,
        items
    });

    const remainingPlannerSessions = getPlannerSessions().filter(
        session => session.date !== today || session.source !== "study-routine"
    );

    const plannerSessions = items.map(item => {
        const startMinutes = timeToMinutes(item.startTime);

        return {
            id: item.id,
            date: today,
            startTime: item.startTime,
            endTime: minutesToTime(
                startMinutes + Number(item.durationMinutes || 0)
            ),
            taskId: item.taskId,
            title: item.title,
            subject: item.subject,
            durationMinutes: item.durationMinutes,
            status: "Planned",
            source: "study-routine"
        };
    });

    savePlannerSessions([
        ...remainingPlannerSessions,
        ...plannerSessions
    ]);

    document.dispatchEvent(new Event("planner:changed"));

    return routine;
}

function validateStudyPlanAvailability({ showError = true } = {}) {
    const startInput = document.getElementById("study-plan-start");
    const endInput = document.getElementById("study-plan-end");

    if (!startInput || !endInput) {
        return null;
    }

    const startMinutes = timeToMinutes(startInput.value);
    const endMinutes = timeToMinutes(endInput.value);
    const isValid = Number.isFinite(startMinutes) &&
        Number.isFinite(endMinutes) &&
        endMinutes > startMinutes;

    setStudyPlanTimeError(
        isValid
            ? ""
            : "Available until must be later than Available from."
    );

    if (!isValid && !showError) {
        setStudyPlanTimeError("");
    }

    return isValid
        ? {
            start: startInput.value,
            end: endInput.value,
            startMinutes,
            endMinutes
        }
        : null;
}

function setStudyPlanTimeError(message) {
    const errorElement = document.getElementById("study-plan-time-error");
    const dropdowns = document.querySelectorAll(".study-time-select");

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = !message;
    }

    dropdowns.forEach(dropdown => {
        dropdown.classList.toggle("has-error", Boolean(message));
    });
}

function timeToMinutes(time) {
    const [hour, minute] = String(time).split(":").map(Number);

    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
        return NaN;
    }

    return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


function openPlanModal() {
    const modal =
        document.getElementById("study-plan-modal");

    if (!modal) {
        return;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    setTimeout(() => {
        document
            .getElementById("study-plan-start-trigger")
            ?.focus();
    }, 100);
}


function closePlanModal() {
    const modal =
        document.getElementById("study-plan-modal");

    if (!modal) {
        return;
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
}


// =========================================================
// STUDY BUTTONS
// =========================================================

function initializeStudyButtons() {
    document
        .getElementById("study-start-button")
        ?.addEventListener("click", startStudySession);

    document
        .getElementById("study-pause-button")
        ?.addEventListener("click", togglePauseSession);

    document
        .getElementById("study-finish-button")
        ?.addEventListener("click", finishStudySession);
}

function initializeAmbientAudioControls() {
    const buttons = document.querySelectorAll(".ambient-btn");
    const volumeInput = document.getElementById("ambient-vol-range");
    const volumeVal = document.getElementById("ambient-vol-val");

    const updateSliderFill = (val) => {
        const pct = Math.round(parseFloat(val) * 100);
        if (volumeInput) {
            volumeInput.style.setProperty("--vol-percent", `${pct}%`);
        }
        if (volumeVal) {
            volumeVal.textContent = `${pct}%`;
        }
    };

    if (volumeInput) {
        updateSliderFill(volumeInput.value);
        volumeInput.addEventListener("input", (e) => {
            const val = e.target.value;
            setAmbientVolume(val);
            updateSliderFill(val);
        });
    }

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");

            const sound = btn.dataset.sound;
            if (sound === "off") {
                stopAmbientSound();
                showToast({ message: "Ambient sound off", type: "info" });
            } else {
                playAmbientSound(sound);
                showToast({ message: `Playing ${sound} ambience 🎧`, type: "success" });
            }
        });
    });
}

function initializeQuickNotes() {
    const notesInput = document.getElementById("study-notes-input");
    const clearBtn = document.getElementById("study-notes-clear");
    const copyBtn = document.getElementById("study-notes-copy");
    const convertBtn = document.getElementById("study-notes-convert");
    const statusSpan = document.getElementById("study-notes-status");

    if (!notesInput) return;

    // Load saved notes
    const savedNotes = localStorage.getItem("studyflow_quick_notes") || "";
    notesInput.value = savedNotes;

    // Auto-save on input
    let saveTimeout;
    notesInput.addEventListener("input", (e) => {
        if (statusSpan) statusSpan.textContent = "Saving...";
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem("studyflow_quick_notes", e.target.value);
            if (statusSpan) statusSpan.textContent = "Auto-saved";
        }, 300);
    });

    // Copy to clipboard
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            if (!notesInput.value.trim()) {
                showToast({ message: "Nothing to copy", type: "info" });
                return;
            }
            navigator.clipboard.writeText(notesInput.value).then(() => {
                showToast({ message: "Notes copied to clipboard! 📋", type: "success" });
            }).catch(() => {
                showToast({ message: "Failed to copy notes", type: "error" });
            });
        });
    }

    // Clear notes
    if (clearBtn) {
        clearBtn.addEventListener("click", async () => {
            if (!notesInput.value.trim()) return;
            const confirmed = await showConfirm({
                title: "Clear Scratchpad",
                message: "Are you sure you want to clear your scratchpad notes? This action cannot be undone.",
                confirmText: "Clear Notes",
                confirmButtonClass: "button-danger",
                icon: "trash-2"
            });
            if (!confirmed) return;
            notesInput.value = "";
            localStorage.removeItem("studyflow_quick_notes");
            if (statusSpan) statusSpan.textContent = "Cleared";
            showToast({ message: "Notes cleared", type: "info" });
        });
    }

    // Convert note to task
    if (convertBtn) {
        convertBtn.addEventListener("click", () => {
            const text = notesInput.value.trim();
            if (!text) {
                showToast({ message: "Write a note first to add as a task", type: "info" });
                return;
            }
            const firstLine = text.split("\n")[0];
            const title = firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine;
            
            addTask({
                id: crypto.randomUUID(),
                title: title,
                details: text,
                subject: "General",
                dueDate: getLocalDateString(),
                estimatedTime: 30,
                priority: "medium",
                completed: false,
                createdAt: new Date().toISOString()
            });

            document.dispatchEvent(new CustomEvent("tasks:changed"));
            showToast({ message: "Note added to tasks! 🎯", type: "success" });
        });
    }
}

function startStudySession() {
    const taskSelect = document.getElementById("study-task-select");
    const sessionTypeSelect = document.getElementById("study-session-type");

    if (!taskSelect?.value) {
        taskSelect?.focus();
        return;
    }

    const plannedSession = getPlannerSessions().find(session => {
        return (
            session.taskId === taskSelect.value &&
            session.date === getLocalDateString() &&
            session.status !== "Completed"
        );
    });

    const duration = plannedSession
        ? Number(plannedSession.durationMinutes)
        : getSelectedDuration();

    if (!duration) {
        document.getElementById("study-custom-duration-input")?.focus();
        return;
    }

    const task = getTasks().find(item => item.id === taskSelect.value);

    if (!task) {
        return;
    }

    const taskTitle = task.name || task.title || "Study Session";
    activeSession = {
        taskId: task.id,
        taskName: taskTitle,
        subject: task.subject || "",
        durationMinutes: duration,
        sessionType: sessionTypeSelect?.value || "focus",
        startedAt: new Date().toISOString(),
        lastResumedAt: new Date().toISOString(),
        elapsedSeconds: 0,
        pausedAt: null,
        isPaused: false
    };

    updatePlannerSessionStatus(
        task.id,
        getLocalDateString(),
        "In progress"
    );

    remainingSeconds = duration * 60;
    showActiveSession();
    startTimer();
    showToast({
        message: `Started ${duration}m session for "${taskTitle}" ⏱️`,
        type: "success"
    });
}

function showActiveSession() {
    const startSection = document.getElementById("study-session-start");
    const activeSection = document.getElementById("study-session-active");
    const sessionCard = document.querySelector(".study-session-card");
    const subjectElement = document.getElementById("study-active-subject");
    const taskElement = document.getElementById("study-active-task");
    const startedElement = document.getElementById("study-session-started");
    const statusElement = document.getElementById("study-session-status");

    if (!activeSession) {
        return;
    }

    startSection?.setAttribute("hidden", "");
    activeSection?.removeAttribute("hidden");
    sessionCard?.classList.add("is-active");

    if (subjectElement) subjectElement.textContent = activeSession.subject;
    if (taskElement) taskElement.textContent = activeSession.taskName;

    if (startedElement) {
        const startedTime = new Date(activeSession.startedAt);
        startedElement.textContent = `Started at ${startedTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    }

    if (statusElement) statusElement.textContent = "Study session in progress.";

    updateTimerDisplay();
    refreshIcons();
}

function startTimer() {
    stopTimer();

    timerInterval = setInterval(() => {
        if (!activeSession || activeSession.isPaused) {
            return;
        }

        const elapsedSinceResume =
            (Date.now() - new Date(activeSession.lastResumedAt).getTime()) / 1000;

        const elapsedSeconds =
            activeSession.elapsedSeconds + elapsedSinceResume;

        remainingSeconds = Math.max(
            0,
            activeSession.durationMinutes * 60 - Math.floor(elapsedSeconds)
        );

        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            updateTimerDisplay();
            finishStudySession(true);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById("study-timer");

    if (!timerElement) {
        return;
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function togglePauseSession() {
    if (!activeSession) {
        return;
    }

    const pauseButton = document.getElementById("study-pause-button");
    activeSession.isPaused = !activeSession.isPaused;

    if (activeSession.isPaused) {
        activeSession.pausedAt = new Date().toISOString();
        activeSession.elapsedSeconds +=
            (Date.now() - new Date(activeSession.lastResumedAt).getTime()) / 1000;
        stopTimer();

        if (pauseButton) {
            pauseButton.innerHTML = '<i data-lucide="play"></i><span>Resume</span>';
        }
    } else {
        activeSession.pausedAt = null;
        activeSession.lastResumedAt = new Date().toISOString();
        startTimer();

        if (pauseButton) {
            pauseButton.innerHTML = '<i data-lucide="pause"></i><span>Pause</span>';
        }
    }

    refreshIcons();
}

function finishStudySession(timerCompleted = false) {
    if (!activeSession) {
        return;
    }

    stopTimer();

    const totalSeconds = activeSession.durationMinutes * 60;
    const studiedSeconds = Math.min(
        totalSeconds,
        totalSeconds - remainingSeconds
    );
    const studiedMinutes = Math.max(1, Math.round(studiedSeconds / 60));
    const now = new Date();

    const session = {
        id: crypto.randomUUID(),
        taskId: activeSession.taskId,
        title: activeSession.taskName,
        date: getLocalDateString(now),
        startTime: new Date(activeSession.startedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        durationMinutes: studiedMinutes,
        sessionType: activeSession.sessionType,
        status: "Completed",
        completed: true,
        createdAt: now.toISOString()
    };

    addStudySession(session);
    updatePlannerSessionStatus(
        activeSession.taskId,
        getLocalDateString(now),
        "Completed"
    );

    showToast({
        message: `Great job! Logged ${studiedMinutes} min study session 🎉`,
        type: "success"
    });

    if (timerCompleted) {
        console.log("Timer completed automatically.");
    }

    activeSession = null;
    remainingSeconds = 0;
    showStartSession();
    renderStudyPage();
}

function updatePlannerSessionStatus(taskId, date, status) {
    const sessions = getPlannerSessions();
    let changed = false;

    const updatedSessions = sessions.map(session => {
        if (session.taskId !== taskId || session.date !== date) {
            return session;
        }

        changed = true;

        return {
            ...session,
            status
        };
    });

    if (changed) {
        savePlannerSessions(updatedSessions);
        document.dispatchEvent(new Event("planner:changed"));
    }
}

function showStartSession() {
    const startSection = document.getElementById("study-session-start");
    const activeSection = document.getElementById("study-session-active");
    const sessionCard = document.querySelector(".study-session-card");
    const statusElement = document.getElementById("study-session-status");
    const pauseButton = document.getElementById("study-pause-button");

    activeSection?.setAttribute("hidden", "");
    startSection?.removeAttribute("hidden");
    sessionCard?.classList.remove("is-active");

    if (statusElement) {
        statusElement.textContent = "No study session is currently running.";
    }

    if (pauseButton) {
        pauseButton.innerHTML = '<i data-lucide="pause"></i><span>Pause</span>';
    }

    refreshIcons();
}


// =========================================================
// SORTING
// =========================================================

function sortTasksByDueDate(a, b) {

    if (!a.dueDate && !b.dueDate) {
        return 0;
    }

    if (!a.dueDate) {
        return 1;
    }

    if (!b.dueDate) {
        return -1;
    }

    if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
    }

    return (
        Number(b.priority === "High") -
        Number(a.priority === "High")
    );
}


// =========================================================
// DATE HELPERS
// =========================================================

function getLocalDateString(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDueDate(dateString) {

    if (!dateString) {
        return "No due date";
    }

    const today = getLocalDateString();

    if (dateString === today) {
        return "Today";
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === getLocalDateString(tomorrow)) {
        return "Tomorrow";
    }

    const date = new Date(
        `${dateString}T00:00:00`
    );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}


function getSessionSortTime(session) {

    return (
        session.startTime ||
        session.createdAt ||
        ""
    );
}


// =========================================================
// FORMATTING
// =========================================================

function formatDuration(minutes) {

    const totalMinutes =
        Number(minutes || 0);

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours =
        Math.floor(totalMinutes / 60);

    const remainingMinutes =
        totalMinutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}


function formatSessionType(type) {

    const types = {
        focus: "Focus session",
        homework: "Homework",
        revision: "Revision",
        practice: "Practice"
    };

    return types[type] || "";
}


// =========================================================
// DOM HELPERS
// =========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function refreshIcons() {

    if (
        typeof lucide !== "undefined" &&
        typeof lucide.createIcons === "function"
    ) {
        lucide.createIcons();
    }
}


// =========================================================
// SECURITY / HTML HELPERS
// =========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
    return escapeHTML(value);
}