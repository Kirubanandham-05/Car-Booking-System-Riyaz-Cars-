# Riyaz Cars Booking System

Riyaz Cars Booking System is a full-stack car booking application with a Node.js/Express backend, MongoDB persistence, and a static front-end served from the `public/` directory. It includes booking flows, authentication, admin pages, profile pages, and supporting scripts for database setup and maintenance.

## Features

- User authentication and profile handling
- Car browsing and booking endpoints
- Admin pages for managing the system
- Contact and messaging flows
- MongoDB-backed API with health check endpoint
- Static front-end pages for the public site, dashboard, profile, and admin area

## Tech Stack

- Node.js
- Express
- MongoDB
- Vanilla JavaScript for the public pages
- Next.js-style UI components are included under `components/`

## Project Structure

- `server/` - Express app, database helpers, middleware, and API routes
- `public/` - Static HTML, CSS, images, and client-side JavaScript
- `app/` - App router files and global styles
- `components/` - UI components
- `hooks/` - Shared React hooks
- `scripts/` - Database migrations, seed scripts, and utilities

## Prerequisites

- Node.js 18+
- MongoDB connection string
- npm or pnpm

## Environment Variables

Create a `.env` file in the project root with at least:

```env
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB_NAME=riyaz_cars
PORT=3001
```

Optional variables may be required by specific features such as email sending or admin workflows.

## Installation

```bash
npm install
```

## Running the App

Start the server:

```bash
npm start
```

For local development, the app runs the Express server from `server/index.js` and serves the public pages from `public/`.

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server in development mode
- `npm run seed:mongodb` - Seed the MongoDB database

## Useful Routes

- `GET /` - Public landing page
- `GET /dashboard` - Dashboard page
- `GET /admin` - Admin page
- `GET /profile` - Profile page
- `GET /api/health` - Health check endpoint

## Notes

- The repository already ignores local secret files such as `.env*` and `admin-credentials.txt`.
- If you add new environment variables, document them here and keep them out of version control.
