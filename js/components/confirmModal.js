// =========================================================
// STUDYFLOW — IN-APP CONFIRMATION MODAL COMPONENT
// =========================================================

/**
 * Shows an in-app confirmation modal instead of browser native alerts/confirms.
 * @param {Object} options
 * @param {string} [options.title="Confirm Action"]
 * @param {string} [options.message="Are you sure you want to proceed?"]
 * @param {string} [options.confirmText="Confirm"]
 * @param {string} [options.cancelText="Cancel"]
 * @param {string} [options.confirmButtonClass="button-danger"]
 * @param {string} [options.icon="alert-triangle"]
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled/closed.
 */
export function showConfirm({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "button-danger",
    icon = "alert-triangle"
} = {}) {
    return new Promise((resolve) => {
        // Remove existing confirm modal if one exists
        const existing = document.getElementById("app-confirm-modal");
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement("div");
        modal.id = "app-confirm-modal";
        modal.className = "modal";
        modal.setAttribute("aria-hidden", "false");

        modal.innerHTML = `
            <div class="modal-backdrop" data-action="cancel"></div>
            <section class="modal-dialog" role="dialog" aria-modal="true" style="max-width: 440px;">
                <div class="modal-header" style="padding-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${icon ? `<div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(220, 53, 69, 0.12); color: var(--danger, #e55353); flex-shrink: 0;"><i data-lucide="${icon}" style="width: 20px; height: 20px;"></i></div>` : ""}
                        <h2>${escapeHtml(title)}</h2>
                    </div>
                    <button type="button" class="modal-close" data-action="cancel" aria-label="Close modal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="modal-body" style="padding-top: 4px; padding-bottom: 20px;">
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin: 0;">${escapeHtml(message)}</p>
                </div>

                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 14px;">
                    <button type="button" class="button button-secondary" data-action="cancel">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button type="button" class="button ${confirmButtonClass}" data-action="confirm">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        document.body.classList.add("modal-open");

        if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
            lucide.createIcons({ scope: modal });
        }

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add("is-open");
            modal.querySelector('[data-action="confirm"]')?.focus();
        });

        const cleanup = (result) => {
            modal.classList.remove("is-open");
            document.body.classList.remove("modal-open");
            document.removeEventListener("keydown", handleKeyDown);
            setTimeout(() => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            }, 200);
            resolve(result);
        };

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                cleanup(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        modal.addEventListener("click", (e) => {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            if (action === "confirm") {
                cleanup(true);
            } else {
                cleanup(false);
            }
        });
    });
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
