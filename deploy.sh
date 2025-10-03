#!/bin/bash

# Deployment script for Vercel
echo "🚀 Deploying to Vercel..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔧 To enable maintenance mode:"
echo "1. Edit src/utils/maintenanceUtils.js"
echo "2. Change MAINTENANCE_MODE to true"
echo "3. Run: vercel --prod"
echo ""
echo "🔧 To disable maintenance mode:"
echo "1. Edit src/utils/maintenanceUtils.js"
echo "2. Change MAINTENANCE_MODE to false"
echo "3. Run: vercel --prod"
