import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
} 