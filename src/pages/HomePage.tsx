import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, Lock, ChevronLeft, ChevronRight, Car, ChevronDown, ArrowRight, Shield, Clock, Users, Award, Calendar, MapPin, CreditCard, Plane, Sparkles, Briefcase, Image } from 'lucide-react';
import Button from '../components/common/Button';
// import ServiceCard from '../components/common/ServiceCard'; // Keep commented for now
// import TestimonialCard from '../components/common/TestimonialCard'; // Keep commented for now
// import BookingForm from '../components/booking/BookingForm'; // Keep commented for now
import { Helmet } from 'react-helmet-async';
import { useEffect, useState, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Ensure video plays completely and doesn't pause unexpectedly
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const ensurePlaying = () => {
      if (video.paused && !video.ended) {
        video.play().catch(err => {
          console.warn('Video play attempt failed:', err);
        });
      }
    };

    const handleCanPlayThrough = () => {
      // Video is ready to play through without stopping
      ensurePlaying();
    };

    const handleLoadedData = () => {
      // Ensure video plays when data is loaded
      ensurePlaying();
    };

    const handleEnded = () => {
      // If loop attribute doesn't work, manually restart
      if (video.loop) {
        video.currentTime = 0;
        video.play().catch(err => {
          console.warn('Video restart failed:', err);
        });
      }
    };

    const handlePause = () => {
      // If video pauses unexpectedly (not by user), resume it
      // Only auto-resume if it's not at the end and should be looping
      if (!video.ended && video.loop) {
        // Small delay to avoid conflicts with browser controls
        setTimeout(() => {
          if (video.paused && !video.ended) {
            video.play().catch(err => {
              console.warn('Video auto-resume failed:', err);
            });
          }
        }, 100);
      }
    };

    const handleWaiting = () => {
      // Video is buffering - ensure it resumes when ready
      video.addEventListener('canplay', () => {
        ensurePlaying();
      }, { once: true });
    };

    const handleStalled = () => {
      // Video loading stalled - try to resume
      console.warn('Video stalled, attempting to resume...');
      setTimeout(() => {
        ensurePlaying();
      }, 500);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      // Try to reload the video source
      const source = video.querySelector('source');
      if (source) {
        const src = source.src;
        source.src = '';
        setTimeout(() => {
          source.src = src;
          video.load();
        }, 1000);
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && video.paused && !video.ended) {
        video.play().catch(err => {
          console.warn('Video resume on visibility change failed:', err);
        });
      }
    };

    // Periodic check to ensure video is playing (every 2 seconds)
    const playCheckInterval = setInterval(() => {
      if (video.paused && !video.ended && video.loop) {
        ensurePlaying();
      }
    }, 2000);

    // Add all event listeners
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Try to play immediately if video is already loaded
    if (video.readyState >= 3) {
      ensurePlaying();
    }

    return () => {
      clearInterval(playCheckInterval);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div>
      <Helmet>
        <title>KAR Limo LAX | Los Angeles Sprinter Limo Airport Transportation Services</title>
        <meta name="description" content="Premium Limousine Service for Los Angeles airports (LAX, SNA, LGB, ONT), Disneyland hotels, and special events with luxury Mercedes Sprinter limos." />
        <link rel="canonical" href="https://karlimolax.com/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-cover"
            style={{ minHeight: '100%', minWidth: '100%' }}
          >
            <source src="/KARLimoLAX_HeroVideo.mp4" type="video/mp4" />
            {/* Fallback image if video doesn't load */}
            <img
              src="/limo-2.png"
              alt="Mercedes Sprinter Limo"
              className="w-full h-full object-cover opacity-50"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
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
              Premium <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">Luxury Transportation</span> in Los Angeles
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Experience the ultimate in comfort and style with our <span className="font-semibold text-white">Mercedes Sprinter limousines</span>. 
              Your journey, elevated.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/booking">
                <button className="group w-full sm:w-auto bg-brand hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2">
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
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Kar Limo LAX
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
              Experience unmatched luxury, reliability, and professionalism with every ride.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Safe & Secure</h3>
              <p className="text-gray-200 text-sm md:text-base">
                Fully licensed, insured, and professionally trained chauffeurs ensuring your safety and peace of mind
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">24/7 Availability</h3>
              <p className="text-gray-200 text-sm md:text-base">
                Available around the clock for your convenience. Book anytime, anywhere in Los Angeles
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Premium Fleet</h3>
              <p className="text-gray-200 text-sm md:text-base">
                Luxury Mercedes Sprinter limousines with spacious interiors and top-tier amenities
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">5-Star Service</h3>
              <p className="text-gray-200 text-sm md:text-base">
                Exceptional customer service with attention to detail that exceeds expectations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Premium Fleet */}
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/60" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Premium Fleet
              </span>
            </h2>
            <p className="text-gray-200 max-w-3xl mx-auto text-sm md:text-base">
              Experience luxury and comfort with our selection of top-tier vehicles.
            </p>
          </div>
          
          {loadingFleet && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-300"></div>
              <span className="ml-3 text-lg text-gray-200">Loading our fleet...</span>
            </div>
          )}

          {fleetError && (
            <div className="text-center py-8 text-red-300">
              <p>Error: {fleetError}</p>
            </div>
          )}

          {!loadingFleet && !fleetError && fleetVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-300">Our fleet information is currently unavailable. Please check back soon.</p>
            </div>
          )}

          {!loadingFleet && !fleetError && fleetVehicles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-6xl mx-auto">
              {fleetVehicles.map(vehicle => (
                <div
                  key={vehicle._id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden hover:bg-white/15 transition-all duration-300 w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm flex-shrink-0"
                >
                  <div className="relative h-40 md:h-48">
                    {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
                      <Carousel images={vehicle.imageUrls} alt={vehicle.name} />
                    ) : vehicle.imageUrl ? (
                      <Carousel images={[vehicle.imageUrl]} alt={vehicle.name} />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Car className="h-12 w-12 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 h-12 md:h-14 overflow-hidden text-white">
                      {vehicle.name}
                    </h3>
                    <p className="text-gray-200 mb-4 text-sm md:text-base">
                      {vehicle.description || 'High-quality vehicle for your comfort and style.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="font-bold text-brand-200 text-sm md:text-base">${vehicle.pricePerHour}/hour</span>
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

      {/* Gallery Section */}
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Gallery
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
              Take a closer look at our premium Mercedes Sprinter limousines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* Sprinter 1 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter1.jpg"
                  alt="Mercedes Sprinter Limousine Interior"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Premium Interior</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Luxurious and spacious interior designed for your comfort
                </p>
              </div>
            </div>

            {/* Sprinter 2 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter2.jpg"
                  alt="Mercedes Sprinter Limousine Exterior"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Elegant Exterior</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Sleek and sophisticated design that makes a statement
                </p>
              </div>
            </div>

            {/* Sprinter 7 (replacing Tailgate) */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter7.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Luxury Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Premium Mercedes Sprinter limousine
                </p>
              </div>
            </div>

            {/* Sprinter 3 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter3.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">VIP Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Luxury transportation at its finest
                </p>
              </div>
            </div>

            {/* Sprinter 4 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter4.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">VIP Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Spacious and comfortable interior
                </p>
              </div>
            </div>

            {/* Sprinter 5 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter5.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Executive Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Professional and elegant design
                </p>
              </div>
            </div>

            {/* Sprinter 6 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter6.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Luxury Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Premium comfort and style
                </p>
              </div>
            </div>

            {/* Sprinter 8 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter8.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">VIP Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Exceptional quality and service
                </p>
              </div>
            </div>

            {/* Sprinter 9 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter9.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">VIP Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Sophisticated and refined
                </p>
              </div>
            </div>

            {/* Sprinter 11 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter11.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Premium Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Top-tier transportation experience
                </p>
              </div>
            </div>

            {/* Sprinter 12 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter12.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Executive Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Professional luxury service
                </p>
              </div>
            </div>

            {/* Sprinter 13 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter13.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Elite Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Superior quality and design
                </p>
              </div>
            </div>

            {/* Sprinter 14 */}
            <div className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src="/Sprinter14.jpeg"
                  alt="Mercedes Sprinter Limousine"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 text-brand-200 mb-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold text-white">Luxury Sprinter</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Exceptional comfort and style
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      {/* Service Highlights Section */}
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/65" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Services
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
              Premium transportation solutions for every occasion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Airport Transfers */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Plane className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Airport Transfers</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Reliable transfers to and from all major airports including LAX, SNA, LGB, ONT, and SAN. Professional service with flight tracking.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Special Events */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Special Events</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Make your weddings, proms, corporate events, and celebrations unforgettable with our luxury transportation service.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Corporate Services */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Corporate Services</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Professional transportation for business meetings, conferences, and corporate events. Impress your clients with style.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Disneyland Transfers */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Disneyland Transfers</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Convenient transportation to Disneyland Park and hotels. Family-friendly service with spacious vehicles for groups.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Hourly Service */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Hourly Service</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Flexible hourly rentals for city tours, shopping trips, or any occasion where you need a dedicated vehicle and driver.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Long Distance */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/90 text-white mb-4 ring-1 ring-white/15">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Long Distance</h3>
              <p className="text-gray-200 text-sm md:text-base mb-4">
                Comfortable long-distance transfers to destinations like Las Vegas, Palm Springs, and throughout Southern California.
              </p>
              <Link to="/booking" className="text-brand-200 hover:text-brand-100 font-semibold text-sm md:text-base inline-flex items-center">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
       
      {/* Instagram Feed */}
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/70" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Follow Us on{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Instagram
              </span>
            </h2>
            <p className="text-gray-200 max-w-3xl mx-auto text-sm md:text-base">
              Behind the scenes, fleet highlights, and recent rides.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 md:p-6 shadow-xl">
            <InstagramEmbed
              profileUrl="https://www.instagram.com/k.a.r_limousine/"
              className="w-full"
              height={520}
              images={instagramImages.length > 0 ? instagramImages : undefined}
            />
          </div>
        </div>
      </section>

      {/* Routes & Services Section */}
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/65" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Routes &{' '}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Services
              </span>{' '}
              We Cover
            </h2>
            <p className="text-gray-200 max-w-3xl mx-auto text-sm md:text-base">
              Comprehensive transportation services across Southern California with premium sprinter vehicles and professional chauffeurs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Top Routes Column */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-xl shadow-xl">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Top Routes We Cover</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Disneyland
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport to Disneyland
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Thousand Oaks to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Irvine to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Anaheim to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Newport Beach to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Huntington Beach to LAX
                  </li>
                </ul>
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Santa Monica to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Calabasas to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Pasadena to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to San Pedro Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Long Beach Cruise Terminal
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Orange County to LAX
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    San Diego to LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX to Palm Springs Limo Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LA To Las Vegas Limo Service
                  </li>
                </ul>
              </div>
            </div>

            {/* Services Column */}
            <div className="space-y-6 md:space-y-8">
              {/* Airport Transfers */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-xl shadow-xl">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Airport Transfers</h3>
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Car Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    LAX Limo Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    John Wayne Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Long Beach Airport Car Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Town Car Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Executive Limo
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Luxury Limo Service
                  </li>
                  <li className="flex items-center text-gray-200">
                    <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                    Sprinter Limo Service LAX
                  </li>
                </ul>
              </div>

              {/* Car Service & Limo Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4">Car Service</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service Orange County
                    </li>
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                      Car Service San Bernardino County
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4">Limo Service</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Los Angeles
                    </li>
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
                      Limo Service Orange County
                    </li>
                    <li className="flex items-center text-gray-200">
                      <span className="w-2 h-2 bg-brand-300 rounded-full mr-3 flex-shrink-0"></span>
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
      <section className="relative py-12 md:py-20 bg-gray-900 text-white overflow-hidden">
        {/* Background overlays (match hero styling) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/70" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Experience{' '}
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
              Premium Transportation
            </span>
            ?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-gray-200">
            Book your premium Mercedes Sprinter service today and travel in style. Our team is ready to provide you with an unforgettable experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/booking" className="w-full sm:w-auto">
              <button className="group w-full sm:w-auto bg-brand hover:bg-brand-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2">
                Book Your Ride Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <button className="group w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2">
                Contact Us
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
