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

let loans = [];
let splitPeople = [];
let currentUser = null;

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadLoans();
});

function loansCollection() {
    return collection(db, "users", currentUser.uid, "loans");
}

function loanDoc(firebaseId) {
    return doc(db, "users", currentUser.uid, "loans", firebaseId);
}

async function loadLoans() {
    let snapshot = await getDocs(loansCollection());

    loans = snapshot.docs.map(item => ({
        firebaseId: item.id,
        ...item.data()
    }));

    renderLoans();
}

function generateSplit() {
    let totalCost = Number(document.getElementById("totalCost").value);

    let names = document.getElementById("peopleNames").value
        .split(",")
        .map(name => name.trim())
        .filter(name => name !== "");

    if (!totalCost || totalCost <= 0) {
        alert("Please enter a valid total cost.");
        return;
    }

    if (names.length === 0) {
        alert("Please enter at least one name.");
        return;
    }

    let equalPercentage = Math.floor((100 / names.length) * 100) / 100;
    let remaining = 100 - equalPercentage * names.length;

    splitPeople = names.map((name, index) => {
        let percentage = equalPercentage;

        if (index === names.length - 1) {
            percentage = Number((percentage + remaining).toFixed(2));
        }

        return {
            name: name,
            percentage: percentage,
            amount: totalCost * percentage / 100,
            locked : false,
            settled: false,
            settledDate: null
        };
    });

    document.getElementById("splitSection").style.display = "block";
    renderSplitEditor();
}

function expensesCollection() {
    return collection(db, "users", currentUser.uid, "expenses");
}

function renderSplitEditor() {
    let splitList = document.getElementById("splitList");
    let totalCost = Number(document.getElementById("totalCost").value);

    splitList.innerHTML = "";

    splitPeople.forEach((person, index) => {
        person.amount = totalCost * Number(person.percentage) / 100;

        let wrapper = document.createElement("div");
        wrapper.classList.add("split-person-card");

        wrapper.innerHTML = `
            <div class="split-person-header">
                <strong>${escapeHtml(person.name)}</strong>
                <span id="split-label-${index}">
                    ${Number(person.percentage).toFixed(2)}%
                    -
                    $${Number(person.amount).toFixed(2)}
                </span>
            </div>

            <input
                id="split-slider-${index}"
                type="range"
                min="0"
                max="100"
                step="1"
                value="${person.percentage}"
                oninput="updateSplitPercentage(${index}, this.value)"
            >

            <input
                id="split-number-${index}"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value="${Number(person.percentage).toFixed(2)}"
                onchange="updateSplitPercentage(${index}, this.value)"
            >
        `;

        splitList.append(wrapper);
    });

    updateTotalPercentageDisplay();
}

function updateSplitPercentage(index, value) {
    let newValue = Number(value);

    if (newValue < 0) newValue = 0;
    if (newValue > 100) newValue = 100;

    splitPeople[index].percentage = newValue;
    splitPeople[index].locked = true;

    let lockedTotal = splitPeople.reduce((sum, person) => {
        return person.locked
            ? sum + Number(person.percentage)
            : sum;
    }, 0);

    let unlockedPeople = splitPeople.filter((person, i) => {
        return !person.locked && i !== index;
    });

    let remainingPercentage = 100 - lockedTotal;

    if (remainingPercentage < 0) {
        alert("Total percentage cannot exceed 100%.");

        splitPeople[index].percentage = 100 - (lockedTotal - newValue);
        remainingPercentage = 0;
    }

    if (unlockedPeople.length > 0) {
        let splitAmongUnlocked =
            remainingPercentage / unlockedPeople.length;

        splitPeople.forEach((person, i) => {
            if (!person.locked && i !== index) {
                person.percentage = splitAmongUnlocked;
            }
        });
    }

    let totalCost =
        Number(document.getElementById("totalCost").value);

    splitPeople.forEach(person => {
        person.amount =
            totalCost * person.percentage / 100;
    });

    updateSplitUI();
}

function updateSplitUI() {

    let totalPercentage =
        splitPeople.reduce((sum, person) => {
            return sum + Number(person.percentage);
        }, 0);

    document.getElementById("totalPercentage").textContent =
        `${totalPercentage.toFixed(2)}%`;

    let percentageElement =
        document.getElementById("totalPercentage");

    if (Math.abs(totalPercentage - 100) < 0.01) {
        percentageElement.style.color = "#16a34a";
    }

    else {
        percentageElement.style.color = "#dc2626";
    }

    splitPeople.forEach((person, index) => {

        let percentageLabel =
            document.getElementById(`split-label-${index}`);

        let slider =
            document.getElementById(`split-slider-${index}`);

        let numberInput =
            document.getElementById(`split-number-${index}`);

        if (percentageLabel) {
            percentageLabel.textContent =
                `${Number(person.percentage).toFixed(2)}% - $${Number(person.amount).toFixed(2)}`;
        }

        if (slider) {
            slider.value = person.percentage;
        }

        if (numberInput) {
            numberInput.value =
                Number(person.percentage).toFixed(2);
        }

    });

}

