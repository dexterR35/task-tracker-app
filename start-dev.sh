#!/bin/bash
set -e

echo "🚀 Starting Task Tracker App (DEV)..."
echo ""

ROOT_DIR=$(pwd)

# ---- Backend checks ----
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found"
    exit 1
fi

# Backend .env
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env not found"
    echo "   Creating from env.example..."
    if [ -f "server/env.example" ]; then
        cp server/env.example server/.env
        echo "   ✅ Created server/.env (update DATABASE_URL & JWT_SECRET)"
    else
        echo "   ❌ server/env.example not found"
        exit 1
    fi
fi

# ---- Start backend ----
echo "📦 Starting backend..."
cd server
npm install
npm run dev &
SERVER_PID=$!
cd "$ROOT_DIR"

# Give backend time
sleep 3

# Health check
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:5000"
else
    echo "⚠️  Backend not ready yet (check server logs)"
fi

# ---- Start frontend ----
echo ""
echo "🌐 Starting frontend..."
npm install
npm run dev &
FRONTEND_PID=$!

echo "   Frontend running at http://localhost:5173"
echo ""
echo "📝 Test accounts (after: cd server && npm run db:seed):"
echo "   - admin-design@netbet.ro / admin123"
echo "   - user-design@netbet.ro / user123"
echo "   - admin-food@netbet.ro / admin123"
echo "   - user-food@netbet.ro / user123"
echo ""
echo "Press Ctrl+C to stop both servers"

# ---- Cleanup ----
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait $SERVER_PID $FRONTEND_PID
