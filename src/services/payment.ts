import { PaymentInfo } from '../types/index';
import { stripePromise, isStripeEnabled } from '../config/stripe';
import { Stripe, StripeElements } from '@stripe/stripe-js';

export interface StripePaymentResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

// Create a payment intent on the backend
export async function createPaymentIntent(amount: number, metadata: Record<string, string> = {}): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  try {
    console.log('Creating payment intent for amount:', amount);
    
    // Check if we're in development and the backend might not be running
    const apiUrl = '/api/create-payment-intent';
    console.log('Calling API endpoint:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'usd',
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Payment intent creation failed:', response.status, errorData);
      
      // Provide more specific error messages
      if (response.status === 500 && errorData.details === 'Stripe configuration missing') {
        throw new Error('Payment processing is not configured. The backend server may need to be restarted after adding Stripe keys.');
      }
      
      throw new Error(errorData.error || `Failed to create payment intent: ${response.status}`);
    }

    const data = await response.json();
    console.log('Payment intent created successfully:', data.paymentIntentId);
    return data;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    // Check if it's a network error
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to payment server. Please ensure the backend server is running.');
    }
    
    throw error; // Re-throw to be caught by the calling function
  }
}

// Process payment using Stripe
export async function processStripePayment(
  paymentInfo: Partial<PaymentInfo>,
  cardNumberElement: any,
  cardExpiryElement: any,
  cardCvcElement: any,
  stripe: Stripe | null
): Promise<StripePaymentResult> {
  console.log('[DEBUG] processStripePayment called with:', {
    hasPaymentInfo: !!paymentInfo,
    totalAmount: paymentInfo.totalAmount,
    hasStripe: !!stripe,
    hasCardElements: {
      cardNumber: !!cardNumberElement,
      cardExpiry: !!cardExpiryElement,
      cardCvc: !!cardCvcElement
    }
  });
  if (!isStripeEnabled) {
    return {
      success: false,
      error: 'Stripe is not configured. Please contact support.',
    };
  }

  if (!stripe) {
    return {
      success: false,
      error: 'Stripe has not loaded yet. Please try again.',
    };
  }

  if (!paymentInfo.totalAmount) {
    return {
      success: false,
      error: 'Total amount is required for payment',
    };
  }

  try {
    console.log('[DEBUG] Creating payment intent for amount:', paymentInfo.totalAmount);
    
    // Create payment intent first - add cache-busting to ensure fresh creation
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        amount: Math.round(paymentInfo.totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          cardholderName: paymentInfo.cardholderName,
          timestamp: new Date().toISOString(), // Add timestamp to ensure uniqueness
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[ERROR] Payment intent creation failed:', errorData);
      console.error('[ERROR] Response status:', response.status);
      console.error('[ERROR] Amount sent:', paymentInfo.totalAmount, 'cents:', Math.round(paymentInfo.totalAmount * 100));
      
      if (errorData.details === 'Stripe configuration missing') {
        throw new Error('Payment processing is not configured. Please contact support.');
      }
      
      // Include details from the error response for better debugging
      const errorMessage = errorData.error || 'Failed to create payment intent';
      const detailsMessage = errorData.details ? `: ${errorData.details}` : '';
      throw new Error(`${errorMessage}${detailsMessage}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Payment intent created:', data.paymentIntentId);
    console.log('[DEBUG] Client secret received:', !!data.clientSecret);
    
    if (!data.clientSecret) {
      throw new Error('No client secret received from server');
    }

    // Validate client secret format (should be pi_xxx_secret_xxx)
    if (!data.clientSecret || typeof data.clientSecret !== 'string' || !data.clientSecret.includes('_secret_')) {
      console.error('[ERROR] Invalid client secret format:', data.clientSecret?.substring(0, 20));
      throw new Error('Invalid payment session. Please try again.');
    }

    // Confirm the payment with the client secret
    console.log('[DEBUG] Confirming payment with client secret:', data.clientSecret?.substring(0, 20) + '...');
    console.log('[DEBUG] Payment intent ID:', data.paymentIntentId);
    console.log('[DEBUG] Cardholder name:', paymentInfo.cardholderName);
    
    // Ensure card elements are still valid
    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      throw new Error('Card information is missing. Please refresh and try again.');
    }
    
    // Create payment method first from card elements
    // This is more reliable than passing card elements directly to confirmCardPayment
    console.log('[DEBUG] Creating payment method from card elements');
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
        card: cardNumberElement,
        billing_details: {
        name: paymentInfo.cardholderName || '',
      },
    });
    
    if (pmError) {
      console.error('[ERROR] Failed to create payment method:', pmError);
      return {
        success: false,
        error: pmError.message || 'Failed to process card information. Please check your card details and try again.',
      };
    }
    
    if (!paymentMethod) {
      return {
        success: false,
        error: 'Failed to create payment method. Please try again.',
      };
    }
    
    console.log('[DEBUG] Payment method created:', paymentMethod.id);
    
    // Confirm the payment intent with the payment method ID
    // This approach is more reliable than passing card elements directly
    console.log('[DEBUG] Confirming payment intent with payment method');
    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: paymentMethod.id,
    });
    
    console.log('[DEBUG] Payment confirmation result:', {
      success: !result.error,
      error: result.error?.message,
      errorCode: result.error?.code,
      paymentIntent: result.paymentIntent?.id
    });

    if (result.error) {
      console.error('[ERROR] Payment confirmation failed:', result.error);
      console.error('[ERROR] Error code:', result.error.code);
      console.error('[ERROR] Error type:', result.error.type);
      console.error('[ERROR] Error message:', result.error.message);
      
      // Handle specific Stripe errors
      if (result.error.code === 'resource_missing' || result.error.code === 'payment_intent_unexpected_state') {
        // Payment intent might have expired or been used - suggest retry
        return {
          success: false,
          error: 'Payment session expired or invalid. Please try again with a fresh payment.',
        };
      }
      
      // Handle card errors more gracefully
      if (result.error.type === 'card_error') {
        return {
          success: false,
          error: result.error.message || 'Card payment failed. Please check your card details and try again.',
        };
      }
      
      return {
        success: false,
        error: result.error.message || 'Payment confirmation failed. Please try again.',
      };
    }

    console.log('[DEBUG] Payment confirmed successfully:', result.paymentIntent?.id);
    console.log('[DEBUG] Payment intent status:', result.paymentIntent?.status);
    console.log('[DEBUG] Payment intent amount:', result.paymentIntent?.amount);
    
    // Verify the payment was actually captured
    if (result.paymentIntent?.status !== 'succeeded') {
      console.warn('[WARNING] Payment intent status is not "succeeded":', result.paymentIntent?.status);
    }
    
    return {
      success: true,
      paymentIntent: result.paymentIntent,
    };
  } catch (error: any) {
    console.error('[ERROR] Stripe payment error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
}

// Legacy function for backward compatibility (now uses mock for development)
export async function processPayment(
  paymentInfo: Partial<PaymentInfo>,
  stripeToken: string
): Promise<PaymentInfo> {
  // For development/testing, we'll still use mock payments
  // In production, this should be replaced with proper Stripe integration
  console.log('Processing payment with Stripe token:', stripeToken);
  
  // Simulate payment processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate successful payment
  const completedPayment: PaymentInfo = {
    cardholderName: paymentInfo.cardholderName || '',
    totalAmount: paymentInfo.totalAmount || 0,
    isPaid: true,
    paymentDate: new Date()
  };
  
  return completedPayment;
}