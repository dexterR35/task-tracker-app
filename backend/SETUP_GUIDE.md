# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update DATABASE_URL
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/task_tracker_db"
```

### Step 3: Setup Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb task_tracker_db

# Run migrations
npm run db:setup

# Seed with sample data
npm run db:seed
```

#### Option B: Heroku PostgreSQL

```bash
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0

# Get DATABASE_URL
heroku config:get DATABASE_URL

# Update your .env with this URL
```

### Step 4: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will be running at: **http://localhost:5000**

### Step 5: Test API

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

## 🔥 Quick Deploy to Heroku

```bash
# 1. Login to Heroku
heroku login

# 2. Create app and add PostgreSQL
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set CORS_ORIGINS=https://your-frontend.com

# 4. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 5. Run migrations and seed (automatic via Procfile release command)
# Or manually:
heroku run npm run db:seed

# 6. Open app
heroku open
```

## 📊 Database Management

```bash
# View database with psql
psql $DATABASE_URL

# Run migrations
npm run db:setup

# Seed database
npm run db:seed

# Reset database (⚠️ deletes all data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:setup
```

## 🔐 Default Test Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tasktracker.com | Admin@123456 |
| User | user@tasktracker.com | User@123456 |

## 🛠️ Common Commands

```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production mode
npm start

# Run migrations
npm run db:setup

# Seed database
npm run db:seed

# Setup database (migrate + seed)
npm run db:setup
```

## 🔍 Useful Heroku Commands

```bash
# View logs
heroku logs --tail

# Run shell commands
heroku run bash

# Check Postgres info
heroku pg:info

# Connect to database
heroku pg:psql

# Restart app
heroku restart

# Scale dynos
heroku ps:scale web=1

# Open app in browser
heroku open
```

## 💡 Tips

1. **JWT_SECRET**: Generate a strong secret with `openssl rand -base64 32`
2. **CORS_ORIGINS**: Update with your frontend URLs (comma-separated)
3. **Rate Limiting**: Adjust limits in `.env` for your use case
4. **Logging**: Use `LOG_LEVEL=debug` for development
5. **Database**: Backup regularly in production

## ⚠️ Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Update CORS_ORIGINS for production
- [ ] Change seeded user passwords
- [ ] Enable HTTPS in production
- [ ] Set up database backups
- [ ] Configure proper rate limits
- [ ] Review and adjust user permissions
- [ ] Set up monitoring and alerts

## 🐛 Troubleshooting

**Port already in use:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Database migration failed:**
```bash
# Check database exists
psql -l | grep task_tracker

# Recreate database
npm run db:setup
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. ✅ Backend API is running
2. 🔗 Connect your React frontend
3. 🧪 Test with Postman or similar
4. 🚀 Deploy to production
5. 📊 Monitor performance
6. 🔒 Set up SSL/HTTPS
7. 📝 Configure logging and monitoring

## 🆘 Need Help?

- 📖 Read the full README.md
- 🐛 Check the troubleshooting section
- 💬 Open an issue on GitHub
- 📧 Contact the development team

---

**Happy Coding! 🎉**
