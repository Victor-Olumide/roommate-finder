# 🏫 ABUAD Room Finder (RMF-ABUAD)

**ABUAD Room Finder** is a full-stack utility web application built for students of Afe Babalola University (ABUAD). It enables students to auto-extract room allocation details directly from official ABUAD allocation slip PDFs and find their assigned roommates before resumption.

---

## ⚡ Features

- 📄 **Instant PDF Allocation Parsing**: Automatically reads and populates Hostel Name, Room Number, Wing, Floor, Level, and Room Capacity directly from uploaded official PDF slips using `pdfjs-dist`.
- 🔍 **Instant Room & Student Search**: Easily lookup room numbers or browse listings to see matched occupants in real-time.
- 🔐 **Zero-Signup Onboarding**: Uses Firebase Anonymous Authentication to silently authenticate users without requiring password setup or OAuth friction.
- 💾 **Local & Cloud Persistence**: Saves document management tokens in browser `localStorage` for quick self-edits while syncing records globally via Cloud Firestore.
- 🛡️ **Moderation Dashboard**: Protected administrative route for managing, editing, and deleting student listings.
- 📱 **Mobile-First Responsive Design**: Built with Tailwind CSS for seamless mobile and desktop navigation.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [React Icons](https://react-icons.github.io/react-icons/)
- **PDF Processing**: [pdfjs-dist](https://github.com/mozilla/pdf.js)
- **Database & Auth**: [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) & [Firebase Anonymous Auth](https://firebase.google.com/docs/auth/web/anonymous-auth)
- **Deployment & Hosting**: [Vercel](https://vercel.com/)

---

# 🚀 Getting Started Locally
Prerequisites
Ensure you have Node.js (v18+) and npm installed on your machine.

## Installation
- Clone the repository:

Bash
git clone [https://github.com/victor-olumide/rmf-abuad.git](https://github.com/your-username/rmf-abuad.git)
cd rmf-abuad
Install dependencies:

Bash
npm install
Set up Environment Variables:
Create a .env file in the root directory and add your Firebase credentials:

## Code snippet
/* VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
*/
Start the local development server:

Bash
npm run dev
Open your browser and navigate to http://localhost:5173.