# Firebase Setup Instructions

## 🚨 Firebase Configuration Error Fix

You're seeing this error because the Firebase environment variables are not configured. Follow these steps to fix it:

## Step 1: Create Environment File

Create a `.env` file in your project root:

```bash
touch .env
```

## Step 2: Add Firebase Configuration

Add the following variables to your `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=task-tracker-app-eb03e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=task-tracker-app-eb03e
VITE_FIREBASE_STORAGE_BUCKET=task-tracker-app-eb03e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Step 3: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `task-tracker-app-eb03e`
3. Click the gear icon (⚙️) → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If you don't have a web app, click **"Add app"** → **Web** (</>)
6. Copy the configuration values from the `firebaseConfig` object

## Step 4: Replace Placeholder Values

Replace the placeholder values in your `.env` file with the actual values from Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI
VITE_FIREBASE_AUTH_DOMAIN=task-tracker-app-eb03e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=task-tracker-app-eb03e
VITE_FIREBASE_STORAGE_BUCKET=task-tracker-app-eb03e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=976694748809
VITE_FIREBASE_APP_ID=1:976694748809:web:4a1d4c0a72ad588e2fc858
```

## Step 5: Restart Development Server

```bash
npm run dev
```

## 🔧 Alternative: Quick Fix

If you want to use the existing configuration temporarily, you can modify the Firebase config to use fallback values:

```javascript
// In src/app/firebase.js, replace the config object with:
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-tracker-app-eb03e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-tracker-app-eb03e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-tracker-app-eb03e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "976694748809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:976694748809:web:4a1d4c0a72ad588e2fc858",
};
```

## ⚠️ Security Note

- Never commit your `.env` file to version control
- The `.env` file should be in your `.gitignore`
- Use environment variables for production deployments

## 🎯 Expected Result

After completing these steps, your Firebase configuration should work correctly and you should see:

```
✅ Firebase app initialized successfully
✅ Auth persistence configured
✅ Session management active
```

