import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';
import PackageSelection from '../components/booking/PackageSelection';
import GooglePlacesAutocomplete from '../components/common/GooglePlacesAutocomplete';
import { Car } from 'lucide-react';
import Carousel from '../components/common/Carousel';

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedVehicle, 
    setSelectedVehicle, 
    selectedPackage,
    setSelectedPackage,
    selectedAirport,
    bookingDetails, 
    setBookingDetails,
    gratuityInfo,
    setGratuityInfo,
    calculateTotal,
    calculateTotalWithGratuity,
    settings,
    totalPrice,
    resetBooking
  } = useBooking();
  
  console.log('DEBUG BookingPage selectedVehicle:', selectedVehicle);
  
  const [currentStep, setCurrentStep] = useState(() => {
    // Initialize step from location state if available
    return location.state?.step || 1;
  });
  const [pickupDate, setPickupDate] = useState<Date | null>(
    bookingDetails.pickupDate ? new Date(bookingDetails.pickupDate) : null
  );
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [distance, setDistance] = useState<{ text: string; value: number } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [stops, setStops] = useState<{ location: string; order: number; price: number }[]>([]);
  const [stopPrice, setStopPrice] = useState<number>(0);
  const [tempSelectedVehicle, setTempSelectedVehicle] = useState<any>(null);
  const hasResetRef = useRef(false);
  // Use gratuity info from context
  const gratuityType = gratuityInfo.type;
  const gratuityPercentage = gratuityInfo.percentage || 15;
  const gratuityCustomAmount = gratuityInfo.customAmount?.toString() || '';

  // Functions to update gratuity info
  const updateGratuityType = (type: 'none' | 'percentage' | 'custom' | 'cash') => {
    if (type === 'percentage') {
      // Set default percentage to 15% when switching to percentage mode
      setGratuityInfo({
        ...gratuityInfo,
        type,
        percentage: 15,
        amount: (calculateTotal() * 15) / 100
      });
    } else {
      setGratuityInfo({
        ...gratuityInfo,
        type,
        amount: type === 'none' || type === 'cash' ? 0 : gratuityInfo.amount
      });
    }
  };

  const updateGratuityPercentage = (percentage: number) => {
    setGratuityInfo({
      ...gratuityInfo,
      percentage,
      amount: (calculateTotal() * percentage) / 100
    });
  };

  const updateGratuityCustomAmount = (customAmount: string) => {
    const amount = parseFloat(customAmount) || 0;
    setGratuityInfo({
      ...gratuityInfo,
      customAmount: amount,
      amount
    });
  };
  
  // Helper function to check if hours meet minimum requirement
  const isHoursBelowMinimum = () => {
    if (!bookingDetails.hours) {
      return false;
    }
    const hours = Number(bookingDetails.hours);
    
    // If there's an hourly package with minimum_hours, use that
    if (selectedPackage?.is_hourly && selectedPackage?.minimum_hours) {
      return hours < selectedPackage.minimum_hours;
    }
    
    // For direct vehicle bookings or packages without minimum_hours, enforce 4 hour minimum
    if (!selectedPackage || selectedPackage.is_hourly || selectedVehicle) {
      return hours < 4;
    }
    
    return false;
  };

  // Reset booking details when user navigates to booking page from outside the booking flow
  useEffect(() => {
    // Only reset if this is a fresh navigation to the booking page (not from within the booking flow)
    const isFreshNavigation = !location.state?.step && !location.state?.from;
    
    if (isFreshNavigation && !hasResetRef.current) {
      resetBooking();
      setCurrentStep(1);
      setPickupDate(null);
      setDistance(null);
      setCalculatingDistance(false);
      setStops([]);
      setStopPrice(0);
      setTempSelectedVehicle(null);
      hasResetRef.current = true;
    }
  }, [location.pathname, resetBooking]);
  
  useEffect(() => {
    if (currentStep === 1) {
      setLoadingVehicles(true);
      fetch('/api/public/vehicles')
        .then(res => res.json())
        .then(data => {
          setVehicles(data);
          setVehicleError(null);
        })
        .catch(() => {
          setVehicleError('Could not load vehicles.');
        })
        .finally(() => setLoadingVehicles(false));
    }
  }, [currentStep]);
  
  // Handle step changes and browser history
  useEffect(() => {
    // Push a new history entry when moving to step 2
    if (currentStep === 2) {
      window.history.pushState({ step: 2 }, '');
    }
  }, [currentStep]);
  
  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we're on step 2 and coming from customer info page, stay on step 2
      if (currentStep === 2 && location.state?.from === 'customer-info') {
        event.preventDefault();
        return;
      }
      // Otherwise, go back to step 1
      if (currentStep === 2) {
        event.preventDefault();
        setCurrentStep(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, location.state]);
  
  // Handle location state changes
  useEffect(() => {
    if (location.state?.step) {
      setCurrentStep(location.state.step);
    }
  }, [location.state]);
  
  // Function to calculate distance between multiple points
  const calculateDistance = async (locations: string[]) => {
    if (locations.length < 2) {
      setDistance(null);
      return;
    }

    setCalculatingDistance(true);
    try {
      const service = new google.maps.DistanceMatrixService();
      let totalDistance = 0;
      let totalDistanceText = '';

      // Calculate distance between each consecutive pair of locations
      for (let i = 0; i < locations.length - 1; i++) {
        const response = await service.getDistanceMatrix({
          origins: [locations[i]],
          destinations: [locations[i + 1]],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
        });

        if (response.rows[0]?.elements[0]?.status === 'OK') {
          const result = response.rows[0].elements[0];
          totalDistance += result.distance.value;
          
          // Convert the current segment distance to miles for display
          const segmentMiles = result.distance.value / 1609.34;
          if (i === 0) {
            totalDistanceText = `${segmentMiles.toFixed(1)} mi`;
          } else {
            totalDistanceText += ` + ${segmentMiles.toFixed(1)} mi`;
          }
        } else {
          setDistance(null);
          return;
        }
      }

      // Add the total distance in miles
      const totalMiles = totalDistance / 1609.34;
      totalDistanceText += ` = ${totalMiles.toFixed(1)} mi total`;

      setDistance({
        text: totalDistanceText,
        value: totalDistance // total distance in meters
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      setDistance(null);
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Update distance when addresses change
  useEffect(() => {
    if (bookingDetails.pickupAddress && bookingDetails.dropoffAddress) {
      const locations = [
        bookingDetails.pickupAddress,
        ...(bookingDetails.stops || []).map(stop => stop.location).filter(Boolean),
        bookingDetails.dropoffAddress
      ].filter(Boolean);

      if (locations.length >= 2) {
        calculateDistance(locations);
      }
    } else {
      setDistance(null);
      setBookingDetails({
        ...bookingDetails,
        distance: undefined
      });
    }
  }, [bookingDetails.pickupAddress, bookingDetails.dropoffAddress, bookingDetails.stops]);
  
  // Update booking details when distance changes
  useEffect(() => {
    if (distance) {
      setBookingDetails({
        ...bookingDetails,
        distance: {
          text: distance.text,
          value: distance.value
        }
      });
    }
  }, [distance]);
  
  // Handler for booking details form
  const handleBookingDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all required fields are filled
    if (
      !bookingDetails.pickupAddress ||
      !bookingDetails.dropoffAddress ||
      !bookingDetails.pickupDate ||
      !bookingDetails.pickupTime ||
      (!selectedPackage && !bookingDetails.hours) ||
      !bookingDetails.passengers
    ) {
      alert('Please fill all required fields');
      return;
    }
    
    // Validate minimum hours requirement
    if (bookingDetails.hours) {
      const hours = Number(bookingDetails.hours);
      
      // For hourly packages with specified minimum_hours
      if (selectedPackage?.is_hourly && selectedPackage.minimum_hours) {
        if (hours < selectedPackage.minimum_hours) {
          alert(`${selectedPackage.minimum_hours} hour minimum required for ${selectedPackage.name}. Please enter ${selectedPackage.minimum_hours} or more hours.`);
          return;
        }
      }
      // For direct vehicle bookings or packages without minimum_hours, enforce 4 hour minimum
      else if (!selectedPackage || selectedPackage.is_hourly || selectedVehicle) {
        if (hours < 4) {
          alert(`4 hour minimum required. Please enter 4 or more hours.`);
          return;
        }
      }
    }
    
    // Validate that hours is a whole number
    if (bookingDetails.hours && !Number.isInteger(Number(bookingDetails.hours))) {
      alert('Please enter a whole number for hours (no decimals).');
      return;
    }
    
    // For Airport Special package, ensure an airport is selected
    if (selectedPackage?.id === 'lax-special' && !bookingDetails.airportCode) {
      alert('Please select an airport for the Airport Special package');
      return;
    }
    
    // Ensure policy acknowledgments are checked
    if (!bookingDetails.acknowledgeVomitFee) {
      alert('Please acknowledge the vomit cleaning fee policy before proceeding');
      return;
    }
    
    if (!bookingDetails.acknowledgeGracePeriod) {
      alert('Please acknowledge the airport grace period policy before proceeding');
      return;
    }
    
    if (!bookingDetails.acknowledgeCancellationPolicy) {
      alert('Please acknowledge the cancellation policy before proceeding');
      return;
    }
    
    // Update booking details with final package and vehicle information
    const updatedBookingDetails = {
      ...bookingDetails,
      packageId: selectedPackage?.id,
      vehicleId: selectedVehicle?._id || selectedVehicle?.id,
      vehicleName: selectedVehicle?.name, // Add vehicle name to booking details
      hours: selectedPackage && !selectedPackage.is_hourly ? undefined : bookingDetails.hours,
      totalPrice: totalPrice
    };
    
    console.log('DEBUG - Saving vehicle info to booking details:', {
      vehicleId: updatedBookingDetails.vehicleId,
      vehicleName: updatedBookingDetails.vehicleName,
      selectedVehicle: selectedVehicle
    });
    
    setBookingDetails(updatedBookingDetails);
    
    // Proceed to customer information
    navigate('/customer-info');
  };
  
  // Handler for form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'passengers' || name === 'carSeats' || name === 'boosterSeats' || name === 'hours') {
      // Convert to a number or undefined
      const numValue = value === '' ? undefined : Number(value);
      setBookingDetails({
        ...bookingDetails,
        [name]: numValue
      });
    } else {
    setBookingDetails({
      ...bookingDetails,
      [name]: value
    });
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setPickupDate(date);
    if (date) {
      setBookingDetails({
        ...bookingDetails,
        pickupDate: date
      });
    }
  };

  // Handle vehicle selection
  const handleSelectVehicle = (vehicle: any) => {
    setTempSelectedVehicle(vehicle);
  };

  // Handle vehicle confirmation
  const handleConfirmVehicle = () => {
    console.log('DEBUG - Vehicle confirmed:', {
      vehicle: tempSelectedVehicle,
      vehicleName: tempSelectedVehicle?.name,
      vehicleId: tempSelectedVehicle?._id || tempSelectedVehicle?.id
    });
    setSelectedVehicle(tempSelectedVehicle);
    setSelectedPackage(null); // Clear selected package when vehicle is selected
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle package selection (from PackageSelection)
  const handlePackageContinue = () => {
    setSelectedVehicle(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Handler for address changes
  const handleAddressChange = (field: string, value: string) => {
    console.log(`Setting ${field} to: "${value}"`);
    
    // Create a new booking details object to ensure it's properly updated
    const updatedBookingDetails = {
      ...bookingDetails,
      [field]: value
    };
    
    // Update state with the new booking details
    setBookingDetails(updatedBookingDetails);
    
    // Log the updated address values for debugging
    console.log('Updated booking details:', updatedBookingDetails);
  };

  // Calculate base price only (without additional fees)
  const calculateBasePrice = () => {
    if (selectedPackage) {
      if (selectedPackage.is_hourly) {
        const hours = Number(bookingDetails.hours) || selectedPackage.minimum_hours || 0;
        return selectedPackage.base_price * hours;
      }
      return selectedPackage.base_price;
    } else if (selectedVehicle) {
      if (selectedVehicle.fixedPrice) {
        return selectedVehicle.fixedPrice;
      } else {
        const hours = Number(bookingDetails.hours) || 0;
        return selectedVehicle.pricePerHour * hours;
      }
    }
    return 0;
  };

  // Calculate gratuity amount (local function for display purposes)
  const calculateGratuity = () => {
    const baseAmount = calculateTotal();
    if (gratuityType === 'percentage') {
      return (baseAmount * gratuityPercentage) / 100;
    } else if (gratuityType === 'custom') {
      const customAmount = parseFloat(gratuityCustomAmount) || 0;
      return customAmount;
    }
    return 0;
  };

  // Handler for adding a stop
  const handleAddStop = () => {
    const newStops = [...(bookingDetails.stops || [])];
    newStops.push({ location: '', order: newStops.length + 1, price: 0 });
    setBookingDetails({
      ...bookingDetails,
      stops: newStops
    });
  };

  // Handler for removing a stop
  const handleRemoveStop = (index: number) => {
    const newStops = (bookingDetails.stops || [])
      .filter((_, i) => i !== index)
      .map((stop, i) => ({ ...stop, order: i + 1 }));
    setBookingDetails({
      ...bookingDetails,
      stops: newStops
    });
  };

  // Handler for stop location change
  const handleStopLocationChange = (index: number, value: string) => {
    const newStops = [...(bookingDetails.stops || [])];
    newStops[index] = { ...newStops[index], location: value };
    setBookingDetails({
      ...bookingDetails,
      stops: newStops
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Book Your Transportation</h1>
        
        {/* Booking Steps */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className={`flex flex-col items-center mb-4 md:mb-0 ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <span className="text-sm font-medium">Select Package/Vehicle</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-gray-200">
              {currentStep >= 2 && <div className="h-full bg-purple-600"></div>}
            </div>
            
            <div className={`flex flex-col items-center mb-4 md:mb-0 ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span className="text-sm font-medium">Booking Details</span>
            </div>
            
            <div className="hidden md:block w-24 h-0.5 bg-gray-200">
              {currentStep >= 3 && <div className="h-full bg-purple-600"></div>}
            </div>
            
            <div className={`flex flex-col items-center mb-4 md:mb-0 ${currentStep >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                3
              </div>
              <span className="text-sm font-medium">Customer Info</span>
            </div>

            <div className="hidden md:block w-24 h-0.5 bg-gray-200">
              {currentStep >= 4 && <div className="h-full bg-purple-600"></div>}
            </div>
            
            <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 4 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                4
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>
        
        {/* Step 1: Select Package or Vehicle */}
        {currentStep === 1 && (
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            {/* Book by Package */}
          <div>
              <PackageSelection onContinue={handlePackageContinue} />
            </div>
            {/* Book by Vehicle */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Book by Vehicle</h2>
              {loadingVehicles ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-lg">Loading vehicles...</span>
                </div>
              ) : vehicleError ? (
                <div className="text-red-600">{vehicleError}</div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map(vehicle => (
                    <div
                      key={vehicle._id}
                        className={`border rounded-lg p-4 flex flex-col transition cursor-pointer ${tempSelectedVehicle?._id === vehicle._id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <div className="relative h-48">
                        {Array.isArray((vehicle as any).imageUrls) && (vehicle as any).imageUrls.length > 0 ? (
                          <Carousel images={(vehicle as any).imageUrls} alt={vehicle.name} />
                        ) : vehicle.imageUrl ? (
                          <Carousel images={[vehicle.imageUrl]} alt={vehicle.name} />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Car className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 mt-2">{vehicle.name}</h3>
                        <p className="text-gray-500 text-sm mb-2">Capacity: {vehicle.capacity} | ${vehicle.pricePerHour}/hr</p>
                        <p className="text-gray-500 text-xs mb-4">{vehicle.description}</p>
                      </div>
                    </div>
                  ))}
                      </div>
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="primary"
                      className="px-8 py-3 text-lg"
                      onClick={handleConfirmVehicle}
                      disabled={!tempSelectedVehicle}
                    >
                      Confirm Vehicle Selection
                    </Button>
                  </div>
                </>
                    )}
            </div>
          </div>
        )}
        
        {/* Step 2: Booking Details */}
        {currentStep === 2 && (selectedVehicle || selectedPackage) && (
          <div className="max-w-3xl mx-auto">
            {/* Selected Package or Vehicle Summary */}
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              {selectedPackage ? (
                <>
                  <h3 className="font-semibold mb-2">Selected Package: {selectedPackage.name}</h3>
                  <div className="flex items-center">
                    <img 
                      src={selectedPackage.image_url || 'https://via.placeholder.com/100x70'} 
                      alt={selectedPackage.name} 
                      className="w-20 h-14 object-cover rounded mr-4"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/100x70'; }}
                    />
                    <div>
                      <p className="text-gray-600">{selectedPackage.description}</p>
                      {selectedPackage.id === 'lax-special' && selectedAirport && (
                        <p className="text-gray-600">Selected Airport: <span className="font-medium">{selectedAirport}</span></p>
                      )}
                      <p className="text-purple-600 font-medium">
                        ${selectedPackage.base_price}{selectedPackage.is_hourly ? '/hr' : ''}
                        {selectedPackage.minimum_hours ? ` (${selectedPackage.minimum_hours} hour minimum)` : ''}
                      </p>
                    </div>
                    <Button 
                      variant="secondary"
                      className="ml-auto"
                      onClick={() => {
                        setSelectedPackage(null);
                        setCurrentStep(1);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-2">Selected Vehicle: {selectedVehicle?.name}</h3>
                  <div className="flex items-center">
                    {Array.isArray((selectedVehicle as any).imageUrls) && (selectedVehicle as any).imageUrls.length > 0 ? (
                      <img
                        src={(selectedVehicle as any).imageUrls[0]}
                        alt={selectedVehicle?.name}
                        className="w-20 h-14 object-cover rounded mr-4"
                      />
                    ) : selectedVehicle?.imageUrl ? (
                      <img
                        src={selectedVehicle.imageUrl}
                        alt={selectedVehicle?.name}
                        className="w-20 h-14 object-cover rounded mr-4"
                      />
                    ) : (
                      <div className="w-20 h-14 bg-gray-100 rounded mr-4 flex items-center justify-center">
                        <Car className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">{selectedVehicle?.capacity} passengers</p>
                      <p className="text-purple-600 font-medium">
                        {selectedVehicle?.fixedPrice 
                          ? `$${selectedVehicle.fixedPrice} fixed rate` 
                          : `$${selectedVehicle?.pricePerHour}/hour`}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <h2 className="text-2xl font-semibold mb-6">Enter Booking Details</h2>
            
            <form onSubmit={handleBookingDetailsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Information */}
                <GooglePlacesAutocomplete
                  label="Pickup Address *"
                    name="pickupAddress"
                    value={bookingDetails.pickupAddress || ''}
                  onChange={(value) => handleAddressChange('pickupAddress', value)}
                    required
                    placeholder="Enter pickup address"
                  />
                
                {/* Dropoff Information */}
                <GooglePlacesAutocomplete
                  label="Dropoff Address *"
                    name="dropoffAddress"
                    value={bookingDetails.dropoffAddress || ''}
                  onChange={(value) => handleAddressChange('dropoffAddress', value)}
                    required
                    placeholder="Enter dropoff address"
                  />

                {/* Additional Stops Section */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Additional Stops</h3>
                    <Button
                      type="button"
                      onClick={handleAddStop}
                      variant="primary"
                    >
                      Add Stop
                    </Button>
                  </div>

                  {(bookingDetails.stops || []).map((stop, index) => (
                    <div key={index} className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <GooglePlacesAutocomplete
                          label={`Stop ${stop.order}`}
                          name={`stop-${index}`}
                          value={stop.location}
                          onChange={(value) => handleStopLocationChange(index, value)}
                          placeholder="Enter stop address"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        variant="danger"
                        className="mt-6"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Address Help Text */}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">
                    You can enter place names (e.g., "Disneyland", "LAX Airport", "Beverly Hills Hotel") - you don't need to enter the complete street address.
                  </p>
                </div>

                {/* Distance Information */}
                {(bookingDetails.pickupAddress && bookingDetails.dropoffAddress) && (
                  <div className="md:col-span-2">
                    <div className="flex flex-col gap-2">
               
                      {distance && distance.value > 0 && (
                        <div className="text-purple-600 text-sm w-full">
                          {(() => {
                            const distanceInMiles = distance.value / 1609.34;
                            
                            // Find applicable distance tier - handle distances beyond the highest tier
                            let applicableTier = settings.distanceTiers.find(tier => 
                              (tier.maxDistance === Infinity || tier.maxDistance === null) && distanceInMiles >= tier.minDistance ||
                              (distanceInMiles >= tier.minDistance && distanceInMiles <= tier.maxDistance)
                            );
                            
                            // If no tier found and distance exceeds all tiers, use the highest tier
                            if (!applicableTier && settings.distanceTiers.length > 0) {
                              const sortedTiers = [...settings.distanceTiers].sort((a, b) => 
                                (a.maxDistance === Infinity || a.maxDistance === null ? Infinity : a.maxDistance) - 
                                (b.maxDistance === Infinity || b.maxDistance === null ? Infinity : b.maxDistance)
                              );
                              const highestTier = sortedTiers[sortedTiers.length - 1];
                              if (distanceInMiles >= highestTier.minDistance) {
                                applicableTier = highestTier;
                              }
                            }

                            console.log('[DEBUG] Distance tiers check:', {
                              distanceFeeEnabled: settings.distanceFeeEnabled,
                              distanceTiersLength: settings.distanceTiers.length,
                              distanceTiers: settings.distanceTiers,
                              distanceInMiles,
                              applicableTier
                            });

                            // Always show distance information if distance is calculated
                            if (distanceInMiles > 0) {
                              return (
                                <div className="space-y-1 break-words bg-white border-2 border-purple-500 rounded-lg p-4">
                                  <div className="font-medium text-purple-700">Distance Information:</div>
                                  <div className="ml-2 text-xs sm:text-sm">
                                    <div className="text-gray-600">
                                      Trip Distance: {distanceInMiles.toFixed(1)} miles
                                    </div>
                                    {settings.distanceFeeEnabled && settings.distanceTiers.length > 0 && applicableTier && (
                                      <div className="text-purple-600 font-medium">
                                        Distance Fee: ${applicableTier.fee.toFixed(2)}
                                        {applicableTier.maxDistance === Infinity || applicableTier.maxDistance === null
                                          ? ` (${applicableTier.minDistance}+ miles)`
                                          : ` (${applicableTier.minDistance}-${applicableTier.maxDistance} miles)`}
                                      </div>
                                    )}
                                    {settings.perMileFeeEnabled && distanceInMiles > settings.distanceThreshold && (
                                      <div className="text-purple-600 text-xs sm:text-sm">
                                        Additional ${settings.perMileFee}/mile after {settings.distanceThreshold} miles
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Date Picker */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="pickupDate">
                    Pickup Date *
                  </label>
                  <DatePicker
                    selected={pickupDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholderText="Select date"
                    required
                  />
                </div>
                
                {/* Time Picker */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="pickupTime">
                    Pickup Time *
                  </label>
                  <input
                    type="time"
                    id="pickupTime"
                    name="pickupTime"
                    value={bookingDetails.pickupTime || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Service Hours - Only show if not a fixed price package */}
                {(!selectedPackage || selectedPackage.is_hourly || selectedVehicle) && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="hours">
                      Number of Hours {selectedPackage && !selectedPackage.is_hourly ? '(N/A)' : '*'}
                    </label>
                    <input
                      type="number"
                      id="hours"
                      name="hours"
                      value={selectedPackage && !selectedPackage.is_hourly ? '' : (bookingDetails.hours || '')}
                      onChange={handleInputChange}
                      required={!selectedPackage || selectedPackage.is_hourly || selectedVehicle}
                      disabled={!!(selectedPackage && !selectedPackage.is_hourly)}
                      min={selectedPackage?.is_hourly && selectedPackage.minimum_hours ? selectedPackage.minimum_hours : 4}
                      step="1"
                      placeholder={selectedPackage && !selectedPackage.is_hourly ? 'N/A' : 'Enter number of hours'}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 ${
                        isHoursBelowMinimum() ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {selectedPackage?.is_hourly && selectedPackage.minimum_hours ? (
                      <p className="text-sm text-purple-600 mt-1">
                        {selectedPackage.minimum_hours} hour minimum required for {selectedPackage.name}
                      </p>
                    ) : (!selectedPackage || selectedPackage.is_hourly || selectedVehicle) && (
                      <p className="text-sm text-purple-600 mt-1">
                        4 hour minimum required
                      </p>
                    )}
                    {isHoursBelowMinimum() && (
                      <p className="text-sm text-red-600 mt-1">
                        {selectedPackage?.is_hourly && selectedPackage.minimum_hours 
                          ? `Please enter at least ${selectedPackage.minimum_hours} hours for ${selectedPackage.name}`
                          : 'Please enter at least 4 hours'}
                      </p>
                    )}
                    {selectedPackage && !selectedPackage.is_hourly && (
                      <p className="text-sm text-gray-600 mt-1">
                        This is a fixed price package with no duration requirement
                      </p>
                    )}
                  </div>
                )}
                
                {/* Passengers */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="passengers">
                    Number of Passengers *
                  </label>
                  <input
                    type="number"
                    id="passengers"
                    name="passengers"
                    value={bookingDetails.passengers || ''}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={selectedVehicle?.capacity || 12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Max capacity: {selectedVehicle?.capacity || 12} passengers</p>
                </div>

                {/* Car Seats */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="carSeats">
                    Number of Car Seats
                  </label>
                  <input
                    type="number"
                    id="carSeats"
                    name="carSeats"
                    value={bookingDetails.carSeats ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                        setBookingDetails({
                          ...bookingDetails,
                        carSeats: value
                      });
                    }}
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Additional ${settings.carSeatPrice} per car seat</p>
                </div>

                {/* Booster Seats */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="boosterSeats">
                    Number of Booster Seats
                  </label>
                  <input
                    type="number"
                    id="boosterSeats"
                    name="boosterSeats"
                    value={bookingDetails.boosterSeats ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      setBookingDetails({
                        ...bookingDetails,
                        boosterSeats: value
                      });
                    }}
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Additional ${settings.boosterSeatPrice} per booster seat</p>
                </div>
              </div>
              
              {/* Special Requests */}
              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="specialRequests">
                  Special Requests (Optional)
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={bookingDetails.specialRequests || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any special requests or instructions for your booking (e.g., champagne on ice)"
                ></textarea>
              </div>
              
              {/* Important Policies Section */}
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Important Policies</h3>
                
                <div className="space-y-3 text-sm text-purple-700">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span><strong>Vomit Cleaning Fee:</strong> $250 will be charged for any vomit incidents in the vehicle</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span><strong>Airport Grace Period:</strong> 1-hour grace period for airport pickups. $75 charge if driver waits more than 1 hour beyond scheduled pickup time due to customer delay</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium mr-2">•</span>
                    <span><strong>Cancellation Policy:</strong> More than 48 hours: Full refund minus $25 fee. 24-48 hours: 50% refund. Less than 24 hours: No refund</span>
                  </div>
                </div>
                
                {/* Policy Acknowledgments */}
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="acknowledgeVomitFee"
                        checked={bookingDetails.acknowledgeVomitFee || false}
                        onChange={(e) => setBookingDetails({
                          ...bookingDetails,
                          acknowledgeVomitFee: e.target.checked
                        })}
                        className="mt-1 mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acknowledgeVomitFee" className="text-sm text-purple-800">
                        I acknowledge the vomit cleaning fee of $250 for any vomit incidents in the vehicle
                      </label>
                    </div>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="acknowledgeGracePeriod"
                        checked={bookingDetails.acknowledgeGracePeriod || false}
                        onChange={(e) => setBookingDetails({
                          ...bookingDetails,
                          acknowledgeGracePeriod: e.target.checked
                        })}
                        className="mt-1 mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acknowledgeGracePeriod" className="text-sm text-purple-800">
                        I acknowledge the airport grace period policy and potential $75 charge for delays
                      </label>
                    </div>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="acknowledgeCancellationPolicy"
                        checked={bookingDetails.acknowledgeCancellationPolicy || false}
                        onChange={(e) => setBookingDetails({
                          ...bookingDetails,
                          acknowledgeCancellationPolicy: e.target.checked
                        })}
                        className="mt-1 mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acknowledgeCancellationPolicy" className="text-sm text-purple-800">
                        I acknowledge the cancellation policy and understand the refund terms based on timing
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fee Breakdown Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>${calculateBasePrice().toFixed(2)}</span>
                  </div>
                  {settings.distanceFeeEnabled && bookingDetails.distance && (
                    <>
                      {(() => {
                        const distanceInMiles = bookingDetails.distance.value / 1609.34;
                        const applicableTier = settings.distanceTiers.find(tier => 
                          (tier.maxDistance === Infinity || tier.maxDistance === null) && distanceInMiles >= tier.minDistance ||
                          (distanceInMiles >= tier.minDistance && distanceInMiles <= tier.maxDistance)
                        );

                        if (applicableTier) {
                          return (
                            <>
                              <div className="flex justify-between text-purple-600 text-xs sm:text-sm">
                                <span className="break-words">Distance Fee ({applicableTier.maxDistance === Infinity || applicableTier.maxDistance === null 
                                  ? `${applicableTier.minDistance}+ miles` 
                                  : `${applicableTier.minDistance}-${applicableTier.maxDistance} miles`}):</span>
                                <span className="ml-2 flex-shrink-0">${applicableTier.fee.toFixed(2)}</span>
                              </div>
                              {settings.perMileFeeEnabled && distanceInMiles > settings.distanceThreshold && (
                                <div className="flex justify-between text-purple-600 text-xs sm:text-sm">
                                  <span className="break-words">Per Mile Fee (beyond {settings.distanceThreshold} miles):</span>
                                  <span className="ml-2 flex-shrink-0">${((distanceInMiles - settings.distanceThreshold) * settings.perMileFee).toFixed(2)}</span>
                                </div>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                  {bookingDetails.stops && bookingDetails.stops.length > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Additional Stops ({bookingDetails.stops.length}):</span>
                      <span>${(bookingDetails.stops.reduce((sum, stop) => sum + (stop.price || settings.stopPrice), 0)).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(bookingDetails.carSeats) > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Car Seats ({bookingDetails.carSeats}):</span>
                      <span>${(bookingDetails.carSeats * settings.carSeatPrice).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(bookingDetails.boosterSeats) > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Booster Seats ({bookingDetails.boosterSeats}):</span>
                      <span>${(bookingDetails.boosterSeats * settings.boosterSeatPrice).toFixed(2)}</span>
                    </div>
                  )}
                  {settings.minFee > 0 && calculateBasePrice() < settings.minFee && (
                    <div className="flex justify-between text-purple-600">
                      <span>Minimum Fee Applied:</span>
                      <span>${settings.minFee.toFixed(2)}</span>
                    </div>
                  )}
                  {settings.maxFee > 0 && calculateTotal() > settings.maxFee && (
                    <div className="flex justify-between text-purple-600">
                      <span>Maximum Fee Applied:</span>
                      <span>${settings.maxFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Base Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gratuity Section */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Gratuity</h3>
                
                <div className="space-y-4">
                  {/* Gratuity Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gratuity Option</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => updateGratuityType('none')}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          gratuityType === 'none'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        No Gratuity
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGratuityType('percentage')}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          gratuityType === 'percentage'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGratuityType('custom')}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          gratuityType === 'custom'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        Custom Amount
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGratuityType('cash')}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          gratuityType === 'cash'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>

                  {/* Percentage Options */}
                  {gratuityType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Percentage</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[15, 18, 20, 25].map((percent) => (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => updateGratuityPercentage(percent)}
                            className={`p-3 text-sm rounded-lg border transition-colors ${
                              gratuityPercentage === percent
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Amount Input */}
                  {gratuityType === 'custom' && (
                    <div>
                      <label htmlFor="custom-gratuity" className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Amount ($)
                      </label>
                      <input
                        type="number"
                        id="custom-gratuity"
                        value={gratuityCustomAmount}
                        onChange={(e) => updateGratuityCustomAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Cash Gratuity Notice */}
                  {gratuityType === 'cash' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-purple-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-purple-800">Cash Gratuity</p>
                          <p className="text-sm text-purple-700 mt-1">
                            You can provide cash gratuity directly to your chauffeur. No additional charge will be added to your payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gratuity Summary */}
                  {gratuityType !== 'none' && gratuityType !== 'cash' && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gratuity Amount:</span>
                        <span className="font-medium text-gray-900">${calculateGratuity().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total with Gratuity */}
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-medium">Final Total:</span>
                  <span className="text-xl font-bold text-purple-600">${calculateTotalWithGratuity().toFixed(2)}</span>
                </div>
              </div>
              
              {/* Validation Message for Policy Acknowledgments */}
              {bookingDetails.acknowledgeVomitFee === false || bookingDetails.acknowledgeGracePeriod === false ? (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm">
                      Please acknowledge both policy agreements before proceeding.
                    </p>
                  </div>
                </div>
              ) : null}
              
              <div className="flex justify-end">
                <Button type="submit" variant="primary">
                  Continue to Customer Info
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}