import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get user's favorite recipes
    const favorites = await db.collection('recipes')
      .find({ 
        userId: user.id,
        saved: true
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const formattedFavorites = favorites.map((recipe: any) => ({
      id: recipe._id.toString(),
      title: recipe.title || recipe.name || 'Unnamed Recipe',
      description: recipe.description || '',
      type: recipe.type || 'recipe',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      cookingTime: recipe.cookingTime || recipe.prepTime || 'Unknown',
      difficulty: recipe.difficulty || 'medium',
      rating: recipe.rating || 0,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      tags: recipe.tags || []
    }));

    return NextResponse.json({ recipes: formattedFavorites });
  } catch (error) {
    console.error('Favorites error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { recipeId, action } = await request.json();
    
    if (!recipeId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const updateResult = await db.collection('recipes').updateOne(
      { 
        _id: new ObjectId(recipeId),
        userId: user.id
      },
      { 
        $set: { 
          saved: action === 'add',
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: action === 'add' ? 'Recipe added to favorites' : 'Recipe removed from favorites',
      saved: action === 'add'
    });
  } catch (error) {
    console.error('Favorites update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}