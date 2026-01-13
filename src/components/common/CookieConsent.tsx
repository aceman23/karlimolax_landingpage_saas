import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if user has already accepted cookies
    const consentAccepted = localStorage.getItem('cookieConsentAccepted');
    if (!consentAccepted) {
      // Show the banner after a small delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleAccept = () => {
    // Store consent in localStorage
    localStorage.setItem('cookieConsentAccepted', 'true');
    setIsVisible(false);
  };
  
  const handleDecline = () => {
    // Store decline preference (still hide banner)
    localStorage.setItem('cookieConsentAccepted', 'false');
    setIsVisible(false);
  };
  
  const handleClose = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold mb-2">We Use Cookies</h3>
          <p className="text-gray-600 text-sm md:text-base">
            We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
            By continuing to browse, you consent to our use of cookies. 
            Learn more in our <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="primary" size="sm" onClick={handleAccept}>
            Accept All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
        </div>
        
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
          aria-label="Close cookie consent banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}