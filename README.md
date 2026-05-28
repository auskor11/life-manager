# 🌟 Life Manager v10

A modern productivity web app built with **HTML, CSS, JavaScript, and Firebase**.

Life Manager helps users manage their:

- ✅ Tasks
- 📆 Events
- 💰 Expenses
- 🔁 Subscriptions
- 🤝 Loans / Shared Payments
- 🔔 Reminders

with secure cloud syncing across devices.

---

# ✨ Features

---

# ✅ Task Manager

- ➕ Add tasks with deadlines
- ✏️ Edit existing tasks
- ✔️ Mark tasks as completed
- 📦 Archive completed tasks
- 🔍 Search archived tasks
- 🚨 Overdue task indicators
- 📅 Deadline sorting
- ☁️ Firebase syncing

---

# 📆 Calendar

- 🗓️ Monthly calendar view
- 🎉 Add events
- ⏳ Multi-day event support
- 🔁 Yearly recurring events
- 📌 Task deadlines displayed on calendar
- 💳 Subscription renewal dates displayed automatically
- 🔴 Overdue task highlighting
- 📍 Today's date indicator

---

# 💰 Expense Tracker

- ➕ Add expenses with categories
- 📂 Categorized expense tracking
- 📅 Monthly expense display
- 🗃️ Archive navigation for previous months
- 📊 Monthly cash summaries
- 📈 Category summaries
- 📦 Collapsible expense categories
- 💵 Cash in / cash out tracking

### Supported Categories

- 🎮 Entertainment
- 🍔 Food
- 📚 Studies
- 🚌 Transportation
- 💸 PayNow
- 📦 Others

---

# 🤝 Loan / Owe System

A fully integrated shared-payment and debt tracking system.

## Features

### 💸 Shared Expense Tracking

Track:

- money people owe you
- money you owe others
- group expenses
- meal splitting
- transport splitting
- shared purchases

---

## 👥 Dynamic Group Splitting

Example:

```txt
Dinner: $100

John → 50%
Mary → 30%
Alex → 10%
Ben → 10%
```

Each person’s contribution can be customized with:

- 🎚️ Sliders
- 🔢 Manual percentage input
- ⚖️ Automatic balancing to 100%

---

## 💰 Instalment Payments

People can repay partially over time.

Example:

```txt
John owes $50

Day 1 → pays $20
Day 2 → pays $15
Day 3 → settles remaining $15
```

The app automatically tracks:

- amount paid
- remaining balance
- payment history
- settled status

---

## 🔄 Integrated With Expense System

Loan repayments automatically update expenses.

### If others owe you:

- Initial payment creates a cash out expense
- Instalments create cash in records

### If you owe others:

- Payments create expenses automatically

---

## 📊 Dashboard Loan Analytics

Dashboard displays:

- 👥 Number of people owing you money
- 💰 Total amount others owe you
- 💸 Total amount you owe others

---

# 🔁 Subscription Tracking

- 💳 Add subscriptions as expenses
- 🗓️ Monthly subscription support
- 📆 Yearly subscription support
- 🔄 Automatic renewal tracking
- 📅 Renewal dates displayed in calendar
- 📊 Monthly equivalent calculations
- 📈 Recurring monthly cost calculations

---

# 🔔 Reminder System

- ⏰ 1-week reminders
- 📅 1-day reminders
- 🚨 Due-today reminders
- 📋 Sorted reminder list
- 🔔 Browser popup notifications

---

# 📊 Dashboard

- 📈 Expense summaries
- 📋 Task statistics
- 📆 Upcoming events
- 🤝 Loan analytics
- 🔔 Reminder notifications

---

# 🔐 Authentication

- Firebase Authentication
- 📧 Email/password login
- 👤 User-specific cloud data
- 💾 Persistent login sessions
- 🚪 Logout support

---

# ☁️ Cloud Storage

- Firebase Firestore integration
- 🔄 Cross-device syncing
- 🛡️ Secure per-user data isolation

---

# 📱 Progressive Web App (PWA)

Life Manager is installable as a mobile app.

Features include:

- 📲 Add to Home Screen
- ⚡ Offline caching
- 🔄 Service worker updates
- 📱 Native-app-like experience

---

# 🛠️ Tech Stack

- 🌐 HTML
- 🎨 CSS
- ⚡ JavaScript
- 🔥 Firebase Hosting
- 🔐 Firebase Authentication
- ☁️ Firebase Firestore
- 📱 PWA Service Workers

---

# 📂 Project Structure

```txt
.
├── index.html
├── login.html
├── task-manager.html
├── calendar.html
├── expense.html
├── expense-archive.html
├── loan-owe.html
├── style.css
├── firebase.js
├── login.js
├── main.js
├── taskManager.js
├── calendar.js
├── expense.js
├── expense-archive.js
├── loan-owe.js
├── service-worker.js
├── manifest.json
└── 404.html
```

---

# 👨‍💻 Author

Built by **Austin Kor**

⭐ If you like this project, consider starring the repository!
