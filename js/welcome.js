// =========================================================
// STUDYFLOW — WELCOME PAGE
// =========================================================

import { initializeTheme, toggleTheme } from "./theme.js";
import {
    getCurrentAccount,
    createAccount,
    signIn
} from "./storage.js";
import { validateEmail, attachEmailInputValidation } from "./validation.js";
import { playAmbientSound, stopAmbientSound } from "./ambientAudio.js";

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
    initializePipelineTutorial();
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

    // Real-time email validation
    const signupEmailInput = document.getElementById("signup-email");
    const loginEmailInput = document.getElementById("login-email");
    const signupErrorElement = document.getElementById("signup-error");
    const loginErrorElement = document.getElementById("login-error");

    attachEmailInputValidation(signupEmailInput, { errorElement: signupErrorElement });
    attachEmailInputValidation(loginEmailInput, { errorElement: loginErrorElement });

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

    modal.querySelectorAll("input.input-invalid").forEach(el => {
        el.classList.remove("input-invalid");
        el.removeAttribute("aria-invalid");
    });
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
    const emailInput = form.querySelector("#signup-email");

    hideError(errorElement);
    emailInput?.classList.remove("input-invalid");

    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");

    if (!name || !email || password.length < 8) {
        showError(errorElement, "Please fill in every field — passwords need at least 8 characters.");
        return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        showError(errorElement, emailValidation.error);
        emailInput?.classList.add("input-invalid");
        emailInput?.focus();
        return;
    }

    setSubmitting(submitButton, submitLabel, "Creating account…");

    try {
        await createAccount({ name, email: emailValidation.normalizedEmail, password });
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
    const emailInput = form.querySelector("#login-email");

    hideError(errorElement);
    emailInput?.classList.remove("input-invalid");

    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        showError(errorElement, emailValidation.error);
        emailInput?.classList.add("input-invalid");
        emailInput?.focus();
        return;
    }

    setSubmitting(submitButton, submitLabel, "Logging in…");

    try {
        await signIn({ email: emailValidation.normalizedEmail, password });
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

    // Each checked checkbox contributes 33% (and 100% when all 3 are completed)
    let percentage = 0;
    if (done === 0) {
        percentage = 0;
    } else if (done >= total && total > 0) {
        percentage = 100;
    } else {
        percentage = done * 33;
    }

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressLabel) {
        progressLabel.textContent = `${percentage}% of this week done`;
    }
}


// =========================================================
// THE PIPELINE — INTERACTIVE APP WALKTHROUGH
// =========================================================

