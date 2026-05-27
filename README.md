# 🌟 Life Manager

A modern productivity web app built with **HTML, CSS, JavaScript, and Firebase**.

Life Manager helps users manage their tasks, deadlines, and events across devices with secure cloud syncing and authentication.

---

# ✨ Features

## ✅ Task Manager
- ➕ Add tasks with deadlines
- ✏️ Edit existing tasks
- ✔️ Mark tasks as completed
- 📦 Archive completed tasks
- 🔍 Search archived tasks
- 🚨 Overdue task indicators
- 📅 Deadline sorting

---

## 📆 Calendar
- 🗓️ Monthly calendar view
- 🎉 Add events
- ⏳ Multi-day event support
- 🔁 Yearly recurring events
- 📌 Task deadlines displayed on calendar
- 🔴 Overdue task highlighting
- 📍 Today's date indicator

---

## 📊 Dashboard
- 📈 Task statistics
- ⏰ Upcoming deadlines/events
- 📱 Responsive layout

---

## 🔐 Authentication
- Firebase Authentication
- 📧 Email/password login
- 👤 User-specific cloud data
- 💾 Persistent login sessions
- 🚪 Logout support

---

## ☁️ Cloud Storage
- Firebase Firestore integration
- 🔄 Cross-device syncing
- 🛡️ Secure per-user data storage

---

# 🛠️ Tech Stack

- 🌐 HTML
- 🎨 CSS
- ⚡ JavaScript
- 🔥 Firebase Hosting
- 🔐 Firebase Authentication
- ☁️ Firebase Firestore

---

# 📂 Project Structure

```txt
.
├── index.html
├── login.html
├── task-manager.html
├── calendar.html
├── style.css
├── firebase.js
├── login.js
├── main.js
├── taskManager.js
├── calendar.js
├── firebase.json
└── 404.html
```

---

# 🚀 Firebase Setup

## 1️⃣ Create Firebase Project

Go to:

```txt
https://console.firebase.google.com
```

Create a new Firebase project.

---

## 2️⃣ Enable Authentication

```txt
Authentication
→ Sign-in method
→ Email/Password
→ Enable
```

---

## 3️⃣ Enable Firestore Database

```txt
Firestore Database
→ Create Database
→ Start in test mode
```

---

## 4️⃣ Firestore Security Rules

Replace your rules with:

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

---

# 🚀 Deployment

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Initialize hosting:

```bash
firebase init hosting
```

Deploy:

```bash
firebase deploy
```

---

# 💻 GitHub Setup

Configure Git:

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

Push project:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

---

# 🌱 Future Improvements

- 💰 Expense tracker
- 📝 Notes system
- 🔥 Habit tracker
- 🔔 Notifications/reminders
- 🌙 Dark mode
- 🎯 Drag-and-drop tasks
- ✏️ Event editing
- 🔁 Recurring tasks
- 📱 Mobile app version

---

# 👨‍💻 Author

Built by **Austin Kor**

⭐ If you like this project, consider starring the repository!
