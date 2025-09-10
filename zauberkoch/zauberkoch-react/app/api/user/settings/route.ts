import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

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

    // Check for demo user (return default settings)
    if (user.email === 'demo@zauberkoch.com') {
      const settings = {
        theme: 'system',
        language: 'de',
        notifications: {
          email: true,
          push: false,
          recipeReminders: true
        },
        preferences: {
          dietary: [],
          allergies: [],
          cuisineTypes: [],
          cookingExperience: 'intermediate',
          defaultServings: 4
        },
        privacy: {
          shareRecipes: false,
          showActivity: true
        }
      };

      return NextResponse.json({ settings });
    }

    const { db } = await connectToDatabase();
    
    // Get user settings from database or return defaults
    const userDoc = await db.collection('users').findOne({ 
      email: user.email 
    });

    const settings = userDoc?.settings || {
      theme: 'system',
      language: 'de',
      notifications: {
        email: true,
        push: false,
        recipeReminders: true
      },
      preferences: {
        dietary: [],
        allergies: [],
        cuisineTypes: [],
        cookingExperience: 'intermediate',
        defaultServings: 4
      },
      privacy: {
        shareRecipes: false,
        showActivity: true
      }
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const settings = await request.json();
    
    // Check for demo user (return success without saving)
    if (user.email === 'demo@zauberkoch.com') {
      return NextResponse.json({ 
        message: 'Settings updated successfully',
        settings
      });
    }
    
    const { db } = await connectToDatabase();
    
    // Update user settings
    const updateResult = await db.collection('users').updateOne(
      { email: user.email },
      { 
        $set: { 
          settings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    if (updateResult.modifiedCount === 0 && updateResult.upsertedCount === 0) {
      return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}