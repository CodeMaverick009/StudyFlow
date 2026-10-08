// =========================================================
// STUDYFLOW — BACKUP & RESTORE MANAGER
// =========================================================

import { getBackupData, importBackupData } from "./storage.js";
import { showToast } from "./components/toast.js";

function escapeHtml(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Downloads a complete JSON snapshot of the user's StudyFlow data.
 */
export function exportBackupData() {
    try {
        const data = getBackupData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().split("T")[0];

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `studyflow-backup-${dateStr}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
        showToast({ message: "Backup downloaded successfully!", type: "success" });
    } catch (error) {
        console.error("Backup export failed:", error);
        showToast({ message: "Failed to export backup file.", type: "error" });
    }
}

/**
 * Validates and analyzes a JSON backup string.
 * @param {string} text
 * @returns {Object} Validation result and detected item summary
 */
export function parseAndValidateBackup(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        return {
            isValid: false,
            error: "The selected file is not a valid JSON document."
        };
    }

    if (!parsed || (typeof parsed !== "object")) {
        return {
            isValid: false,
            error: "The backup file does not contain a valid JSON object or list."
        };
    }

    // Support standalone task array backups
    if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            return {
                isValid: false,
                error: "The task list in this JSON file is empty."
            };
        }
        return {
            isValid: true,
            data: { tasks: parsed },
            summary: {
                tasks: parsed.length,
                planner: 0,
                sessions: 0,
                hasRoutine: false,
                hasNotes: false,
                totalItems: parsed.length
            }
        };
    }

    // Full backup object
    const tasksCount = Array.isArray(parsed.tasks) ? parsed.tasks.length : 0;
    const plannerCount = Array.isArray(parsed.planner) ? parsed.planner.length : 0;
    const sessionsCount = Array.isArray(parsed.sessions) ? parsed.sessions.length : 0;
    const hasRoutine = !!parsed.routine && typeof parsed.routine === "object";
    const hasNotes = typeof parsed.quickNotes === "string" && parsed.quickNotes.trim().length > 0;
    const totalItems = tasksCount + plannerCount + sessionsCount + (hasRoutine ? 1 : 0) + (hasNotes ? 1 : 0);

    if (totalItems === 0) {
        return {
            isValid: false,
            error: "No StudyFlow tasks, planner entries, or study data found in this backup file."
        };
    }

    return {
        isValid: true,
        data: parsed,
        summary: {
            tasks: tasksCount,
            planner: plannerCount,
            sessions: sessionsCount,
            hasRoutine,
            hasNotes,
            totalItems
        }
    };
}

/**
 * Shows an in-app confirmation modal presenting the backup file summary and
 * allowing the user to choose between 'replace', 'merge', or cancelling.
 * @param {Object} summary
 * @returns {Promise<'replace'|'merge'|null>}
 */
export function showImportConfirmModal(summary) {
    return new Promise((resolve) => {
        const existing = document.getElementById("import-confirm-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "import-confirm-modal";
        modal.className = "modal";
        modal.setAttribute("aria-hidden", "false");

        const routineBadge = summary.hasRoutine ? '<span class="status-pill status-pill-active">Included</span>' : '<span style="color: var(--text-tertiary);">None</span>';
        const notesBadge = summary.hasNotes ? '<span class="status-pill status-pill-active">Included</span>' : '<span style="color: var(--text-tertiary);">None</span>';

        modal.innerHTML = `
            <div class="modal-backdrop" data-action="cancel"></div>
            <section class="modal-dialog" role="dialog" aria-modal="true" style="max-width: 500px;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius-md); background: rgba(184, 107, 75, 0.12); color: var(--primary); flex-shrink: 0;">
                            <i data-lucide="upload" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <h2>Import Study Data</h2>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Review contents from your backup file</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" data-action="cancel" aria-label="Close modal">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="modal-body" style="padding-top: 10px; padding-bottom: 20px;">
                    <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 16px;">
                        The selected backup file contains the following items:
                    </p>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
                        <div style="background: var(--bg-surface-secondary, rgba(0,0,0,0.03)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px;">
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); display: block; font-weight: 600;">Tasks</span>
                            <strong style="font-size: 1.4rem; color: var(--text-primary);">${summary.tasks}</strong>
                        </div>
                        <div style="background: var(--bg-surface-secondary, rgba(0,0,0,0.03)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px;">
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); display: block; font-weight: 600;">Planner Entries</span>
                            <strong style="font-size: 1.4rem; color: var(--text-primary);">${summary.planner}</strong>
                        </div>
                        <div style="background: var(--bg-surface-secondary, rgba(0,0,0,0.03)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px;">
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); display: block; font-weight: 600;">Study Sessions</span>
                            <strong style="font-size: 1.4rem; color: var(--text-primary);">${summary.sessions}</strong>
                        </div>
                        <div style="background: var(--bg-surface-secondary, rgba(0,0,0,0.03)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); display: block; font-weight: 600;">Routine & Notes</span>
                            <div style="font-size: 0.85rem; color: var(--text-primary); margin-top: 4px;">
                                Routine: ${routineBadge}<br/>
                                Notes: ${notesBadge}
                            </div>
                        </div>
                    </div>

                    <div style="background: rgba(184, 107, 75, 0.06); border: 1px solid rgba(184, 107, 75, 0.2); border-radius: var(--radius-md); padding: 12px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.45;">
                        <strong style="color: var(--text-primary); display: block; margin-bottom: 2px;">How would you like to import?</strong>
                        • <strong>Replace All:</strong> Completely restores the backup, replacing current local data.<br/>
                        • <strong>Merge:</strong> Keeps your existing items and adds new items from the backup.
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
                    <button type="button" class="button button-secondary button-sm" data-action="cancel">
                        Cancel
                    </button>
                    <button type="button" class="button button-secondary button-sm" data-action="merge" title="Add items without deleting existing data">
                        <i data-lucide="plus"></i> Merge with Existing
                    </button>
                    <button type="button" class="button button-primary button-sm" data-action="replace" title="Overwrite current data with backup">
                        <i data-lucide="check"></i> Replace All Data
                    </button>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        document.body.classList.add("modal-open");

        if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
            lucide.createIcons({ scope: modal });
        }

        requestAnimationFrame(() => {
            modal.classList.add("is-open");
        });

        const cleanup = (choice) => {
            modal.classList.remove("is-open");
            document.body.classList.remove("modal-open");
            document.removeEventListener("keydown", handleKeyDown);
            setTimeout(() => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            }, 200);
            resolve(choice);
        };

        const handleKeyDown = (e) => {
            if (e.key === "Escape") cleanup(null);
        };

        document.addEventListener("keydown", handleKeyDown);

        modal.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;
            const action = btn.dataset.action;
            if (action === "replace") cleanup("replace");
            else if (action === "merge") cleanup("merge");
            else cleanup(null);
        });
    });
}

