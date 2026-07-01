# Event Management System - Backend

## Overview

The backend of the Event Management System provides REST APIs for authentication, event management, registrations, attendance tracking, certificate generation, and analytics.

It is built using **Express.js**, **TypeScript**, **Prisma ORM**, and **Neon PostgreSQL**. Authentication is implemented using **Better Auth**, providing secure session-based authentication.

---

# Tech Stack

- Express.js
- TypeScript
- Better Auth
- Prisma ORM
- Neon PostgreSQL
- Vitest
- Supertest
- REST API

---

# Project Structure

```
backend
├── package-lock.json
├── package.json
├── prisma
│   └── schema.prisma
├── prisma.config.ts
├── README.md
├── src
│   ├── controller
│   │   └── auth.ts
│   ├── generated
│   │   └── prisma
│   ├── lib
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── types.ts
│   ├── middleware
│   │   └── auth.ts
│   ├── __tests__
│   │   ├── auth.test.ts
│   │   ├── prisma.test.ts
│   │   └── server.test.ts
│   └── server.ts
├── tsconfig.json
└── vitest.config.ts
```

---

# Architecture

![image](https://github.com/Syed-Ashiq-AP/event-management-backend/blob/master/images/backend-architecture.png)

---

# Request Flow

![image](https://github.com/Syed-Ashiq-AP/event-management-backend/blob/master/images/backend-request-flow.png)

---

# Authentication Flow

![image](https://github.com/Syed-Ashiq-AP/event-management-backend/blob/master/images/backend-auth-flow.png)

---

# Database

Database Provider:
Neon PostgreSQL

ORM:
Prisma

The application stores:

- Users
- Session
- Account
- Verification
- Events
- Registrations
- Certificates

---

# Environment Variables

```
DATABASE_URL

BETTER_AUTH_SECRET

BETTER_AUTH_URL

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

GITHUB_CLIENT_ID

GITHUB_CLIENT_SECRET

FRONTEND_BASE_URL

PORT=8000
```

---

# Installation

```bash
npm install
```

---

# Generate Prisma Client

```bash
npx prisma generate
```

---

# Apply Database Schema

```bash
npx prisma db push
```

---

# Run Development Server

```bash
npm run dev
```

---

# Run Tests

The backend uses **Vitest** in the Node environment.

Test configuration:

- `vitest.config.ts` sets `environment: "node"`.
- Tests live in `src/__tests__`.
- `supertest` is used for HTTP endpoint tests.
- Prisma-related tests use transactional testing helpers where needed.

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Current test coverage includes:

- Health endpoint
- Email sign-up and sign-in flows
- Session and logout flow
- User role setup
- Event create, list, update, and delete behavior
- Participant registration and cancellation behavior
- Attendance marking
- Analytics
- Certificates

---

# API Modules

Authentication

- Login
- Logout
- Session Validation
- Set-up User Role

Events

- Create Event
- View Events
- Update Event
- Delete Event

Registration

- Register for Event
- View Registrations
- Mark Attendance

Analytics

- Event Statistics
- Registration Statistics

---

# Error Handling

The backend implements centralized error handling for:

- Validation Errors
- Unauthorized Requests
- Internal Server Errors

---

# Security

- Session-based authentication
- Protected routes
- Environment variable configuration
- Prisma SQL injection protection
- Request validation

---

# Future Improvements

- Email Notifications
- Role-Based Access Control
- Event Search
- Pagination
- Docker Deployment

---

# Author

Syed Ashiq
