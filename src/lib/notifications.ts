
'use server';

import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from './firebase';
import type { Notification } from './types';

// This function can be called from server components or other server-side logic
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  if (!firebaseApp) {
    console.error("Firebase is not initialized. Cannot create notification.");
    // In a real app, you might want to handle this more gracefully.
    // For this simulation, we'll just log an error.
    return;
  }
  
  // A simple check to avoid sending notifications if the config is not set.
  // This prevents errors if the user hasn't set up their firebaseConfig.
  if (firebaseApp.options.apiKey === 'YOUR_API_KEY') {
      console.log("Firebase config is default. Skipping notification creation.");
      return;
  }

  const db = getFirestore(firebaseApp);
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification in Firestore: ", error);
  }
}
