
# Taxes247

Taxes247 is a web application for managing tax preparation service requests. It allows users to register requests, upload W2 files, track their status, and enables administrators to securely manage and update these requests from an admin panel.

## 🧩 Technologies Used

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** Firebase Authentication
- **Email:** Nodemailer (with Gmail)
- **Cache:** Redis
- **File Storage:** AWS S3

## 🔐 Authentication

- Firebase authentication (for both regular users and admins).
- Account verification via email.
- Route protection with custom middlewares (`verifyToken`, `verifyAdmin`).

## 📦 Main Features

### For Users

- Registration and login with verification.
- Submit service requests (Standard or Premium).
- Upload W2 files.
- Receive a confirmation number and automatic email.
- Track request status and view details.

### For Admins

- Login with role verification.
- Admin panel with:
  - Request table with filters and search.
  - Statistics dashboard.
  - Update request status.
  - Manage administrative notes.
  - Delete requests with confirmation validation.
- Migration and administrative scripts (`createAdmin`, `updateAdminUid`, `fix_missing_descriptions`).

## 📁 Folder Structure

```
├── controllers/
├── models/
├── routes/
├── middlewares/
├── utils/
├── scripts/
├── config/
├── frontend/ (Vite + React)
└── .env (not included)
```

## ⚙️ Environment Variables

Make sure to have a `.env` file with the following values:

```env
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
AWS_BUCKET_NAME=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## 🚀 How to Run Locally

1. Clone the project:
   ```bash
   git clone https://github.com/romeroalan26/taxes247-backend.git
   ```

2. Install dependencies:
   ```bash
   cd taxes247-backend
   npm install
   ```

3. Create a `.env` file and configure your variables.

4. Start the server:
   ```bash
   npm run dev
   ```

5. Frontend: [https://taxes247.vercel.app](https://taxes247.vercel.app)

   Repository: [Frontend on GitHub](https://github.com/romeroalan26/taxes247-frontend/tree/main/src/components)

## 🛠 Useful Scripts

- `node scripts/createAdmin.js`: Assigns admin role to a user.
- `node scripts/updateAdminUid.js`: Updates admin UID in MongoDB using Firebase.
- `node scripts/fix_missing_descriptions.js`: Fixes missing status descriptions in requests.

## 🧠 Skills Gained

- JWT & Firebase Authentication
- Request management with MongoDB
- S3 File Upload and secure handling
- Transactional email handling
- Admin panel in React with modals and statistics

---

Developed by **Alan Joel Romero De Oleo**
