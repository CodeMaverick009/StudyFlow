# StudyFlow

> **Your schoolwork, in flow.**

StudyFlow is a modern study management platform designed for secondary-school students. It brings tasks, planning, focused study sessions, and progress tracking together in one organized workspace.

## Features

### Dashboard

Get a quick overview of your schoolwork and what needs your attention.

- Today's tasks
- Upcoming deadlines
- Planned study sessions
- Study progress
- Quick Add
- Daily overview

### Tasks & Materials

Manage all your schoolwork in one place.

- Create, edit, and delete tasks
- Organize tasks by subject and type
- Set due dates
- Set estimated study time
- Set difficulty and priority
- Add task descriptions
- Create subtasks
- Add study materials
- Search tasks
- Filter tasks
- Sort tasks
- Mark tasks as completed

### Planner

Plan your schoolwork and study sessions with a visual calendar.

- Monthly calendar
- Schedule tasks
- Schedule study sessions
- View upcoming work
- Plan study time around deadlines
- View task details

### Study

Turn your plans into focused study sessions.

- Plan My Day
- Create study sessions
- Focus timer
- Track study sessions
- Study by task
- Ambient study audio
- Session completion tracking

### Progress

See how your work is adding up over time.

- Total study time
- Completed tasks
- Completion rate
- Weekly study activity
- Study time by subject
- Recent study activity

### Settings

Customize your StudyFlow experience.

- Light and dark themes
- Accent colors
- Focus timer settings
- Sound notifications
- Profile settings
- Export data
- Import data
- Reset local data

## Design

StudyFlow is designed around a clean, calm, and student-focused interface.

The design uses:

- Warm neutral colors
- Terracotta accents
- Olive green secondary colors
- Clear typography
- Consistent spacing
- Minimal animations
- Responsive layouts
- Simple navigation
- Subtle technological elements

The goal is to create a modern productivity experience without making the interface distracting.

## Technology

StudyFlow is built using:

- HTML5
- CSS3
- Vanilla JavaScript
- JavaScript ES Modules
- LocalStorage
- Lucide Icons

StudyFlow does not use React or TypeScript.

## Data & Privacy

StudyFlow currently uses a local-first architecture.

Tasks, study sessions, routines, settings, and other application data are stored locally in the user's browser using `localStorage`.

The current version does not require a backend database.

Users can export and import their StudyFlow data through the Settings page.

> Your StudyFlow data stays in your browser unless you choose to export it.

## How It Works

StudyFlow is built around a simple workflow:

```text
Add Tasks
    ↓
Plan Your Work
    ↓
Schedule Study Sessions
    ↓
Focus & Study
    ↓
Track Progress
```

The different sections of StudyFlow share the same application data, allowing changes made in one part of the platform to appear throughout the rest of the application.

## Project Structure

```text
StudyFlow/
│
├── assets/
│
├── audio/
│
├── css/
│   ├── components.css
│   ├── responsive.css
│   ├── style.css
│   └── welcome.css
│
├── js/
│   ├── components/
│   │   ├── header.js
│   │   └── sidebar.js
│   │
│   ├── ambientAudio.js
│   ├── app.js
│   ├── demoData.js
│   ├── planner.js
│   ├── progress.js
│   ├── settings.js
│   ├── state.js
│   ├── storage.js
│   ├── study.js
│   ├── tasks.js
│   ├── theme.js
│   └── welcome.js
│
├── index.html
├── planner.html
├── progress.html
├── settings.html
├── study.html
├── tasks.html
├── welcome.html
│
├── .gitignore
└── README.md
```

## Getting Started

### Clone the repository

```bash
git clone https://github.com/CodeMaverick009/StudyFlow.git
```

### Open the project

Open the project folder in Visual Studio Code or another code editor.

### Run the project locally

Because StudyFlow uses JavaScript modules, it is recommended to run the project using a local development server.

For Visual Studio Code:

1. Install the Live Server extension.
2. Open the StudyFlow project.
3. Open `welcome.html`.
4. Select **Go Live**.

StudyFlow will then open in your browser.

## Live Website

**StudyFlow:**  
https://studyflowplatform.vercel.app/

## Future Development

Possible future improvements include:

- AI-assisted study planning
- Cloud synchronization
- Secure user authentication
- Cross-device synchronization
- School platform integrations
- More advanced analytics
- Calendar integrations
- Personalized study recommendations

These features are not part of the current core implementation.

## Project Goal

The goal of StudyFlow is simple:

> **Help students spend less time organizing schoolwork and more time actually studying.**

## License

This project was created as part of an Computer Science school project.
