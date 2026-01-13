import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';
import Button from '../common/Button';
import { processStripePayment } from '../../services/payment';
import { PaymentInfo } from '../../types/index';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
  paymentInfo: Partial<PaymentInfo>;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  disabled?: boolean;
}

const elementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export default function StripePaymentForm({
  paymentInfo,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing,
  disabled = false,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);



  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isProcessing) {
      console.log('Payment already in progress, ignoring duplicate submission');
      return;
    }

    if (!stripe || !elements) {
      console.error('[ERROR] Stripe not loaded:', { stripe: !!stripe, elements: !!elements });
      toast.error('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter the cardholder name');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    console.log('[DEBUG] Stripe elements:', {
      cardNumber: !!cardNumberElement,
      cardExpiry: !!cardExpiryElement,
      cardCvc: !!cardCvcElement
    });

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      console.error('[ERROR] Card elements not found');
      toast.error('Card elements not found. Please refresh the page and try again.');
      return;
    }

    console.log('[DEBUG] Payment info:', {
      totalAmount: paymentInfo.totalAmount,
      cardholderName,
      isProcessing
    });

    if (!paymentInfo.totalAmount || paymentInfo.totalAmount <= 0) {
      console.error('[ERROR] Invalid payment amount:', paymentInfo.totalAmount);
      toast.error('Invalid payment amount. Please try again.');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const result = await processStripePayment(
        {
          ...paymentInfo,
          cardholderName,
        },
        cardNumberElement,
        cardExpiryElement,
        cardCvcElement,
        stripe
      );

      console.log('[DEBUG] Stripe payment result:', result);
      
      if (result.success) {
        console.log('[DEBUG] Payment successful, calling onPaymentSuccess');
        onPaymentSuccess(result);
      } else {
        console.error('[ERROR] Payment failed:', result.error);
        const errorMessage = result.error || 'Payment failed';
        console.log('[DEBUG] Calling onPaymentError with:', errorMessage);
        onPaymentError(errorMessage);
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('[ERROR] Exception during payment processing:', error);
      const errorMessage = error.message || 'Payment processing failed';
      console.log('[DEBUG] Calling onPaymentError with exception:', errorMessage);
      onPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
            <p className="text-gray-700 font-medium">Processing payment...</p>
            <p className="text-sm text-gray-500 mt-1">Please do not close this window</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cardholder Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="cardholderName">
            Cardholder Name *
          </label>
          <input
            type="text"
            id="cardholderName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Name as it appears on card"
            required
            disabled={isProcessing}
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Card Number *
          </label>
          <div className={`w-full px-4 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-purple-500 ${isProcessing ? 'opacity-50' : ''}`}>
            <CardNumberElement
              options={{
                ...elementOptions,
                disabled: isProcessing,
              }}
              onChange={handleCardChange}
            />
          </div>
        </div>

        {/* Expiration Date and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Expiration Date *
            </label>
            <div className={`w-full px-4 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-purple-500 ${isProcessing ? 'opacity-50' : ''}`}>
              <CardExpiryElement
                options={{
                  ...elementOptions,
                  disabled: isProcessing,
                }}
                onChange={handleCardChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              CVC *
            </label>
            <div className={`w-full px-4 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-purple-500 ${isProcessing ? 'opacity-50' : ''}`}>
              <CardCvcElement
                options={{
                  ...elementOptions,
                  disabled: isProcessing,
                }}
                onChange={handleCardChange}
              />
            </div>
          </div>
        </div>

        {cardError && (
          <p className="text-red-500 text-sm mt-1">{cardError}</p>
        )}

        {/* Secure Message */}
        <div className="flex items-center px-4 py-3 bg-gray-50 rounded border border-gray-200">
          <Lock className="text-gray-400 mr-2" size={18} />
          <span className="text-sm text-gray-600">
            Your payment information is encrypted and secure. We never store your card details.
          </span>
        </div>



        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || isProcessing || disabled}
          className="w-full"
        >
          {isProcessing ? 'Processing payment...' : `Pay $${(paymentInfo.totalAmount || 0).toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
} 