function updateTotalPercentageDisplay() {
    let totalPercentageElement = document.getElementById("totalPercentage");

    let totalPercentage = splitPeople.reduce((sum, person) => {
        return sum + Number(person.percentage);
    }, 0);

    totalPercentageElement.textContent = `${totalPercentage.toFixed(2)}%`;

    if (Math.abs(totalPercentage - 100) < 0.01) {
        totalPercentageElement.style.color = "#16a34a";
    } else {
        totalPercentageElement.style.color = "#dc2626";
    }
}

async function addLoan() {
    let titleInput = document.getElementById("loanTitle");
    let typeInput = document.getElementById("loanType");
    let totalCostInput = document.getElementById("totalCost");
    let dueDateInput = document.getElementById("loanDueDate");

    let title = titleInput.value.trim();
    let type = typeInput.value;
    let totalCost = Number(totalCostInput.value);
    let dueDate = dueDateInput.value;

    if (title === "" || !totalCost || totalCost <= 0) {
        alert("Please enter a valid title and total cost.");
        return;
    }

    if (splitPeople.length === 0) {
        alert("Please click Generate Split first.");
        return;
    }

    let people = splitPeople.map(person => ({
        name: person.name,
        percentage: Number(person.percentage),
        amount: Number((totalCost * person.percentage / 100).toFixed(2)),
        paidAmount: 0,
        payments: [],
        locked: person.locked || false,
        settled: false,
        settledDate: null
    }));

    let today = new Date();

    let newLoan = {
        title,
        type,
        totalCost,
        peopleCount: people.length,
        people,
        dueDate,
        date: formatDate(today),
        createdAt: Date.now()
    };

    let loanRef = await addDoc(loansCollection(), newLoan);

    if (type === "owedToMe") {
        await addDoc(expensesCollection(), {
            type: "expense",
            name: `Loan/Owe: ${title}`,
            category: "PayNow",
            price: totalCost,
            subscription: false,
            date: formatDate(today),
            month: getMonthKey(today),
            loanLinked: true,
            loanId: loanRef.id,
            loanAction: "initialPaid",
            createdAt: Date.now()
        });
    }

    titleInput.value = "";
    typeInput.value = "owedToMe";
    totalCostInput.value = "";
    document.getElementById("peopleNames").value = "";
    dueDateInput.value = "";
    document.getElementById("splitSection").style.display = "none";
    document.getElementById("splitList").innerHTML = "";

    splitPeople = [];
    loadLoans();
}

function renderLoans() {
    let owedToMeList = document.getElementById("owedToMeList");
    let iOweList = document.getElementById("iOweList");
    let settledList = document.getElementById("settledList");

    owedToMeList.innerHTML = "";
    iOweList.innerHTML = "";
    settledList.innerHTML = "";

    let activeOwedToMe = loans.filter(item => {
        return item.type === "owedToMe" && !isLoanFullySettled(item);
    });

    let activeIOwe = loans.filter(item => {
        return item.type === "iOwe" && !isLoanFullySettled(item);
    });

    let settledLoans = loans.filter(item => {
        return isLoanFullySettled(item);
    });

    let totalOwedToMe = activeOwedToMe.reduce((sum, loan) => {
        return sum + getUnsettledTotal(loan);
    }, 0);

    let totalIOwe = activeIOwe.reduce((sum, loan) => {
        return sum + getUnsettledTotal(loan);
    }, 0);

    let netPosition = totalOwedToMe - totalIOwe;

    document.getElementById("totalOwedToMe").textContent =
        `$${totalOwedToMe.toFixed(2)}`;

    document.getElementById("totalIOwe").textContent =
        `$${totalIOwe.toFixed(2)}`;

    let netElement = document.getElementById("netLoanPosition");
    netElement.textContent = `$${netPosition.toFixed(2)}`;
    netElement.style.color = netPosition < 0 ? "#dc2626" : "#16a34a";

    renderLoanGroup(activeOwedToMe, owedToMeList);
    renderLoanGroup(activeIOwe, iOweList);
    renderLoanGroup(settledLoans, settledList);
}

