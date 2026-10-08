// =========================================================
// STUDYFLOW — TOAST NOTIFICATION SYSTEM
// =========================================================

let toastContainer = null;

function ensureContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        document.body.appendChild(toastContainer);
    }
}

/**
 * Display a toast notification.
 * @param {Object} options
 * @param {string} options.message - The text message to display.
 * @param {'success'|'info'|'warning'|'error'} [options.type='info'] - Type of toast.
 * @param {number} [options.duration=3200] - Duration in milliseconds before auto dismiss.
 * @param {string} [options.icon] - Lucide icon name optional.
 */
export function showToast({ message, type = "info", duration = 3200, icon = null }) {
    ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconName = icon;
    if (!iconName) {
        switch (type) {
            case "success": iconName = "check-circle-2"; break;
            case "warning": iconName = "alert-triangle"; break;
            case "error": iconName = "alert-circle"; break;
            default: iconName = "info"; break;
        }
    }

    toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">
            <i data-lucide="${iconName}"></i>
        </span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button type="button" class="toast-close" aria-label="Close notification">
            <i data-lucide="x"></i>
        </button>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => removeToast(toast));

    toastContainer.appendChild(toast);

    if (typeof lucide !== "undefined") {
        lucide.createIcons({ props: {}, nameAttr: 'data-lucide', scope: toast });
    }

    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }
}

function removeToast(toast) {
    if (toast.classList.contains("toast-leaving")) return;
    toast.classList.add("toast-leaving");
    toast.addEventListener("animationend", () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
