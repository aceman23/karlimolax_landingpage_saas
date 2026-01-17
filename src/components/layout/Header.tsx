import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogOut, User, Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 w-full overflow-x-hidden">
      <div className="max-w-[100vw] mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center min-w-0">
            <img 
              src="/KarLimoLAX_Logo.jpeg" 
              alt="Kar Limo LAX" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>
          
          {/* Mobile Menu Button */}
          <button 
            className="menu:hidden p-1.5 rounded-md hover:bg-gray-800 focus:outline-none flex-shrink-0"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden menu:flex items-center space-x-6 ml-4">
            <Link 
              to="/" 
              className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/') ? 'text-brand-300' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/vehicles" 
              className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/vehicles') ? 'text-brand-300' : ''}`}
            >
              Our Fleet
            </Link>
            <Link 
              to="/booking" 
              className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/booking') ? 'text-brand-300' : ''}`}
            >
              Book Now
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/about') ? 'text-brand-300' : ''}`}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/contact') ? 'text-brand-300' : ''}`}
            >
              Contact
            </Link>
            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/admin') ? 'text-brand-300' : ''}`}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/profile" 
                  className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/admin/profile') ? 'text-brand-300' : ''}`}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'driver' && (
              <>
                <Link 
                  to="/driver" 
                  className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/driver') ? 'text-brand-300' : ''}`}
                >
                  Driver Panel
                </Link>
                <Link 
                  to="/driver/profile" 
                  className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/driver/profile') ? 'text-brand-300' : ''}`}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'customer' && (
              <Link 
                to="/profile" 
                className={`hover:text-brand-300 transition text-base whitespace-nowrap ${isActive('/profile') ? 'text-brand-300' : ''}`}
              >
                My Profile
              </Link>
            )}
          </nav>
          
          {/* Desktop Login Links */}
          <div className="hidden menu:flex items-center space-x-3 flex-shrink-0 ml-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="flex items-center text-sm hover:text-brand-300 transition whitespace-nowrap"
                >
                  <Lock size={14} className="mr-1 flex-shrink-0" />
                  <span>Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`menu:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mt-2 pb-2`}>
          <nav className="flex flex-col space-y-2">
            <Link 
              to="/" 
              className={`hover:text-brand-300 transition text-lg ${isActive('/') ? 'text-brand-300' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/vehicles" 
              className={`hover:text-brand-300 transition text-lg ${isActive('/vehicles') ? 'text-brand-300' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Fleet
            </Link>
            <Link 
              to="/booking" 
              className={`hover:text-brand-300 transition text-lg ${isActive('/booking') ? 'text-brand-300' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Book Now
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-brand-300 transition text-lg ${isActive('/about') ? 'text-brand-300' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className={`hover:text-brand-300 transition text-lg ${isActive('/contact') ? 'text-brand-300' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className={`hover:text-brand-300 transition text-lg ${isActive('/admin') ? 'text-brand-300' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/profile" 
                  className={`hover:text-brand-300 transition text-lg ${isActive('/admin/profile') ? 'text-brand-300' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'driver' && (
              <>
                <Link 
                  to="/driver" 
                  className={`hover:text-brand-300 transition text-lg ${isActive('/driver') ? 'text-brand-300' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Driver Panel
                </Link>
                <Link 
                  to="/driver/profile" 
                  className={`hover:text-brand-300 transition text-lg ${isActive('/driver/profile') ? 'text-brand-300' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'customer' && (
              <Link 
                to="/profile" 
                className={`hover:text-brand-300 transition text-lg ${isActive('/profile') ? 'text-brand-300' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Profile
              </Link>
            )}
          </nav>

          {/* Mobile Login Links */}
          <div className="mt-3 pt-3 border-t border-gray-800">
            {user ? (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-lg font-medium rounded-md text-white bg-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/login" 
                  className="flex items-center justify-center text-lg hover:text-brand-300 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Lock size={16} className="mr-1 flex-shrink-0" />
                  <span>Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}