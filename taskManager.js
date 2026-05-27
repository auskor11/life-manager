import {
    db,
    auth,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    signOut,
    onAuthStateChanged
}
from "./firebase.js";

let tasks = [];
let editingId = null;
let currentUser = null;

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadTasks();
});

function tasksCollection() {
    return collection(db, "users", currentUser.uid, "tasks");
}

function taskDoc(firebaseId) {
    return doc(db, "users", currentUser.uid, "tasks", firebaseId);
}

async function loadTasks() {
    let snapshot = await getDocs(tasksCollection());

    tasks = snapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    renderTasks();
}

async function addTask() {
    let taskInput = document.getElementById("taskInput");
    let deadlineInput = document.getElementById("taskDeadLine");

    let task = taskInput.value.trim();
    let deadline = deadlineInput.value;

    if (task === "") return;

    let newTask = {
        name: task,
        deadline: deadline,
        completed: false,
        completedDate: null,
        createdAt: Date.now()
    };

    await addDoc(tasksCollection(), newTask);

    taskInput.value = "";
    deadlineInput.value = "";

    loadTasks();
}

function renderTasks() {
    let searchInput = document.getElementById("archiveSearch");
    let searchText = "";

    if (searchInput) {
        searchText = searchInput.value.toLowerCase();
    }

    sortTasks();

    let taskList = document.getElementById("taskList");
    let archiveList = document.getElementById("archiveList");

    taskList.innerHTML = "";
    archiveList.innerHTML = "";

    tasks.forEach(task => {
        let li = document.createElement("li");

        if (!task.completed) {
            let isEditing = task.firebaseId === editingId;

            if (isEditing) {
                li.innerHTML = `
                    <input id="edit-name-${task.firebaseId}" value="${escapeHtml(task.name)}">
                    <input id="edit-deadline-${task.firebaseId}" value="${task.deadline || ""}" type="date">
                    <button onclick="saveEdit('${task.firebaseId}')">Save</button>
                    <button onclick="cancelEdit()">Cancel</button>
                `;
            } else {
                li.innerHTML = `
                    <div class="task-name">${escapeHtml(task.name)}</div><br>

                    <div class="task-deadline">
                        Deadline: ${task.deadline || "No Deadline"}
                    </div>

                    ${isOverdue(task.deadline) ? '<span style="color:red">(OVERDUE)</span>' : ""}<br>

                    <button onclick="editTask('${task.firebaseId}')">Edit</button>
                    <button onclick="completeTask('${task.firebaseId}')">Complete</button>
                `;

                if (isOverdue(task.deadline)) {
                    li.classList.add("overdue");
                }
            }

            taskList.append(li);
        } else {
            let matchesSearch =
                task.name.toLowerCase().includes(searchText) ||
                (task.completedDate && task.completedDate.includes(searchText));

            if (!matchesSearch) return;

            li.innerHTML = `
                <div class="task-name">${escapeHtml(task.name)}</div><br>

                <div class="task-deadline">
                    Deadline: ${task.deadline || "No Deadline"}<br>
                </div>

                <div class="task-completed">
                    Completed on: ${task.completedDate}
                    ${isOverdue(task.deadline) ? '<span class="late-tag">(Was Overdue)</span>' : ""}<br>
                </div>
            `;

            archiveList.append(li);
        }
    });

    if (taskList.innerHTML === "") {
        taskList.innerHTML = "<li>No active tasks.</li>";
    }

    if (archiveList.innerHTML === "") {
        archiveList.innerHTML = "<li>No archived tasks found.</li>";
    }
}

async function completeTask(firebaseId) {
    let today = new Date();

    await updateDoc(taskDoc(firebaseId), {
        completed: true,
        completedDate: today.toISOString().split("T")[0]
    });

    loadTasks();
}

async function removeTasks() {
    for (let task of tasks) {
        await deleteDoc(taskDoc(task.firebaseId));
    }

    loadTasks();
}

function editTask(firebaseId) {
    editingId = firebaseId;
    renderTasks();
}

async function saveEdit(firebaseId) {
    let newName = document.getElementById(`edit-name-${firebaseId}`).value.trim();
    let newDeadline = document.getElementById(`edit-deadline-${firebaseId}`).value;

    if (newName === "") return;

    await updateDoc(taskDoc(firebaseId), {
        name: newName,
        deadline: newDeadline
    });

    editingId = null;
    loadTasks();
}

function cancelEdit() {
    editingId = null;
    renderTasks();
}

function isOverdue(deadline) {
    if (!deadline) return false;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let taskDate = parseDate(deadline);
    taskDate.setHours(0, 0, 0, 0);

    return taskDate < today;
}

function parseDate(dateString) {
    let [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function sortTasks() {
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed;
        }

        let aHasDate = !!a.deadline;
        let bHasDate = !!b.deadline;

        if (!aHasDate && bHasDate) return 1;
        if (aHasDate && !bHasDate) return -1;

        if (aHasDate && bHasDate) {
            return parseDate(a.deadline) - parseDate(b.deadline);
        }

        return (a.createdAt || 0) - (b.createdAt || 0);
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

window.addTask = addTask;
window.renderTasks = renderTasks;
window.completeTask = completeTask;
window.removeTasks = removeTasks;
window.editTask = editTask;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.toggleSidebar = toggleSidebar;
window.logout = logout;