import {
    db,
    auth,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    signOut,
    onAuthStateChanged
}
from "./firebase.js";

let events = [];
let loans = [];
let tasks = [];
let expenses = [];
let currentDate = new Date();
let currentUser = null;

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadData();
});

function eventsCollection() {
    return collection(db, "users", currentUser.uid, "events");
}

function tasksCollection() {
    return collection(db, "users", currentUser.uid, "tasks");
}

function expensesCollection() {
    return collection(db, "users", currentUser.uid, "expenses");
}

function loansCollection() {
    return collection(db, "users", currentUser.uid, "loans");
}

function eventDoc(firebaseId) {
    return doc(db, "users", currentUser.uid, "events", firebaseId);
}

function parseDate(dateString) {
    let [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getSubscriptionRenewalDates(subscription) {

    let renewalDates = [];

    if (!subscription.subscription)
        return renewalDates;

    let startDate =
    subscription.subscriptionStartDate
    || subscription.date;

    if (!startDate)
        return renewalDates;

    let current =
    parseDate(startDate);

    let currentMonth =
    currentDate.getMonth();

    let currentYear =
    currentDate.getFullYear();

    current.setHours(0,0,0,0);

    if (
        subscription.subscriptionType
        === "Yearly"
    ) {

        let renewal =
        new Date(
            currentYear,
            current.getMonth(),
            current.getDate()
        );

        renewalDates.push(
            formatDate(renewal)
        );

    }

    else {

        let renewal =
        new Date(
            currentYear,
            currentMonth,
            current.getDate()
        );

        renewalDates.push(
            formatDate(renewal)
        );

    }

    return renewalDates;
}

async function loadData() {
    let loanSnapshot = await getDocs(loansCollection());
    let eventSnapshot = await getDocs(eventsCollection());
    let taskSnapshot = await getDocs(tasksCollection());
    let expenseSnapshot = await getDocs(expensesCollection());

    events = eventSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    tasks = taskSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    expenses = expenseSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    loans = loanSnapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    renderEvents();
    renderCalendar();
}

function isOverdue(deadline) {
    if (!deadline) return false;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let taskDate = parseDate(deadline);
    taskDate.setHours(0, 0, 0, 0);

    return taskDate < today;
}

function getNextOccurrence(eventDate) {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let original = parseDate(eventDate);

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

function getDateRange(startDate, endDate) {
    let dates = [];

    let current = parseDate(startDate);
    let last = parseDate(endDate);

    current.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);

    while (current <= last) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

async function addEvent() {
    let nameInput = document.getElementById("eventName");
    let startDateInput = document.getElementById("eventStartDate");
    let endDateInput = document.getElementById("eventEndDate");
    let yearlyInput = document.getElementById("eventYearly");

    let name = nameInput.value.trim();
    let startDate = startDateInput.value;
    let endDate = endDateInput.value || startDate;

    if (name === "" || startDate === "") return;

    if (parseDate(endDate) < parseDate(startDate)) {
        alert("End date cannot be before start date.");
        return;
    }

    let newEvent = {
        name: name,
        startDate: startDate,
        endDate: endDate,
        yearly: yearlyInput.checked,
        createdAt: Date.now()
    };

    await addDoc(eventsCollection(), newEvent);

    nameInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    yearlyInput.checked = false;

    loadData();
}

async function removeEvent(firebaseId) {
    await deleteDoc(eventDoc(firebaseId));
    loadData();
}

function renderEvents() {
    let eventList = document.getElementById("eventList");
    eventList.innerHTML = "";

    let sortedEvents = [...events].sort((a, b) => {
        let aStart = a.startDate || a.date;
        let bStart = b.startDate || b.date;

        let dateA = a.yearly ? getNextOccurrence(aStart) : parseDate(aStart);
        let dateB = b.yearly ? getNextOccurrence(bStart) : parseDate(bStart);

        return dateA - dateB;
    });

    sortedEvents.forEach(event => {
        let li = document.createElement("li");

        let start = event.startDate || event.date;
        let end = event.endDate || event.date || start;

        let displayStart = event.yearly
            ? getNextOccurrence(start)
            : parseDate(start);

        let displayEnd = event.yearly
            ? getNextOccurrence(end)
            : parseDate(end);

        li.innerHTML = `
            <strong>${escapeHtml(event.name)}</strong><br>

            Date:
            ${displayStart.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            })}

            ${
                start !== end
                    ? ` - ${displayEnd.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}`
                    : ""
            }

            ${event.yearly ? '<span class="yearly-tag">Yearly</span>' : ""}

            <br>

            <button onclick="removeEvent('${event.firebaseId}')">Remove</button>
        `;

        eventList.append(li);
    });

    if (eventList.innerHTML === "") {
        eventList.innerHTML = "<li>No upcoming events.</li>";
    }
}

function renderCalendar() {
    let calendarGrid = document.getElementById("calendarGrid");
    let calendarTitle = document.getElementById("calendarTitle");

    calendarGrid.innerHTML = "";

    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();

    let monthName = currentDate.toLocaleString("default", {
        month: "long"
    });

    calendarTitle.textContent = `${monthName} ${year}`;

    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        let emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-cell", "empty-cell");
        calendarGrid.append(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        let cell = document.createElement("div");
        cell.classList.add("calendar-cell");

        let fullDate =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        let today = new Date();

        let todayDate =
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        if (fullDate === todayDate) {
            cell.classList.add("today-cell");
        }

        cell.innerHTML = `<strong>${day}</strong>`;

        let items = getItemsForDate(fullDate);

        items.forEach(item => {
            let itemDiv = document.createElement("div");

            if (item.type === "task") {
                itemDiv.classList.add("calendar-task");
            } else if (item.type === "overdue-task") {
                itemDiv.classList.add("calendar-overdue-task");
            } else if (item.type === "subscription") {
                itemDiv.classList.add("calendar-subscription");
            } else if (item.type === "loan") {
                itemDiv.classList.add("calendar-loan");
            } else if (item.type === "overdue-loan") {
                itemDiv.classList.add("calendar-overdue-loan");
            } else {
                itemDiv.classList.add("calendar-event");
            }

            itemDiv.textContent = item.name;
            cell.append(itemDiv);
        });

        calendarGrid.append(cell);
    }
}

function getItemsForDate(date) {
    let result = [];

    events.forEach(event => {
        let start = event.startDate || event.date;
        let end = event.endDate || event.date || start;

        if (!start) return;

        if (event.yearly) {
            let selectedDate = parseDate(date);
            let selectedMonth = selectedDate.getMonth();
            let selectedDay = selectedDate.getDate();

            let eventDates = getDateRange(start, end);

            eventDates.forEach(eventDate => {
                let original = parseDate(eventDate);

                if (
                    original.getMonth() === selectedMonth &&
                    original.getDate() === selectedDay
                ) {
                    result.push({
                        name: `${event.name} 🔁`,
                        type: "event"
                    });
                }
            });
        } else {
            let eventDates = getDateRange(start, end);

            if (eventDates.includes(date)) {
                result.push({
                    name: start !== end
                        ? `${event.name} (${start === date ? "Start" : end === date ? "End" : "Ongoing"})`
                        : event.name,
                    type: "event"
                });
            }
        }
    });

    tasks.forEach(task => {
        if (!task.completed && task.deadline === date) {
            result.push({
                name: isOverdue(task.deadline)
                    ? `Overdue: ${task.name}`
                    : `Task: ${task.name}`,
                type: isOverdue(task.deadline)
                    ? "overdue-task"
                    : "task"
            });
        }
    });

    expenses.forEach(expense => {
        if (!expense.subscription) return;

        let renewalDates =
        getSubscriptionRenewalDates(expense);

        if (renewalDates.includes(date)) {
            result.push({
                name:
                `Subscription: ${expense.name} $${Number(expense.price).toFixed(2)}`,
                type:
                "subscription"
            });
        }
    });

    loans.forEach(loan => {
        if (!loan.dueDate || loan.dueDate !== date) return;

        let people = getLoanPeopleArray(loan);

        let unpaidPeople = people.filter(person => {
            return !person.settled;
        });

        if (unpaidPeople.length === 0) return;

        let unpaidTotal = unpaidPeople.reduce((sum, person) => {
            let amount = Number(person.amount || 0);
            let paid = Number(person.paidAmount || 0);

            return sum + Math.max(amount - paid, 0);
        }, 0);

        let label =
            loan.type === "owedToMe"
                ? `Loan due: ${loan.title} +$${unpaidTotal.toFixed(2)}`
                : `Debt due: ${loan.title} -$${unpaidTotal.toFixed(2)}`;

        result.push({
            name: label,
            type: isOverdue(loan.dueDate)
                ? "overdue-loan"
                : "loan"
        });
    });

    return result;
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function getLoanPeopleArray(loan) {
    if (Array.isArray(loan.people)) {
        return loan.people;
    }

    return [];
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
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

window.addEvent = addEvent;
window.removeEvent = removeEvent;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.toggleSidebar = toggleSidebar;
window.logout = logout;