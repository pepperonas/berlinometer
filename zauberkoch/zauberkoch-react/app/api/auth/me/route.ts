import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { connectToDatabase, UserRepository } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the access token
    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check for demo user (bypass database for demo account)
    if (payload.userId === 'demo-user-001') {
      const demoUser = {
        id: 'demo-user-001',
        username: 'DemoUser',
        email: 'demo@zauberkoch.com',
        firstName: 'Demo',
        lastName: 'User',
        language: 'de',
        premiumExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year premium for demo
        verified: true,
        created: new Date(),
      };

      return NextResponse.json({
        success: true,
        user: demoUser,
      });
    }

    // Get user data from database
    const collections = await connectToDatabase();
    const userRepository = new UserRepository(collections);
    
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update last seen
    await userRepository.updateLastSeen(user.id);

    // Return user data (without password)
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}