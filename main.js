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

function getTodayString() {
    let today = new Date();

    return formatDate(today);
}

function formatDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function daysBetween(todayDate, targetDate) {
    let today = parseDate(todayDate);
    let target = parseDate(targetDate);

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    let diff = target - today;

    return Math.round(diff / (1000 * 60 * 60 * 24));
}

function renderNotifications() {
    let notificationBox =
    document.getElementById("notificationBox");

    let notificationList =
    document.getElementById("notificationList");

    if (!notificationBox || !notificationList) return;

    let today =
    getTodayString();

    let reminders = [];

    tasks.forEach(task => {
        if (!task.completed && task.deadline) {
            let daysLeft =
            daysBetween(today, task.deadline);

            if (
                daysLeft === 7 ||
                daysLeft === 1 ||
                daysLeft === 0
            ) {
                reminders.push({
                    type: "Task",
                    name: task.name,
                    date: task.deadline,
                    daysLeft: daysLeft
                });
            }
        }
    });

    events.forEach(event => {
        let startDate =
        event.startDate || event.date;

        if (!startDate) return;

        let eventDate =
        event.yearly
        ? formatDate(getNextOccurrence(startDate))
        : startDate;

        let daysLeft =
        daysBetween(today, eventDate);

        if (
            daysLeft === 7 ||
            daysLeft === 1
        ) {
            reminders.push({
                type: "Event",
                name: event.name,
                date: eventDate,
                daysLeft: daysLeft
            });
        }
    });

    reminders.sort((a, b) => {
        return parseDate(a.date) - parseDate(b.date);
    });

    notificationList.innerHTML = "";

    if (reminders.length === 0) {
        notificationBox.style.display = "none";
        return;
    }

    notificationBox.style.display = "block";

    reminders.forEach(item => {
        let label = "";

        if (item.daysLeft === 0) {
            label = "Due today";
        } else if (item.daysLeft === 1) {
            label = "Tomorrow";
        } else if (item.daysLeft === 7) {
            label = "In 1 week";
        }

        notificationList.innerHTML += `
            <div class="notification-item">
                <strong>
                    ${escapeHtml(item.type)}:
                    ${escapeHtml(item.name)}
                </strong>
                <br>

                Date: ${item.date}
                <br>

                <span class="notification-days">
                    ${label}
                </span>
            </div>
        `;
    });

    setTimeout(() => {
        alert(
            `🔔 You have ${reminders.length} upcoming reminder(s).`
        );
    }, 500);
}

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
    renderNotifications();
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