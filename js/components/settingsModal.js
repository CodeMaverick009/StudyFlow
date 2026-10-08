// =========================================================
// STUDYFLOW — SETTINGS MODAL COMPONENT
// =========================================================

import { getSavedTheme, applyTheme } from "../theme.js";
import { getCurrentAccount, updateProfile, changePassword } from "../storage.js";
import { validateEmail, attachEmailInputValidation } from "../validation.js";
import { showToast } from "./toast.js";
import { showConfirm } from "./confirmModal.js";
import { exportBackupData, handleBackupFileSelect } from "../backup.js";

const ACCENT_COLOR_KEY = "studyflow_accent_color";
const TIMER_PREF_KEY = "studyflow_timer_pref";
const CHIME_PREF_KEY = "studyflow_chime_pref";

const ACCENT_COLORS = [
    { id: "terracotta", name: "Warm Terracotta", value: "#B86B4B" },
    { id: "olive", name: "Sage Olive", value: "#727966" },
    { id: "amber", name: "Vintage Amber", value: "#C58B42" },
    { id: "slate", name: "Slate Dusk", value: "#4A6B82" },
    { id: "rosewood", name: "Rosewood Plum", value: "#8C5A69" },
    { id: "taupe", name: "Bronze Taupe", value: "#8C7A6B" }
];

export function applyAccentColor(colorValue = null) {
    const savedColor = colorValue || localStorage.getItem(ACCENT_COLOR_KEY);
    if (savedColor) {
        document.documentElement.style.setProperty("--accent-primary", savedColor);
        document.documentElement.style.setProperty("--brand-olive", savedColor);
    }
}

export function initializeSettingsModal() {
    applyAccentColor();
    ensureModalDOM();

    // Global listener for opening settings modal
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("#sidebar-settings, [data-open-settings], .sidebar-action[aria-label='Settings']");
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        }
    });
}

