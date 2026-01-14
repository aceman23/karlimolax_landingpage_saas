import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, Lock, ChevronLeft, ChevronRight, Car, ChevronDown, ArrowRight, Shield, Clock, Users, Award } from 'lucide-react';
import Button from '../components/common/Button';
// import ServiceCard from '../components/common/ServiceCard'; // Keep commented for now
// import TestimonialCard from '../components/common/TestimonialCard'; // Keep commented for now
// import BookingForm from '../components/booking/BookingForm'; // Keep commented for now
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react'; // Removed useRef, useCallback
import Carousel from '../components/common/Carousel'; // Added import for Carousel
import InstagramEmbed from '../components/common/InstagramEmbed';

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
  const [instagramImages, setInstagramImages] = useState<Array<{ src: string; href?: string; alt?: string }>>([]);

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
        const res = await fetch('/api/instagram/media?all=true&limit=60&username=k.a.r_limousine');
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



  return (
    <div>
      <Helmet>
        <title>Kar Limo LAX | Premium Los Angeles Airport Transportation</title>
        <meta name="description" content="Premium limousine service for Los Angeles airports (LAX, SNA, LGB, ONT), Disneyland hotels, and special events with luxury Mercedes Sprinter limos." />
        <link rel="canonical" href="https://dapperlimolax.com/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ minHeight: '100%', minWidth: '100%' }}
          >
            <source src="/KARLimoLAX_HD.mp4" type="video/mp4" />
            {/* Fallback image if video doesn't load */}
            <img
              src="/limo-2.png"
              alt="Mercedes Sprinter Limo"
              className="w-full h-full object-cover opacity-50"
            />
          </video>
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-2 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Bold Headline with Highlighted Phrases */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Premium <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Luxury Transportation</span> in Los Angeles
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Experience the ultimate in comfort and style with our <span className="font-semibold text-white">Mercedes Sprinter limousines</span>. 
              Your journey, elevated.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/booking">
                <button className="group w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2">
                  Book Your Ride
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/vehicles">
                <button className="group w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2">
                  View Our Fleet
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>24/7 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>Premium Fleet</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>5-Star Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/70" />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Why Choose <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Kar Limo LAX</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience unmatched luxury, reliability, and professionalism with every ride
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Safe & Secure</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Fully licensed, insured, and professionally trained chauffeurs ensuring your safety and peace of mind
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">24/7 Availability</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Available around the clock for your convenience. Book anytime, anywhere in Los Angeles
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Premium Fleet</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Luxury Mercedes Sprinter limousines with spacious interiors and top-tier amenities
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">5-Star Service</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Exceptional customer service with attention to detail that exceeds expectations
              </p>
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
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
                      <span className="font-bold text-purple-600 text-sm md:text-base">${vehicle.pricePerHour}/hour</span>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Why Choose KarLimoLax?</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Premium Mercedes Fleet</h3>
                    <p className="text-gray-600 text-sm md:text-base">Travel in style and comfort with our top-of-the-line Mercedes-Benz Sprinter vans, known for their reliability and luxury.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Professional Chauffeurs</h3>
                    <p className="text-gray-600 text-sm md:text-base">Our experienced, licensed, and insured chauffeurs are dedicated to providing safe, punctual, and courteous service.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <Lock className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
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
       
      {/* Instagram Feed */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Follow Us on Instagram</h2>
          <InstagramEmbed
            profileUrl="https://www.instagram.com/k.a.r_limousine/"
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
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Thousand Oaks to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Irvine to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Anaheim to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Newport Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Huntington Beach to LAX
                  </li>
                </ul>
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Santa Monica to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Calabasas to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Pasadena to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to San Pedro Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Long Beach Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Orange County to LAX
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    San Diego to LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Palm Springs Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
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
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Town Car Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Executive Limo
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    Luxury Limo Service
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
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
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Orange County
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service San Bernardino County
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Limo Service</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Orange County
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
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