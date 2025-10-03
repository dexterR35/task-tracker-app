#!/bin/bash

# Toggle maintenance mode script
MAINTENANCE_FILE="src/utils/maintenanceUtils.js"

if grep -q "MAINTENANCE_MODE = true" "$MAINTENANCE_FILE"; then
    echo "🔧 Disabling maintenance mode..."
    sed -i 's/MAINTENANCE_MODE = true/MAINTENANCE_MODE = false/' "$MAINTENANCE_FILE"
    echo "✅ Maintenance mode DISABLED"
    echo "🚀 Deploying to Vercel..."
    vercel --prod
elif grep -q "MAINTENANCE_MODE = false" "$MAINTENANCE_FILE"; then
    echo "🔧 Enabling maintenance mode..."
    sed -i 's/MAINTENANCE_MODE = false/MAINTENANCE_MODE = true/' "$MAINTENANCE_FILE"
    echo "✅ Maintenance mode ENABLED"
    echo "🚀 Deploying to Vercel..."
    vercel --prod
else
    echo "❌ Could not find MAINTENANCE_MODE in $MAINTENANCE_FILE"
    exit 1
fi