function renderLoanGroup(items, list) {
    if (items.length === 0) {
        list.innerHTML = "<li>No records found.</li>";
        return;
    }

    items.sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    items.forEach(item => {
        let li = document.createElement("li");

        let people = getPeopleArray(item);

        let settledCount = people.filter(person => person.settled).length;
        let unpaidCount = people.length - settledCount;

        let unpaidTotal = getUnsettledTotal(item);
        let settledTotal = getSettledTotal(item);

        let groupId = `loan-${item.firebaseId}`;

        li.classList.add("expense-category-card");

        li.innerHTML = `
            <button class="expense-category-toggle"
                    onclick="toggleExpenseCategory('${groupId}')">
                <span>▶ ${escapeHtml(item.title)}</span>
                <strong>$${unpaidTotal.toFixed(2)} left</strong>
            </button>

            <div id="expense-category-${groupId}" class="expense-category-content">
                <div class="expense-meta" style="margin: 14px 0;">
                    Total Cost: $${Number(item.totalCost || 0).toFixed(2)}<br>
                    Unpaid Total: $${unpaidTotal.toFixed(2)}<br>
                    Settled Total: $${settledTotal.toFixed(2)}<br>
                    People: ${people.length}<br>
                    Paid: ${settledCount}<br>
                    Unpaid: ${unpaidCount}<br>
                    Due Date: ${item.dueDate || "No due date"}<br>
                    Added on: ${item.date || "Unknown"}
                </div>

                ${people.map((person, index) => {
                    let paidAmount = Number(person.paidAmount || 0);
                    let totalAmount = Number(person.amount || 0);
                    let remaining = totalAmount - paidAmount;

                    return `
                        <div class="compact-expense-item ${person.settled ? "cash-in-compact" : ""}">
                            <div>
                                <strong>${escapeHtml(person.name)}</strong>
                                <p>
                                    ${Number(person.percentage || 0).toFixed(2)}% of total<br>
                                    Paid: $${paidAmount.toFixed(2)} / $${totalAmount.toFixed(2)}<br>
                                    Left: $${remaining.toFixed(2)}
                                    ${
                                        person.settled
                                            ? `<br>Settled on: ${person.settledDate || "Unknown"}`
                                            : ""
                                    }
                                </p>
                            </div>

                            <div class="compact-expense-price">
                                $${remaining.toFixed(2)} left
                            </div>

                            ${
                                person.settled
                                    ? `<button onclick="undoSettlePerson('${item.firebaseId}', ${index})">Undo</button>`
                                    : `
                                        <div class="loan-payment-controls">
                                            <input
                                                id="payment-${item.firebaseId}-${index}"
                                                type="number"
                                                step="0.01"
                                                placeholder="Amount"
                                            >

                                            <button onclick="addInstalment('${item.firebaseId}', ${index})">
                                                Add
                                            </button>

                                            <button onclick="settlePerson('${item.firebaseId}', ${index})">
                                                Settle
                                            </button>
                                        </div>
                                    `
                            }
                        </div>
                    `;
                }).join("")}

                <button onclick="deleteLoan('${item.firebaseId}')">
                    Delete Whole Record
                </button>
            </div>
        `;

        if (!isLoanFullySettled(item) && isOverdue(item.dueDate)) {
            li.classList.add("overdue");
        }

        list.append(li);
    });
}

async function settlePerson(firebaseId, personIndex) {
    let loan = loans.find(item => item.firebaseId === firebaseId);

    if (!loan) return;

    let people = getPeopleArray(loan);
    let person = people[personIndex];

    let paidAmount = Number(person.paidAmount || 0);
    let totalAmount = Number(person.amount || 0);
    let remaining = totalAmount - paidAmount;

    if (remaining <= 0) return;

    await recordLoanPayment(firebaseId, personIndex, remaining);
}

async function addInstalment(firebaseId, personIndex) {
    let input = document.getElementById(`payment-${firebaseId}-${personIndex}`);
    let amount = Number(input.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
    }

    await recordLoanPayment(firebaseId, personIndex, amount);

    input.value = "";
}

