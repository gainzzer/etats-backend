# ETATS Backend (API)

ETATS (Employee Task Assignment & Tracking System) is a backend REST API built using Node.js, Express, and PostgreSQL.  
It provides secure, role-based endpoints for managing employees, tasks, and reports using **session-based authentication**.

---

## Tech Stack

- Node.js
- Express
- PostgreSQL
- express-session
- pg
- dotenv
- cors

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- PostgreSQL
- npm

### Installation

```
npm install
```
### Running the Server
```
npm run 
```

The backend will run at:
```
http://localhost:5001
```

Health check endpoint:
```
GET /api/health
```
```
backend/
│
├── db/
│   └── pool.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   └── logger.middleware.js
│
├── routes/
│   ├── auth.routes.js
│   ├── employees.routes.js
│   ├── tasks.routes.js
│   └── reports.routes.js
│
├── server.js
├── .env
└── package.json
```

### Authentication
```

The backend uses session-based authentication .

Login creates a server-side session

Session ID is stored in a cookie (etats.sid)

Requests must include credentials

Role-based access is enforced using middleware
```

# Auth Routes
## Login
```
POST /api/auth/login
```
### Request body:
```
{
  "email": "user@email.com",
  "password": "password"
}
```
### Get Logged-in User
```
GET /api/auth/me
```
### Logout
```
POST /api/auth/logout
```     
# API Endpoints
## Employees

### (Manager only except /me)
```
GET    /api/employees/me
GET    /api/employees
POST   /api/employees
PUT    /api/employees/:employeeId
DELETE /api/employees/:employeeId
```
## Tasks
```
GET    /api/tasks                  (manager only)
GET    /api/tasks/my/:employeeId
POST   /api/tasks                  (manager only)
PUT    /api/tasks/:taskId           (manager only)
DELETE /api/tasks/:taskId           (manager only)
PUT    /api/tasks/:taskId/:employeeId/status
```
## Reports

### (Manager only)
```
GET  /api/reports
POST /api/reports
```

#Notes
```
CORS is restricted to the frontend origin

Role-based access control is enforced using middleware

Database connection uses environment variables

Task assignments use a many-to-many relationship
```