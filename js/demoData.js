// =========================================================
// STUDYFLOW — DEMO DATA & BACKUP MANAGEMENT
// =========================================================

import { getTasks, saveTasks, getStudySessions, saveStudySessions, getPlannerSessions, savePlannerSessions } from "./storage.js";
import { showToast } from "./components/toast.js";
import { exportBackupData } from "./backup.js";

export function loadDemoData() {
    const today = new Date();
    const formatDate = (offsetDays) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split("T")[0];
    };

    const demoTasks = [
        {
            id: crypto.randomUUID(),
            title: "Review Calculus Chapter 4 Derivatives",
            description: "Practice product rule and chain rule problems.",
            dueDate: formatDate(0),
            priority: "high",
            category: "Math",
            status: "pending",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            title: "Draft History Essay Outline",
            description: "Thesis statement on the impact of the Industrial Revolution.",
            dueDate: formatDate(1),
            priority: "high",
            category: "History",
            status: "pending",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            title: "Physics Lab Report - Pendulum Motion",
            description: "Calculate percentage error and graph results.",
            dueDate: formatDate(2),
            priority: "medium",
            category: "Physics",
            status: "pending",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            title: "Read Computer Science Ch 3 Data Structures",
            description: "Focus on linked list operations and Big-O time complexity.",
            dueDate: formatDate(-1),
            priority: "low",
            category: "CS",
            status: "completed",
            completed: true,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            title: "Biology Flashcards Review",
            description: "Cellular respiration & photosynthesis terminology.",
            dueDate: formatDate(3),
            priority: "medium",
            category: "Biology",
            status: "pending",
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];

    const demoSessions = [
        {
            id: crypto.randomUUID(),
            subject: "Math",
            durationMinutes: 45,
            date: formatDate(0),
            completedAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            subject: "Computer Science",
            durationMinutes: 60,
            date: formatDate(-1),
            completedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            subject: "Physics",
            durationMinutes: 30,
            date: formatDate(-2),
            completedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ];

    const demoPlanner = [
        {
            id: crypto.randomUUID(),
            title: "Math Deep Work",
            subject: "Math",
            dayOfWeek: today.getDay(),
            startTime: "10:00",
            endTime: "11:30"
        },
        {
            id: crypto.randomUUID(),
            title: "History Writing Session",
            subject: "History",
            dayOfWeek: (today.getDay() + 1) % 7,
            startTime: "14:00",
            endTime: "15:30"
        }
    ];

    saveTasks(demoTasks);
    saveStudySessions(demoSessions);
    savePlannerSessions(demoPlanner);

    document.dispatchEvent(new CustomEvent("tasks:changed"));
    document.dispatchEvent(new CustomEvent("planner:changed"));

    showToast({
        message: "Demo study data loaded successfully!",
        type: "success"
    });
}

export function exportUserData() {
    exportBackupData();
}
