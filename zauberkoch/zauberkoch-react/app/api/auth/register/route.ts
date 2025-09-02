import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  hashPassword, 
  validateEmail, 
  validatePassword, 
  validateUsername,
  generateSecureToken,
  generateReferralCode,
  SecurityManager
} from '@/lib/auth';
import { connectToDatabase, UserRepository } from '@/lib/database';
import { sendVerificationEmail } from '@/lib/email';
import { headers } from 'next/headers';

// Request validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  language: z.enum(['de', 'en']).default('de'),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const clientIP = forwardedFor?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     request.ip || 
                     'unknown';

    // Check registration rate limiting
    const rateLimitKey = `register:${clientIP}`;
    if (!SecurityManager.checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 per hour
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many registration attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { username, email, password, firstName, lastName, language, referralCode } = validationResult.data;

    // Additional password validation
    const passwordValidation = validatePassword(password);
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
    const userRepo = new UserRepository(collections);

    // Check if email already exists
    const existingUserByEmail = await userRepo.findByEmail(email);
    if (existingUserByEmail) {
      SecurityManager.recordAttempt(rateLimitKey, false, email, clientIP);
      return NextResponse.json(
        { 
          success: false, 
          message: 'An account with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUserByUsername = await userRepo.findByUsername(username);
    if (existingUserByUsername) {
      SecurityManager.recordAttempt(rateLimitKey, false, email, clientIP);
      return NextResponse.json(
        { 
          success: false, 
          message: 'This username is already taken' 
        },
        { status: 409 }
      );
    }

    // Validate referral code if provided
    let referralBonus = false;
    if (referralCode) {
      const referral = await collections.referrals.findOne({ 
        referralCode, 
        referredUserId: { $exists: false } 
      });
      
      if (!referral) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid referral code' 
          },
          { status: 400 }
        );
      }
      
      referralBonus = true;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await userRepo.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      language,
      premiumExpiration: referralBonus ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null, // 90 days if referral
      subscriptionId: null,
      verified: false,
      googleOauth: false,
      referralCode: generateReferralCode(),
    });

    // Create verification token
    const verificationToken = generateSecureToken(64);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await collections.verificationTokens.insertOne({
      userId: newUser.id,
      token: verificationToken,
      expiryDate: tokenExpiry,
      created: new Date(),
    });

    // Create default user settings
    await collections.userSettings.insertOne({
      id: `settings_${newUser.id}`,
      userId: newUser.id,
      rgType: 'all',
      rgGoal: 'healthy',
      rgApi: 'openai',
      sliderDiversity: 3,
      sliderDuration: 3,
      sliderCost: 3,
      sliderPortions: 2,
      cbxGetThin: false,
      cbxGetHeavy: false,
      cbxGetMuscles: false,
      cbxGetHealthy: true,
      rgTypeDrink: 'all',
      rgStyleDrink: 'classic',
      sliderDiversityDrink: 3,
      sliderComplexityDrink: 3,
      sliderAlcoholContentDrink: 3,
      sliderGlassesDrink: 2,
      cbxFruityDrink: false,
      cbxDessertDrink: false,
      expandableLayoutOpen: true,
      requestJson: true,
      reduceAnimations: false,
      updated: new Date(),
    });

    // Process referral if provided
    if (referralCode) {
      await collections.referrals.updateOne(
        { referralCode },
        { 
          $set: { 
            referredUserId: newUser.id, 
            used: new Date() 
          } 
        }
      );

      // Give referrer bonus (3 months premium)
      const referral = await collections.referrals.findOne({ referralCode });
      if (referral) {
        const referrer = await userRepo.findById(referral.referrerUserId);
        if (referrer) {
          const currentPremium = referrer.premiumExpiration || new Date();
          const newPremiumExpiry = new Date(Math.max(currentPremium.getTime(), Date.now()) + 90 * 24 * 60 * 60 * 1000);
          
          await userRepo.update(referrer.id, {
            premiumExpiration: newPremiumExpiry
          });
        }
      }
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, language);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Record successful registration
    SecurityManager.recordAttempt(rateLimitKey, true, email, clientIP);

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        language: newUser.language,
        verified: newUser.verified,
        referralBonus,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

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