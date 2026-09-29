// =========================================================
// STUDYFLOW — SIDEBAR COMPONENT
// =========================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function renderSidebar(account = null) {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) return;

    const currentPage = document.body.dataset.page;

    const initials = (account?.name || "?")
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const navigationItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "house",
            href: "index.html"
        },
        {
            id: "planner",
            label: "Planner",
            icon: "calendar-days",
            href: "planner.html"
        },
        {
            id: "tasks",
            label: "Tasks & Materials",
            icon: "clipboard-check",
            href: "tasks.html"
        },
        {
            id: "study",
            label: "Study",
            icon: "brain",
            href: "study.html"
        },
        {
            id: "progress",
            label: "Progress",
            icon: "chart-no-axes-combined",
            href: "progress.html"
        }
    ];

    sidebar.innerHTML = `
        <div class="sidebar-inner">

            <!-- Logo -->
            <a
                href="index.html"
                class="sidebar-logo"
                aria-label="Studyflow Dashboard"
            >

                <span class="logo-mark" aria-hidden="true">

                    <svg
                        class="studyflow-logo"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                        <!-- Bottom book -->
                        <path
                            class="logo-book logo-book-bottom"
                            d="M7 31.5L35 27.5L41 31L13 36L7 31.5Z"
                            fill="currentColor"
                        />

                        <path
                            class="logo-book-edge logo-book-bottom-edge"
                            d="M13 36V39L41 34V31L13 36Z"
                            fill="currentColor"
                        />

                        <!-- Middle book -->
                        <path
                            class="logo-book logo-book-middle"
                            d="M10 24L34 20.5L40 24L16 28.5L10 24Z"
                            fill="currentColor"
                        />

                        <path
                            class="logo-book-edge logo-book-middle-edge"
                            d="M16 28.5V31.5L40 27V24L16 28.5Z"
                            fill="currentColor"
                        />

                        <!-- Top book -->
                        <path
                            class="logo-book logo-book-top"
                            d="M14 17L35 14L40 17L19 21L14 17Z"
                            fill="currentColor"
                        />

                        <path
                            class="logo-book-edge logo-book-top-edge"
                            d="M19 21V23.5L40 19.5V17L19 21Z"
                            fill="currentColor"
                        />

                        <!-- Progress dot -->
                        <circle
                            class="logo-dot"
                            cx="29"
                            cy="9"
                            r="3.5"
                            fill="currentColor"
                        />

                    </svg>

                </span>

                <span class="logo-text">
                    Studyflow
                </span>

            </a>


            <!-- Navigation -->
            <nav
                class="sidebar-navigation"
                aria-label="Main navigation"
            >

                ${navigationItems.map(item => `
                    <a
                        href="${item.href}"
                        class="nav-item ${currentPage === item.id ? "active" : ""}"
                        ${currentPage === item.id ? 'aria-current="page"' : ""}
                    >

                        <span
                            class="nav-icon"
                            aria-hidden="true"
                        >
                            <i data-lucide="${item.icon}"></i>
                        </span>

                        <span class="nav-label">
                            ${item.label}
                        </span>

                    </a>
                `).join("")}

            </nav>


            <!-- Sidebar bottom -->
            <div class="sidebar-bottom">

                <div class="sidebar-divider"></div>

                ${account ? `
                    <div class="sidebar-account" title="${escapeHTML(account.name)} · ${escapeHTML(account.email)}">
                        <span class="sidebar-account-avatar" aria-hidden="true">${escapeHTML(initials)}</span>
                        <span class="sidebar-account-info">
                            <strong>${escapeHTML(account.name)}</strong>
                            <span>${escapeHTML(account.email)}</span>
                        </span>
                    </div>
                ` : ""}

                <a
                    href="settings.html"
                    class="sidebar-action ${currentPage === "settings" ? "active" : ""}"
                    id="sidebar-settings"
                    aria-label="Settings"
                >

                    <span
                        class="nav-icon"
                        aria-hidden="true"
                    >
                        <i data-lucide="settings"></i>
                    </span>

                    <span class="nav-label">
                        Settings
                    </span>

                </a>

                <button
                    type="button"
                    class="sidebar-action"
                    id="sidebar-logout"
                    aria-label="Log out"
                >

                    <span
                        class="nav-icon"
                        aria-hidden="true"
                    >
                        <i data-lucide="log-out"></i>
                    </span>

                    <span class="nav-label">
                        Log out
                    </span>

                </button>

            </div>

        </div>
    `;
}
