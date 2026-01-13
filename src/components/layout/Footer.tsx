import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <span className="text-xl font-bold">KarLimoLax.com</span>
            </div>
            <p className="text-gray-400 mb-4">
              Providing premium limousine services for all your special occasions and business needs.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/k.a.r_limousine" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:ml-8">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-purple-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="text-gray-400 hover:text-purple-400 transition">
                  Our Fleet
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">
                  Book Now
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-purple-400 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-purple-400 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">LAX Airport Transfers</Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">Disneyland Shuttles</Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">Corporate Events</Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">Wedding Transportation</Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-purple-400 transition">Wine Tasting Tours</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-purple-500 mt-1 flex-shrink-0" />
                <span className="text-gray-400">1550 N Batavia<br />Orange, CA 92867</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="text-purple-500 flex-shrink-0" />
                <span className="text-gray-400">(213) 590-6085</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="text-purple-500 flex-shrink-0" />
                <span className="text-gray-400 break-all">dapperlimolax@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3 mt-4">
                <Lock size={20} className="text-purple-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <Link to="/login" className="text-gray-400 hover:text-purple-400 transition">
                    Admin Login
                  </Link>
                  <Link to="/login" className="text-gray-400 hover:text-purple-400 transition">
                    Driver Login
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-800 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} KarLimoLax. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/terms" className="text-gray-500 text-sm hover:text-gray-400 transition">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-gray-500 text-sm hover:text-gray-400 transition">
              Privacy Policy
            </Link>
            <Link to="/login" className="text-gray-500 text-sm hover:text-purple-400 transition flex items-center">
              <Lock size={12} className="mr-1" />
              Admin/Driver Portal
            </Link>
          </div>
        </div>
        
        {/* Hybrid Ads Attribution */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <a 
            href="https://hybridads.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 text-sm hover:text-purple-400 transition"
          >
            Designed & Built by Hybrid Ads.ai
          </a>
        </div>
      </div>
    </footer>
  );
}