# Quick Start Guide - Raw SQL Implementation

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Database created

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tasktracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Socket.IO
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tasktracker;

# Exit
\q
```

### 4. Setup Database

```bash
npm run db:setup
```

This creates all tables, indexes, and triggers from schema.sql.

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

Creates initial users and sample data:
- **Admin**: admin@tasktracker.com / admin123
- **User**: user@tasktracker.com / user123

### 6. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 7. Test the API

Visit http://localhost:5000/health to verify the server is running.

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:setup` - Setup database structure from schema.sql
- `npm run db:seed` - Seed database with initial data
- `npm run db:init` - Run both setup and seeding

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get board by ID
- `GET /api/boards/month/:monthId` - Get board by month
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Reporters
- `GET /api/reporters` - Get all reporters
- `GET /api/reporters/:id` - Get reporter by ID
- `POST /api/reporters` - Create new reporter
- `PUT /api/reporters/:id` - Update reporter
- `DELETE /api/reporters/:id` - Delete reporter

### Deliverables
- `GET /api/deliverables` - Get all deliverables
- `GET /api/deliverables/:id` - Get deliverable by ID
- `POST /api/deliverables` - Create new deliverable
- `PUT /api/deliverables/:id` - Update deliverable
- `DELETE /api/deliverables/:id` - Delete deliverable

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/deactivate` - Deactivate user
- `DELETE /api/users/:id` - Delete user

## Testing with cURL

### Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "department": "design"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tasktracker.com",
    "password": "admin123"
  }'
```

## Troubleshooting

### Database connection failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Database setup errors
- Check PostgreSQL permissions
- Verify database exists
- Check schema.sql for syntax errors

### Server won't start
- Check if port 5000 is available
- Verify all environment variables are set
- Check Node.js version (18+ required)

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Set up PostgreSQL connection pooling
5. Enable SSL for database connection
6. Set up proper logging and monitoring

## Need Help?

- Review `README.md` for full documentation
- Check PostgreSQL logs for database errors
- Review application logs in the console
