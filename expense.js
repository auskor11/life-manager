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

let expenses = [];
let currentUser = null;
let viewingDate = new Date();

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadExpenses();
});

function expensesCollection() {
    return collection(
        db,
        "users",
        currentUser.uid,
        "expenses"
    );
}

function expenseDoc(firebaseId) {
    return doc(
        db,
        "users",
        currentUser.uid,
        "expenses",
        firebaseId
    );
}

async function loadExpenses() {
    let snapshot =
    await getDocs(expensesCollection());

    expenses =
    snapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    renderExpenses();
}

async function addExpense() {

    let nameInput =
    document.getElementById("expenseName");

    let categoryInput =
    document.getElementById("expenseCategory");

    let priceInput =
    document.getElementById("expensePrice");

    let subscriptionInput =
    document.getElementById("expenseSubscription");

    let subscriptionTypeInput =
    document.getElementById("subscriptionType");

    let subscriptionStartDateInput =
    document.getElementById("subscriptionStartDate");

    let name =
    nameInput.value.trim();

    let category =
    categoryInput.value;

    let price =
    Number(priceInput.value);

    let subscription =
    subscriptionInput.checked;

    if (name === "" || !price || price <= 0)
        return;

    let today = new Date();

    let subscriptionStartDate =
    subscription
    ? subscriptionStartDateInput.value
    : null;

    if (
        subscription &&
        subscriptionStartDate === ""
    ) {
        alert(
            "Please enter a subscription start date."
        );
        return;
    }

    let newExpense = {

        type: "expense",

        name: name,

        category: category,

        price: price,

        subscription: subscription,

        subscriptionType:
        subscription
        ? subscriptionTypeInput.value
        : null,

        subscriptionStartDate:
        subscription
        ? subscriptionStartDate
        : null,

        date:
        subscription
        ? subscriptionStartDate
        : formatDate(today),

        month:
        subscription
        ? subscriptionStartDate.slice(0, 7)
        : getMonthKey(today),

        createdAt: Date.now()
    };

    await addDoc(
        expensesCollection(),
        newExpense
    );

    nameInput.value = "";
    priceInput.value = "";

    subscriptionInput.checked = false;

    subscriptionTypeInput.value =
    "Monthly";

    subscriptionStartDateInput.value = "";

    document.getElementById(
        "subscriptionOptions"
    ).style.display = "none";

    loadExpenses();
}

async function addCashIn() {

    let nameInput =
    document.getElementById("cashInName");

    let amountInput =
    document.getElementById("cashInAmount");

    let name =
    nameInput.value.trim();

    let amount =
    Number(amountInput.value);

    if (
        name === "" ||
        !amount ||
        amount <= 0
    ) return;

    let today =
    new Date();

    let newCashIn = {

        type: "cashIn",

        name: name,

        amount: amount,

        date: formatDate(today),

        month: getMonthKey(today),

        createdAt: Date.now()
    };

    await addDoc(
        expensesCollection(),
        newCashIn
    );

    nameInput.value = "";
    amountInput.value = "";

    loadExpenses();
}

async function deleteExpense(firebaseId) {
    await deleteDoc(
        expenseDoc(firebaseId)
    );

    loadExpenses();
}

