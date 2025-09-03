import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/database';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { message: 'Rezept-ID erforderlich' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    
    // Check if recipe exists in generations
    const generation = await db.recipe_generations.findOne({
      userId: payload.userId
    });

    if (!generation) {
      return NextResponse.json(
        { message: 'Rezept nicht gefunden oder nicht berechtigt' },
        { status: 404 }
      );
    }

    // Check if already saved
    const existingSave = await db.saved_recipes.findOne({
      userId: payload.userId,
      recipeId
    });

    if (existingSave) {
      return NextResponse.json(
        { message: 'Rezept bereits gespeichert' },
        { status: 409 }
      );
    }

    // Save recipe
    await db.saved_recipes.insertOne({
      userId: payload.userId,
      recipeId,
      savedAt: new Date(),
      tags: [],
      notes: '',
    });

    return NextResponse.json({
      message: 'Rezept erfolgreich gespeichert'
    });

  } catch (error) {
    console.error('Save recipe error:', error);
    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}