function ensureModalDOM() {
    if (document.getElementById("settings-modal")) return;

    const account = getCurrentAccount();
    const currentTheme = getSavedTheme();
    const activeColor = localStorage.getItem(ACCENT_COLOR_KEY) || "#727966";
    const defaultTimer = localStorage.getItem(TIMER_PREF_KEY) || "25";
    const chimeEnabled = localStorage.getItem(CHIME_PREF_KEY) !== "false";

    const modalHTML = `
    <div id="settings-modal" class="modal" aria-hidden="true">
        <div class="modal-backdrop" data-close-settings></div>
        <section class="modal-dialog settings-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div class="modal-header">
                <div>
                    <p class="card-eyebrow">Preferences</p>
                    <h2 id="settings-modal-title">Settings</h2>
                </div>
                <button type="button" class="modal-close" id="settings-modal-close" aria-label="Close modal">
                    <i data-lucide="x"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="settings-layout">
                    <!-- Nav Tabs -->
                    <nav class="settings-sidebar-nav">
                        <button type="button" class="settings-tab-btn is-active" data-settings-tab="appearance">
                            <i data-lucide="palette"></i> Appearance
                        </button>
                        <button type="button" class="settings-tab-btn" data-settings-tab="timer">
                            <i data-lucide="clock"></i> Focus Timer
                        </button>
                        <button type="button" class="settings-tab-btn" data-settings-tab="profile">
                            <i data-lucide="user"></i> Account Profile
                        </button>
                        <button type="button" class="settings-tab-btn" data-settings-tab="data">
                            <i data-lucide="hard-drive"></i> Data & Backup
                        </button>
                    </nav>

                    <!-- Tab Panels -->
                    <div class="settings-content">
                        <!-- Appearance Tab -->
                        <div class="settings-tab-panel is-active" data-settings-panel="appearance">
                            <div class="settings-group">
                                <span class="settings-group-label">Theme Mode</span>
                                <span class="settings-group-desc">Choose between light and dark interface styles.</span>
                                <div class="settings-toggle-row">
                                    <span>Theme style</span>
                                    <div class="button-group">
                                        <button type="button" class="button button-sm ${currentTheme === "light" ? "button-primary" : "button-secondary"}" id="settings-theme-light">
                                            Light
                                        </button>
                                        <button type="button" class="button button-sm ${currentTheme === "dark" ? "button-primary" : "button-secondary"}" id="settings-theme-dark">
                                            Dark
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">Accent Theme Color</span>
                                <span class="settings-group-desc">Select your preferred highlight and active color theme.</span>
                                <div class="color-picker-grid" id="settings-color-grid">
                                    ${ACCENT_COLORS.map(c => `
                                        <button type="button" class="color-chip ${activeColor === c.value ? "is-selected" : ""}" data-color="${c.value}" style="background-color: ${c.value};" title="${c.name}"></button>
                                    `).join("")}
                                </div>
                            </div>
                        </div>

                        <!-- Timer Tab -->
                        <div class="settings-tab-panel" data-settings-panel="timer">
                            <div class="settings-group">
                                <span class="settings-group-label">Default Study Session Length</span>
                                <span class="settings-group-desc">Set your default focus duration for new study sessions.</span>
                                <select id="settings-default-duration" class="form-control">
                                    <option value="25" ${defaultTimer === "25" ? "selected" : ""}>25 minutes (Pomodoro)</option>
                                    <option value="45" ${defaultTimer === "45" ? "selected" : ""}>45 minutes (Standard)</option>
                                    <option value="60" ${defaultTimer === "60" ? "selected" : ""}>60 minutes (Deep Focus)</option>
                                </select>
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">Sound Notifications</span>
                                <span class="settings-group-desc">Play a chime when study timers complete.</span>
                                <div class="settings-toggle-row">
                                    <span>Timer completion chime</span>
                                    <input type="checkbox" id="settings-chime-toggle" ${chimeEnabled ? "checked" : ""}>
                                </div>
                            </div>
                        </div>

                        <!-- Profile Tab -->
                        <div class="settings-tab-panel" data-settings-panel="profile">
                            <div class="settings-group">
                                <span class="settings-group-label">Display Name</span>
                                <input type="text" id="modal-settings-profile-name" class="form-control" value="${account?.name || ""}" placeholder="Your Name">
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">Email Address</span>
                                <input type="email" id="modal-settings-profile-email" class="form-control" value="${account?.email || ""}" placeholder="email@example.com">
                            </div>

                            <button type="button" class="button button-primary button-sm" id="modal-settings-profile-save" style="align-self: flex-start; margin-top: 8px;">
                                Save Profile Changes
                            </button>

                            <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border);">

                            <div style="margin-bottom: 12px;">
                                <span class="settings-group-label" style="font-weight: 600;">Change Password</span>
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">Current Password</span>
                                <input type="password" id="modal-settings-current-password" class="form-control" placeholder="Enter current password">
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">New Password</span>
                                <input type="password" id="modal-settings-new-password" class="form-control" placeholder="Enter new password (min. 8 characters)">
                            </div>

                            <div class="settings-group">
                                <span class="settings-group-label">Confirm New Password</span>
                                <input type="password" id="modal-settings-confirm-password" class="form-control" placeholder="Confirm new password">
                            </div>

                            <button type="button" class="button button-primary button-sm" id="modal-settings-password-save" style="align-self: flex-start; margin-top: 8px;">
                                Update Password
                            </button>
                        </div>

                        <!-- Data & Backup Tab -->
                        <div class="settings-tab-panel" data-settings-panel="data">
                            <div class="settings-action-box">
                                <div>
                                    <span class="settings-group-label">Export Study Data</span>
                                    <p class="settings-group-desc">Download a complete JSON backup of all your tasks, planner items, and study history.</p>
                                </div>
                                <button type="button" class="button button-secondary button-sm" id="settings-export-btn">
                                    <i data-lucide="download"></i> Export
                                </button>
                            </div>

                            <div class="settings-action-box">
                                <div>
                                    <span class="settings-group-label">Import Study Data</span>
                                    <p class="settings-group-desc">Restore your data from a previously exported `.json` backup file.</p>
                                </div>
                                <label class="button button-secondary button-sm" style="cursor: pointer;">
                                    <i data-lucide="upload"></i> Import
                                    <input type="file" id="settings-import-file" accept=".json" style="display: none;">
                                </label>
                            </div>

                            <div class="settings-action-box">
                                <div>
                                    <span class="settings-group-label" style="color: var(--danger);">Reset Data</span>
                                    <p class="settings-group-desc">Clear all tasks, sessions, and custom settings stored in browser.</p>
                                </div>
                                <button type="button" class="button button-danger button-sm" id="settings-reset-btn">
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="button button-primary" data-close-settings>Close</button>
            </div>
        </section>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    bindModalEvents();
}

function bindModalEvents() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;

    // Delegate click events on the modal for tab switching & closing
    modal.addEventListener("click", (e) => {
        // Tab switching
        const tabBtn = e.target.closest("[data-settings-tab]");
        if (tabBtn) {
            e.preventDefault();
            const targetTab = tabBtn.dataset.settingsTab;
            modal.querySelectorAll("[data-settings-tab]").forEach(b => b.classList.remove("is-active"));
            modal.querySelectorAll("[data-settings-panel]").forEach(p => p.classList.remove("is-active"));

            tabBtn.classList.add("is-active");
            const targetPanel = modal.querySelector(`[data-settings-panel="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add("is-active");
            }
            return;
        }

        // Close triggers
        const closeBtn = e.target.closest("[data-close-settings], #settings-modal-close");
        if (closeBtn) {
            e.preventDefault();
            closeSettingsModal();
            return;
        }

        // Color chips
        const colorChip = e.target.closest(".color-chip");
        if (colorChip) {
            const color = colorChip.dataset.color;
            modal.querySelectorAll(".color-chip").forEach(c => c.classList.remove("is-selected"));
            colorChip.classList.add("is-selected");
            localStorage.setItem(ACCENT_COLOR_KEY, color);
            applyAccentColor(color);
            showToast({ message: "Accent color updated!", type: "success" });
            return;
        }
    });

    // ESC Key close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
            closeSettingsModal();
        }
    });

    // Theme toggles
    document.getElementById("settings-theme-light")?.addEventListener("click", () => {
        applyTheme("light");
        updateThemeButtons("light");
        showToast({ message: "Light theme applied", type: "info" });
    });

    document.getElementById("settings-theme-dark")?.addEventListener("click", () => {
        applyTheme("dark");
        updateThemeButtons("dark");
        showToast({ message: "Dark theme applied", type: "info" });
    });

    // Default duration & chime
    document.getElementById("settings-default-duration")?.addEventListener("change", (e) => {
        localStorage.setItem(TIMER_PREF_KEY, e.target.value);
        showToast({ message: "Default study timer updated", type: "success" });
    });

    document.getElementById("settings-chime-toggle")?.addEventListener("change", (e) => {
        localStorage.setItem(CHIME_PREF_KEY, e.target.checked ? "true" : "false");
        showToast({ message: e.target.checked ? "Sound chimes enabled" : "Sound chimes disabled", type: "info" });
    });

    // Attach real-time email validation
    const modalEmailInput = modal.querySelector("#modal-settings-profile-email, #settings-profile-email");
    if (modalEmailInput) {
        attachEmailInputValidation(modalEmailInput);
    }

    // Profile save
    modal.querySelector("#modal-settings-profile-save, #settings-profile-save")?.addEventListener("click", () => {
        const nameInput = modal.querySelector("#modal-settings-profile-name, #settings-profile-name");
        const emailInput = modal.querySelector("#modal-settings-profile-email, #settings-profile-email");
        const rawEmail = emailInput?.value || "";

        const emailValidation = validateEmail(rawEmail);
        if (!emailValidation.isValid) {
            emailInput?.classList.add("input-invalid");
            emailInput?.focus();
            showToast({ message: emailValidation.error, type: "error" });
            return;
        }

        try {
            updateProfile({
                name: nameInput?.value,
                email: emailValidation.normalizedEmail
            });
            emailInput?.classList.remove("input-invalid");
            showToast({ message: "Profile updated successfully!", type: "success" });
        } catch (error) {
            showToast({ message: error.message || "Failed to update profile", type: "error" });
        }
    });

    // Password update
    modal.querySelector("#modal-settings-password-save, #settings-password-save")?.addEventListener("click", async () => {
        const currentPasswordInput = modal.querySelector("#modal-settings-current-password, #settings-current-password");
        const newPasswordInput = modal.querySelector("#modal-settings-new-password, #settings-new-password");
        const confirmPasswordInput = modal.querySelector("#modal-settings-confirm-password, #settings-confirm-password");

        const currentPassword = currentPasswordInput?.value || "";
        const newPassword = newPasswordInput?.value || "";
        const confirmPassword = confirmPasswordInput?.value || "";

        if (!currentPassword) {
            showToast({ message: "Please enter your current password", type: "error" });
            return;
        }

        if (!newPassword || newPassword.length < 8) {
            showToast({ message: "New password must be at least 8 characters long", type: "error" });
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast({ message: "New passwords do not match", type: "error" });
            return;
        }

        try {
            await changePassword({ currentPassword, newPassword });
            showToast({ message: "Password updated successfully!", type: "success" });

            if (currentPasswordInput) currentPasswordInput.value = "";
            if (newPasswordInput) newPasswordInput.value = "";
            if (confirmPasswordInput) confirmPasswordInput.value = "";
        } catch (error) {
            showToast({ message: error.message || "Failed to update password", type: "error" });
        }
    });

    // Export Data
    modal.querySelector("#settings-export-btn")?.addEventListener("click", () => {
        exportBackupData();
    });

    // Import Data
    const importInput = modal.querySelector("#settings-import-file");
    importInput?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleBackupFileSelect(file, importInput);
        }
    });

    // Reset Data
    modal.querySelector("#settings-reset-btn")?.addEventListener("click", async () => {
        const confirmed = await showConfirm({
            title: "Reset Demo Data",
            message: "Are you sure you want to reset demo data? This will clear local tasks.",
            confirmText: "Reset Data",
            confirmButtonClass: "button-danger",
            icon: "alert-triangle"
        });
        if (confirmed) {
            localStorage.removeItem("studyflow-tasks");
            localStorage.removeItem("studyflow_quick_notes");
            showToast({ message: "Data reset. Reloading...", type: "info" });
            setTimeout(() => window.location.reload(), 1200);
        }
    });
}

function updateThemeButtons(theme) {
    const lightBtn = document.getElementById("settings-theme-light");
    const darkBtn = document.getElementById("settings-theme-dark");
    if (lightBtn && darkBtn) {
        lightBtn.className = `button button-sm ${theme === "light" ? "button-primary" : "button-secondary"}`;
        darkBtn.className = `button button-sm ${theme === "dark" ? "button-primary" : "button-secondary"}`;
    }
}

export function openSettingsModal() {
    ensureModalDOM();
    const modal = document.getElementById("settings-modal");
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
        lucide.createIcons();
    }
}

export function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}
