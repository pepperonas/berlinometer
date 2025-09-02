import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/database';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { message: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, token } = body;

    if (!subscriptionId || !token) {
      return NextResponse.json(
        { message: 'Subscription-ID und Token erforderlich' },
        { status: 400 }
      );
    }

    // Get PayPal subscription details
    const subscriptionDetails = await getPayPalSubscriptionDetails(subscriptionId);
    
    if (!subscriptionDetails) {
      return NextResponse.json(
        { message: 'Abonnement nicht gefunden oder ungültig' },
        { status: 404 }
      );
    }

    // Verify that the subscription belongs to the current user
    if (subscriptionDetails.custom_id !== payload.userId) {
      return NextResponse.json(
        { message: 'Abonnement gehört nicht zum aktuellen Benutzer' },
        { status: 403 }
      );
    }

    // Activate subscription only if it's not already active
    if (subscriptionDetails.status === 'ACTIVE') {
      const collections = await connectToDatabase();
      
      // Find subscription intent to get plan details
      const intent = await collections.subscription_intents.findOne({
        paypalSubscriptionId: subscriptionId,
        userId: payload.userId,
      });

      if (!intent) {
        return NextResponse.json(
          { message: 'Subscription-Intent nicht gefunden' },
          { status: 404 }
        );
      }

      // Calculate expiration date based on plan
      const now = new Date();
      const expirationDate = new Date(now);
      
      if (intent.planId === 'monthly') {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      } else if (intent.planId === 'yearly') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }

      // Update user premium status
      await collections.users.updateOne(
        { id: payload.userId },
        {
          $set: {
            premiumExpiration: expirationDate,
            subscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            updatedAt: now,
          }
        }
      );

      // Update subscription intent status
      await collections.subscription_intents.updateOne(
        { _id: intent._id },
        {
          $set: {
            status: 'completed',
            activatedAt: now,
            expirationDate: expirationDate,
          }
        }
      );

      // Log the activation
      await collections.subscription_logs.insertOne({
        userId: payload.userId,
        subscriptionId: subscriptionId,
        action: 'manual_activation',
        planId: intent.planId,
        expirationDate: expirationDate,
        createdAt: now,
      });

      return NextResponse.json({
        message: 'Premium erfolgreich aktiviert',
        expirationDate: expirationDate,
        planId: intent.planId,
      });

    } else {
      return NextResponse.json(
        { message: `Abonnement ist nicht aktiv. Status: ${subscriptionDetails.status}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Subscription activation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Interner Serverfehler bei der Aktivierung' },
      { status: 500 }
    );
  }
}

async function getPayPalSubscriptionDetails(subscriptionId: string) {
  try {
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

    // Get subscription details
    const subscriptionResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!subscriptionResponse.ok) {
      console.error('PayPal subscription fetch failed:', subscriptionResponse.status);
      return null;
    }

    const subscriptionData = await subscriptionResponse.json();
    return subscriptionData;

  } catch (error) {
    console.error('Error fetching PayPal subscription:', error);
    return null;
  }
}