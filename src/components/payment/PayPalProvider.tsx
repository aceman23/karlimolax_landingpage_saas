import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: React.ReactNode;
}

export default function PayPalProvider({ children }: PayPalProviderProps) {
  const paypalClientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    console.warn('PayPal client ID not found. PayPal payment processing will be disabled.');
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider options={{
      clientId: paypalClientId,
      currency: 'USD',
      intent: 'capture'
    }}>
      {children}
    </PayPalScriptProvider>
  );
} 