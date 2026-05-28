# 🌟 Life Manager

A modern productivity web app built with **HTML, CSS, JavaScript, and Firebase**.

Life Manager helps users manage their **tasks, deadlines, events, expenses, and subscriptions** across devices with secure cloud syncing and authentication.

---

## ✨ Features

### ✅ Task Manager
- ➕ Add tasks with deadlines
- ✏️ Edit existing tasks
- ✔️ Mark tasks as completed
- 📦 Archive completed tasks
- 🔍 Search archived tasks
- 🚨 Overdue task indicators
- 📅 Deadline sorting

---

### 📆 Calendar
- 🗓️ Monthly calendar view
- 🎉 Add events
- ⏳ Multi-day event support
- 🔁 Yearly recurring events
- 📌 Task deadlines displayed on calendar
- 💳 Subscription renewal dates displayed automatically
- 🔴 Overdue task highlighting
- 📍 Today's date indicator

---

### 💰 Expense Tracker
- ➕ Add expenses with name, category, and price
- 📂 Categorized expense tracking
- 📅 Monthly expense display
- 🗃️ Archive navigation for previous months
- 📊 Monthly expense totals
- 📈 Category summaries
- 📦 Collapsible expense categories for a cleaner interface

#### Supported Categories
- 🎮 Entertainment
- 🍔 Food
- 📚 Studies
- 🚌 Transportation
- 💸 PayNow
- 📦 Others

---

### 🔁 Subscription Tracking
- 💳 Add subscriptions as expenses
- 🗓️ Monthly subscription support
- 📆 Yearly subscription support
- 📅 Subscription start dates
- 🔄 Automatic renewal tracking
- 📆 Renewal dates displayed in the calendar
- 📊 Monthly equivalent calculation for yearly subscriptions
- 📈 Total recurring monthly cost calculation
- 📂 Collapsible subscription sections

---

### 📊 Dashboard
- 📈 Task statistics
- ⏰ Upcoming tasks and events
- 🔔 Reminder notifications
- 📱 Responsive layout

---

### 🔔 Reminder System
- ⏰ 1-week reminders
- 📅 1-day reminders
- 🚨 Due-today task reminders
- 📋 Reminders sorted by nearest deadline
- 🔔 Web popup reminders

---

### 🔐 Authentication
- Firebase Authentication
- 📧 Email/password login
- 👤 User-specific cloud data
- 💾 Persistent login sessions
- 🚪 Logout support

---

### ☁️ Cloud Storage
- Firebase Firestore integration
- 🔄 Cross-device syncing
- 🛡️ Secure per-user data storage

---

## 🛠️ Tech Stack

- 🌐 HTML
- 🎨 CSS
- ⚡ JavaScript
- 🔥 Firebase Hosting
- 🔐 Firebase Authentication
- ☁️ Firebase Firestore

---

## 📂 Project Structure

```txt
.
├── index.html
├── login.html
├── task-manager.html
├── calendar.html
├── expense.html
├── style.css
├── firebase.js
├── login.js
├── main.js
├── taskManager.js
├── calendar.js
├── expense.js
├── firebase.json
└── 404.html
```

---

## 🚀 Firebase Setup

### 1️⃣ Create a Firebase Project

Go to:

```txt
https://console.firebase.google.com
```

Create a new Firebase project.

---

### 2️⃣ Enable Authentication

In Firebase Console:

```txt
Authentication
→ Sign-in method
→ Email/Password
→ Enable
```

---

### 3️⃣ Enable Firestore Database

In Firebase Console:

```txt
Firestore Database
→ Create Database
→ Start in test mode
```

---

### 4️⃣ Firestore Security Rules

Replace your Firestore rules with:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write:
      if request.auth != null
      && request.auth.uid == userId;
    }

  }
}
```

This ensures each user can only access their own data.

---

## 🚀 Deployment

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

Initialize Firebase Hosting:

```bash
firebase init hosting
```

Deploy the app:

```bash
firebase deploy
```

---

## 💻 GitHub Setup

Configure Git:

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

Push project to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

---

## 🌱 Future Improvements

- 📩 Email reminder system
- 🔔 Push notifications
- 🧠 AI expense analysis
- 📊 Spending analytics charts
- 📝 Notes system
- 🔥 Habit tracker
- 🌙 Dark mode
- 🎯 Drag-and-drop tasks
- ✏️ Event editing
- 🔁 Recurring tasks
- 📱 Mobile app version

---

## 👨‍💻 Author

Built by **Austin Kor**

⭐ If you like this project, consider starring the repository!