/**
 * Reads and processes a selected JSON backup file.
 * @param {File} file
 * @param {HTMLInputElement} [fileInput=null]
 */
export async function handleBackupFileSelect(file, fileInput = null) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json") && file.type && !file.type.includes("json")) {
        showToast({ message: "Please select a valid .json backup file.", type: "error" });
        if (fileInput) fileInput.value = "";
        return;
    }

    try {
        const text = await file.text();
        const validation = parseAndValidateBackup(text);

        if (!validation.isValid) {
            showToast({ message: validation.error, type: "error" });
            if (fileInput) fileInput.value = "";
            return;
        }

        const choice = await showImportConfirmModal(validation.summary);

        if (!choice) {
            showToast({ message: "Import cancelled.", type: "info" });
            if (fileInput) fileInput.value = "";
            return;
        }

        const result = importBackupData(validation.data, { mode: choice });

        const detailMsg = choice === "merge"
            ? `Merged backup data (${result.tasksRestored} tasks, ${result.plannerRestored} planner entries)! Reloading...`
            : `Restored ${result.tasksRestored} tasks, ${result.plannerRestored} planner entries! Reloading...`;

        showToast({ message: detailMsg, type: "success" });

        if (fileInput) fileInput.value = "";

        setTimeout(() => {
            window.location.reload();
        }, 1200);
    } catch (error) {
        console.error("Error reading backup file:", error);
        showToast({ message: "Failed to read backup file.", type: "error" });
        if (fileInput) fileInput.value = "";
    }
}

/**
 * Triggers a file picker to import backup data from anywhere in the application.
 */
export function triggerImportDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleBackupFileSelect(file, input);
        }
        input.remove();
    });

    input.click();
}
