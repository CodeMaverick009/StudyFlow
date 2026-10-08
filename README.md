# StudyFlow

> A modern study management platform designed to help students organize, plan, study, and track their schoolwork in one place.

## About

StudyFlow is a student-focused productivity website created to make managing schoolwork easier.

Instead of using separate tools for tasks, planning, studying, and tracking progress, StudyFlow brings everything together into one simple workspace.

The project was designed with a focus on **clarity, usability, privacy, and a calm modern interface**.

## Features

### Dashboard
Get a quick overview of your schoolwork and what needs your attention.

- Today's tasks
- Upcoming deadlines
- Planned study sessions
- Study progress
- Quick Add for new tasks
- Daily overview

### Planner
Plan your schoolwork and study sessions around your schedule.

- Monthly calendar
- Scheduled study sessions
- Task planning
- Daily planning
- Task details and deadlines

### Tasks & Materials
Keep all your schoolwork organized in one place.

- Create, edit, and delete tasks
- Subjects and task types
- Due dates
- Estimated study time
- Difficulty and priority
- Subtasks
- Study materials
- Search, filtering, and sorting
- Mark tasks as completed

### Study
Turn your planned work into focused study sessions.

- Plan My Day
- Planned sessions
- Focus sessions
- Study timer
- Session tracking
- Task-based studying

### Progress
See how your work is adding up over time.

- Study time
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
- Local profile settings
- Data export and import
- Reset local data

## Design

StudyFlow uses a clean and calm visual style designed specifically for students.

The interface combines:

- Warm neutral colors
- Terracotta accents
- Olive green secondary colors
- Clear typography
- Minimal animations
- Responsive layouts
- Consistent components
- Accessible navigation

The goal is to make the interface feel **modern and technological without becoming distracting**.

## Technology

StudyFlow is built using standard web technologies:

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- JavaScript ES Modules
- LocalStorage
- Lucide Icons

No React or TypeScript is used.

## Data & Privacy

StudyFlow is designed with a local-first approach.

Your tasks, study sessions, routines, and settings are stored locally in your browser using `localStorage`.

This means the current version does not require a backend or database to manage your schoolwork.

> Your data stays in your browser unless you choose to export it.

## Project Structure

```text
StudyFlow/
│
├── assets/
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
│   ├── app.js
│   ├── planner.js
│   ├── progress.js
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
├── study.html
├── tasks.html
└── welcome.html