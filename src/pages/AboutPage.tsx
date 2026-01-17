import React from 'react';
import { MapPin, Calendar, Car, Award, Clock, Users } from 'lucide-react';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// Small change

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>About Us | Kar Limo LAX</title>
        <meta
          name="description"
          content="Learn about Kar Limo LAX and our premium transportation services across Los Angeles, Orange County, and Riverside County. We provide luxury Mercedes Sprinter limo service for airport transfers, corporate travel, and special events."
        />
        <link rel="canonical" href="https://karlimolax.com/about" />
      </Helmet>
      
      {/* Page Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About Us</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Premium transportation services in Los Angeles, Orange County, and Riverside County
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="/Sprinter10.jpeg" 
                alt="Mercedes Sprinter Limo Fleet" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-6">Welcome to KarLimoLAX.com</h2>
              
              <div className="prose max-w-none">
                <p className="mb-4">
                  KarLimoLAX.com is a premium transportation booking system & service built around one simple promise: your ride should feel effortless. From airport pickups to special events, we deliver a luxury experience with professional chauffeurs and a Mercedes Sprinter fleet designed for comfort, space, and style.
                </p>
                
                <p className="mb-4">
                  We proudly serve Los Angeles, Orange County, and Riverside County with reliable service to major airports including LAX, SNA, LGB, ONT, and SAN. Whether you’re traveling for business or leisure, our team focuses on punctuality, clear communication, and a smooth door-to-door experience.
                </p>
                
                <p className="mb-8">
                  Beyond airport transportation, we provide elevated limo service for special events—weddings, proms, birthdays, corporate events, concerts, and more. Our Sprinter limousines are ideal for groups who want a refined ride, premium amenities, and a chauffeur who takes care of the details.
                </p>
                
                <p className="mb-4">
                  Planning a destination trip? We regularly provide transportation to Disneyland and other theme parks, sporting events, and long-distance destinations throughout Southern California (and beyond).
                </p>
                
                <p className="mb-6">
                  At KarLimoLAX.com, we’re committed to five-star service—clean vehicles, respectful chauffeurs, and consistent reliability. When you book with us, you’re choosing a team that values your time, your comfort, and your peace of mind.
                </p>
              </div>
            </div>

            {/* Promo video removed */}
          </div>
          
          {/* Our Services */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md transition hover:shadow-lg">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-2">Airport Transportation</h3>
                <p className="text-gray-600 mb-4">
                  Premium transfers to and from LAX, SNA, LGB, and ONT airports.
                </p>
                <ul className="text-gray-600 space-y-1 mb-4">
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Flight monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Meet & greet service
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Luggage assistance
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md transition hover:shadow-lg">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-2">Special Events</h3>
                <p className="text-gray-600 mb-4">
                  Luxurious transportation for your most important occasions.
                </p>
                <ul className="text-gray-600 space-y-1 mb-4">
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Weddings & Proms, Funerals
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Quinceañera’s, Sweet 16’s, Birthday celebrations
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                     Concerts, Corporate Events & more
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md transition hover:shadow-lg">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                  <Car className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-2">Destination Transportation</h3>
                <p className="text-gray-600 mb-4">
                  Travel to Southern California's most popular destinations.
                </p>
                <ul className="text-gray-600 space-y-1 mb-4">
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Disneyland Hotels & Theme Parks
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Sporting Events
                  </li>
                  <li className="flex items-start">
                    <span className="text-brand mr-2">•</span>
                    Wine tasting tours
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Why Choose Us */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose KarLimoLax</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Award className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Premium Fleet</h3>
                  <p className="text-gray-600">
                    Our fleet of Mercedes Sprinter limousines are meticulously maintained and feature luxury amenities including leather seating, climate control, and premium sound systems.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Clock className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Punctuality</h3>
                  <p className="text-gray-600">
                    We value your time and guarantee on-time pickups and drop-offs, with our chauffeurs arriving early to ensure a smooth and stress-free experience.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Users className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Professional Chauffeurs</h3>
                  <p className="text-gray-600">
                    Our chauffeurs are professionally trained, courteous, and knowledgeable about the area, providing exceptional customer service throughout your journey.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <MapPin className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Service Area</h3>
                  <p className="text-gray-600">
                    We proudly serve Los Angeles, Orange County, and Riverside County, providing comprehensive transportation solutions throughout Southern California.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gray-900 text-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Premium Transportation?</h2>
            <p className="text-xl mb-6">
              Book your Mercedes Sprinter limousine service today for airport transfers, special events, or destination travel.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/booking">
                <Button variant="primary">
                  Book Now
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="primary">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Cancellation Policy */}
          <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6">Cancellation Policy</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                Our cancellation policy is as follows:
              </p>
              <ul className="mb-4 space-y-2">
                <li className="flex items-start">
                  <span className="text-brand mr-2 font-bold">•</span>
                  <span><strong>Cancellations made more than 48 hours before the scheduled service:</strong> Full refund minus a $25 processing fee</span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand mr-2 font-bold">•</span>
                  <span><strong>Cancellations made 24-48 hours before the scheduled service:</strong> 50% refund</span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand mr-2 font-bold">•</span>
                  <span><strong>Cancellations made less than 24 hours before the scheduled service:</strong> No refund</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* SEO Keywords (hidden visually but present for SEO) */}
          <div className="mt-16 text-xs text-gray-400">
            <p>
              Limo Service Orange County, Limo Service Los Angeles, Limo Service Long Beach, Limo Service OC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
