import { loadStripe } from '@stripe/stripe-js';

// Get the publishable key from environment variables
const stripePublishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment processing will be disabled.');
}

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export const isStripeEnabled = !!stripePublishableKey; 