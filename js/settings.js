// =========================================================
// STUDYFLOW — SETTINGS PAGE & CONTROLS
// =========================================================

import { getSavedTheme, applyTheme } from "./theme.js";
import { getCurrentAccount, updateProfile, changePassword } from "./storage.js";
import { validateEmail, attachEmailInputValidation } from "./validation.js";
import { showToast } from "./components/toast.js";
import { showConfirm } from "./components/confirmModal.js";
import { exportBackupData, handleBackupFileSelect } from "./backup.js";

const ACCENT_COLOR_KEY = "studyflow_accent_color";
const TIMER_PREF_KEY = "studyflow_timer_pref";
const CHIME_PREF_KEY = "studyflow_chime_pref";

export function applyAccentColor(colorValue = null) {
    const savedColor = colorValue || localStorage.getItem(ACCENT_COLOR_KEY);
    if (savedColor) {
        document.documentElement.style.setProperty("--accent-primary", savedColor);
        document.documentElement.style.setProperty("--brand-olive", savedColor);
    }
}

export function initializeSettingsPage() {
    applyAccentColor();

    const isSettingsPage = document.body.dataset.page === "settings";
    if (!isSettingsPage) return;

    loadSettingsValues();
    bindSettingsEvents();
}

function loadSettingsValues() {
    const account = getCurrentAccount();
    const currentTheme = getSavedTheme();
    const activeColor = localStorage.getItem(ACCENT_COLOR_KEY) || "#727966";
    const defaultTimer = localStorage.getItem(TIMER_PREF_KEY) || "25";
    const chimeEnabled = localStorage.getItem(CHIME_PREF_KEY) !== "false";

    // Populate inputs
    const nameInput = document.getElementById("settings-profile-name");
    const emailInput = document.getElementById("settings-profile-email");
    if (nameInput) nameInput.value = account?.name || "";
    if (emailInput) {
        emailInput.value = account?.email || "";
        attachEmailInputValidation(emailInput);
    }

    // Timer selects
    const durationSelect = document.getElementById("settings-default-duration");
    const chimeToggle = document.getElementById("settings-chime-toggle");
    if (durationSelect) durationSelect.value = defaultTimer;
    if (chimeToggle) chimeToggle.checked = chimeEnabled;

    // Theme buttons
    updateThemeButtons(currentTheme);

    // Color chips
    document.querySelectorAll(".color-chip").forEach(chip => {
        if (chip.dataset.color === activeColor) {
            chip.classList.add("is-selected");
        } else {
            chip.classList.remove("is-selected");
        }
    });
}

function bindSettingsEvents() {
    // Tab switching
    document.querySelectorAll("[data-settings-tab]").forEach(tabBtn => {
        tabBtn.addEventListener("click", () => {
            const targetTab = tabBtn.dataset.settingsTab;
            document.querySelectorAll("[data-settings-tab]").forEach(b => b.classList.remove("is-active"));
            document.querySelectorAll("[data-settings-panel]").forEach(p => p.classList.remove("is-active"));

            tabBtn.classList.add("is-active");
            const targetPanel = document.querySelector(`[data-settings-panel="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add("is-active");
            }
        });
    });

    // Theme mode toggles
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

    // Accent color picker
    document.querySelectorAll(".color-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const color = chip.dataset.color;
            document.querySelectorAll(".color-chip").forEach(c => c.classList.remove("is-selected"));
            chip.classList.add("is-selected");
            localStorage.setItem(ACCENT_COLOR_KEY, color);
            applyAccentColor(color);
            showToast({ message: "Accent color theme updated!", type: "success" });
        });
    });

    // Timer preferences
    document.getElementById("settings-default-duration")?.addEventListener("change", (e) => {
        localStorage.setItem(TIMER_PREF_KEY, e.target.value);
        showToast({ message: "Default study duration updated", type: "success" });
    });

    document.getElementById("settings-chime-toggle")?.addEventListener("change", (e) => {
        localStorage.setItem(CHIME_PREF_KEY, e.target.checked ? "true" : "false");
        showToast({ message: e.target.checked ? "Chimes enabled" : "Chimes disabled", type: "info" });
    });

    // Profile save
    document.getElementById("settings-profile-save")?.addEventListener("click", () => {
        const nameInput = document.getElementById("settings-profile-name");
        const emailInput = document.getElementById("settings-profile-email");
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
    document.getElementById("settings-password-save")?.addEventListener("click", async () => {
        const currentPasswordInput = document.getElementById("settings-current-password");
        const newPasswordInput = document.getElementById("settings-new-password");
        const confirmPasswordInput = document.getElementById("settings-confirm-password");

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

    // Export JSON
    document.getElementById("settings-export-btn")?.addEventListener("click", () => {
        exportBackupData();
    });

    // Import JSON
    const importInput = document.getElementById("settings-import-file");
    importInput?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleBackupFileSelect(file, importInput);
        }
    });

    // Reset Data
    document.getElementById("settings-reset-btn")?.addEventListener("click", async () => {
        const confirmed = await showConfirm({
            title: "Reset Study Data",
            message: "Are you sure you want to reset your local data? This will clear local tasks and quick notes.",
            confirmText: "Reset All Data",
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
