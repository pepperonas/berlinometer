import { NextRequest, NextResponse } from 'next/server';

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
    // Return offline error since Google OAuth requires external services
    return NextResponse.json(
      {
        error: "Offline",
        message: "Google OAuth ist offline nicht verfügbar. Bitte verwenden Sie die Demo-Anmeldung."
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/auth/login?error=oauth_offline`);
  }
}