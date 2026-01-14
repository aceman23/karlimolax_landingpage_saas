import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';
import { CreditCard, Lock } from 'lucide-react';
import { processPayment } from '../services/payment';
import { createBooking, BookingRequestPayload } from '../services/booking';
import toast from 'react-hot-toast';

import { sendBookingConfirmation } from '../services/sms';
import { useAuth } from '../context/AuthContext';

import StripeProvider from '../components/payment/StripeProvider';
import StripePaymentForm from '../components/payment/StripePaymentForm';

import { isStripeEnabled } from '../config/stripe';

// Minor edit

export default function PaymentPage() {
  const navigate = useNavigate();
  const { 
    selectedVehicle,
    selectedPackage,
    bookingDetails,
    customerInfo,
    paymentInfo,
    setPaymentInfo,
    calculateTotal,
    calculateTotalWithGratuity,
    gratuityInfo,
    setCurrentBooking,
    settings
  } = useBooking();
  const { token, user } = useAuth();
  
  console.log('DEBUG PaymentPage selectedVehicle:', selectedVehicle);
  

  
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe'>('stripe');


  
  
  
  // Redirect if necessary info is missing
  if ((!selectedVehicle && !selectedPackage) || !bookingDetails.pickupDate || !customerInfo.firstName) {
    navigate('/booking');
    return null;
  }



  // Handle Stripe success
  const handleStripeSuccess = async (result: { success: boolean; paymentIntent?: any; error?: string }) => {
    try {
      if (!result.success || !result.paymentIntent) {
        throw new Error(result.error || 'Payment failed');
      }

      setIsProcessing(true);
      const totalAmount = calculateTotalWithGratuity();
      const processedPayment = {
        id: result.paymentIntent.id,
        cardholderName: customerInfo.firstName + ' ' + customerInfo.lastName,
        totalAmount,
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: 'stripe'
      };
      setPaymentInfo(processedPayment);
      const booking = await createBookingAfterPayment(processedPayment, totalAmount);
      if (booking) {
        setCurrentBooking(booking);
        try { await sendBookingConfirmation(booking); } catch {}
        navigate('/booking-success');
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment succeeded but booking failed');
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (message: string) => {
    console.error('[ERROR] Payment error received:', message);
    
    // Provide more specific error messages based on common Stripe errors
    let userFriendlyMessage = message;
    
    if (message.includes('card_number')) {
      userFriendlyMessage = 'Please check your card number and try again.';
    } else if (message.includes('expiry')) {
      userFriendlyMessage = 'Please check your card expiration date and try again.';
    } else if (message.includes('cvc')) {
      userFriendlyMessage = 'Please check your card security code (CVC) and try again.';
    } else if (message.includes('insufficient_funds')) {
      userFriendlyMessage = 'Your card has insufficient funds. Please try a different card.';
    } else if (message.includes('card_declined')) {
      userFriendlyMessage = 'Your card was declined. Please try a different card.';
    } else if (message.includes('expired')) {
      userFriendlyMessage = 'Payment session expired. Please try again.';
    } else if (message.includes('network')) {
      userFriendlyMessage = 'Network error. Please check your connection and try again.';
    } else if (message.includes('Payment failed')) {
      userFriendlyMessage = 'Payment processing failed. Please check your card details and try again.';
    }
    
    console.log('[DEBUG] Showing user-friendly error:', userFriendlyMessage);
    toast.error(userFriendlyMessage);
    setErrors({ submission: userFriendlyMessage });
    setIsProcessing(false);
  };

  // Common booking creation logic
  const createBookingAfterPayment = async (processedPayment: any, totalAmount: number) => {
    try {
      if (!processedPayment || !processedPayment.id) {
        console.error('Invalid payment:', processedPayment);
        throw new Error('Invalid payment information');
      }

      if (!totalAmount || totalAmount <= 0) {
        console.error('Invalid total amount:', totalAmount);
        throw new Error('Invalid total amount');
      }

      // Log all available data
      console.log('DEBUG - User:', user);
      console.log('DEBUG - Customer Info:', customerInfo);
      console.log('DEBUG - Booking Details:', bookingDetails);
      console.log('DEBUG - Selected Package:', selectedPackage);
      console.log('DEBUG - Selected Vehicle:', selectedVehicle);

      // Validate required customer information
      let customerName: string;
      let customerEmail: string;
      let customerPhone: string;

      if (!user) {
        // For non-logged in users, check customerInfo
        if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone) {
          console.error('Missing required customer information:', {
            email: customerInfo.email,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone
          });
          throw new Error('Missing required customer information');
        }
        // Construct customer information from customerInfo
        customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
        customerEmail = customerInfo.email;
        customerPhone = customerInfo.phone;
      } else {
        // For logged-in users, check user info and customerInfo.phone
        const userEmail = user.email;
        const userFirstName = user.firstName;
        const userLastName = user.lastName;
        
        if (!userEmail || !userFirstName || !userLastName || !customerInfo.phone) {
          console.error('Missing required customer information:', {
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
            phone: customerInfo.phone
          });
          throw new Error('Missing required customer information');
        }
        // Construct customer information from user info
        customerName = `${userFirstName} ${userLastName}`.trim();
        customerEmail = userEmail;
        customerPhone = customerInfo.phone;
      }

      // Log customer information
      console.log('DEBUG - Customer Information:', {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      });

      // Validate required booking information
      if (!bookingDetails.pickupAddress || !bookingDetails.dropoffAddress || !bookingDetails.pickupDate) {
        console.error('Missing required booking information:', {
          pickupAddress: bookingDetails.pickupAddress,
          dropoffAddress: bookingDetails.dropoffAddress,
          pickupDate: bookingDetails.pickupDate
        });
        throw new Error('Missing required booking information');
      }

      // Sanitize identifiers to avoid invalid ObjectId casts on the server
      const candidateVehicleId = bookingDetails.vehicleId || selectedVehicle?._id || selectedVehicle?.id;
      const sanitizedVehicleId = typeof candidateVehicleId === 'string' && /^[a-fA-F0-9]{24}$/.test(candidateVehicleId)
        ? candidateVehicleId
        : undefined;

      // Customer relation is optional; avoid sending a non-Customer ObjectId
      const sanitizedCustomerId = null;

      // Create proper pickup time by combining date and time
      const pickupDateTime = bookingDetails.pickupTime 
        ? new Date(`${bookingDetails.pickupDate.toISOString().split('T')[0]}T${bookingDetails.pickupTime}`)
        : new Date(bookingDetails.pickupDate);
      
      // Calculate dropoff time based on pickup time and hours
      const dropoffDateTime = bookingDetails.hours 
        ? new Date(pickupDateTime.getTime() + bookingDetails.hours * 3600000)
        : undefined;

      const bookingPayload = {
        customerId: sanitizedCustomerId,
        customerEmail: customerEmail,
        customerName: customerName,
        customerPhone: customerPhone,
        pickupLocation: bookingDetails.pickupAddress,
        dropoffLocation: bookingDetails.dropoffAddress,
        pickupTime: pickupDateTime.toISOString(),
        dropoffTime: dropoffDateTime?.toISOString(),
        price: totalAmount,
        totalAmount: totalAmount,
        specialInstructions: bookingDetails.specialRequests || '',
        packageId: selectedPackage?.id || '',
        packageName: selectedPackage?.name || 'Custom Package',
        vehicleId: sanitizedVehicleId,
        vehicleName: bookingDetails.vehicleName || selectedVehicle?.name || '',
        hours: bookingDetails.hours || undefined,
        passengers: bookingDetails.passengers || 1,
        carSeats: bookingDetails.carSeats || 0,
        boosterSeats: bookingDetails.boosterSeats || 0,
        status: 'pending',
        paymentStatus: 'paid',
        stops: bookingDetails.stops?.map((stop, index) => ({
          location: stop.location,
          order: index + 1,
          price: stop.price || 0
        })) || [],
        gratuity: gratuityInfo
      };

      // Log the complete payload for debugging
      console.log('DEBUG - Complete booking payload:', JSON.stringify(bookingPayload, null, 2));
      console.log('DEBUG - Vehicle information in booking payload:', {
        vehicleId: bookingPayload.vehicleId,
        vehicleName: bookingPayload.vehicleName,
        bookingDetailsVehicleId: bookingDetails.vehicleId,
        bookingDetailsVehicleName: bookingDetails.vehicleName,
        selectedVehicleId: selectedVehicle?._id || selectedVehicle?.id,
        selectedVehicleName: selectedVehicle?.name
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header if we have a valid token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create booking' }));
        console.error('Booking creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          payload: bookingPayload
        });
        throw new Error(errorData.message || `Failed to create booking: ${response.status} ${response.statusText}`);
      }

      const booking = await response.json();
      console.log('Booking created successfully:', booking);
      return booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Please use MM/YY format';
    }
    
    if (!cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isProcessing) {
      console.log('Payment already in progress, ignoring duplicate submission');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Set processing state immediately to prevent double-clicks
      setIsProcessing(true);
      
      const totalAmount = calculateTotalWithGratuity();
      const updatedPaymentInfo = {
        ...paymentInfo,
        cardholderName,
        totalAmount,
        paymentMethod: 'card' // Example payment method
      };
      
      // Simulate payment processing
      const mockStripeToken = 'tok_' + Math.random().toString(36).substring(2, 15);
      const processedPayment = await processPayment(updatedPaymentInfo, mockStripeToken);
      
      setPaymentInfo(processedPayment);
      
      // Create booking after successful payment
      const booking = await createBookingAfterPayment(processedPayment, totalAmount);
      
      if (booking) {
        // Set the current booking in context
        setCurrentBooking(booking);
        
        // Send booking confirmation SMS
        try {
          await sendBookingConfirmation(booking);
        } catch (smsError) {
          console.error('Error sending SMS confirmation:', smsError);
          // Don't block the flow if SMS fails
        }
        
        // Navigate to success page
        navigate('/booking-success');
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Payment processing failed. Please try again.');
      setErrors({
        submission: error.message || 'There was an error processing your payment. Please try again.'
      });
      // Only reset processing state on error
      setIsProcessing(false);
    }
  };

  // Format the card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts: string[] = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Payment</h1>
        
        {/* Booking Steps */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand text-white">
                1
              </div>
              <span className="text-sm font-medium">Select Package/Vehicle</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-brand"></div>
            
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand text-white">
                2
              </div>
              <span className="text-sm font-medium">Booking Details</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-brand"></div>
            
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand text-white">
                3
              </div>
              <span className="text-sm font-medium">Customer Info</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-brand"></div>
            
            <div className="flex flex-col items-center text-brand">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand text-white">
                4
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {/* Booking Summary */}
          <div className="mb-8 p-5 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-4 pb-2 border-b">Booking Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">
                  {selectedPackage ? selectedPackage.name : selectedVehicle?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {bookingDetails.pickupDate?.toLocaleDateString()} at {bookingDetails.pickupTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {selectedPackage && selectedPackage.id !== 'special-events' 
                    ? 'Fixed Rate Service'
                    : `${bookingDetails.hours} hour(s)`}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <span className="font-medium">Base Amount:</span>
              <span className="text-lg font-semibold text-gray-700">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="font-medium">Total with Gratuity:</span>
              <span className="text-xl font-bold text-brand">${calculateTotalWithGratuity().toFixed(2)}</span>
            </div>
          </div>
          
          {/* Cancellation Policy Notice */}
          <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-brand-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-brand-700">Cancellation Policy</h3>
                <div className="mt-2 text-sm text-brand-600">
                  <p className="mb-2">Please note our cancellation policy:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>More than 48 hours:</strong> Full refund minus $25 processing fee</li>
                    <li>• <strong>24-48 hours:</strong> 50% refund</li>
                    <li>• <strong>Less than 24 hours:</strong> No refund</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <h2 className="text-2xl font-semibold mb-6">Enter Payment Information</h2>
          

          
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
              <div className="flex space-x-4 mb-6">
                {isStripeEnabled && (
                  <button
                    onClick={() => setSelectedPaymentMethod('stripe')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === 'stripe'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-200'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span>Credit Card</span>
                    </div>
                  </button>
                )}
                

              </div>
                </div>
              
            {selectedPaymentMethod === 'stripe' && isStripeEnabled ? (
              <StripeProvider>
                <StripePaymentForm
                  paymentInfo={{
                    totalAmount: calculateTotalWithGratuity(),
                    cardholderName: '',
                  }}
                  onPaymentSuccess={handleStripeSuccess}
                  onPaymentError={handlePaymentError}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  disabled={false}
                />
              </StripeProvider>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Payment processing is currently unavailable.</p>
                <p className="text-sm text-gray-500 mt-2">Please try again later or contact support.</p>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button 
                variant="secondary"
                onClick={() => navigate('/customer-info')}
                disabled={isProcessing}
              >
                Back
              </Button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
}