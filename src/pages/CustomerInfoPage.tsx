import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import FormTermsCheckbox from '../components/common/FormTermsCheckbox';
import { Helmet } from 'react-helmet';

export default function CustomerInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedVehicle,
    selectedPackage,
    bookingDetails, 
    customerInfo,
    setCustomerInfo,
    calculateTotal,
    calculateTotalWithGratuity,
    setPaymentInfo,
    totalPrice
  } = useBooking();
  
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    termsAgreed?: string;
  }>({});
  
  const [termsAgreed, setTermsAgreed] = useState(false);
  
  // Set user info from logged in user if available
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        ...customerInfo,
        firstName: customerInfo.firstName || user.firstName || '',
        lastName: customerInfo.lastName || user.lastName || '',
        email: user.email
      });
    }
  }, [user]);
  
  // Log booking details for debugging
  useEffect(() => {
    // Check if addresses are correctly populated
    console.log('CustomerInfoPage - Booking Details:', {
      pickupAddress: bookingDetails.pickupAddress,
      dropoffAddress: bookingDetails.dropoffAddress,
      pickupDate: bookingDetails.pickupDate,
      pickupTime: bookingDetails.pickupTime
    });
  }, [bookingDetails]);
  
  const handleBackButton = (event: PopStateEvent) => {
    event.preventDefault();
    // Navigate back to booking page with step 2
    navigate('/booking', { state: { step: 2 } });
  };

  window.addEventListener('popstate', handleBackButton);

  // Redirect if no vehicle/package or booking details
  if ((!selectedVehicle && !selectedPackage) || !bookingDetails.pickupDate) {
    navigate('/booking');
    return null;
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo({
      ...customerInfo,
      [name]: value
    });
    
    // Clear error for this field if any
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };
  
  const validateForm = (): boolean => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      termsAgreed?: string;
    } = {};
    
    if (!customerInfo.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!customerInfo.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    // Only validate email if user is not logged in (since we use their account email)
    if (!user) {
      if (!customerInfo.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    if (!customerInfo.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(customerInfo.phone.replace(/[^\d]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!termsAgreed) {
      errors.termsAgreed = 'You must agree to the Terms of Service and Privacy Policy to continue';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Set payment info with calculated total including gratuity
    const total = calculateTotalWithGratuity();
    setPaymentInfo({
      totalAmount: total,
      isPaid: false
    });
    
    // Proceed to payment
    navigate('/payment');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <Helmet>
        <title>Customer Information | Kar Limo LAX</title>
        <meta name="description" content="Complete your booking information for KarLimoLax premium transportation services in Los Angeles." />
        <link rel="canonical" href="https://dapperlimolax.com/customer-info" />
      </Helmet>
      
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Customer Information</h1>
        
        {/* Booking Steps */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand-500">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand-500 text-white">
                1
              </div>
              <span className="text-sm font-medium">Select Package/Vehicle</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-brand-500"></div>
            
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand-500">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand-500 text-white">
                2
              </div>
              <span className="text-sm font-medium">Booking Details</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-brand-500"></div>
            
            <div className="flex flex-col items-center mb-4 md:mb-0 text-brand-500">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-brand-500 text-white">
                3
              </div>
              <span className="text-sm font-medium">Customer Info</span>
            </div>

            <div className="hidden md:block w-24 h-0.5 bg-gray-200"></div>
            
            <div className="flex flex-col items-center text-gray-400">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-gray-200 text-gray-500">
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
                <p className="text-sm text-gray-500">Pickup Location</p>
                <p className="font-medium">{bookingDetails.pickupAddress}</p>
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
              <span className="font-medium">Total Estimate:</span>
              <span className="text-xl font-bold text-brand-500">${calculateTotalWithGratuity().toFixed(2)}</span>
            </div>
          </div>
          
          {/* Customer Information Form */}
          <h2 className="text-2xl font-semibold mb-6">Enter Your Information</h2>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="firstName">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={customerInfo.firstName || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                  aria-required="true"
                  aria-invalid={formErrors.firstName ? 'true' : 'false'}
                  aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
                />
                {formErrors.firstName && (
                  <p id="firstName-error" className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={customerInfo.lastName || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                  aria-required="true"
                  aria-invalid={formErrors.lastName ? 'true' : 'false'}
                  aria-describedby={formErrors.lastName ? "lastName-error" : undefined}
                />
                {formErrors.lastName && (
                  <p id="lastName-error" className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                )}
              </div>
              
              {/* Email - only shown for non-logged in users */}
              {!user ? (
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={customerInfo.email || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                    aria-required="true"
                    aria-invalid={formErrors.email ? 'true' : 'false'}
                    aria-describedby={formErrors.email ? "email-error" : "email-description"}
                  />
                  {formErrors.email ? (
                    <p id="email-error" className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  ) : (
                    <p id="email-description" className="text-sm text-gray-500 mt-1">
                      We'll send your booking confirmation to this email
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700">
                    {user.email} <span className="text-gray-500 text-sm">(Account email)</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Your booking confirmation will be sent to your account email
                  </p>
                </div>
              )}
              
              {/* Phone */}
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                  aria-required="true"
                  aria-invalid={formErrors.phone ? 'true' : 'false'}
                  aria-describedby={formErrors.phone ? "phone-error" : "phone-description"}
                />
                {formErrors.phone ? (
                  <p id="phone-error" className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                ) : (
                  <p id="phone-description" className="text-sm text-gray-500 mt-1">
                    For important updates and driver communication
                  </p>
                )}
              </div>
            </div>
            
            {/* Terms Agreement */}
            <FormTermsCheckbox
              id="terms-agreement"
              checked={termsAgreed}
              onChange={(e) => {
                setTermsAgreed(e.target.checked);
                if (e.target.checked && formErrors.termsAgreed) {
                  setFormErrors({
                    ...formErrors,
                    termsAgreed: undefined
                  });
                }
              }}
              error={formErrors.termsAgreed}
              className="mt-6"
            />
            
            {/* Submit Button */}
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  // Navigate back to booking page with step 2
                  navigate('/booking', { state: { step: 2 } });
                }}
                type="button"
                aria-label="Back to booking details"
              >
                Back to Booking Details
              </Button>
              <Button 
                type="submit"
                variant="primary"
                aria-label="Continue to payment"
              >
                Continue to Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}