import { connectToDatabase } from './mongodb';
import type { User } from '@/types';

// User Limits & Premium Checks (Server-side only)
export async function checkUserLimits(userId: string): Promise<boolean> {
  try {
    // Check for demo user (bypass database for demo account)
    if (userId === 'demo-user-001') {
      // Demo user has premium status, so unlimited generations
      return true;
    }

    const { db } = await connectToDatabase();
    
    // Get user data
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      console.error('User not found for limits check:', userId);
      return false;
    }
    
    // Premium users have unlimited generations
    if (isPremiumUser(user)) {
      return true;
    }
    
    // Check daily generation limits for free users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastGenerationDate = user.lastGenerationDate ? new Date(user.lastGenerationDate) : null;
    const isToday = lastGenerationDate && lastGenerationDate >= today;
    
    const dailyGenerations = isToday ? (user.dailyGenerations || 0) : 0;
    const dailyLimit = 5; // Free users get 5 generations per day
    
    console.log(`User ${userId} daily generations: ${dailyGenerations}/${dailyLimit}`);
    return dailyGenerations < dailyLimit;
  } catch (error) {
    console.error('Error checking user limits:', error);
    return false;
  }
}

// Helper function to check premium status
function isPremiumUser(user: User): boolean {
  if (!user.premiumExpiration) return false;
  return new Date(user.premiumExpiration) > new Date();
}