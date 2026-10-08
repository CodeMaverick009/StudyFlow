// =========================================================
// STUDYFLOW — STORAGE
// =========================================================

import { validateEmail } from "./validation.js";

const TASKS_KEY = "studyflow-tasks";
const SESSIONS_KEY = "studyflow-sessions";
const ROUTINE_KEY = "studyflow-routine";
const PLANNER_KEY = "studyflow-planner";
const ACCOUNTS_KEY = "studyflow-accounts";
const SESSION_KEY = "studyflow-session";


// =========================================================
// ACCOUNTS
//
// NOTE: Studyflow has no backend — everything lives in this
// browser's localStorage. Passwords are hashed (SHA-256 +
// a per-account salt) before storing so they aren't sitting
// around in plain text, but this is NOT real server-side
// authentication. Clearing browser data removes the account,
// and it won't be reachable from any other device or browser.
// =========================================================

export function getAccounts() {
    const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);

    if (!storedAccounts) {
        return [];
    }

    try {
        return JSON.parse(storedAccounts);
    } catch (error) {
        console.error("Could not load accounts:", error);
        return [];
    }
}


function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}


function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}


function bytesToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


function generateSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(bytes.buffer);
}


async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(digest);
}


export async function createAccount({ name, email, password }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
    }
    const normalizedEmail = emailValidation.normalizedEmail;
    const accounts = getAccounts();

    if (accounts.some(account => account.email === normalizedEmail)) {
        throw new Error("An account with this email already exists.");
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const account = {
        id: crypto.randomUUID(),
        name: String(name || "").trim(),
        email: normalizedEmail,
        salt,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    accounts.push(account);
    saveAccounts(accounts);
    setSession(account.id);

    return toPublicAccount(account);
}


export async function signIn({ email, password }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
    }
    const normalizedEmail = emailValidation.normalizedEmail;
    const account = getAccounts().find(item => item.email === normalizedEmail);

    if (!account) {
        throw new Error("Incorrect email or password.");
    }

    const passwordHash = await hashPassword(password, account.salt);

    if (passwordHash !== account.passwordHash) {
        throw new Error("Incorrect email or password.");
    }

    setSession(account.id);

    return toPublicAccount(account);
}


export function updateProfile({ name, email }) {
    const accountId = getSession();
    if (!accountId) {
        throw new Error("No active session found.");
    }

    const accounts = getAccounts();
    const accountIndex = accounts.findIndex(item => item.id === accountId);
    if (accountIndex === -1) {
        throw new Error("Account not found.");
    }

    const cleanName = String(name || "").trim();
    if (!cleanName) {
        throw new Error("Please enter a valid display name.");
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
    }
    const normalizedEmail = emailValidation.normalizedEmail;

    const existing = accounts.find(item => item.email === normalizedEmail && item.id !== accountId);
    if (existing) {
        throw new Error("An account with this email already exists.");
    }

    accounts[accountIndex].name = cleanName;
    accounts[accountIndex].email = normalizedEmail;

    saveAccounts(accounts);
    return toPublicAccount(accounts[accountIndex]);
}


export async function changePassword({ currentPassword, newPassword }) {
    const accountId = getSession();
    if (!accountId) {
        throw new Error("No active session found.");
    }

    if (!currentPassword) {
        throw new Error("Please enter your current password.");
    }

    if (!newPassword || newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long.");
    }

    if (currentPassword === newPassword) {
        throw new Error("New password must be different from current password.");
    }

    const accounts = getAccounts();
    const accountIndex = accounts.findIndex(item => item.id === accountId);
    if (accountIndex === -1) {
        throw new Error("Account not found.");
    }

    const account = accounts[accountIndex];
    const currentHash = await hashPassword(currentPassword, account.salt);

    if (currentHash !== account.passwordHash) {
        throw new Error("Incorrect current password.");
    }

    const newSalt = generateSalt();
    const newPasswordHash = await hashPassword(newPassword, newSalt);

    accounts[accountIndex] = {
        ...account,
        salt: newSalt,
        passwordHash: newPasswordHash
    };

    saveAccounts(accounts);
    return true;
}


function toPublicAccount(account) {
    if (!account) {
        return null;
    }

    const { salt, passwordHash, ...publicAccount } = account;
    return publicAccount;
}


