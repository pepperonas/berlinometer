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
      ?.find(c => c.trim().startsWith('accessToken='))
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
    
    // Get user's recipes
    const recipes = await collections.recipes
      .find({ userId: payload.userId })
      .sort({ created: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        category: recipe.category,
        tags: recipe.tags,
        nutritionInfo: recipe.nutritionInfo,
        created: recipe.created,
        userId: recipe.userId,
      }))
    });

  } catch (error) {
    console.error('Error loading user recipes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}