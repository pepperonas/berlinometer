import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/database';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const body = await request.text();
    
    if (!webhookId) {
      console.error('PayPal Webhook ID not configured');
      return NextResponse.json({ message: 'Webhook not configured' }, { status: 500 });
    }

    // Verify PayPal webhook signature
    const isValid = await verifyPayPalWebhook(headersList, body, webhookId);
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('PayPal webhook event:', event.event_type);

    const collections = await connectToDatabase();

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event, collections);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event, collections);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event, collections);
        break;

      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await handleSubscriptionReactivated(event, collections);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event, collections);
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentFailed(event, collections);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event_type}`);
    }

    // Log webhook event
    await collections.webhook_logs.insertOne({
      type: event.event_type,
      data: {
        eventId: event.id,
        resourceId: event.resource?.id,
        payload: event,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function verifyPayPalWebhook(
  headers: Headers,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    const paypalApiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get PayPal access token
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured');
    }

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
      throw new Error('PayPal authentication failed');
    }

    const authData = await authResponse.json();

    // Verify webhook signature
    const verificationData = {
      auth_algo: headers.get('PAYPAL-AUTH-ALGO'),
      cert_id: headers.get('PAYPAL-CERT-ID'),
      transmission_id: headers.get('PAYPAL-TRANSMISSION-ID'),
      transmission_sig: headers.get('PAYPAL-TRANSMISSION-SIG'),
      transmission_time: headers.get('PAYPAL-TRANSMISSION-TIME'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    };

    const verifyResponse = await fetch(`${paypalApiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify(verificationData),
    });

    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification failed:', await verifyResponse.text());
      return false;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';

  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

async function handleSubscriptionActivated(event: any, collections: any) {
  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id; // This is our userId

  console.log(`Subscription activated: ${subscriptionId} for user: ${customId}`);

  // Find subscription intent
  const intent = await collections.subscription_intents.findOne({
    paypalSubscriptionId: subscriptionId,
    userId: customId,
  });

  if (!intent) {
    console.error(`Subscription intent not found for: ${subscriptionId}`);
    return;
  }

  // Calculate expiration date based on plan
  const plan = intent.planId;
  const now = new Date();
  const expirationDate = new Date(now);
  
  if (plan === 'monthly') {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  } else if (plan === 'yearly') {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  }

  // Update user premium status
  await collections.users.updateOne(
    { _id: customId },
    {
      $set: {
        premiumExpiration: expirationDate,
        subscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        updatedAt: now,
      }
    }
  );

  // Update subscription intent
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
    userId: customId,
    subscriptionId: subscriptionId,
    action: 'activated',
    planId: plan,
    expirationDate: expirationDate,
    createdAt: now,
  });

  console.log(`Premium activated for user ${customId} until ${expirationDate}`);
}

async function handleSubscriptionCancelled(event: any, collections: any) {
  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id;

  console.log(`Subscription cancelled: ${subscriptionId} for user: ${customId}`);

  // Update user subscription status
  await collections.users.updateOne(
    { _id: customId },
    {
      $set: {
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
      }
    }
  );

  // Log the cancellation
  await collections.subscription_logs.insertOne({
    userId: customId,
    subscriptionId: subscriptionId,
    action: 'cancelled',
    reason: event.resource.status_change_note || 'User cancelled',
    createdAt: new Date(),
  });
}

async function handleSubscriptionSuspended(event: any, collections: any) {
  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id;

  console.log(`Subscription suspended: ${subscriptionId} for user: ${customId}`);

  await collections.users.updateOne(
    { _id: customId },
    {
      $set: {
        subscriptionStatus: 'suspended',
        updatedAt: new Date(),
      }
    }
  );

  await collections.subscription_logs.insertOne({
    userId: customId,
    subscriptionId: subscriptionId,
    action: 'suspended',
    reason: event.resource.status_change_note || 'Payment failed',
    createdAt: new Date(),
  });
}

async function handleSubscriptionReactivated(event: any, collections: any) {
  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id;

  console.log(`Subscription reactivated: ${subscriptionId} for user: ${customId}`);

  await collections.users.updateOne(
    { _id: customId },
    {
      $set: {
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      }
    }
  );

  await collections.subscription_logs.insertOne({
    userId: customId,
    subscriptionId: subscriptionId,
    action: 'reactivated',
    createdAt: new Date(),
  });
}

async function handlePaymentCompleted(event: any, collections: any) {
  const paymentId = event.resource.id;
  const subscriptionId = event.resource.billing_agreement_id;

  console.log(`Payment completed: ${paymentId} for subscription: ${subscriptionId}`);

  // Find user by subscription
  const user = await collections.users.findOne({
    subscriptionId: subscriptionId
  });

  if (!user) {
    console.error(`User not found for subscription: ${subscriptionId}`);
    return;
  }

  // Log the payment
  await collections.payment_logs.insertOne({
    userId: user._id,
    subscriptionId: subscriptionId,
    paymentId: paymentId,
    amount: event.resource.amount,
    currency: event.resource.amount.currency_code,
    status: 'completed',
    createdAt: new Date(),
  });

  // Extend premium if needed (for renewals)
  const currentExpiration = user.premiumExpiration ? new Date(user.premiumExpiration) : new Date();
  const now = new Date();
  
  // If subscription is about to expire or already expired, extend it
  if (currentExpiration <= now || (currentExpiration.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    const newExpiration = new Date(Math.max(currentExpiration.getTime(), now.getTime()));
    
    // Add subscription period
    const intent = await collections.subscription_intents.findOne({
      paypalSubscriptionId: subscriptionId
    });
    
    if (intent?.planId === 'monthly') {
      newExpiration.setMonth(newExpiration.getMonth() + 1);
    } else if (intent?.planId === 'yearly') {
      newExpiration.setFullYear(newExpiration.getFullYear() + 1);
    }

    await collections.users.updateOne(
      { _id: user._id },
      {
        $set: {
          premiumExpiration: newExpiration,
          subscriptionStatus: 'active',
          updatedAt: now,
        }
      }
    );

    console.log(`Premium extended for user ${user._id} until ${newExpiration}`);
  }
}

async function handlePaymentFailed(event: any, collections: any) {
  const paymentId = event.resource.id;
  const subscriptionId = event.resource.billing_agreement_id;

  console.log(`Payment failed: ${paymentId} for subscription: ${subscriptionId}`);

  const user = await collections.users.findOne({
    subscriptionId: subscriptionId
  });

  if (user) {
    await collections.payment_logs.insertOne({
      userId: user._id,
      subscriptionId: subscriptionId,
      paymentId: paymentId,
      status: 'failed',
      reason: event.resource.reason_code || 'Payment failed',
      createdAt: new Date(),
    });
  }
}