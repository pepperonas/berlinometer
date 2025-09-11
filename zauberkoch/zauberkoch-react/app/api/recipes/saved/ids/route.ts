import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');
    const accessToken = cookieHeader
      ?.split(';')
      ?.find(c => c.trim().startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    const collections = await connectToDatabase();
    
    // Get user's saved recipe IDs
    const savedRecipes = await collections.saved_recipes
      .find({ userId: payload.userId })
      .toArray();

    const savedIds = savedRecipes.map(sr => sr.recipeId);

    return NextResponse.json({
      success: true,
      savedIds
    });

  } catch (error) {
    console.error('Error loading saved recipe IDs:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}