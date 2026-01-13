import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, DollarSign, Check, ChevronLeft, ChevronRight, Car } from 'lucide-react';
// import { vehicles as staticVehicles } from '../data/vehicles'; // Removed static import
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';
import { Helmet } from 'react-helmet-async'; // Changed to react-helmet-async for consistency
// import limoImage from '../limo.png'; // Added for fallback
// import execImage1 from '../exec-image-1.png';
// import execImage2 from '../exec-image-2.png';
// import execImage2 from '../exec-image-2.png';

// Interface for Vehicle data from API
interface VehicleFromAPI {
  _id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerHour: number;
  features?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  // Add any other fields returned by /api/public/vehicles that are used
  make?: string; // If needed for display or selection
  model?: string; // If needed
}

// Carousel component for vehicle images
const ImageCarousel = ({ images, alt }: { images: string[]; alt: string }) => {
  const validImages = (images || []).filter(Boolean);
  if (validImages.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Car className="h-12 w-12 text-gray-400" />
      </div>
    );
  }
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + validImages.length) % validImages.length);
  };

  useEffect(() => {
    if (validImages.length > 1) {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
    }
  }, [validImages.length]);

  return (
    <div className="relative h-64 overflow-hidden">
      <img
        src={validImages[currentIndex]}
        alt={alt}
        className="w-full h-full object-cover transition duration-500 transform hover:scale-105"
      />
      {validImages.length > 1 && (
        <>
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {validImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
        </>
      )}
    </div>
  );
};

// Helper to check for valid MongoDB ObjectId
function isValidObjectId(id: string | undefined): boolean {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

export default function VehiclesPage() {
  const { setSelectedVehicle, selectedVehicle, setSelectedPackage } = useBooking();
  console.log('DEBUG VehiclesPage selectedVehicle:', selectedVehicle);
  const [vehicles, setVehicles] = useState<VehicleFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/vehicles');
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }
        const data = await response.json();
        setVehicles(data);
        setError(null);
        console.log('DEBUG vehicles:', data);
      } catch (err: any) {
        setError(err.message || 'Could not load vehicles.');
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);
  
  const handleSelectVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (vehicle) {
      console.log('DEBUG handleSelectVehicle:', vehicle);
      // Ensure both id and _id are set for context compatibility
      setSelectedVehicle({ ...vehicle, id: vehicle._id } as any);
      setSelectedPackage(null); // Clear selected package when vehicle is selected
      navigate('/booking', { state: { step: 2 } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-lg">Loading our fleet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <Car className="h-12 w-12 mb-4" />
        <p className="text-xl">Error loading vehicles: {error}</p>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen">
      <Helmet>
        <title>Our Fleet | Luxury Mercedes Sprinter Limos | Kar Limo LAX</title>
        <meta name="description" content="Explore our luxury fleet of Mercedes Sprinter limousines for airport transfers, Disneyland visits, and special events in Los Angeles." />
        <link rel="canonical" href="https://dapperlimolax.com/vehicles" />
      </Helmet>
      
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Luxury Fleet</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Choose from our selection of premium vehicles designed to provide the ultimate in comfort and style for your journey.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        {vehicles.length === 0 ? (
          <div className="text-center py-10">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Our fleet is currently being updated.</p>
            <p className="text-gray-500">Please check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.filter(vehicle => isValidObjectId(vehicle._id)).map((vehicle) => (
              <div key={vehicle._id} className="bg-gray-100 rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-64 overflow-hidden">
                  {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
                    <ImageCarousel images={vehicle.imageUrls} alt={vehicle.name} />
                  ) : vehicle.imageUrl ? (
                    <ImageCarousel images={[vehicle.imageUrl]} alt={vehicle.name} />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Car className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{vehicle.name}</h2>
                  <p className="text-gray-600 mb-4 h-20 overflow-y-auto">{vehicle.description || 'No description available.'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-purple-500 mr-2" />
                      <span>{vehicle.capacity} Passengers</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-purple-500 mr-2" />
                      <span>Hourly Service</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                      <span>${vehicle.pricePerHour}/hour</span>
                    </div>
                  </div>
                  
                  {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Features:</h3>
                      <ul className="space-y-2 h-24 overflow-y-auto">
                    {vehicle.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                  )}
                
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => handleSelectVehicle(vehicle._id)}
                  >
                    Select Vehicle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}