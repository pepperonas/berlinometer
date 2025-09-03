import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase, UserRepository } from '@/lib/database';
import { generateSecureToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email format',
          errors: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Connect to database
    const collections = await connectToDatabase();
    const userRepo = new UserRepository(collections);

    // Find user by email
    const user = await userRepo.findByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = generateSecureToken(32);
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await collections.passwordResetTokens.insertOne({
      userId: user.id,
      token: resetToken,
      expiryDate,
      created: new Date(),
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetToken, user.language, user.firstName);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}