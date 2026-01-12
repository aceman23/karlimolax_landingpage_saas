// Type definitions for Google Maps JavaScript API
// Simplified version for use with Google Places Autocomplete

declare namespace google {
  namespace maps {
    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions);
        addListener(eventName: string, handler: Function): MapsEventListener;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds;
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        types?: string[];
      }

      interface ComponentRestrictions {
        country: string | string[];
      }

      interface PlaceResult {
        address_components?: AddressComponent[];
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
          viewport?: LatLngBounds;
        };
        name?: string;
        place_id?: string;
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
      toJSON(): any;
      toString(): string;
    }

    interface LatLngBounds {
      contains(latLng: LatLng): boolean;
      equals(other: LatLngBounds): boolean;
      extend(latLng: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toJSON(): any;
      toString(): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    namespace event {
      function removeListener(listener: MapsEventListener): void;
    }
  }
} 