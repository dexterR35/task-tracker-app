#!/bin/bash
# Development startup script - starts both server and frontend

echo "🚀 Starting Task Tracker App..."
echo ""

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found"
    exit 1
fi

# Check if server .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env not found"
    echo "   Creating from env.example..."
    if [ -f "server/env.example" ]; then
        cp server/env.example server/.env
        echo "   ✅ Created server/.env - Please update DATABASE_URL and JWT_SECRET"
    else
        echo "   ❌ server/env.example not found"
        exit 1
    fi
fi

# Start server in background
echo "📦 Starting server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a bit for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:5000"
else
    echo "⚠️  Server may not be ready yet. Check server logs."
fi

echo ""
echo "🌐 Starting frontend..."
echo "   Frontend will be available at http://localhost:5173"
echo ""
echo "📝 Test accounts (after running: cd server && npm run db:seed):"
echo "   - admin-design@netbet.ro / admin123"
echo "   - user-design@netbet.ro / user123"
echo "   - admin-food@netbet.ro / admin123"
echo "   - user-food@netbet.ro / user123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM
wait $SERVER_PID
