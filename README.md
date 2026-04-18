
## 📌 Overview

This project is a full-stack web application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) with AI integrations. It supports intelligent processing using APIs like Gemini and Groq, along with PDF handling and RAG-based querying.

---

## 🚀 Features

* Modern React frontend UI
* RESTful APIs using Node.js & Express
* AI-powered responses (Gemini, Groq)
* PDF processing service
* RAG (Retrieval-Augmented Generation) support
* Modular backend architecture (controllers, services, routes)

---

## 🛠 Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **AI APIs:** Gemini API, Groq API

---

## 📂 Project Structure

```
project-final/
│
├── backend/              # Main backend server
├── frontend/             # React frontend
├── pdf/                  # PDF processing service
├── rag-pdf-service/      # RAG-based PDF service
├── db/                   # Database-related files
├── README.md             # Project documentation
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```
git clone <your-repo-link>
cd project-final
```

---

### 2. Backend Setup

```
cd backend
npm install
npm start
```

---

### 3. Frontend Setup

```
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder using the example below:

```
GITHUB_TOKEN=
GEMINI_API_KEY=
GROQ_API_KEY=
DB_PASSWORD=
```

⚠️ Do NOT share your `.env` file publicly.

---

## 📌 Notes

* Ensure MongoDB is running before starting the backend
* Add valid API keys in the `.env` file
* Make sure all services (backend, frontend, pdf, rag service) are running properly

---

## 🧪 Running the Project

* Backend runs on: `http://localhost:5000` (or configured port)
* Frontend runs on: `http://localhost:3000`

---

## 📈 Future Improvements

* Add authentication system
* Improve UI/UX design
* Add deployment (Docker / Cloud)
* Enhance AI response accuracy

---

