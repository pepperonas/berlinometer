import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OAUTH_CONFIG } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!GOOGLE_OAUTH_CONFIG.clientId || !GOOGLE_OAUTH_CONFIG.clientSecret) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
        },
        { status: 500 }
      );
    }

    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state in session/cookie for verification later (in a production app)
    // For now, we'll skip state verification but this should be implemented
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', GOOGLE_OAUTH_CONFIG.clientId);
    googleAuthUrl.searchParams.append('redirect_uri', GOOGLE_OAUTH_CONFIG.redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'email profile openid');
    googleAuthUrl.searchParams.append('state', state);
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');

    // Redirect to Google OAuth
    return NextResponse.redirect(googleAuthUrl.toString());
    
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initiate Google OAuth' 
      },
      { status: 500 }
    );
  }
}