function renderExpenses() {

    let expenseList =
    document.getElementById("expenseList");

    let subscriptionList =
    document.getElementById("subscriptionList");

    let cashInList =
    document.getElementById("cashInList");

    let monthTotal =
    document.getElementById("monthTotal");

    let cashInTotal =
    document.getElementById("cashInTotal");

    let netBalance =
    document.getElementById("netBalance");

    let categorySummary =
    document.getElementById("categorySummary");

    let expenseMonthTitle =
    document.getElementById("expenseMonthTitle");

    let monthlySubscriptionTotal =
    document.getElementById(
        "monthlySubscriptionTotal"
    );

    let yearlySubscriptionTotal =
    document.getElementById(
        "yearlySubscriptionTotal"
    );

    let yearlyMonthlyEquivalent =
    document.getElementById(
        "yearlyMonthlyEquivalent"
    );

    let totalRecurringMonthly =
    document.getElementById(
        "totalRecurringMonthly"
    );

    let monthKey =
    getMonthKey(viewingDate);

    expenseMonthTitle.textContent =
        viewingDate.toLocaleDateString(
            "en-GB",
            {
                month: "long",
                year: "numeric"
            }
        );

    let cashIns =
    expenses.filter(item => {
        return (
            item.type === "cashIn" &&
            item.month === monthKey
        );
    });

    let normalExpenses =
    expenses.filter(expense => {
        return (
            expense.type !== "cashIn" &&
            !expense.subscription &&
            expense.month === monthKey
        );
    });

    let subscriptions =
    expenses.filter(expense => {
        return (
            expense.type !== "cashIn" &&
            expense.subscription
        );
    });

    let subscriptionsThisMonth =
    subscriptions.filter(subscription => {
        return subscriptionOccursInMonth(
            subscription,
            viewingDate
        );
    });

    let monthlyExpensesForTotal = [
        ...normalExpenses,
        ...subscriptionsThisMonth
    ];

    let total =
    monthlyExpensesForTotal.reduce(
        (sum, expense) => {
            return (
                sum +
                Number(expense.price)
            );
        },
        0
    );

    monthTotal.textContent =
    total.toFixed(2);

    let totalCashIn =
    cashIns.reduce((sum, item) => {
        return (
            sum +
            Number(item.amount)
        );
    }, 0);

    cashInTotal.textContent =
    totalCashIn.toFixed(2);

    netBalance.textContent =
    (
        totalCashIn - total
    ).toFixed(2);

    let monthlySubscriptions =
    subscriptions.filter(subscription => {
        return (
            (
                subscription.subscriptionType
                || "Monthly"
            ) === "Monthly"
        );
    });

    let yearlySubscriptions =
    subscriptions.filter(subscription => {
        return (
            subscription.subscriptionType
            === "Yearly"
        );
    });

    let monthlyRecurringTotal =
    monthlySubscriptions.reduce(
        (sum, subscription) => {
            return (
                sum +
                Number(subscription.price)
            );
        },
        0
    );

    let yearlyRecurringTotal =
    yearlySubscriptions.reduce(
        (sum, subscription) => {
            return (
                sum +
                Number(subscription.price)
            );
        },
        0
    );

    let yearlyEquivalent =
    yearlyRecurringTotal / 12;

    let recurringMonthlyTotal =
    monthlyRecurringTotal +
    yearlyEquivalent;

    monthlySubscriptionTotal.textContent =
    monthlyRecurringTotal.toFixed(2);

    yearlySubscriptionTotal.textContent =
    yearlyRecurringTotal.toFixed(2);

    yearlyMonthlyEquivalent.textContent =
    yearlyEquivalent.toFixed(2);

    totalRecurringMonthly.textContent =
    recurringMonthlyTotal.toFixed(2);

    expenseList.innerHTML = "";
    subscriptionList.innerHTML = "";
    cashInList.innerHTML = "";
    categorySummary.innerHTML = "";

    let categories = {
        Entertainment: [],
        Food: [],
        Studies: [],
        Transportation: [],
        PayNow: [],
        Others: []
    };

    monthlyExpensesForTotal.forEach(expense => {

        if (expense.type === "cashIn")
            return;

        if (!categories[expense.category]) {
            categories[
                expense.category
            ] = [];
        }

        categories[
            expense.category
        ].push(expense);
    });

    categorySummary.innerHTML = `
        <div class="category-summary">

            ${Object.keys(categories).map(category => {

                let categoryTotal =
                categories[category].reduce(
                    (sum, expense) => {
                        return (
                            sum +
                            Number(expense.price)
                        );
                    },
                    0
                );

                return `
                    <div class="category-row">
                        <span>${category}</span>

                        <strong>
                            $${categoryTotal.toFixed(2)}
                        </strong>
                    </div>
                `;
            }).join("")}

        </div>
    `;

    renderCashIns(
        cashIns,
        cashInList
    );

    renderSubscriptionGroups(
        subscriptions,
        subscriptionList
    );

    renderNormalExpenseGroups(
        normalExpenses,
        expenseList
    );
}

