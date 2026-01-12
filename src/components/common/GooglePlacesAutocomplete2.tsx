import React, { useRef, useEffect, useState } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  id?: string;
  name?: string;
  className?: string;
  error?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter address',
  required = false,
  label,
  id,
  name,
  className = '',
  error
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current || isInitialized) return;

    try {
      // Create a new instance of Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
      });

      // Add listener for place selection
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place?.formatted_address) {
          // Force immediate update of both input and state
          if (inputRef.current) {
            inputRef.current.value = place.formatted_address;
          }
          onChange(place.formatted_address);
        }
      });

      // Add mutation observer to handle autocomplete dropdown
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                // Add click handlers to all pac-items
                const items = node.querySelectorAll('.pac-item');
                items.forEach((item) => {
                  item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const address = item.textContent || '';
                    if (address && inputRef.current) {
                      inputRef.current.value = address;
                      onChange(address);
                    }
                  });
                });
              }
            });
          }
        });
      });

      // Start observing the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setIsInitialized(true);

      return () => {
        if (window.google?.maps?.event && listener) {
          window.google.maps.event.removeListener(listener);
        }
        observer.disconnect();
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setIsLoading(false);
    }
  }, [onChange, isInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleFocus = () => {
    if (inputRef.current && autocompleteRef.current) {
      // Trigger autocomplete dropdown on focus if there's text
      if (inputRef.current.value) {
        autocompleteRef.current.setFields(['address_components', 'formatted_address', 'geometry', 'name', 'place_id']);
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block font-semibold mb-1">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete; 