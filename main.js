import {
    db,
    auth,
    collection,
    getDocs,
    signOut,
    onAuthStateChanged
}
from "./firebase.js";

let tasks = [];
let events = [];
let currentUser = null;

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadDashboardData();
});

async function loadDashboardData() {
    let taskSnapshot = await getDocs(
        collection(db, "users", currentUser.uid, "tasks")
    );

    let eventSnapshot = await getDocs(
        collection(db, "users", currentUser.uid, "events")
    );

    tasks = taskSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    events = eventSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    updateDashboard();
    renderUpcomingEvents();
}

function updateDashboard() {
    let activeTasks = tasks.filter(task => !task.completed).length;
    let completedTasks = tasks.filter(task => task.completed).length;

    document.getElementById("activeCount").textContent = activeTasks;
    document.getElementById("completedCount").textContent = completedTasks;
}

function parseDate(dateString) {
    let [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function getNextOccurrence(dateString) {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let original = parseDate(dateString);

    let next = new Date(
        today.getFullYear(),
        original.getMonth(),
        original.getDate()
    );

    if (next < today) {
        next.setFullYear(next.getFullYear() + 1);
    }

    return next;
}

function renderUpcomingEvents() {
    let container = document.getElementById("upcomingEvents");
    let upcoming = [];

    tasks.forEach(task => {
        if (!task.completed && task.deadline) {
            upcoming.push({
                name: `Task: ${task.name}`,
                date: parseDate(task.deadline)
            });
        }
    });

    events.forEach(event => {
        let startDate = event.startDate || event.date;

        if (!startDate) return;

        let displayDate = event.yearly
            ? getNextOccurrence(startDate)
            : parseDate(startDate);

        upcoming.push({
            name: event.yearly ? `${event.name} 🎉` : event.name,
            date: displayDate
        });
    });

    upcoming.sort((a, b) => a.date - b.date);
    upcoming = upcoming.slice(0, 2);

    container.innerHTML = "";

    if (upcoming.length === 0) {
        container.innerHTML = "<p>No upcoming events</p>";
        return;
    }

    upcoming.forEach(item => {
        container.innerHTML += `
            <div class="upcoming-item">
                <strong>${escapeHtml(item.name)}</strong>
                <p>
                    ${item.date.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}
                </p>
            </div>
        `;
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

async function logout() {
    await signOut(auth);
    window.location.href = "login.html";
}

function escapeHtml(text) {
    let div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

window.toggleSidebar = toggleSidebar;
window.logout = logout;