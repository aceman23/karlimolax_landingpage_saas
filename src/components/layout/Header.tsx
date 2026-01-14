import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogOut, User, UserPlus, Menu, X } from 'lucide-react';
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
            <span className="text-2xl font-bold tracking-tight truncate">KarLimoLax.com</span>
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
              className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/') ? 'text-purple-400' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/vehicles" 
              className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/vehicles') ? 'text-purple-400' : ''}`}
            >
              Our Fleet
            </Link>
            <Link 
              to="/booking" 
              className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/booking') ? 'text-purple-400' : ''}`}
            >
              Book Now
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/about') ? 'text-purple-400' : ''}`}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/contact') ? 'text-purple-400' : ''}`}
            >
              Contact
            </Link>
            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/admin') ? 'text-purple-400' : ''}`}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/profile" 
                  className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/admin/profile') ? 'text-purple-400' : ''}`}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'driver' && (
              <>
                <Link 
                  to="/driver" 
                  className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/driver') ? 'text-purple-400' : ''}`}
                >
                  Driver Panel
                </Link>
                <Link 
                  to="/driver/profile" 
                  className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/driver/profile') ? 'text-purple-400' : ''}`}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'customer' && (
              <Link 
                to="/profile" 
                className={`hover:text-purple-400 transition text-base whitespace-nowrap ${isActive('/profile') ? 'text-purple-400' : ''}`}
              >
                My Profile
              </Link>
            )}
          </nav>
          
          {/* Desktop Login Links */}
          <div className="hidden menu:flex items-center space-x-3 flex-shrink-0 ml-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-white truncate max-w-[120px]">
                    Welcome, {user.firstName} {user.lastName}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  state={{ showRegistration: true }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign up
                </Link>
                <Link 
                  to="/login" 
                  className="flex items-center text-sm hover:text-purple-400 transition whitespace-nowrap"
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
              className={`hover:text-purple-400 transition text-lg ${isActive('/') ? 'text-purple-400' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/vehicles" 
              className={`hover:text-purple-400 transition text-lg ${isActive('/vehicles') ? 'text-purple-400' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Fleet
            </Link>
            <Link 
              to="/booking" 
              className={`hover:text-purple-400 transition text-lg ${isActive('/booking') ? 'text-purple-400' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Book Now
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-purple-400 transition text-lg ${isActive('/about') ? 'text-purple-400' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className={`hover:text-purple-400 transition text-lg ${isActive('/contact') ? 'text-purple-400' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className={`hover:text-purple-400 transition text-lg ${isActive('/admin') ? 'text-purple-400' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/profile" 
                  className={`hover:text-purple-400 transition text-lg ${isActive('/admin/profile') ? 'text-purple-400' : ''}`}
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
                  className={`hover:text-purple-400 transition text-lg ${isActive('/driver') ? 'text-purple-400' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Driver Panel
                </Link>
                <Link 
                  to="/driver/profile" 
                  className={`hover:text-purple-400 transition text-lg ${isActive('/driver/profile') ? 'text-purple-400' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
              </>
            )}
            {user && user.role === 'customer' && (
              <Link 
                to="/profile" 
                className={`hover:text-purple-400 transition text-lg ${isActive('/profile') ? 'text-purple-400' : ''}`}
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
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="text-lg font-medium text-white truncate">
                    Welcome, {user.firstName} {user.lastName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-lg font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/login" 
                  state={{ showRegistration: true }}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-lg font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Sign up
                </Link>
                <Link 
                  to="/login" 
                  className="flex items-center justify-center text-lg hover:text-purple-400 transition"
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