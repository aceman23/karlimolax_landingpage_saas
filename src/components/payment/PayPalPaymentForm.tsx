import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

interface PaymentInfo {
  totalAmount?: number;
  cardholderName?: string;
}

interface PayPalPaymentFormProps {
  paymentInfo: Partial<PaymentInfo>;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  disabled?: boolean;
}

export default function PayPalPaymentForm({
  paymentInfo,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing,
  disabled = false,
}: PayPalPaymentFormProps) {
  const handleApprove = async (data: any, actions: any) => {
    try {
      setIsProcessing(true);
      const order = await actions.order.capture();
      onPaymentSuccess({
        id: order.id,
        cardholderName: order.payer.name.given_name + ' ' + order.payer.name.surname,
        totalAmount: paymentInfo.totalAmount,
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: 'paypal'
      });
    } catch (error: any) {
      onPaymentError(error.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
            <p className="text-gray-700 font-medium">Processing payment...</p>
            <p className="text-sm text-gray-500 mt-1">Please do not close this window</p>
          </div>
        </div>
      )}
      
      <div className="w-full">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    value: (paymentInfo.totalAmount || 0).toFixed(2),
                    currency_code: 'USD'
                  }
                }
              ]
            });
          }}
          onApprove={handleApprove}
          onError={(err) => {
            console.error('PayPal Error:', err);
            onPaymentError('PayPal payment failed. Please try again.');
            setIsProcessing(false);
          }}
          disabled={isProcessing || disabled}
        />
      </div>
    </div>
  );
} 