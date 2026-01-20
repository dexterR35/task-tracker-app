# Task Tracker Backend API

A production-ready PERN (PostgreSQL, Express, React, Node.js) stack backend with Prisma ORM, JWT authentication, and Socket.IO for real-time features.

## 🚀 Features

- **RESTful API** - Complete CRUD operations for all resources
- **Authentication & Authorization** - JWT-based auth with role-based access control (RBAC)
- **Real-time Updates** - Socket.IO integration for live data synchronization
- **Database** - PostgreSQL with Prisma ORM for type-safe database access
- **Security** - Helmet, CORS, rate limiting, password hashing with bcrypt
- **Logging** - Winston logger with multiple transports
- **Validation** - Request validation using Joi schemas
- **Error Handling** - Centralized error handling with custom error classes
- **Activity Logging** - Complete audit trail for all user actions
- **Scalable Architecture** - Modular structure ready for production

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 13.x
- npm >= 9.x

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Environment
NODE_ENV=development

# Server
PORT=5000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/task_tracker_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=8h

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial data (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Database seeding script
├── src/
│   ├── config/
│   │   ├── database.js      # Prisma client setup
│   │   ├── env.js           # Environment configuration
│   │   └── socket.js        # Socket.IO setup
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js
│   │   ├── tasks.controller.js
│   │   ├── users.controller.js
│   │   ├── reporters.controller.js
│   │   ├── deliverables.controller.js
│   │   └── boards.controller.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication & authorization
│   │   ├── errorHandler.js  # Error handling
│   │   └── validation.js    # Request validation
│   ├── routes/              # API routes
│   │   ├── auth.routes.js
│   │   ├── tasks.routes.js
│   │   ├── users.routes.js
│   │   ├── reporters.routes.js
│   │   ├── deliverables.routes.js
│   │   └── boards.routes.js
│   └── utils/               # Utility functions
│       ├── jwt.js           # JWT token utilities
│       ├── logger.js        # Winston logger
│       └── password.js      # Password hashing utilities
├── server.js                # Main server file
├── package.json
└── .env.example
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update password
- `DELETE /api/users/:id` - Delete user (Admin only)

### Tasks

- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Reporters

- `GET /api/reporters` - Get all reporters
- `GET /api/reporters/:id` - Get reporter by ID
- `POST /api/reporters` - Create reporter (Admin only)
- `PUT /api/reporters/:id` - Update reporter (Admin only)
- `DELETE /api/reporters/:id` - Delete reporter (Admin only)

### Deliverables

- `GET /api/deliverables` - Get all deliverables
- `GET /api/deliverables/:id` - Get deliverable by ID
- `POST /api/deliverables` - Create deliverable (Admin only)
- `PUT /api/deliverables/:id` - Update deliverable (Admin only)
- `DELETE /api/deliverables/:id` - Delete deliverable (Admin only)

### Boards

- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get board by ID
- `GET /api/boards/month/:monthId` - Get board by month
- `POST /api/boards` - Create board (Admin only)
- `PUT /api/boards/:id` - Update board (Admin only)
- `DELETE /api/boards/:id` - Delete board (Admin only)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### User Roles

- **USER** - Regular user (can manage own tasks)
- **ADMIN** - Full access to all features
- **MANAGER** - Can view team tasks
- **VIEWER** - Read-only access

## 🔌 Socket.IO Events

### Connection

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Events

**Client -> Server:**
- `task:subscribe` - Subscribe to task updates
- `task:unsubscribe` - Unsubscribe from task updates
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:update` - Update user presence

**Server -> Client:**
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `user:typing` - User is typing
- `user:stopped_typing` - User stopped typing
- `user:presence` - User presence update
- `user:offline` - User went offline

## 📊 Database Schema

Your database uses **PostgreSQL with Prisma ORM** and includes:

- **8 tables** - Users, Sessions, Tasks, Reporters, Deliverables, Boards, TaskDeliverables, ActivityLogs
- **3 enums** - UserRole, TaskStatus, TaskPriority
- **Single UUID identifiers** - No Firebase compatibility, clean design
- **Full audit trail** - Activity logging on all operations
- **Optimized indexes** - 20 strategic indexes for performance

See `DATABASE_SCHEMA.md` for complete schema documentation with diagrams.

## 🚀 Deployment to Heroku

### 1. Install Heroku CLI

```bash
# macOS
brew install heroku/brew/heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create Heroku App

```bash
heroku create your-app-name
```

### 4. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:essential-0
```

### 5. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-jwt-secret
heroku config:set JWT_EXPIRES_IN=8h
heroku config:set CORS_ORIGINS=https://your-frontend-domain.com
```

### 6. Deploy

```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

### 7. Run Migrations

Migrations will run automatically via the `release` command in `Procfile`. To run manually:

```bash
heroku run npx prisma migrate deploy
```

### 8. Seed Database (Optional)

```bash
heroku run npm run prisma:seed
```

### 9. View Logs

```bash
heroku logs --tail
```

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test

# Check Prisma schema
npx prisma validate

# Generate Prisma client
npm run prisma:generate

# View database in Prisma Studio
npm run prisma:studio
```

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User** - User accounts with authentication
- **Session** - Active user sessions
- **Task** - Task/work items
- **Reporter** - External reporters/stakeholders
- **Deliverable** - Task deliverable types
- **Board** - Monthly task boards
- **TaskDeliverable** - Many-to-many relationship
- **ActivityLog** - Audit trail for all actions

See `prisma/schema.prisma` for complete schema.

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 8h |
| `CORS_ORIGINS` | Allowed CORS origins | localhost:5173 |
| `LOG_LEVEL` | Logging level | info |

## 📝 Default Credentials (After Seeding)

- **Admin:** admin@tasktracker.com / Admin@123456
- **User:** user@tasktracker.com / User@123456

⚠️ **Change these in production!**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db push

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 npm run dev
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the development team.
