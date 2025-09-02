import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/database';
import { verifyAccessToken } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { message: 'Plan-ID erforderlich' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free') {
      return NextResponse.json(
        { message: 'Ungültiger Plan' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const collections = await connectToDatabase();
    const user = await collections.users.findOne({ 
      _id: payload.userId 
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if user already has premium
    if (user.premiumExpiration && new Date(user.premiumExpiration) > new Date()) {
      return NextResponse.json(
        { message: 'Du hast bereits ein aktives Premium-Abonnement' },
        { status: 409 }
      );
    }

    // Create PayPal subscription
    const subscriptionData = await createPayPalSubscription(plan, payload.userId);

    if (!subscriptionData.approvalUrl) {
      throw new Error('Fehler beim Erstellen der PayPal-Zahlung');
    }

    // Store subscription intent in database
    await collections.subscription_intents.insertOne({
      userId: payload.userId,
      planId: plan.id,
      paypalSubscriptionId: subscriptionData.subscriptionId,
      status: 'pending',
      createdAt: new Date(),
      approvalUrl: subscriptionData.approvalUrl,
    });

    return NextResponse.json({
      subscriptionId: subscriptionData.subscriptionId,
      approvalUrl: subscriptionData.approvalUrl,
      message: 'Subscription erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

async function createPayPalSubscription(plan: any, userId: string) {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalApiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  if (!paypalClientId || !paypalClientSecret) {
    throw new Error('PayPal Konfiguration fehlt');
  }

  // Get PayPal access token
  const authResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!authResponse.ok) {
    throw new Error('PayPal Authentifizierung fehlgeschlagen');
  }

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  // Create subscription
  const subscriptionPayload = {
    plan_id: getPayPalPlanId(plan.id),
    custom_id: userId,
    application_context: {
      brand_name: 'ZauberKoch',
      locale: 'de-DE',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/premium/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/premium/cancel`,
    },
  };

  const subscriptionResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(subscriptionPayload),
  });

  if (!subscriptionResponse.ok) {
    const errorData = await subscriptionResponse.json().catch(() => ({}));
    console.error('PayPal subscription creation failed:', errorData);
    throw new Error('PayPal Abonnement konnte nicht erstellt werden');
  }

  const subscriptionData = await subscriptionResponse.json();
  
  // Find the approval URL
  const approvalUrl = subscriptionData.links?.find(
    (link: any) => link.rel === 'approve'
  )?.href;

  if (!approvalUrl) {
    throw new Error('PayPal Approval URL nicht gefunden');
  }

  return {
    subscriptionId: subscriptionData.id,
    approvalUrl,
  };
}

function getPayPalPlanId(planId: string): string {
  // These would be the PayPal Plan IDs created in your PayPal dashboard
  // For now, using placeholder IDs - replace with actual PayPal Plan IDs
  const paypalPlanIds = {
    monthly: process.env.PAYPAL_MONTHLY_PLAN_ID || 'P-MONTHLY-PLAN-ID',
    yearly: process.env.PAYPAL_YEARLY_PLAN_ID || 'P-YEARLY-PLAN-ID',
  };

  const paypalPlanId = paypalPlanIds[planId as keyof typeof paypalPlanIds];
  
  if (!paypalPlanId) {
    throw new Error(`PayPal Plan ID für ${planId} nicht gefunden`);
  }

  return paypalPlanId;
}