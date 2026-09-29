// =========================================================
// STUDYFLOW — COMMAND PALETTE (Ctrl+K)
// =========================================================

import { toggleTheme } from "../theme.js";
import { loadDemoData, exportUserData } from "../demoData.js";
import { showToast } from "./toast.js";

let paletteOverlay = null;
let selectedIndex = 0;

const COMMANDS = [
    {
        id: "nav-dashboard",
        title: "Go to Dashboard",
        category: "Navigation",
        icon: "layout-dashboard",
        action: () => window.location.href = "index.html"
    },
    {
        id: "nav-tasks",
        title: "Go to Tasks & Materials",
        category: "Navigation",
        icon: "check-square",
        action: () => window.location.href = "tasks.html"
    },
    {
        id: "nav-study",
        title: "Go to Study Timer",
        category: "Navigation",
        icon: "timer",
        action: () => window.location.href = "study.html"
    },
    {
        id: "nav-planner",
        title: "Go to Weekly Planner",
        category: "Navigation",
        icon: "calendar",
        action: () => window.location.href = "planner.html"
    },
    {
        id: "nav-progress",
        title: "Go to Progress Analytics",
        category: "Navigation",
        icon: "bar-chart-2",
        action: () => window.location.href = "progress.html"
    },
    {
        id: "action-add-task",
        title: "Add New Task...",
        category: "Actions",
        icon: "plus-circle",
        action: () => {
            closeCommandPalette();
            const quickAddBtn = document.getElementById("quick-add-button") || document.getElementById("add-task-btn");
            if (quickAddBtn) {
                quickAddBtn.click();
            } else {
                window.location.href = "tasks.html?action=new";
            }
        }
    },
    {
        id: "action-toggle-theme",
        title: "Toggle Light / Dark Theme",
        category: "Actions",
        icon: "sun-moon",
        action: () => {
            toggleTheme();
            showToast({ message: "Theme updated", type: "info" });
        }
    },
    {
        id: "action-load-demo",
        title: "Load Sample / Demo Data",
        category: "Data & Settings",
        icon: "sparkles",
        action: () => {
            loadDemoData();
        }
    },
    {
        id: "action-export-data",
        title: "Export Data Backup (JSON)",
        category: "Data & Settings",
        icon: "download",
        action: () => {
            exportUserData();
        }
    }
];

export function initializeCommandPalette() {
    // Listen for Ctrl+K or Cmd+K
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            toggleCommandPalette();
        } else if (e.key === "Escape" && paletteOverlay && !paletteOverlay.classList.contains("hidden")) {
            closeCommandPalette();
        }
    });
}

export function openCommandPalette() {
    if (!paletteOverlay) {
        createPaletteDOM();
    }
    paletteOverlay.classList.remove("hidden");
    const input = paletteOverlay.querySelector("#cmd-input");
    input.value = "";
    selectedIndex = 0;
    renderCommands(COMMANDS);
    input.focus();
}

export function closeCommandPalette() {
    if (paletteOverlay) {
        paletteOverlay.classList.add("hidden");
    }
}

export function toggleCommandPalette() {
    if (paletteOverlay && !paletteOverlay.classList.contains("hidden")) {
        closeCommandPalette();
    } else {
        openCommandPalette();
    }
}

function createPaletteDOM() {
    paletteOverlay = document.createElement("div");
    paletteOverlay.className = "command-palette-overlay hidden";
    paletteOverlay.innerHTML = `
        <div class="command-palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
            <div class="command-palette-header">
                <i data-lucide="search" class="cmd-search-icon"></i>
                <input type="text" id="cmd-input" placeholder="Type a command or search..." autocomplete="off" />
                <kbd class="cmd-kbd">ESC</kbd>
            </div>
            <div class="command-palette-body" id="cmd-results"></div>
            <div class="command-palette-footer">
                <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                <span><kbd>↵</kbd> to select</span>
                <span><kbd>ESC</kbd> to close</span>
            </div>
        </div>
    `;

    document.body.appendChild(paletteOverlay);

    // Close on overlay backdrop click
    paletteOverlay.addEventListener("click", (e) => {
        if (e.target === paletteOverlay) {
            closeCommandPalette();
        }
    });

    const input = paletteOverlay.querySelector("#cmd-input");
    input.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = COMMANDS.filter(cmd => 
            cmd.title.toLowerCase().includes(query) || 
            cmd.category.toLowerCase().includes(query)
        );
        selectedIndex = 0;
        renderCommands(filtered);
    });

    input.addEventListener("keydown", (e) => {
        const items = paletteOverlay.querySelectorAll(".cmd-item");
        if (!items.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selectedEl = items[selectedIndex];
            if (selectedEl) {
                const cmdId = selectedEl.dataset.id;
                const cmd = COMMANDS.find(c => c.id === cmdId);
                if (cmd) {
                    closeCommandPalette();
                    cmd.action();
                }
            }
        }
    });
}

function renderCommands(commands) {
    const resultsContainer = paletteOverlay.querySelector("#cmd-results");
    if (!commands.length) {
        resultsContainer.innerHTML = `
            <div class="cmd-empty">
                <i data-lucide="help-circle"></i>
                <p>No matching commands found</p>
            </div>
        `;
        if (typeof lucide !== "undefined") {
            lucide.createIcons({ props: {}, nameAttr: 'data-lucide', scope: resultsContainer });
        }
        return;
    }

    // Group by category
    const grouped = {};
    commands.forEach(cmd => {
        if (!grouped[cmd.category]) grouped[cmd.category] = [];
        grouped[cmd.category].push(cmd);
    });

    let html = "";
    let globalIndex = 0;

    for (const [category, cmds] of Object.entries(grouped)) {
        html += `<div class="cmd-category-title">${category}</div>`;
        cmds.forEach(cmd => {
            const isSelected = globalIndex === selectedIndex;
            html += `
                <div class="cmd-item ${isSelected ? "selected" : ""}" data-id="${cmd.id}" data-index="${globalIndex}">
                    <i data-lucide="${cmd.icon}" class="cmd-item-icon"></i>
                    <span class="cmd-item-title">${escapeHtml(cmd.title)}</span>
                    <i data-lucide="chevron-right" class="cmd-item-arrow"></i>
                </div>
            `;
            globalIndex++;
        });
    }

    resultsContainer.innerHTML = html;

    if (typeof lucide !== "undefined") {
        lucide.createIcons({ props: {}, nameAttr: 'data-lucide', scope: resultsContainer });
    }

    const items = resultsContainer.querySelectorAll(".cmd-item");
    items.forEach(item => {
        item.addEventListener("click", () => {
            const cmdId = item.dataset.id;
            const cmd = COMMANDS.find(c => c.id === cmdId);
            if (cmd) {
                closeCommandPalette();
                cmd.action();
            }
        });
        item.addEventListener("mouseenter", () => {
            selectedIndex = parseInt(item.dataset.index, 10);
            updateSelection(items);
        });
    });
}

function updateSelection(items) {
    items.forEach((item, idx) => {
        if (idx === selectedIndex) {
            item.classList.add("selected");
            item.scrollIntoView({ block: "nearest" });
        } else {
            item.classList.remove("selected");
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
