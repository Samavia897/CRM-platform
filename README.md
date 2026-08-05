# 📊 Enterprise CRM Analytics & Venture Platform

A full-stack, enterprise-grade CRM Platform designed to streamline venture capital tracking, fund management, deal pipelines, and team tasks. Built with a modern dark dashboard UI, multi-board workspace layouts, and dynamic analytics.

🌐 **Live Application:** [https://my-crm-client.onrender.com](https://my-crm-client.onrender.com)

---

## 📸 Interface Preview

![Dashboard Overview](./client/src/assets/preview-dashboard.png)

*Admin Analytics Environment tracking real-time dynamic metrics for Investors, Funds, Pipelines, and Tasks.*

---

## ✨ Features

- 🔐 **Authentication & Workspace Controls:** Secure user authentication with role-based access control (Admin vs. Standard User).
- 📈 **Dynamic Analytics Dashboard:** Live metric indicators tracking aggregate counts across Investors, Funds, Active Pipelines, and Pending Tasks.
- 🏢 **Organization Management:** Admin environment to onboard workspace members and assign custom operational roles.
- 👥 **Investors Directory:** Centralized database for managing corporate backers and assets with live multi-column filtering.
- 🏦 **Funds Matrix:** Interactive fund classification table with industry tagging, custom search, and bulk data import options.
- 🔀 **Dynamic Deal Pipelines:** Multi-board workspace view enabling teams to track active deals across customized stages.
- 📋 **Integrated Task Lifecycle:** Categorized task management (Overdue, Due, Upcoming, Completed) with priority tagging (High, Medium, Low) and quick action controls.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Custom CSS / Glassmorphism Dark Theme, Lucide React / React Icons, Axios
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** PostgreSQL
- **Deployment:** Render (Full-Stack Live Host)

---

## 🚀 Getting Started

Follow these steps to set up and run the application locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Samavia897/CRM-platform.git
cd CRM-platform
```

### 2. Install Dependencies
For Backend:
```bash
cd Backend
npm install
```
For Frontend:
```bash
cd ../client
npm install
```

### 3. Environment Setup
Create a .env file in the Backend directory and add your environment variables:
```bash
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Run Development Servers
Start Backend Server:
```bash
cd Backend
npm run dev
```
Start Frontend Application:
```bash
cd client
npm run dev
```
---

## 📂 Project Structure
```
CRM-platform/
 ├── Backend/               # Express.js REST API server & database configurations
 │   ├── controllers/       # Route request handlers
 │   ├── models/            # PostgreSQL schema definitions & queries
 │   ├── routes/            # API endpoints (Auth, Investors, Funds, Tasks, Pipelines)
 │   └── server.js          # Main Express server setup
 │
 ├── client/                # React.js frontend application
 │   ├── src/
 │   │   ├── components/    # Reusable UI components (Sidebar, Topbar, Modals)
 │   │   ├── pages/         # Core routes (Dashboard, Investors, Funds, Pipelines, Tasks)
 │   │   ├── App.jsx        # Routing & global state configuration
 │   │   └── main.jsx       # Application entry point
 │   └── public/            # Static assets & favicon
 │
 └── .gitignore             # Root git ignore rules
```

## 📄 License
 This project is open-source and available under the MIT License.
