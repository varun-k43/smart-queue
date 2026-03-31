# 🚀 Smart Queue Management System

A real-time queue management system designed for hospitals and service centers to reduce waiting time and improve user experience.

---

## 📌 Overview

This system allows users to join a queue digitally and track their live position in real-time. Admins can manage the queue efficiently by calling the next user, while all clients stay updated instantly.

---

## ✨ Features

- 🔄 Real-time queue updates using Socket.IO
- 📍 Live position tracking for users
- ⏱️ Wait time calculation
- 👨‍⚕️ Admin control to call next user
- 🔁 Multi-tab synchronization
- 💾 Persistent session using localStorage
- 📊 Queue history tracking

---

## 🛠️ Tech Stack

**Frontend**

- React.js
- Axios
- Socket.IO Client

**Backend**

- Node.js
- Express.js
- Socket.IO

**Database**

- MongoDB (Atlas)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/varun-k43/smart-queue.git
cd smart-queue
```

---

### 2️⃣ Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside backend:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Run backend:

```bash
node server.js
```

---

### 3️⃣ Frontend setup

```bash
cd frontend
npm install
npm start
```

---

## 🚀 How It Works

1. User enters name and joins queue
2. System assigns a unique ID and position
3. Admin calls next user
4. Queue updates in real-time for all users
5. Position updates dynamically
6. Data is stored and managed using MongoDB

---

## 🔮 Future Improvements

- QR code-based entry system
- Admin authentication
- Mobile app version
- Notifications for upcoming turn

---

## 👨‍💻 Author

**Varun K**
B.Tech CSE (AI/ML)
SRM University

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
