/**
 * Script to add initial updates data to Firebase
 * Run this once to populate the updates collection
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './src/app/firebase.js';

const addInitialUpdates = async () => {
  const updates = [
    {
      title: "Help Page Implementation",
      description: "Added comprehensive help page with real-time updates, feedback form, and status tracking",
      type: "feature",
      createdAt: serverTimestamp(),
      version: "1.0.0"
    },
    {
      title: "UI Color Improvements",
      description: "Enhanced color scheme and reduced opacity for better visual hierarchy",
      type: "improvement", 
      createdAt: serverTimestamp(),
      version: "1.0.0"
    },
    {
      title: "Performance Optimization",
      description: "Reduced re-renders and optimized Firebase listeners for better performance",
      type: "improvement",
      createdAt: serverTimestamp(),
      version: "1.0.0"
    },
    {
      title: "Feedback System",
      description: "Implemented real-time feedback collection with status management",
      type: "feature",
      createdAt: serverTimestamp(),
      version: "1.0.0"
    }
  ];

  try {
    for (const update of updates) {
      await addDoc(collection(db, 'updates'), update);
      console.log('Added update:', update.title);
    }
    console.log('All updates added successfully!');
  } catch (error) {
    console.error('Error adding updates:', error);
  }
};

// Uncomment the line below to run this script
// addInitialUpdates();
