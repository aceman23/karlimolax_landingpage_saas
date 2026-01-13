// import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Car } from 'lucide-react';
import Button from '../components/common/Button';
import { Helmet } from 'react-helmet';

const NotFound = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Page Not Found | Kar Limo LAX</title>
        <meta name="description" content="We're sorry, but the page you're looking for cannot be found." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Car size={80} className="text-purple-500" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">404 - Wrong Destination</h1>
          <p className="text-xl text-gray-600 mb-8">
            Looks like our driver took a wrong turn. The page you're looking for has moved or doesn't exist.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/">
              <Button variant="primary" className="flex items-center">
                <ArrowLeft size={18} className="mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="outline" className="flex items-center">
                <Car size={18} className="mr-2" />
                Book a Ride
              </Button>
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Popular Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition">
                <MapPin size={18} className="text-purple-500 mr-2" />
                <span>Home</span>
              </Link>
              <Link to="/vehicles" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition">
                <MapPin size={18} className="text-purple-500 mr-2" />
                <span>Our Fleet</span>
              </Link>
              <Link to="/booking" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition">
                <MapPin size={18} className="text-purple-500 mr-2" />
                <span>Book Now</span>
              </Link>
              <Link to="/about" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition">
                <MapPin size={18} className="text-purple-500 mr-2" />
                <span>About Us</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-gray-500">
            <p>Need assistance? Call us at (310) 555-7890</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;