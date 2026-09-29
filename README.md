# StudyFlow

> A calm, intelligent, and private study management platform designed to help students organize coursework, structure daily routines, focus deeply with procedural soundscapes, and visualize learning progress.

---

## Overview

**StudyFlow** is an all-in-one, distraction-free study companion built entirely with modern web standards (Vanilla ES6+ JavaScript, CSS3, and HTML5). It combines task management, time-blocking calendar routines, an ambient focus timer, and performance analytics into a single cohesive experience.

Designed with an **offline-first and privacy-focused architecture**, StudyFlow requires **zero backend servers or third-party tracking**. All account credentials, study routines, tasks, and analytics are stored locally and encrypted within the user's browser.

---

## Key Features

### 1. Focus Room & Study Timer (`study.html`)

* **Customizable Intervals**: Quick-select presets (25m Pomodoro, 45m deep focus, 60m lecture review) or custom study durations.
* **Task Association**: Bind active tasks directly to focus sessions to track time spent per task or subject.
* **Procedural Ambient Sound Generator (`ambientAudio.js`)**:

  * Synthesizes soothing background soundscapes in real time using the **Web Audio API**—no external audio files or internet streaming needed.
  * Three procedural sound modes:

    * **Rain**: White-noise low-pass filtered to create a soft rainfall soundscape.
    * **Ocean Waves**: Modulated low-frequency oscillation simulating gentle wave swells.
    * **White Noise**: Smooth broadband sound for blocking out environmental noise.
  * Independent master volume slider.
* **Today's Routine Planner**: Calculates a recommended daily study routine based on task deadlines, priorities, and available hours.
* **Quick Notes Scratchpad**: In-session notepad to jot down passing thoughts, formulas, or distractions without breaking flow.
* **Audio Chimes**: Completion alerts to signal session transitions.

### 2. Tasks & Coursework Management (`tasks.html`)

* **Comprehensive Task Details**: Set title, subject, assignment category (*Homework, Assignment, Test, Project, Other*), priority level (*Low, Normal, High*), estimated duration, and due dates.
* **Subtasks & Study Materials**: Break down complex projects into actionable checklists and attach reference material links.
* **Search & Filters**: Real-time keyword search, completion status filtering (*All, Active, Completed*), and sorting by due date, priority, or subject.
* **Quick-Add Modal**: Accessible globally across the app to capture assignments immediately.

### 3. Visual Calendar Planner (`planner.html`)

* **Interactive Monthly Grid**: Clear calendar view showing due dates and scheduled study blocks.
* **Day Details Modal**: Click any day to view all scheduled tasks or directly schedule a new assignment for that date.
* **Upcoming Deadlines Sidebar**: Fast glance at pressing deadlines for the week.

### 4. Progress & Analytics Dashboard (`progress.html`)

* **Weekly Performance Summary**: High-level KPIs tracking total study hours, sessions logged, tasks completed, and overall completion rate.
* **Daily Study Breakdown Chart**: Responsive CSS/SVG bar chart visualizing study time day by day.
* **Subject Distribution**: Insights into time allocation across different subjects (e.g., Mathematics, Physics, History).
* **Activity Log**: Detailed audit log of completed focus blocks and completed coursework.

### 5. Power Features & Quick Navigation

* **Command Palette (`Ctrl + K` / `Cmd + K`)**:

  * Global spotlight modal to jump between pages, create tasks, toggle themes, seed sample data, or trigger backups.
* **One-Click Demo Data (`demoData.js`)**:

  * Instant pre-population of realistic coursework and focus history to test and preview app capabilities.
* **Customization & Themes (`settings.html`)**:

  * Dark / Light mode toggle with smooth color-token transitions.
  * Accent color picker (Olive, Slate, Terracotta, Sage, etc.).
  * Default timer configuration and completion chime settings.
* **Full Data Ownership**:

  * **Export JSON**: Download a complete backup of tasks, calendar plans, sessions, and preferences.
  * **Import JSON**: Restore or transfer your study data across browsers with one click.
  * **Reset Option**: Securely clear local storage if needed.

---

## Privacy & Architecture

* **No Server / No Cloud Required**: Runs 100% in the user's browser.
* **Secure Local Authentication**:

  * Passwords are encrypted client-side using the native **Web Crypto API** (`crypto.subtle.digest` with **SHA-256** and a unique per-account cryptographic salt).
  * Credentials and study data are stored in browser `localStorage`.
