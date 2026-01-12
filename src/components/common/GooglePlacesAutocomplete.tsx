import React from 'react';
import Autocomplete from 'react-google-autocomplete';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: any) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  label?: string;
  name?: string;
  error?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Enter an address',
  className = '',
  required = false,
  label,
  name,
  error
}) => {
  const handlePlaceSelect = (place: any) => {
    if (place) {
      // Combine place name and formatted address if available
      let displayText = place.name || '';
      if (place.formatted_address && place.name !== place.formatted_address) {
        displayText += ` - ${place.formatted_address}`;
      }
      
      // If no name is available, use the formatted address
      if (!displayText && place.formatted_address) {
        displayText = place.formatted_address;
      }
      
      onChange(displayText);
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block font-semibold mb-1">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative" style={{ position: 'relative', zIndex: 1 }}>
        <Autocomplete
          apiKey={process.env.VITE_GOOGLE_PLACES_API_KEY}
          onPlaceSelected={handlePlaceSelect}
          defaultValue={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          options={{
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'us' },
            fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
          }}
          className={`w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
          placeholder={placeholder}
          required={required}
          name={name}
          id={name}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete; 