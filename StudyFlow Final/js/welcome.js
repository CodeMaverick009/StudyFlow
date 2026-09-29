// =========================================================
// STUDYFLOW — WELCOME PAGE
// =========================================================

import { initializeTheme, toggleTheme } from "./theme.js";
import {
    getCurrentAccount,
    createAccount,
    signIn
} from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();

    // Already signed in on this browser — skip straight to the app.
    if (getCurrentAccount()) {
        window.location.href = "index.html";
        return;
    }

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    initializeThemeToggle();
    initializeAuthModals();
    initializePreviewDemo();
    initializeScrollReveal();
});


// =========================================================
// SCROLL REVEAL
// =========================================================

function initializeScrollReveal() {
    const revealElements = document.querySelectorAll("[data-reveal]");

    if (!revealElements.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach(element => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.25,
        rootMargin: "0px 0px -60px 0px"
    });

    revealElements.forEach(element => observer.observe(element));
}


// =========================================================
// THEME TOGGLE
// =========================================================

function initializeThemeToggle() {
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
        toggleTheme();
    });
}


// =========================================================
// AUTH MODALS — SIGN UP / LOG IN
// =========================================================

function initializeAuthModals() {

    const signupModal = document.getElementById("signup-modal");
    const loginModal = document.getElementById("login-modal");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    // Open

    document.querySelectorAll(".js-open-signup").forEach(button => {
        button.addEventListener("click", () => {
            openModal(signupModal, "signup-name");
        });
    });

    document.getElementById("welcome-login-button")?.addEventListener("click", () => {
        openModal(loginModal, "login-email");
    });

    // Switch between the two modals

    document.getElementById("signup-switch-to-login")?.addEventListener("click", () => {
        closeModal(signupModal);
        openModal(loginModal, "login-email");
    });

    document.getElementById("login-switch-to-signup")?.addEventListener("click", () => {
        closeModal(loginModal);
        openModal(signupModal, "signup-name");
    });

    // Close

    document.getElementById("signup-close")?.addEventListener("click", () => closeModal(signupModal));
    document.getElementById("login-close")?.addEventListener("click", () => closeModal(loginModal));

    document.querySelectorAll("[data-close-signup]").forEach(element => {
        element.addEventListener("click", () => closeModal(signupModal));
    });

    document.querySelectorAll("[data-close-login]").forEach(element => {
        element.addEventListener("click", () => closeModal(loginModal));
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") {
            return;
        }

        if (signupModal?.classList.contains("is-open")) closeModal(signupModal);
        if (loginModal?.classList.contains("is-open")) closeModal(loginModal);
    });

    // Submit

    signupForm?.addEventListener("submit", async event => {
        event.preventDefault();
        await handleSignup(signupForm);
    });

    loginForm?.addEventListener("submit", async event => {
        event.preventDefault();
        await handleLogin(loginForm);
    });
}

function openModal(modal, focusId) {
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => {
        document.getElementById(focusId)?.focus();
    }, 100);
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    hideError(modal.querySelector(".auth-error"));
}

function showError(errorElement, message) {
    if (!errorElement) return;

    errorElement.textContent = message;
    errorElement.hidden = false;
}

function hideError(errorElement) {
    if (!errorElement) return;

    errorElement.hidden = true;
    errorElement.textContent = "";
}

async function handleSignup(form) {
    const errorElement = document.getElementById("signup-error");
    const submitButton = form.querySelector("button[type='submit']");
    const submitLabel = submitButton?.querySelector(".auth-submit-label");

    hideError(errorElement);

    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");

    if (!name || !email || password.length < 8) {
        showError(errorElement, "Please fill in every field — passwords need at least 8 characters.");
        return;
    }

    setSubmitting(submitButton, submitLabel, "Creating account…");

    try {
        await createAccount({ name, email, password });
        window.location.href = "index.html";
    } catch (error) {
        showError(errorElement, error.message || "Something went wrong. Please try again.");
        setSubmitting(submitButton, submitLabel, "Create account", false);
    }
}

async function handleLogin(form) {
    const errorElement = document.getElementById("login-error");
    const submitButton = form.querySelector("button[type='submit']");
    const submitLabel = submitButton?.querySelector(".auth-submit-label");

    hideError(errorElement);

    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    setSubmitting(submitButton, submitLabel, "Logging in…");

    try {
        await signIn({ email, password });
        window.location.href = "index.html";
    } catch (error) {
        showError(errorElement, error.message || "Something went wrong. Please try again.");
        setSubmitting(submitButton, submitLabel, "Log in", false);
    }
}

function setSubmitting(button, label, text, isSubmitting = true) {
    if (!button) return;

    button.disabled = isSubmitting;

    if (label) {
        label.textContent = text;
    }
}


// =========================================================
// INTERACTIVE PREVIEW — try checking off a task
// =========================================================

function initializePreviewDemo() {
    const taskButtons = document.querySelectorAll("[data-preview-task]");

    if (!taskButtons.length) {
        return;
    }

    taskButtons.forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("is-done");
            updatePreviewStats();
        });
    });
}

function updatePreviewStats() {
    const taskButtons = document.querySelectorAll("[data-preview-task]");
    const total = taskButtons.length;
    const done = document.querySelectorAll("[data-preview-task].is-done").length;

    const tasksLeft = document.getElementById("welcome-preview-tasks-left");
    const progressBar = document.getElementById("welcome-preview-progress-bar");
    const progressLabel = document.getElementById("welcome-preview-progress-label");

    if (tasksLeft) {
        tasksLeft.textContent = total - done;
    }

    // Start from a baseline of 62% "done this week" and nudge it with
    // whatever the visitor checks off, just to show the bar responding.
    const baseline = 62;
    const bonus = Math.round((done / total) * 30);
    const percentage = Math.min(100, baseline + bonus);

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressLabel) {
        progressLabel.textContent = `${percentage}% of this week done`;
    }
}