export function setSession(accountId) {
    localStorage.setItem(SESSION_KEY, accountId);
}


export function getSession() {
    return localStorage.getItem(SESSION_KEY);
}


export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}


export function getCurrentAccount() {
    const accountId = getSession();

    if (!accountId) {
        return null;
    }

    const account = getAccounts().find(item => item.id === accountId);

    return toPublicAccount(account) || null;
}


// =========================================================
// TASKS
// =========================================================

export function getTasks() {
    const storedTasks = localStorage.getItem(TASKS_KEY);

    if (!storedTasks) {
        return [];
    }

    try {
        return JSON.parse(storedTasks);
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}


export function saveTasks(tasks) {
    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}


export function addTask(task) {
    const tasks = getTasks();

    tasks.push(task);

    saveTasks(tasks);

    return task;
}


export function getTaskById(id) {
    const tasks = getTasks();

    return tasks.find(task => task.id === id) || null;
}


export function updateTask(id, updates) {
    const tasks = getTasks();

    const updatedTasks = tasks.map(task => {
        if (task.id !== id) {
            return task;
        }

        return {
            ...task,
            ...updates
        };
    });

    saveTasks(updatedTasks);

    return getTaskById(id);
}


export function deleteTask(id) {
    const tasks = getTasks();

    const remainingTasks = tasks.filter(
        task => task.id !== id
    );

    saveTasks(remainingTasks);
}


// =========================================================
// STUDY SESSIONS
// =========================================================

export function getStudySessions() {
    const storedSessions = localStorage.getItem(SESSIONS_KEY);

    if (!storedSessions) {
        return [];
    }

    try {
        return JSON.parse(storedSessions);
    } catch (error) {
        console.error("Could not load study sessions:", error);
        return [];
    }
}


export function saveStudySessions(sessions) {
    localStorage.setItem(
        SESSIONS_KEY,
        JSON.stringify(sessions)
    );
}


export function addStudySession(session) {
    const sessions = getStudySessions();

    sessions.push(session);

    saveStudySessions(sessions);

    return session;
}   


// =========================================================
// STUDY ROUTINE STORAGE
// =========================================================

export function getStudyRoutine() {
    const storedRoutine = localStorage.getItem(ROUTINE_KEY);

    if (!storedRoutine) {
        return null;
    }

    try {
        return JSON.parse(storedRoutine);
    } catch (error) {
        console.error("Could not load study routine:", error);
        return null;
    }
}


export function saveStudyRoutine(routine) {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
    return routine;
}


export function clearStudyRoutine() {
    localStorage.removeItem(ROUTINE_KEY);
}


// =========================================================
// PLANNER SESSIONS
// =========================================================

export function getPlannerSessions() {
    const storedSessions = localStorage.getItem(PLANNER_KEY);

    if (!storedSessions) {
        return [];
    }

    try {
        return JSON.parse(storedSessions);
    } catch (error) {
        console.error(
            "Could not load planner sessions:",
            error
        );

        return [];
    }
}


export function savePlannerSessions(sessions) {
    localStorage.setItem(
        PLANNER_KEY,
        JSON.stringify(sessions)
    );

    return sessions;
}


export function addPlannerSession(session) {
    const sessions = getPlannerSessions();

    sessions.push(session);

    savePlannerSessions(sessions);

    return session;
}


export function deletePlannerSessionsForDate(date) {
    const sessions = getPlannerSessions();

    const remaining = sessions.filter(
        session => session.date !== date
    );

    savePlannerSessions(remaining);

    return remaining;
}


// =========================================================
// QUICK NOTES & BACKUP RESTORE
// =========================================================

const QUICK_NOTES_KEY = "studyflow_quick_notes";

export function getQuickNotes() {
    return localStorage.getItem(QUICK_NOTES_KEY) || "";
}

export function saveQuickNotes(notes) {
    localStorage.setItem(QUICK_NOTES_KEY, String(notes ?? ""));
}

export function clearQuickNotes() {
    localStorage.removeItem(QUICK_NOTES_KEY);
}

/**
 * Returns a complete snapshot of all StudyFlow user data for backup.
 */
export function getBackupData() {
    return {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        tasks: getTasks(),
        planner: getPlannerSessions(),
        sessions: getStudySessions(),
        routine: getStudyRoutine(),
        quickNotes: getQuickNotes()
    };
}

/**
 * Restores or merges backup data into localStorage.
 * @param {Object|Array} backupData - Full backup object or an array of tasks.
 * @param {Object} [options]
 * @param {'replace'|'merge'} [options.mode='replace']
 * @returns {Object} Result summary
 */
export function importBackupData(backupData, { mode = "replace" } = {}) {
    if (!backupData || (typeof backupData !== "object")) {
        throw new Error("Invalid backup format: expected an object or array.");
    }

    // Support standalone task array backups
    const normalized = Array.isArray(backupData)
        ? { tasks: backupData }
        : backupData;

    const summary = {
        tasksRestored: 0,
        plannerRestored: 0,
        sessionsRestored: 0,
        routineRestored: false,
        notesRestored: false
    };

    if (mode === "replace") {
        if (Array.isArray(normalized.tasks)) {
            saveTasks(normalized.tasks);
            summary.tasksRestored = normalized.tasks.length;
        }

        if (Array.isArray(normalized.planner)) {
            savePlannerSessions(normalized.planner);
            summary.plannerRestored = normalized.planner.length;
        }

        if (Array.isArray(normalized.sessions)) {
            saveStudySessions(normalized.sessions);
            summary.sessionsRestored = normalized.sessions.length;
        }

        if (normalized.routine !== undefined) {
            if (normalized.routine) {
                saveStudyRoutine(normalized.routine);
            } else {
                clearStudyRoutine();
            }
            summary.routineRestored = true;
        }

        if (typeof normalized.quickNotes === "string") {
            saveQuickNotes(normalized.quickNotes);
            summary.notesRestored = true;
        }
    } else if (mode === "merge") {
        // Merge tasks by unique ID
        if (Array.isArray(normalized.tasks)) {
            const currentTasks = getTasks();
            const existingIds = new Set(currentTasks.map(t => String(t.id)));
            const newTasks = normalized.tasks.filter(t => t && t.id && !existingIds.has(String(t.id)));
            saveTasks([...currentTasks, ...newTasks]);
            summary.tasksRestored = newTasks.length;
        }

        // Merge planner sessions by unique ID or date+title
        if (Array.isArray(normalized.planner)) {
            const currentPlanner = getPlannerSessions();
            const existingKeys = new Set(currentPlanner.map(p => p.id || `${p.date}_${p.title}`));
            const newPlanner = normalized.planner.filter(p => p && !existingKeys.has(p.id || `${p.date}_${p.title}`));
            savePlannerSessions([...currentPlanner, ...newPlanner]);
            summary.plannerRestored = newPlanner.length;
        }

        // Merge completed study sessions by unique ID or date+timestamp
        if (Array.isArray(normalized.sessions)) {
            const currentSessions = getStudySessions();
            const existingKeys = new Set(currentSessions.map(s => s.id || `${s.date}_${s.completedAt || s.startTime}`));
            const newSessions = normalized.sessions.filter(s => s && !existingKeys.has(s.id || `${s.date}_${s.completedAt || s.startTime}`));
            saveStudySessions([...currentSessions, ...newSessions]);
            summary.sessionsRestored = newSessions.length;
        }

        // Routine: only adopt if user currently has no routine
        if (normalized.routine && !getStudyRoutine()) {
            saveStudyRoutine(normalized.routine);
            summary.routineRestored = true;
        }

        // Quick notes: append if both exist, otherwise set if none exists
        if (typeof normalized.quickNotes === "string" && normalized.quickNotes.trim()) {
            const currentNotes = getQuickNotes();
            if (!currentNotes.trim()) {
                saveQuickNotes(normalized.quickNotes);
                summary.notesRestored = true;
            } else if (!currentNotes.includes(normalized.quickNotes.trim())) {
                saveQuickNotes(`${currentNotes}\n\n--- Restored Notes ---\n${normalized.quickNotes}`);
                summary.notesRestored = true;
            }
        }
    }

    // Dispatch update events for reactive UI components
    document.dispatchEvent(new CustomEvent("tasks:changed"));
    document.dispatchEvent(new CustomEvent("planner:changed"));

    return summary;
}