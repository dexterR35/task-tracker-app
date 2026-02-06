# Login Troubleshooting Guide

## Quick Fix Checklist

### 1. **Start the Server**
```bash
cd server
npm run dev
```
Server should start on `http://localhost:5000`

### 2. **Verify Server is Running**
Open browser: `http://localhost:5000/health`
Should return: `{"status":"ok","db":"connected"}`

### 3. **Check Database is Seeded**
```bash
cd server
npm run db:seed
```

### 4. **Default Test Accounts**

After seeding, you can login with:

**Design Department:**
- Email: `admin-design@netbet.ro` | Password: `admin123`
- Email: `user-design@netbet.ro` | Password: `user123`

**Food Department:**
- Email: `admin-food@netbet.ro` | Password: `admin123`
- Email: `user-food@netbet.ro` | Password: `user123`

**Customer Support Department:**
- Email: `admin-customer-support@netbet.ro` | Password: `admin123`
- Email: `user-customer-support@netbet.ro` | Password: `user123`

### 5. **Check Environment Variables**

**Server `.env` file (`server/.env`):**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/task_tracker
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

**Frontend `.env` file (root `.env`):**
```bash
VITE_API_URL=http://localhost:5000
```

### 6. **Common Issues**

#### Issue: "Failed to fetch"
- **Cause**: Server not running
- **Fix**: Start server with `cd server && npm run dev`

#### Issue: "Invalid email or password"
- **Cause**: Wrong credentials or user doesn't exist
- **Fix**: Run `npm run db:seed` to create test users

#### Issue: "Only office emails are allowed"
- **Cause**: Email domain not in whitelist
- **Fix**: Use `@netbet.ro` email or update `ALLOWED_LOGIN_DOMAINS` in `server/config/auth.js`

#### Issue: "Account must be assigned to a department"
- **Cause**: User exists but has no department
- **Fix**: Run `npm run db:seed` to assign departments

#### Issue: CORS Error
- **Cause**: CORS_ORIGIN mismatch
- **Fix**: Set `CORS_ORIGIN=http://localhost:5173` in `server/.env`

### 7. **Verify Database Connection**

```bash
cd server
psql $DATABASE_URL -c "SELECT email, role FROM users LIMIT 5;"
```

Should show seeded users.

### 8. **Check Server Logs**

When you try to login, check server console for:
- Authentication attempts
- Error messages
- Database connection issues

### 9. **Reset Everything**

```bash
cd server
npm run db:reset  # Resets schema and seeds data
npm run dev       # Start server
```

### 10. **Network Debugging**

Open browser console (F12) and check:
- Network tab: See if request reaches server
- Console tab: Check for CORS errors
- Application tab: Check cookies (should see `refresh_token` after login)

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify database is running: `pg_isready`
3. Check port 5000 is not in use: `lsof -i :5000`
4. Verify frontend is running on port 5173: `lsof -i :5173`