function renderCashIns(
    cashIns,
    cashInList
) {

    if (!cashInList) return;

    cashInList.innerHTML = "";

    if (cashIns.length === 0) {

        cashInList.innerHTML =
        "<li>No cash in for this month.</li>";

        return;
    }

    cashIns
    .sort((a, b) => {
        return (
            new Date(b.date)
            -
            new Date(a.date)
        );
    })
    .forEach(item => {

        let li =
        document.createElement("li");

        li.classList.add(
            "cash-in-card"
        );

        li.innerHTML = `
            <div class="expense-item-header">

                <strong>
                    ${escapeHtml(item.name)}
                </strong>

                <span>
                    +$${Number(item.amount).toFixed(2)}
                </span>

            </div>

            <div class="expense-meta">
                Date: ${item.date}
            </div>

            <button onclick="deleteExpense('${item.firebaseId}')">
                Delete
            </button>
        `;

        cashInList.append(li);
    });
}

function renderSubscriptionGroups(
    subscriptions,
    subscriptionList
) {

    if (subscriptions.length === 0) {

        subscriptionList.innerHTML =
        "<li>No subscriptions added.</li>";

        return;
    }

    let subscriptionGroups = {

        Monthly:
        subscriptions.filter(subscription => {
            return (
                (
                    subscription.subscriptionType
                    || "Monthly"
                ) === "Monthly"
            );
        }),

        Yearly:
        subscriptions.filter(subscription => {
            return (
                subscription.subscriptionType
                === "Yearly"
            );
        })
    };

    Object.keys(subscriptionGroups)
    .forEach(type => {

        let group =
        subscriptionGroups[type];

        if (group.length === 0)
            return;

        let groupTotal =
        group.reduce(
            (sum, subscription) => {
                return (
                    sum +
                    Number(subscription.price)
                );
            },
            0
        );

        let groupId =
        `subscription-${type}`;

        let wrapper =
        document.createElement("li");

        wrapper.classList.add(
            "expense-category-card"
        );

        wrapper.innerHTML = `
            <button
                class="expense-category-toggle"
                onclick="toggleExpenseCategory('${groupId}')">

                <span>
                    ▶ ${type} Subscriptions
                </span>

                <strong>
                    ${
                        type === "Yearly"
                        ? `$${groupTotal.toFixed(2)}/year`
                        : `$${groupTotal.toFixed(2)}/month`
                    }
                </strong>

            </button>

            <div
                id="expense-category-${groupId}"
                class="expense-category-content">

                ${group.map(subscription => `

                    <div class="compact-expense-item ${
                        isYearlyRenewalThisMonth(subscription)
                        ? "yearly-renewal-highlight"
                        : ""
                    }">

                        <div>

                            <strong>
                                ${escapeHtml(subscription.name)}
                            </strong>

                            <p>

                                Category:
                                ${subscription.category}

                                <br>

                                Started:
                                ${
                                    subscription.subscriptionStartDate
                                    || subscription.date
                                }

                                ${
                                    type === "Yearly"
                                    ? `
                                        <br>

                                        Monthly equivalent:
                                        $${(
                                            Number(subscription.price) / 12
                                        ).toFixed(2)}

                                        ${
                                            isYearlyRenewalThisMonth(subscription)
                                            ? `
                                                <br>

                                                <span class="renewal-tag">
                                                    Renews this month
                                                </span>
                                            `
                                            : ""
                                        }
                                    `
                                    : ""
                                }

                            </p>

                        </div>

                        <div class="compact-expense-price">
                            $${Number(subscription.price).toFixed(2)}
                        </div>

                        <button onclick="deleteExpense('${subscription.firebaseId}')">
                            Delete
                        </button>

                    </div>

                `).join("")}

            </div>
        `;

        subscriptionList.append(wrapper);
    });
}

