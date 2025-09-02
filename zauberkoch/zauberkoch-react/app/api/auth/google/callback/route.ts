import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OAUTH_CONFIG } from '@/lib/constants';
import { connectToDatabase, UserRepository } from '@/lib/database';
import { createAccessToken, createRefreshToken, setAuthCookies, generateReferralCode } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import type { User } from '@/types';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=oauth_error`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=missing_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info from Google:', await userResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=user_info_failed`);
    }

    const googleUser: GoogleUserInfo = await userResponse.json();

    if (!googleUser.verified_email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=email_not_verified`);
    }

    // Connect to database
    const collections = await connectToDatabase();
    const userRepository = new UserRepository(collections);

    // Check if user already exists
    let user = await userRepository.findByEmail(googleUser.email);

    if (!user) {
      // Create new user
      const newUser = {
        username: googleUser.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7),
        email: googleUser.email,
        firstName: googleUser.given_name || '',
        lastName: googleUser.family_name || '',
        language: 'de' as const,
        premiumExpiration: null,
        subscriptionId: null,
        verified: true, // Google users are already verified
        googleOauth: true,
        referralCode: generateReferralCode(),
      };

      user = await userRepository.create(newUser);

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.language, user.firstName || user.username);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }
    } else {
      // Update existing user's Google OAuth status
      await userRepository.update(user.id, { 
        googleOauth: true,
        verified: true,
        lastSeen: new Date()
      });
      
      // Refresh user data
      user = await userRepository.findById(user.id);
      if (!user) {
        throw new Error('User not found after update');
      }
    }

    // Create JWT tokens
    const jwtAccessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    // Create response and set auth cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`);
    
    // Set cookies manually since setAuthCookies expects a Response object
    const maxAge = 60 * 60; // 1 hour for access token
    const refreshMaxAge = 60 * 60 * 24 * 7; // 7 days for refresh token

    response.cookies.set('access_token', jwtAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshMaxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=oauth_callback_failed`);
  }
}