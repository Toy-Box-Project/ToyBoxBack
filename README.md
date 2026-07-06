# ToyBox Backend – API REST con Node.js y Express

A complete REST API for the ToyBox platform, a second-hand toy marketplace. Includes user management, product catalog, real-time chat, ratings, purchases, and moderation system.

## Features

* Express 5.x server setup with ES Modules
* JWT authentication with bcryptjs
* MySQL database with 13 normalized tables
* Real-time chat with Socket.io
* Cloudinary integration for image storage
* CORS enabled
* Environment configuration with `.env` support
* Express-validator for input validation
* Role-based access control (RBAC)
* Global error handling middleware

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js 22+
- npm 10+
- MySQL 8.0+

You can download Node.js from the [Node.js official website](https://nodejs.org/).

### Installation

1. Clone the repository:

```bash
git clone <repository-url> toybox-backend
cd toybox-backend
```

2. Navigate to the project directory and install dependencies:

```bash
npm install
```

3. Import the database:

```bash
mysql -u root -p toybox < BBDD/toybox_schema_updated.sql
mysql -u root -p toybox < BBDD/seed_updated.sql
```

## Environment Configuration

Create a `.env` file in the root of the project. Reference `.env.example` for required variables:

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_PORT=3306
DB_NAME=toybox

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_long_secret_key_with_special_characters
JWT_EXPIRATION=7d

CORS_ORIGIN=http://localhost:4200
```

## Running the Application

### Start the server

```bash
npm start
```

The server will start and listen on the port defined in your `.env` file, or default to port 3000.

### Development mode

To start the server in development mode with automatic restarts on file changes:

```bash
npm run dev
```

## Available Scripts

* `start` - Runs `node index.js` to start the server
* `dev` - Runs `nodemon index.js` for development with auto-restart
* `lint` - Check code for issues (if linting is configured)
* `format` - Format and fix code (if formatter is configured)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and Cloudinary configuration
│   ├── controllers/     # Business logic (14 files)
│   ├── models/          # SQL queries (10 files)
│   ├── routes/          # API endpoints (11 files)
│   ├── middlewares/     # Auth, validation, error handling
│   └── sockets/         # Socket.io for real-time chat
├── BBDD/                # SQL scripts
│   ├── toybox_schema_updated.sql
│   ├── seed_updated.sql
│   └── queries_items.sql
├── .env.example         # Environment template
├── .env                 # Environment variables (git ignored)
├── package.json
└── index.js
```



## Authors

This project was developed by:

- Adrian Ortiz
- Heimer Martinez
- Jaime Colás
- Jesus Maria Trillo-Figueroa
- Julian Diaz
- Luna Lopez de la Fuente

Master  Full Stack  - UNIR (2026)

