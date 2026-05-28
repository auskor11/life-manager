import {
    db,
    auth,
    collection,
    getDocs,
    signOut,
    onAuthStateChanged
}
from "./firebase.js";

let expenses = [];
let currentUser = null;
let viewingDate = new Date();
let viewingYear = new Date().getFullYear();

viewingDate.setDate(1);

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadArchive();
});

function expensesCollection() {
    return collection(db, "users", currentUser.uid, "expenses");
}

async function loadArchive() {
    let snapshot = await getDocs(expensesCollection());

    expenses = snapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    renderYearlyGraph();
    renderArchiveMonth();
}

function renderYearlyGraph() {
    document.getElementById("archiveYearTitle").textContent = viewingYear;

    let monthlyNetCash = [];

    for (let month = 0; month < 12; month++) {
        let monthDate = new Date(viewingYear, month, 1);
        let summary = getMonthSummary(monthDate);

        monthlyNetCash.push(summary.netCash);
    }

    drawNetCashChart(monthlyNetCash);
}

function drawNetCashChart(monthlyNetCash) {
    let canvas = document.getElementById("netCashChart");
    let ctx = canvas.getContext("2d");

    let parentWidth = canvas.parentElement.clientWidth;
    canvas.width = parentWidth - 20;

    let width = canvas.width;
    let height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let padding = 36;
    let chartWidth = width - padding * 2;
    let chartHeight = height - padding * 2;

    let maxValue = Math.max(...monthlyNetCash.map(value => Math.abs(value)), 100);

    let zeroY = padding + chartHeight / 2;

    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.strokeStyle = "#999";
    ctx.stroke();

    let barWidth = chartWidth / 12 * 0.6;
    let gap = chartWidth / 12;

    let months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    monthlyNetCash.forEach((value, index) => {
        let x = padding + index * gap + gap * 0.2;
        let barHeight = Math.abs(value) / maxValue * (chartHeight / 2);

        let y = value >= 0
            ? zeroY - barHeight
            : zeroY;

        ctx.fillStyle = value >= 0 ? "#16a34a" : "#dc2626";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#333";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(months[index], x + barWidth / 2, height - 10);
    });
}

function renderArchiveMonth() {
    document.getElementById("archiveMonthTitle").textContent =
        viewingDate.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric"
        });

    let monthPicker = document.getElementById("archiveMonthPicker");

    if (monthPicker) {
        monthPicker.value = getMonthKey(viewingDate);
    }

    let summary = getMonthSummary(viewingDate);

    document.getElementById("archiveCashOut").textContent =
        summary.cashOut.toFixed(2);

    document.getElementById("archiveCashIn").textContent =
        summary.cashIn.toFixed(2);

    document.getElementById("archiveNetCash").textContent =
        summary.netCash.toFixed(2);

    renderCategorySummary(summary.normalExpenses, summary.subscriptionsThisMonth);
    renderCashInGroup(summary.cashIns);
    renderSubscriptionList(summary.subscriptionsThisMonth);
    renderExpenseCategoryGroups(summary.normalExpenses);
}

function getMonthSummary(monthDate) {
    let monthKey = getMonthKey(monthDate);

    let cashIns = expenses.filter(item => {
        return item.type === "cashIn" && item.month === monthKey;
    });

    let normalExpenses = expenses.filter(item => {
        return (
            item.type !== "cashIn" &&
            !item.subscription &&
            item.month === monthKey
        );
    });

    let subscriptions = expenses.filter(item => {
        return item.type !== "cashIn" && item.subscription;
    });

    let subscriptionsThisMonth = subscriptions.filter(subscription => {
        return subscriptionOccursInMonth(subscription, monthDate);
    });

    let cashOut = [
        ...normalExpenses,
        ...subscriptionsThisMonth
    ].reduce((sum, item) => {
        return sum + Number(item.price);
    }, 0);

    let cashIn = cashIns.reduce((sum, item) => {
        return sum + Number(item.amount);
    }, 0);

    return {
        cashIns,
        normalExpenses,
        subscriptionsThisMonth,
        cashOut,
        cashIn,
        netCash: cashIn - cashOut
    };
}

