# Stripe Payment Integration Setup Guide

## Overview

The application now supports both mock payments (for development) and real Stripe payments (for production). The system automatically detects whether Stripe is configured and switches between the two modes.

## Current Status

✅ **Frontend Integration**: Complete
- Stripe configuration utility (`src/config/stripe.ts`)
- Stripe payment service (`src/services/payment.ts`)
- Stripe payment form component (`src/components/payment/StripePaymentForm.tsx`)
- Stripe provider component (`src/components/payment/StripeProvider.tsx`)
- Updated PaymentPage with conditional rendering

✅ **Backend Integration**: Partially Complete
- Payment endpoints added to `server/routes/api.ts`
- Payment intent creation endpoint
- Payment confirmation endpoint
- Webhook endpoint for payment events

⚠️ **Missing Dependencies**: 
- `@stripe/react-stripe-js` (frontend)
- `stripe` (backend)

## Setup Instructions

### 1. Install Required Dependencies

#### Frontend Dependencies
```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
# or
yarn add @stripe/react-stripe-js @stripe/stripe-js
```

#### Backend Dependencies
```bash
npm install stripe
# or
yarn add stripe
```

### 2. Configure Environment Variables

The following environment variables have been added to your `.env` file:

```env
# Backend Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend Stripe Configuration (Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Get Your Stripe Keys

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: In your Stripe Dashboard, go to Developers > API keys
3. **Copy Keys**: 
   - Copy the "Publishable key" (starts with `pk_test_`)
   - Copy the "Secret key" (starts with `sk_test_`)
4. **Update .env**: Replace the placeholder values in your `.env` file

### 4. Configure Webhooks (Optional but Recommended)

1. **Create Webhook Endpoint**: In Stripe Dashboard, go to Developers > Webhooks
2. **Add Endpoint**: Add `https://yourdomain.com/api/stripe-webhook`
3. **Select Events**: Choose events like `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Get Webhook Secret**: Copy the webhook signing secret (starts with `whsec_`)
5. **Update .env**: Add the webhook secret to your `.env` file

## How It Works

### Development Mode (No Stripe Keys)
- Uses mock payment processing
- Shows "Payment Method (Demo Mode)" in the UI
- Simulates successful payments after 1.5 seconds
- No real money is processed

### Production Mode (With Stripe Keys)
- Uses real Stripe payment processing
- Shows "Secure Payment with Stripe" in the UI
- Displays Stripe Elements for secure card input
- Processes real payments through Stripe

### Automatic Detection
The system automatically detects if Stripe is configured by checking for the presence of `VITE_STRIPE_PUBLISHABLE_KEY`. If the key is present and valid, it enables Stripe mode; otherwise, it falls back to mock mode.

## API Endpoints

### POST /api/create-payment-intent
Creates a Stripe PaymentIntent for processing payments.

**Request Body:**
```json
{
  "amount": 150.00,
  "currency": "usd",
  "metadata": {
    "customerName": "John Doe"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### POST /api/confirm-payment
Confirms a payment and updates booking status.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx",
  "bookingId": "booking_xxx"
}
```

### POST /api/stripe-webhook
Handles Stripe webhook events for payment status updates.

## Testing

### Test Card Numbers
Use these test card numbers in development:

- **Successful Payment**: `4242424242424242`
- **Declined Payment**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

### Test Details
- **Expiry**: Any future date (e.g., `12/25`)
- **CVV**: Any 3-digit number (e.g., `123`)
- **Name**: Any name

## Security Considerations

1. **Environment Variables**: Never commit real Stripe keys to version control
2. **HTTPS**: Always use HTTPS in production for Stripe integration
3. **Webhook Verification**: Always verify webhook signatures using the webhook secret
4. **Client-Side**: Only use publishable keys on the frontend
5. **Server-Side**: Keep secret keys secure on the backend only

## Troubleshooting

### Common Issues

1. **"Stripe has not loaded yet"**
   - Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure the publishable key is valid

2. **"Failed to create payment intent"**
   - Check that `STRIPE_SECRET_KEY` is set on the backend
   - Verify the backend server is running
   - Check network connectivity

3. **Payment form not showing**
   - Install required dependencies: `@stripe/react-stripe-js`
   - Check browser console for errors

4. **Webhook events not received**
   - Verify webhook URL is accessible from the internet
   - Check webhook secret configuration
   - Use ngrok for local development testing

## Next Steps

1. **Install Dependencies**: Run the npm/yarn install commands above
2. **Get Stripe Keys**: Create a Stripe account and get your test keys
3. **Update Environment**: Replace placeholder keys in `.env` file
4. **Test Integration**: Try making a test payment
5. **Configure Webhooks**: Set up webhooks for production deployment

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Documentation](https://stripe.com/docs/stripe-js/react)
- [Stripe API Reference](https://stripe.com/docs/api) 