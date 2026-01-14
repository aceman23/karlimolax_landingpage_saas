// Get the PayPal client ID from environment variables
const paypalClientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;

// Check if PayPal is enabled
export const isPayPalEnabled = false; // Temporarily disabled

// Payment method types
export type PaymentMethod = 'stripe' | 'paypal' | 'zelle';

// Payment configuration
export const paymentConfig = {
  currency: 'USD',
  supportedMethods: ['stripe'] as PaymentMethod[],
  defaultMethod: 'stripe' as PaymentMethod,
};

// Zelle configuration
export const zelleConfig = {
  email: 'Knockoutautorentals@gmai.com',
  name: 'Kar Limo LAX'
}; 