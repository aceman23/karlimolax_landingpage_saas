import React, { useRef, useEffect, useState } from 'react';

interface DropoffAddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DropoffAddressInput: React.FC<DropoffAddressInputProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current || isInitialized) return;

    // Create a new instance of Autocomplete specifically for dropoff
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
  }, [onChange, isInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <label htmlFor="dropoff-address" className="block font-semibold mb-1">
        Dropoff Address *
      </label>
      <input
        ref={inputRef}
        id="dropoff-address"
        type="text"
        name="dropoffAddress"
        value={value}
        onChange={handleInputChange}
        placeholder="Enter dropoff address"
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoComplete="off"
      />
    </div>
  );
};

export default DropoffAddressInput; 