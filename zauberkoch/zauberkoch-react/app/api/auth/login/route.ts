import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  comparePasswords, 
  createAccessToken, 
  createRefreshToken, 
  setAuthCookies,
  SecurityManager,
  validateEmail
} from '@/lib/auth';
import { connectToDatabase, UserRepository } from '@/lib/database';
import { headers } from 'next/headers';

// Request validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const clientIP = forwardedFor?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input', 
          errors: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check for demo user (bypass database for demo account)
    if (email === 'demo@zauberkoch.com' && password === 'demo123') {
      const demoUser = {
        id: 'demo-user-001',
        username: 'DemoUser',
        email: 'demo@zauberkoch.com',
        firstName: 'Demo',
        lastName: 'User',
        language: 'de',
        premiumExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days premium
        verified: true,
        created: new Date(),
      };

      // Create tokens for demo user
      const accessToken = await createAccessToken(demoUser);
      const refreshToken = await createRefreshToken(demoUser.id);

      const response = NextResponse.json({
        success: true,
        message: 'Demo login successful',
        user: demoUser,
      });

      // Set cookies
      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });

      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // Check rate limiting
    const rateLimitKey = `login:${clientIP}:${email}`;
    if (SecurityManager.isBlocked(rateLimitKey)) {
      const remainingAttempts = SecurityManager.getRemainingAttempts(rateLimitKey);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Too many login attempts. Please try again later.`,
          remainingAttempts,
          blockDuration: '15 minutes'
        },
        { status: 429 }
      );
    }

    // Connect to database
    const collections = await connectToDatabase();
    const userRepo = new UserRepository(collections);

    // Find user by email
    const user = await userRepo.findByEmail(email);
    
    if (!user) {
      // Record failed attempt
      SecurityManager.recordAttempt(rateLimitKey, false, email, clientIP);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Check if account is verified
    if (!user.verified) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please verify your email address before logging in',
          requiresVerification: true
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = user.password ? await comparePasswords(password, user.password) : false;
    
    if (!isValidPassword) {
      // Record failed attempt
      SecurityManager.recordAttempt(rateLimitKey, false, email, clientIP);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Record successful attempt
    SecurityManager.recordAttempt(rateLimitKey, true, email, clientIP);

    // Update last seen
    await userRepo.updateLastSeen(user.id);

    // Create tokens
    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    // Store refresh token in database
    await collections.userSessions.insertOne({
      userId: user.id,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created: new Date(),
      lastUsed: new Date(),
      userAgent: headersList.get('user-agent') || undefined,
      ipAddress: clientIP,
    });

    // Set HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
        premiumExpiration: user.premiumExpiration,
        verified: user.verified,
        created: user.created,
      },
    });

    // Set cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://zauberkoch.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}