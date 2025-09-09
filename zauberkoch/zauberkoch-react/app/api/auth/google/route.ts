import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return offline message for Google OAuth
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/auth/login?message=Google OAuth ist offline nicht verfügbar. Verwenden Sie die Demo-Anmeldung.`);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/auth/login?error=oauth_offline`);
  }
}