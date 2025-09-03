import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase, UserRepository } from '@/lib/database';
import { hashPassword, validatePassword } from '@/lib/auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { token, newPassword } = validationResult.data;

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Connect to database
    const collections = await connectToDatabase();

    // Find valid reset token
    const resetToken = await collections.passwordResetTokens.findOne({
      token,
      expiryDate: { $gt: new Date() }
    });

    if (!resetToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or expired reset token' 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const userRepo = new UserRepository(collections);
    const updated = await userRepo.update(resetToken.userId, {
      password: hashedPassword
    });

    if (!updated) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update password' 
        },
        { status: 500 }
      );
    }

    // Delete used reset token
    await collections.passwordResetTokens.deleteOne({ token });

    // Delete all other reset tokens for this user
    await collections.passwordResetTokens.deleteMany({ userId: resetToken.userId });

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset. You can now login with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to verify token validity
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token is required' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    const collections = await connectToDatabase();

    // Check if token exists and is valid
    const resetToken = await collections.passwordResetTokens.findOne({
      token,
      expiryDate: { $gt: new Date() }
    });

    if (!resetToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or expired reset token' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}