* **Zero Build Step**: No Node.js build process, bundlers, or compilation required. Pure modular JavaScript (`type="module"`).

---

## Tech Stack

| Layer           | Technology                | Details                                                            |
| --------------- | ------------------------- | ------------------------------------------------------------------ |
| **Structure**   | Semantic HTML5            | Clean, accessible layouts with ARIA attributes                     |
| **Styling**     | Modern CSS3               | CSS Variables, Flexbox, Grid, Responsive Media Queries             |
| **Typography**  | Google Fonts              | *Fraunces* (editorial serif) & modern system sans-serif            |
| **Logic**       | Vanilla JavaScript (ES6+) | Native ES Modules, async/await, DOM APIs                           |
| **Audio**       | Web Audio API             | Procedural sound generation (`AudioContext`, Biquad filters, LFOs) |
| **Security**    | Web Crypto API            | SHA-256 + salt password hashing                                    |
| **Icons**       | Lucide Icons              | Clean, lightweight SVG icon system via CDN                         |
| **Persistence** | Web Storage API           | `localStorage` with JSON serialization                             |

---

## Project Structure

```text
StudyFlow/
├── index.html                  # Main Dashboard overview & KPIs
├── study.html                  # Focus Room: timer, ambient audio & routines
├── tasks.html                  # Task & coursework list manager
├── planner.html                # Monthly calendar & schedule view
├── progress.html               # Analytics, charts & subject breakdown
├── settings.html               # User profile, appearance, audio prefs & backups
├── welcome.html                # Landing page & user authentication (Sign up/Login)
│
├── css/
│   ├── style.css               # Core variables, resets, global layouts
│   ├── components.css          # Cards, buttons, modals, forms & inputs
│   ├── responsive.css          # Breakpoints for tablet and mobile screens
│   └── welcome.css             # Styles specific to the welcome landing page
│
└── js/
    ├── app.js                  # Main application orchestrator & routing checks
    ├── storage.js              # LocalStorage CRUD & Web Crypto password hashing
    ├── study.js                # Timer engine, routines & focus room logic
    ├── ambientAudio.js         # Procedural Web Audio API sound generator
    ├── tasks.js                # Task CRUD, filters, subtasks & sorting
    ├── planner.js              # Calendar generation & day-view scheduling
    ├── progress.js             # Metrics calculation & progress chart rendering
    ├── settings.js             # Theme customizer, accent color, backup export/import
    ├── theme.js                # Theme loading & light/dark switching
    ├── demoData.js              # Sample datasets for instant previews
    ├── welcome.js              # Auth forms & landing page animations
    │
    └── components/
        ├── command-palette.js  # Ctrl+K spotlight modal & shortcuts
        ├── sidebar.js          # Main navigation bar component
        ├── header.js           # Top header component with breadcrumbs
        ├── toast.js            # Transient notification system
        ├── confirmModal.js     # Accessible confirmation dialogs
        └── settingsModal.js    # In-app settings pop-up dialog
```

---

## Getting Started

### Prerequisites

StudyFlow requires no installation of Node.js, Python, or external databases. Any modern web browser (Chrome, Firefox, Safari, Edge) is supported.

### Running Locally

1. Clone or Download the repository:

```bash
git clone https://github.com/your-username/studyflow.git
cd studyflow
```

2. Serve the Directory:

Because StudyFlow uses ES6 modules (`import/export`), it should be served via a local web server rather than directly opening the file via `file://`.

* **Using VS Code:** Right-click `index.html` and click "Open with Live Server".
* **Using Python 3:**

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

* **Using Node / npx:**

```bash
npx serve .
```

3. Get Started:

* Create a local account on `welcome.html`.
* Press `Ctrl + K` (or `Cmd + K`) and choose **Load Sample / Demo Data** to immediately explore pre-filled coursework and statistics.

---

## Keyboard Shortcuts

| Shortcut               | Action                                 |
| ---------------------- | -------------------------------------- |
| `Ctrl + K` / `Cmd + K` | Open global Command Palette            |
| `Esc`                  | Dismiss open modal, palette, or dialog |

---

## License

This project is open-source and available under the MIT License (`/LICENSE`).