async function recordLoanPayment(firebaseId, personIndex, amount) {
    let loan = loans.find(item => item.firebaseId === firebaseId);

    if (!loan) return;

    let people = getPeopleArray(loan);
    let person = people[personIndex];

    let paidAmount = Number(person.paidAmount || 0);
    let totalAmount = Number(person.amount || 0);
    let remaining = totalAmount - paidAmount;

    if (amount > remaining) {
        alert(`Payment cannot exceed remaining amount of $${remaining.toFixed(2)}.`);
        return;
    }

    let today = new Date();

    let payment = {
        amount: Number(amount),
        date: formatDate(today),
        createdAt: Date.now()
    };

    person.paidAmount = paidAmount + Number(amount);

    if (!Array.isArray(person.payments)) {
        person.payments = [];
    }

    person.payments.push(payment);

    if (person.paidAmount >= totalAmount) {
        person.settled = true;
        person.settledDate = formatDate(today);
    }

    await updateDoc(loanDoc(firebaseId), {
        people: people
    });

    if (loan.type === "owedToMe") {
        await addDoc(expensesCollection(), {
            type: "cashIn",
            name: `Loan payment from ${person.name}: ${loan.title}`,
            amount: Number(amount),
            date: formatDate(today),
            month: getMonthKey(today),
            loanLinked: true,
            loanId: firebaseId,
            personIndex: personIndex,
            loanAction: "loanPayment",
            createdAt: Date.now()
        });
    }

    if (loan.type === "iOwe") {
        await addDoc(expensesCollection(), {
            type: "expense",
            name: `Loan payment to ${person.name}: ${loan.title}`,
            category: "PayNow",
            price: Number(amount),
            subscription: false,
            date: formatDate(today),
            month: getMonthKey(today),
            loanLinked: true,
            loanId: firebaseId,
            personIndex: personIndex,
            loanAction: "loanPayment",
            createdAt: Date.now()
        });
    }

    loadLoans();
}

function getMonthKey(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

async function undoSettlePerson(firebaseId, personIndex) {
    let loan = loans.find(item => item.firebaseId === firebaseId);

    if (!loan) return;

    let people = getPeopleArray(loan);
    let person = people[personIndex];

    person.paidAmount = 0;
    person.payments = [];
    person.settled = false;
    person.settledDate = null;

    await updateDoc(loanDoc(firebaseId), {
        people: people
    });

    await deleteLinkedExpense(firebaseId, personIndex, "loanPayment");

    loadLoans();
}

async function deleteLinkedExpense(loanId, personIndex, loanAction) {
    let snapshot = await getDocs(expensesCollection());

    let matchingDocs = snapshot.docs.filter(item => {
        let data = item.data();

        return data.loanLinked === true &&
               data.loanId === loanId &&
               data.personIndex === personIndex &&
               data.loanAction === loanAction;
    });

    for (let item of matchingDocs) {
        await deleteDoc(doc(db, "users", currentUser.uid, "expenses", item.id));
    }
}

async function deleteLinkedExpensesForLoan(loanId) {
    let snapshot = await getDocs(expensesCollection());

    let matchingDocs = snapshot.docs.filter(item => {
        let data = item.data();

        return data.loanLinked === true &&
               data.loanId === loanId;
    });

    for (let item of matchingDocs) {
        await deleteDoc(doc(db, "users", currentUser.uid, "expenses", item.id));
    }
}

async function deleteLoan(firebaseId) {
    await deleteLinkedExpensesForLoan(firebaseId);
    await deleteDoc(loanDoc(firebaseId));

    loadLoans();
}

function getPeopleArray(loan) {
    if (Array.isArray(loan.people)) {
        return loan.people;
    }

    if (Array.isArray(loan.peopleNames)) {
        let amountPerPerson =
            Number(loan.amountPerPerson) ||
            Number(loan.totalCost || 0) / Number(loan.peopleNames.length || 1);

        let percentage =
            100 / Number(loan.peopleNames.length || 1);

        return loan.peopleNames.map(name => ({
            name: name,
            percentage: percentage,
            amount: amountPerPerson,
            paidAmount: 0,
            payments: [],
            settled: false,
            settledDate: null
        }));
    }

    return [];
}

function getUnsettledTotal(loan) {
    let people = getPeopleArray(loan);

    return people.reduce((sum, person) => {
        let amount = Number(person.amount || 0);
        let paid = Number(person.paidAmount || 0);

        return sum + Math.max(amount - paid, 0);
    }, 0);
}

function getSettledTotal(loan) {
    let people = getPeopleArray(loan);

    return people.reduce((sum, person) => {
        return sum + Number(person.paidAmount || 0);
    }, 0);
}

function isLoanFullySettled(loan) {
    let people = getPeopleArray(loan);

    if (people.length === 0) return false;

    return people.every(person => person.settled);
}

function toggleExpenseCategory(categoryId) {
    let content = document.getElementById(`expense-category-${categoryId}`);

    if (!content) return;

    content.classList.toggle("open");
}

function isOverdue(dateString) {
    if (!dateString) return false;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueDate = parseDate(dateString);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
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

window.generateSplit = generateSplit;
window.updateSplitPercentage = updateSplitPercentage;
window.addLoan = addLoan;
window.settlePerson = settlePerson;
window.undoSettlePerson = undoSettlePerson;
window.deleteLoan = deleteLoan;
window.toggleExpenseCategory = toggleExpenseCategory;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.addInstalment = addInstalment;