function renderCategorySummary(normalExpenses, subscriptionsThisMonth) {
    let container = document.getElementById("archiveCategorySummary");

    let categories = getCategoryGroups([
        ...normalExpenses,
        ...subscriptionsThisMonth
    ]);

    container.innerHTML = `
        <div class="category-summary">
            ${Object.keys(categories).map(category => {
                let total = categories[category].reduce((sum, expense) => {
                    return sum + Number(expense.price);
                }, 0);

                return `
                    <div class="category-row">
                        <span>${category}</span>
                        <strong>$${total.toFixed(2)}</strong>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderCashInGroup(cashIns) {
    let list = document.getElementById("archiveCashInList");
    list.innerHTML = "";

    if (cashIns.length === 0) {
        list.innerHTML = "<li>No cash in for this month.</li>";
        return;
    }

    let total = cashIns.reduce((sum, item) => {
        return sum + Number(item.amount);
    }, 0);

    let wrapper = document.createElement("li");
    wrapper.classList.add("expense-category-card");

    wrapper.innerHTML = `
        <button class="expense-category-toggle"
                onclick="toggleExpenseCategory('archive-cash-in')">
            <span>▶ Cash In</span>
            <strong>+$${total.toFixed(2)}</strong>
        </button>

        <div id="expense-category-archive-cash-in"
             class="expense-category-content">
            ${cashIns.map(item => `
                <div class="compact-expense-item cash-in-compact">
                    <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <p>${item.date}</p>
                    </div>

                    <div class="compact-expense-price cash-in-price">
                        +$${Number(item.amount).toFixed(2)}
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    list.append(wrapper);
}

function renderSubscriptionList(subscriptions) {
    let list = document.getElementById("archiveSubscriptionList");
    list.innerHTML = "";

    if (subscriptions.length === 0) {
        list.innerHTML = "<li>No subscription renewals for this month.</li>";
        return;
    }

    let groups = {
        Monthly: subscriptions.filter(item => {
            return (item.subscriptionType || "Monthly") === "Monthly";
        }),

        Yearly: subscriptions.filter(item => {
            return item.subscriptionType === "Yearly";
        })
    };

    Object.keys(groups).forEach(type => {
        let group = groups[type];

        if (group.length === 0) return;

        let total = group.reduce((sum, item) => {
            return sum + Number(item.price);
        }, 0);

        let groupId = `archive-subscription-${type}`;

        let wrapper = document.createElement("li");
        wrapper.classList.add("expense-category-card");

        wrapper.innerHTML = `
            <button class="expense-category-toggle"
                    onclick="toggleExpenseCategory('${groupId}')">
                <span>▶ ${type} Subscriptions</span>
                <strong>$${total.toFixed(2)}</strong>
            </button>

            <div id="expense-category-${groupId}"
                 class="expense-category-content">
                ${group.map(item => `
                    <div class="compact-expense-item">
                        <div>
                            <strong>${escapeHtml(item.name)}</strong>
                            <p>
                                Category: ${item.category}<br>
                                Started: ${item.subscriptionStartDate || item.date}
                                ${
                                    item.subscriptionType === "Yearly"
                                        ? `<br>Monthly equivalent: $${(Number(item.price) / 12).toFixed(2)}`
                                        : ""
                                }
                            </p>
                        </div>

                        <div class="compact-expense-price">
                            $${Number(item.price).toFixed(2)}
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        list.append(wrapper);
    });
}

function renderExpenseCategoryGroups(normalExpenses) {
    let list = document.getElementById("archiveExpenseList");
    list.innerHTML = "";

    if (normalExpenses.length === 0) {
        list.innerHTML = "<li>No normal expenses for this month.</li>";
        return;
    }

    let categories = getCategoryGroups(normalExpenses);

    Object.keys(categories).forEach(category => {
        let categoryExpenses = categories[category];

        if (categoryExpenses.length === 0) return;

        let total = categoryExpenses.reduce((sum, item) => {
            return sum + Number(item.price);
        }, 0);

        let categoryId = `archive-${category.replace(/\s+/g, "-")}`;

        let wrapper = document.createElement("li");
        wrapper.classList.add("expense-category-card");

        wrapper.innerHTML = `
            <button class="expense-category-toggle"
                    onclick="toggleExpenseCategory('${categoryId}')">
                <span>▶ ${category}</span>
                <strong>$${total.toFixed(2)}</strong>
            </button>

            <div id="expense-category-${categoryId}"
                 class="expense-category-content">
                ${categoryExpenses.map(item => `
                    <div class="compact-expense-item">
                        <div>
                            <strong>${escapeHtml(item.name)}</strong>
                            <p>${item.date}</p>
                        </div>

                        <div class="compact-expense-price">
                            $${Number(item.price).toFixed(2)}
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        list.append(wrapper);
    });
}

function getCategoryGroups(items) {
    let categories = {
        Entertainment: [],
        Food: [],
        Studies: [],
        Transportation: [],
        PayNow: [],
        Others: []
    };

    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }

        categories[item.category].push(item);
    });

    return categories;
}

function subscriptionOccursInMonth(subscription, monthDate) {
    let startDate = subscription.subscriptionStartDate || subscription.date;

    if (!startDate) return false;

    let start = parseDate(startDate);

    let viewYear = monthDate.getFullYear();
    let viewMonth = monthDate.getMonth();

    let startYear = start.getFullYear();
    let startMonth = start.getMonth();

    if (
        viewYear < startYear ||
        (viewYear === startYear && viewMonth < startMonth)
    ) {
        return false;
    }

    if (subscription.subscriptionType === "Yearly") {
        return viewMonth === startMonth;
    }

    return true;
}

function previousArchiveMonth() {
    viewingDate.setMonth(viewingDate.getMonth() - 1);
    renderArchiveMonth();
}

function nextArchiveMonth() {
    viewingDate.setMonth(viewingDate.getMonth() + 1);
    renderArchiveMonth();
}

function jumpToArchiveMonth() {
    let picker = document.getElementById("archiveMonthPicker");

    if (!picker || !picker.value) return;

    let [year, month] = picker.value.split("-").map(Number);

    viewingDate = new Date(year, month - 1, 1);

    renderArchiveMonth();
}

function previousArchiveYear() {
    viewingYear--;
    renderYearlyGraph();
}

function nextArchiveYear() {
    viewingYear++;
    renderYearlyGraph();
}

function toggleExpenseCategory(categoryId) {
    let content = document.getElementById(`expense-category-${categoryId}`);

    if (!content) return;

    content.classList.toggle("open");
}

function getMonthKey(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

function parseDate(dateString) {
    let [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
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

window.previousArchiveMonth = previousArchiveMonth;
window.nextArchiveMonth = nextArchiveMonth;
window.jumpToArchiveMonth = jumpToArchiveMonth;
window.previousArchiveYear = previousArchiveYear;
window.nextArchiveYear = nextArchiveYear;
window.toggleExpenseCategory = toggleExpenseCategory;
window.toggleSidebar = toggleSidebar;
window.logout = logout;