function renderNormalExpenseGroups(
    normalExpenses,
    expenseList
) {

    if (normalExpenses.length === 0) {

        expenseList.innerHTML =
        "<li>No normal expenses for this month.</li>";

        return;
    }

    let categories = {
        Entertainment: [],
        Food: [],
        Studies: [],
        Transportation: [],
        PayNow: [],
        Others: []
    };

    normalExpenses.forEach(expense => {
        categories[
            expense.category
        ].push(expense);
    });

    Object.keys(categories)
    .forEach(category => {

        let categoryExpenses =
        categories[category];

        if (categoryExpenses.length === 0)
            return;

        let categoryTotal =
        categoryExpenses.reduce(
            (sum, expense) => {
                return (
                    sum +
                    Number(expense.price)
                );
            },
            0
        );

        let categoryId =
        category.replace(/\s+/g, "-");

        let wrapper =
        document.createElement("li");

        wrapper.classList.add(
            "expense-category-card"
        );

        wrapper.innerHTML = `
            <button
                class="expense-category-toggle"
                onclick="toggleExpenseCategory('${categoryId}')">

                <span>
                    ▶ ${category}
                </span>

                <strong>
                    $${categoryTotal.toFixed(2)}
                </strong>

            </button>

            <div
                id="expense-category-${categoryId}"
                class="expense-category-content">

                ${categoryExpenses.map(expense => `

                    <div class="compact-expense-item">

                        <div>

                            <strong>
                                ${escapeHtml(expense.name)}
                            </strong>

                            <p>
                                ${expense.date}
                            </p>

                        </div>

                        <div class="compact-expense-price">
                            $${Number(expense.price).toFixed(2)}
                        </div>

                        <button onclick="deleteExpense('${expense.firebaseId}')">
                            Delete
                        </button>

                    </div>

                `).join("")}

            </div>
        `;

        expenseList.append(wrapper);
    });
}

function subscriptionOccursInMonth(
    subscription,
    monthDate
) {

    let startDate =
    subscription.subscriptionStartDate
    || subscription.date;

    if (!startDate)
        return false;

    let start =
    parseDate(startDate);

    let viewYear =
    monthDate.getFullYear();

    let viewMonth =
    monthDate.getMonth();

    let startYear =
    start.getFullYear();

    let startMonth =
    start.getMonth();

    if (
        viewYear < startYear ||
        (
            viewYear === startYear &&
            viewMonth < startMonth
        )
    ) {
        return false;
    }

    if (
        subscription.subscriptionType
        === "Yearly"
    ) {
        return (
            viewMonth === startMonth
        );
    }

    return true;
}

function isYearlyRenewalThisMonth(
    subscription
) {

    if (
        subscription.subscriptionType
        !== "Yearly"
    ) return false;

    let startDate =
    subscription.subscriptionStartDate
    || subscription.date;

    if (!startDate)
        return false;

    let start =
    parseDate(startDate);

    return (
        start.getMonth()
        ===
        viewingDate.getMonth()
    );
}

function toggleExpenseCategory(
    categoryId
) {

    let content =
    document.getElementById(
        `expense-category-${categoryId}`
    );

    if (!content) return;

    content.classList.toggle("open");
}

function toggleSubscriptionOptions() {

    let checkbox =
    document.getElementById(
        "expenseSubscription"
    );

    let options =
    document.getElementById(
        "subscriptionOptions"
    );

    if (checkbox.checked) {
        options.style.display = "block";
    } else {
        options.style.display = "none";
    }
}

function previousExpenseMonth() {
    viewingDate.setMonth(
        viewingDate.getMonth() - 1
    );

    renderExpenses();
}

function nextExpenseMonth() {
    viewingDate.setMonth(
        viewingDate.getMonth() + 1
    );

    renderExpenses();
}

function getMonthKey(date) {

    let year =
    date.getFullYear();

    let month =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
}

function formatDate(date) {

    let year =
    date.getFullYear();

    let month =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");

    let day =
    String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(dateString) {

    let [
        year,
        month,
        day
    ] =
    dateString
    .split("-")
    .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}

function toggleSidebar() {
    document
    .getElementById("sidebar")
    .classList
    .toggle("open");
}

async function logout() {
    await signOut(auth);

    window.location.href =
    "login.html";
}

function escapeHtml(text) {

    let div =
    document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

window.addExpense =
addExpense;

window.addCashIn =
addCashIn;

window.deleteExpense =
deleteExpense;

window.previousExpenseMonth =
previousExpenseMonth;

window.nextExpenseMonth =
nextExpenseMonth;

window.toggleExpenseCategory =
toggleExpenseCategory;

window.toggleSubscriptionOptions =
toggleSubscriptionOptions;

window.toggleSidebar =
toggleSidebar;

window.logout =
logout;