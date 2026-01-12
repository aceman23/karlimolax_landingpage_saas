import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, Lock, ChevronLeft, ChevronRight, Car } from 'lucide-react';
import Button from '../components/common/Button';
// import ServiceCard from '../components/common/ServiceCard'; // Keep commented for now
// import TestimonialCard from '../components/common/TestimonialCard'; // Keep commented for now
// import BookingForm from '../components/booking/BookingForm'; // Keep commented for now
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react'; // Removed useRef, useCallback
import { useBooking } from '../context/BookingContext';
import Carousel from '../components/common/Carousel'; // Added import for Carousel
import InstagramEmbed from '../components/common/InstagramEmbed';
import GoogleReviewsSlider from '../components/common/GoogleReviewsSlider';

// Interface for Vehicle data from API (can be shared or defined locally)
interface HomePageVehicle {
  _id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerHour: number;
  features?: string[];
  imageUrl?: string;
  imageUrls?: string[];
}

export default function HomePage() {
  const [fleetVehicles, setFleetVehicles] = useState<HomePageVehicle[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const { setSelectedPackage } = useBooking();
  const [instagramImages, setInstagramImages] = useState<Array<{ src: string; href?: string; alt?: string }>>([]);
  const limoImagePaths = [
    '/limoimages/limoimage1.jpeg',
    '/limoimages/limoimage2.jpeg',
    '/limoimages/limoimage3.jpeg',
    '/limoimages/limoimage4.jpeg',
    '/limoimages/limoimage5.jpeg',
    '/limoimages/limoimage6.jpeg',
  ];

  useEffect(() => {
    const fetchFleetVehicles = async () => {
      try {
        setLoadingFleet(true);
        const response = await fetch('/api/public/vehicles');
        if (!response.ok) {
          throw new Error('Failed to fetch fleet vehicles');
        }
        const data: HomePageVehicle[] = await response.json();
        setFleetVehicles(data.slice(0, 3)); // Take first 3 for the homepage display
        setFleetError(null);
      } catch (err: any) {
        setFleetError(err.message || 'Could not load fleet data.');
        console.error("Error fetching fleet vehicles for homepage:", err);
      } finally {
        setLoadingFleet(false);
      }
    };
    fetchFleetVehicles();
  }, []);

  // Fetch Instagram media thumbnails from our backend (no API key on client)
  useEffect(() => {
    const fetchInstagram = async () => {
      try {
        const res = await fetch('/api/instagram/media?all=true&limit=60&username=dapperlimo');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.images)) {
          setInstagramImages(data.images);
        }
      } catch {
        // silently ignore; component will fallback to iframe embed
      }
    };
    fetchInstagram();
  }, []);

  // Load Elfsight script for Google Reviews widget
  useEffect(() => {
    const src = 'https://elfsightcdn.com/platform.js';
    const existing = document.querySelector(`script[src="${src}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script already present, try to re-initialize
      // @ts-ignore
      if ((window as any).eapps?.initialize) {
        // @ts-ignore
        (window as any).eapps.initialize();
      }
    }
  }, []);

  // minor 
  
  const handlePackageSelect = (packageName: string) => {
    // Create a temporary package object to pass to the booking page
    const packageData = {
      id: packageName === 'Airport Pick Up / Drop Off' ? 'lax-special' :
          packageName === 'Disneyland Park & Hotel' ? 'disneyland' :
          packageName === 'Special Events' ? 'special-events' :
          'party-bus',
      name: packageName,
      description: '',
      base_price: 0,
      duration: 60,
      is_hourly: false,
      is_active: true,
      vehicle_id: '',
      image_url: '',
      airports: []
    };
    setSelectedPackage(packageData);
  };

  return (
    <div>
      <Helmet>
        <title>Dapper Limo LAX | Premium Los Angeles Airport Transportation</title>
        <meta name="description" content="Premium limousine service for Los Angeles airports (LAX, SNA, LGB, ONT), Disneyland hotels, and special events with luxury Mercedes Sprinter limos." />
        <link rel="canonical" href="https://dapperlimolax.com/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0">
          <img
            src="/limo-2.png"
            alt="Luxury Limo"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-32">
          <h1 className="text-3xl md:text-6xl font-bold mb-4">Welcome to Dapper Limo LAX</h1>
          <p className="text-lg md:text-xl mb-8">Your premier luxury transportation service in Los Angeles.</p>
          <Link to="/booking">
            <button className="w-full md:w-auto bg-cyan-500 text-white px-6 py-3 rounded-md hover:bg-cyan-600 transition">
              Book Now
            </button>
          </Link>
        </div>
      </section>

      {/* Elfsight Google Reviews embed */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="elfsight-app-099f02bc-1240-4b92-9934-5dd4ab8fa600" data-elfsight-app-lazy></div>
        </div>
      </section>

      {/* For Reservation section */}
      <section className="py-8 md:py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-10">For reservation please select one of the following packages</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            {/* Service Card 1 */}
            <div 
              className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              onClick={() => handlePackageSelect('Airport Pick Up / Drop Off')}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-center mb-2">Airport Pick Up / Drop Off</h3>
                <p className="text-gray-600 text-sm text-center mb-2">LAX - SNA - LGB - ONT - SAN</p>
                <p className="text-gray-600 mb-6 text-sm">
                  Our experienced chauffeurs provide luxury transfers to and from all major airports in the Greater Los Angeles area and San Diego, including Los Angeles International (LAX), John Wayne/Orange County (SNA), Long Beach (LGB), Ontario (ONT), and San Diego (SAN). Travel in style and comfort to your destination with our premium service.
                </p>
                <div className="w-full h-48 mb-6">
                  <img 
                    src="/plane.png" 
                    alt="Airport Transfer Service" 
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex justify-center">
                  <Link to="/booking">
                    <Button variant="primary" className="flex items-center">
                      Book Now <span className="ml-1">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Service Card 2 */}
            <div 
              className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              onClick={() => handlePackageSelect('Disneyland Park & Hotel')}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-center mb-2">Disneyland Park & Hotel</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  We pick up and drop off to Disneyland Park and hotels such as Disneyland Hotel, Disney's Grand Californian Hotel & Spa. We offer the best and lowest deals for limo service to and from Disneyland in Anaheim California and amusement parks in Los Angeles California.
                </p>
                <div className="w-full h-48 mb-6">
                  <img 
                    src="/disneyland.png" 
                    alt="Disneyland Transportation Service" 
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex justify-center">
                  <Link to="/booking">
                    <Button variant="primary" className="flex items-center">
                      Book Now <span className="ml-1">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Service Card 3 */}
            <div 
              className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              onClick={() => handlePackageSelect('Special Events')}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-center mb-2">Special Events</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Make your special occasions even more memorable with our luxury transportation service. Perfect for weddings, proms, corporate events, and other special celebrations. Our professional chauffeurs ensure a safe and stylish journey for your important day.
                </p>
                <div className="w-full h-48 mb-6">
                  <img 
                    src="/weddings.png" 
                    alt="Special Events Transportation" 
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex justify-center">
                  <Link to="/booking">
                    <Button variant="primary" className="flex items-center">
                      Book Now <span className="ml-1">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Service Card 4 */}
            <div 
              className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              onClick={() => handlePackageSelect('Party Bus')}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-center mb-2">Party Bus</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Experience the ultimate party on wheels with our luxury party bus service. Perfect for bachelor/bachelorette parties, birthday celebrations, and group outings. Enjoy premium amenities and create unforgettable memories with your friends and family.
                </p>
                <div className="w-full h-48 mb-6">
                  <img 
                    src="/partybus.png" 
                    alt="Party Bus Service" 
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex justify-center">
                  <Link to="/booking">
                    <Button variant="primary" className="flex items-center">
                      Book Now <span className="ml-1">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Premium Fleet */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Premium Fleet</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base">
              Experience luxury and comfort with our selection of top-tier vehicles.
            </p>
          </div>
          
          {loadingFleet && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
              <span className="ml-3 text-lg">Loading our fleet...</span>
            </div>
          )}

          {fleetError && (
            <div className="text-center py-8 text-red-600">
              <p>Error: {fleetError}</p>
            </div>
          )}

          {!loadingFleet && !fleetError && fleetVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Our fleet information is currently unavailable. Please check back soon.</p>
            </div>
          )}

          {!loadingFleet && !fleetError && fleetVehicles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {fleetVehicles.map(vehicle => (
                <div key={vehicle._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-40 md:h-48">
                    {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
                      <Carousel images={vehicle.imageUrls} alt={vehicle.name} />
                    ) : vehicle.imageUrl ? (
                      <Carousel images={[vehicle.imageUrl]} alt={vehicle.name} />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Car className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 h-12 md:h-14 overflow-hidden">{vehicle.name}</h3>
                    <p className="text-gray-600 mb-4 h-16 md:h-20 overflow-y-auto text-sm md:text-base">{vehicle.description || 'High-quality vehicle for your comfort and style.'}</p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="font-bold text-cyan-600 text-sm md:text-base">${vehicle.pricePerHour}/hour</span>
                      <Link to="/booking" className="w-full sm:w-auto">
                        <Button variant="primary" className="w-full sm:w-auto" onClick={() => console.log('Selected vehicle for booking:', vehicle._id)}>
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-8 md:py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <img 
                src="/limo-2.png" 
                alt="Mercedes Sprinter Limo Van" 
                className="w-full rounded-lg shadow-xl"
              />
            </div>
            
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Why Choose DapperLimoLax?</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Premium Mercedes Fleet</h3>
                    <p className="text-gray-600 text-sm md:text-base">Travel in style and comfort with our top-of-the-line Mercedes-Benz Sprinter vans, known for their reliability and luxury.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Professional Chauffeurs</h3>
                    <p className="text-gray-600 text-sm md:text-base">Our experienced, licensed, and insured chauffeurs are dedicated to providing safe, punctual, and courteous service.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <Lock className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Safety and Reliability</h3>
                    <p className="text-gray-600 text-sm md:text-base">Your safety is our priority. Our vehicles are regularly maintained and equipped with modern safety features.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:mt-8">
                <Link to="/about">
                  <Button variant="secondary" className="w-full sm:w-auto">Learn More About Us</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
       
      {/* Gallery and Videos */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Gallery</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base">
              A glimpse of our luxury fleet and service experience.
            </p>
          </div>
          <div className="space-y-8">
            {/* Photos Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Photos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {limoImagePaths.map((src) => (
                  <img key={src} src={src} alt="Dapper Limo" className="w-full h-48 object-cover rounded-lg shadow hover:shadow-lg transition-shadow" loading="lazy" />
                ))}
              </div>
            </div>
            
            {/* Videos Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Videos</h3>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <div className="max-w-xs mx-auto rounded-lg overflow-hidden shadow-md bg-black">
                  <video controls playsInline preload="metadata" className="w-full h-auto">
                    <source src="/limovideo2.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Follow Us on Instagram</h2>
          <InstagramEmbed
            profileUrl="https://www.instagram.com/dapperlimo/"
            className="max-w-3xl mx-auto"
            height={520}
            images={instagramImages.length > 0 ? instagramImages : undefined}
          />
        </div>
      </section>

      {/* Routes & Services Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Routes & Services We Cover</h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base">
              Comprehensive transportation services across Southern California with premium vehicles and professional chauffeurs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Top Routes Column */}
            <div className="bg-gray-50 p-6 md:p-8 rounded-lg">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Top Routes We Cover</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Thousand Oaks to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Irvine to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Anaheim to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Newport Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Huntington Beach to LAX
                  </li>
                </ul>
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Santa Monica to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Calabasas to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Pasadena to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to San Pedro Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Long Beach Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Orange County to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    San Diego to LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Palm Springs Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LA To Las Vegas Limo Service
                  </li>
                </ul>
              </div>
            </div>

            {/* Services Column */}
            <div className="space-y-6 md:space-y-8">
              {/* Airport Transfers */}
              <div className="bg-gray-50 p-6 md:p-8 rounded-lg">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Airport Transfers</h3>
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Town Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Executive Limo
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Luxury Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    Sprinter Limo Service LAX
                  </li>
                </ul>
              </div>

              {/* Car Service & Limo Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Car Service</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Orange County
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service San Bernardino County
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Limo Service</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Orange County
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service San Bernardino County
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Experience Premium Transportation?</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-3xl mx-auto">
            Book your premium Mercedes Sprinter service today and travel in style. Our team is ready to provide you with an unforgettable experience.
          </p>
          <Link to="/booking" className="w-full sm:w-auto inline-block">
            <Button variant="primary" className="w-full sm:w-auto">
              Book Your Ride Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}