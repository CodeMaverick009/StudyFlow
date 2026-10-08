// =========================================================
// STUDYFLOW — HEADER COMPONENT
// =========================================================

export function renderHeader() {
    const header = document.getElementById("header");

    if (!header) return;

    const currentPage = document.body.dataset.page;

    const pageInfo = {
        dashboard: {
            title: "Dashboard",
            description: "Your overview for today"
        },

        planner: {
            title: "Planner",
            description: "Plan your time and stay ahead"
        },

        tasks: {
            title: "Tasks & Materials",
            description: "Everything you need to get done"
        },

        study: {
            title: "Study",
            description: "Focus on what matters now"
        },

        progress: {
            title: "Progress",
            description: "See how your work is adding up"
        }
    };

    const currentInfo = pageInfo[currentPage] || pageInfo.dashboard;

    header.innerHTML = `
        <div class="header-inner">

            <div class="header-left">

                <button
                    type="button"
                    class="mobile-menu-button"
                    id="mobile-menu-button"
                    aria-label="Open navigation menu"
                    aria-controls="sidebar"
                    aria-expanded="false"
                >
                    <i data-lucide="menu" aria-hidden="true"></i>
                </button>

                <div class="header-title">
                    <h1>${currentInfo.title}</h1>
                    <p>${currentInfo.description}</p>
                </div>

            </div>


            <div class="header-actions">

                <button
                    type="button"
                    class="cmd-trigger-btn"
                    id="cmd-palette-trigger-btn"
                    aria-label="Open command palette"
                >
                    <i data-lucide="search" aria-hidden="true"></i>
                    <span>Search or jump...</span>
                    <kbd>Ctrl+K</kbd>
                </button>

                <button
                    type="button"
                    class="theme-toggle"
                    id="theme-toggle"
                    aria-label="Switch theme"
                >
                    <i
                        data-lucide="sun"
                        class="theme-icon theme-icon-light"
                        aria-hidden="true"
                    ></i>

                    <i
                        data-lucide="moon"
                        class="theme-icon theme-icon-dark"
                        aria-hidden="true"
                    ></i>

                    <span class="theme-toggle-label">
                        Theme
                    </span>
                </button>

            </div>

        </div>
    `;
}