function initializePipelineTutorial() {
    const steps = document.querySelectorAll("[data-pipeline-step]");
    const navButtons = document.querySelectorAll("[data-mockup-tab]");
    const panes = document.querySelectorAll("[data-pipeline-pane]");

    if (!steps.length || !panes.length) {
        return;
    }

    let activeIndex = 0;
    let isUserClicking = false;
    let userClickTimeout = null;

    function setActiveStep(index) {
        if (index < 0 || index >= steps.length) return;
        activeIndex = index;

        // Steps highlighting
        steps.forEach((step, idx) => {
            step.classList.toggle("is-active", idx === index);
        });

        // Mockup sidebar highlighting
        navButtons.forEach((btn, idx) => {
            btn.classList.toggle("is-active", idx === index);
        });

        // Mockup panes switching
        panes.forEach((pane, idx) => {
            pane.classList.toggle("is-active", idx === index);
        });

        // If navigating away from Focus Room (step 2), stop ambient audio
        if (index !== 2) {
            stopDemoAudio();
        }

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    // Step clicks
    steps.forEach((step, idx) => {
        step.addEventListener("click", () => {
            isUserClicking = true;
            clearTimeout(userClickTimeout);
            setActiveStep(idx);
            userClickTimeout = setTimeout(() => {
                isUserClicking = false;
            }, 800);
        });
    });

    // Mockup sidebar tab clicks
    navButtons.forEach((btn, idx) => {
        btn.addEventListener("click", () => {
            isUserClicking = true;
            clearTimeout(userClickTimeout);
            setActiveStep(idx);
            userClickTimeout = setTimeout(() => {
                isUserClicking = false;
            }, 800);
        });
    });

    // Scroll synchronization via IntersectionObserver
    if ("IntersectionObserver" in window) {
        const stepObserver = new IntersectionObserver((entries) => {
            if (isUserClicking) return;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stepIdx = parseInt(entry.target.dataset.pipelineStep, 10);
                    if (!isNaN(stepIdx)) {
                        setActiveStep(stepIdx);
                    }
                }
            });
        }, {
            threshold: 0.55,
            rootMargin: "0px 0px -20% 0px"
        });

        steps.forEach(step => stepObserver.observe(step));
    }

    // ---------------------------------------------------------
    // Pane 0: Tasks Interactivity
    // ---------------------------------------------------------
    const taskCards = document.querySelectorAll("[data-pipeline-task]");
    taskCards.forEach(card => {
        const checkbox = card.querySelector(".pipeline-task-checkbox");
        checkbox?.addEventListener("click", (e) => {
            e.stopPropagation();
            card.classList.toggle("is-done");
        });
    });

    const priorityButtons = document.querySelectorAll("[data-priority-toggle]");
    const priorities = [
        { label: "High priority", className: "priority-high" },
        { label: "Med priority", className: "priority-med" },
        { label: "Low priority", className: "priority-low" }
    ];

    priorityButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const currentIdx = priorities.findIndex(p => btn.classList.contains(p.className));
            const nextIdx = (currentIdx + 1) % priorities.length;
            btn.classList.remove("priority-high", "priority-med", "priority-low");
            btn.classList.add(priorities[nextIdx].className);
            btn.textContent = priorities[nextIdx].label;
        });
    });

    // ---------------------------------------------------------
    // Pane 1: Planner Interactivity
    // ---------------------------------------------------------
    const planBtn = document.getElementById("pipeline-auto-plan-btn");
    const timeline = document.getElementById("pipeline-timeline");
    planBtn?.addEventListener("click", () => {
        if (!timeline) return;
        timeline.style.opacity = "0.3";
        timeline.style.transform = "scale(0.98)";
        timeline.style.transition = "all 0.25s ease";

        setTimeout(() => {
            timeline.style.opacity = "1";
            timeline.style.transform = "scale(1)";
            planBtn.innerHTML = '<i data-lucide="check"></i><span>Day planned!</span>';
            if (typeof lucide !== "undefined") lucide.createIcons();

            setTimeout(() => {
                planBtn.innerHTML = '<i data-lucide="wand-sparkles"></i><span>Plan my day</span>';
                if (typeof lucide !== "undefined") lucide.createIcons();
            }, 2200);
        }, 280);
    });

    // ---------------------------------------------------------
    // Pane 2: Focus Room Timer & Audio Interactivity
    // ---------------------------------------------------------
    let timerSeconds = 25 * 60;
    let timerInterval = null;
    const timerDisplay = document.getElementById("pipeline-timer-display");
    const timerToggle = document.getElementById("pipeline-timer-toggle");
    const timerReset = document.getElementById("pipeline-timer-reset");
    const timerBtnText = document.getElementById("pipeline-timer-btn-text");

    function renderTimer() {
        const mins = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
        const secs = String(timerSeconds % 60).padStart(2, "0");
        if (timerDisplay) {
            timerDisplay.textContent = `${mins}:${secs}`;
        }
    }

    timerToggle?.addEventListener("click", () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            if (timerBtnText) timerBtnText.textContent = "Resume timer";
        } else {
            timerInterval = setInterval(() => {
                if (timerSeconds > 0) {
                    timerSeconds--;
                    renderTimer();
                } else {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    if (timerBtnText) timerBtnText.textContent = "Start timer";
                }
            }, 1000);
            if (timerBtnText) timerBtnText.textContent = "Pause timer";
        }
    });

    timerReset?.addEventListener("click", () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerSeconds = 25 * 60;
        renderTimer();
        if (timerBtnText) timerBtnText.textContent = "Start timer";
    });

    // Ambient sound buttons
    const soundButtons = document.querySelectorAll("[data-pipeline-sound]");
    function stopDemoAudio() {
        stopAmbientSound();
        soundButtons.forEach(btn => {
            btn.classList.toggle("is-active", btn.dataset.pipelineSound === "off");
        });
    }

    soundButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const soundType = btn.dataset.pipelineSound;
            soundButtons.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");

            if (soundType === "off") {
                stopAmbientSound();
            } else {
                playAmbientSound(soundType);
            }
        });
    });
}
