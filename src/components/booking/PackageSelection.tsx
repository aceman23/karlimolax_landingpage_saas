// import { Car, Users, Briefcase, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { getServicePackages } from '../../services/database';
import Button from '../common/Button';
import limoImage from '../../limo.png';
import { ServicePackage } from '../../types';

const LA_AIRPORTS = [
  { code: 'LAX', name: 'Los Angeles International' },
  { code: 'BUR', name: 'Bob Hope (Burbank)' },
  { code: 'LGB', name: 'Long Beach' },
  { code: 'ONT', name: 'Ontario International' },
  { code: 'SNA', name: 'John Wayne (Orange County)' }
];

export default function PackageSelection({ onContinue }: { onContinue: () => void }) {
  const { 
    selectedPackage, 
    setSelectedPackage, 
    setSelectedVehicle, 
    selectedAirport, 
    setSelectedAirport,
    bookingDetails,
    setBookingDetails 
  } = useBooking();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getServicePackages();
        setPackages(data.filter(pkg => pkg.is_active));
        setError(null);
      } catch (err) {
        console.error('Error fetching service packages:', err);
        setError('Failed to load service packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePackageSelect = (packageId: string) => {
    // Clear any previously selected vehicle when selecting a package
    setSelectedVehicle(null);
    
    const pkg = packages.find(p => p._id === packageId || p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      
      // If this is the LAX Special package, show airport selection
      if (pkg.name === 'LAX Special') {
        // Default to LAX if no airport is selected
        const airport = selectedAirport || 'LAX';
        setSelectedAirport(airport);
        
        // Add selected airport to booking details
        setBookingDetails({
          ...bookingDetails,
          airportCode: airport
        });
      } else {
        setSelectedAirport(null);
        
        // Remove airportCode if not an airport package
        const { airportCode, ...restDetails } = bookingDetails;
        setBookingDetails(restDetails);
      }
    }
  };

  const handleAirportSelect = (airport: string) => {
    setSelectedAirport(airport);
    
    // Update airport in booking details
    setBookingDetails({
      ...bookingDetails,
      airportCode: airport
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Select a Service Package</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-lg">Loading packages...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Select a Service Package</h2>
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Select a Service Package</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div 
            key={pkg._id || pkg.id}
            className={`
              border rounded-lg p-4 cursor-pointer transition
              ${selectedPackage?._id === pkg._id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
            `}
            onClick={() => handlePackageSelect(pkg._id || pkg.id || '')}
          >
            <div className="w-full h-48 rounded overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
              <img 
                src={pkg.image_url || limoImage} 
                alt={pkg.name} 
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).src = limoImage; }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{pkg.name}</h3>
              <p className="text-gray-500 text-sm mb-2">{pkg.description}</p>
              <p className="font-medium text-purple-600">
                {pkg.is_hourly 
                  ? `$${pkg.base_price}/hr${pkg.minimum_hours ? ` (${pkg.minimum_hours} hour minimum)` : ''}`
                  : `$${pkg.base_price} (Fixed rate)`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedPackage?.name === 'LAX Special' && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Select Your Airport</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {LA_AIRPORTS.map((airport) => (
              <button
                key={airport.code}
                onClick={() => handleAirportSelect(airport.code)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition
                  ${selectedAirport === airport.code 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white border border-gray-200 hover:border-purple-300 text-gray-700'}
                `}
              >
                {airport.code}
                <span className="block text-xs text-gray-500">{airport.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 flex justify-center">
        <Button 
          variant="primary"
          disabled={!selectedPackage || (selectedPackage.name === 'LAX Special' && !selectedAirport)}
          onClick={onContinue}
        >
          Continue with Selected Package
        </Button>
      </div>
    </div>
  );
}