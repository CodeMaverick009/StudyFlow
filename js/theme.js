// =========================================================
// STUDYFLOW — THEME SYSTEM
// =========================================================

const THEME_KEY = "studyflow-theme";


// Get saved theme
export function getSavedTheme() {

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }

    // Use system preference when no preference exists
    if (
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ) {
        return "dark";
    }

    return "light";
}


// Apply theme
export function applyTheme(theme) {

    document.documentElement.dataset.theme = theme;

    localStorage.setItem(
        THEME_KEY,
        theme
    );
}


// Toggle theme
export function toggleTheme() {

    const currentTheme =
        document.documentElement.dataset.theme || "light";

    const newTheme =
        currentTheme === "light"
            ? "dark"
            : "light";

    applyTheme(newTheme);
}


// Initialize theme
export function initializeTheme() {

    const theme = getSavedTheme();

    applyTheme(theme);
}