import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { BookingDetails, CustomerInfo, PaymentInfo, Vehicle, Booking, ServicePackage } from '../types/index';
import { vehicles, servicePackages } from '../data/vehicles';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';

interface DistanceTier {
  minDistance: number;
  maxDistance: number;
  fee: number;
}

interface TimeSurcharge {
  startTime: string;
  endTime: string;
  surcharge: number;
}

interface VehiclePackagePricing {
  vehicleId: string;
  packageId: string;
  distanceThreshold: number;
  perMileFee: number;
}

interface FeeRule {
  condition: string;
  fee: number;
}

interface PricingSettings {
  distanceFeeEnabled: boolean;
  distanceThreshold: number;
  distanceFee: number;
  perMileFeeEnabled: boolean;
  perMileFee: number;
  minFee: number;
  maxFee: number;
  distanceTiers: DistanceTier[];
  timeSurcharges: TimeSurcharge[];
  vehiclePackagePricing: VehiclePackagePricing[];
  feeRules: FeeRule[];
  stopPrice: number;
  carSeatPrice: number;
  boosterSeatPrice: number;
}

interface BookingContextType {
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  selectedPackage: ServicePackage | null;
  setSelectedPackage: (pkg: ServicePackage | null) => void;
  selectedAirport: string | null;
  setSelectedAirport: (airport: string | null) => void;
  bookingDetails: Partial<BookingDetails>;
  setBookingDetails: (details: Partial<BookingDetails>) => void;
  customerInfo: Partial<CustomerInfo>;
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  paymentInfo: Partial<PaymentInfo>;
  setPaymentInfo: (info: Partial<PaymentInfo>) => void;
  gratuityInfo: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
  setGratuityInfo: (info: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  }) => void;
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  calculateTotal: () => number;
  calculateTotalWithGratuity: () => number;
  resetBooking: () => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  getPackageById: (id: string) => ServicePackage | undefined;
  settings: PricingSettings;
  totalPrice: number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Partial<BookingDetails>>({});
  const [customerInfo, setCustomerInfo] = useState<Partial<CustomerInfo>>({});
  const [paymentInfo, setPaymentInfo] = useState<Partial<PaymentInfo>>({});
  const [gratuityInfo, setGratuityInfo] = useState<{
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  }>({
    type: 'none',
    amount: 0
  });


  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [settings, setSettings] = useState<PricingSettings>({
    distanceFeeEnabled: true,
    distanceThreshold: 40,
    distanceFee: 49,
    perMileFeeEnabled: false,
    perMileFee: 2,
    minFee: 0,
    maxFee: 1000,
    stopPrice: 25,
    distanceTiers: [
      { minDistance: 0, maxDistance: 40, fee: 0 },
      { minDistance: 40, maxDistance: 60, fee: 49 },
      { minDistance: 60, maxDistance: 100, fee: 99 }
    ],
    timeSurcharges: [],
    vehiclePackagePricing: [],
    feeRules: [],
    carSeatPrice: 15,
    boosterSeatPrice: 10
  });

  useEffect(() => {
    fetchPricingSettings();
  }, []); 

  const fetchPricingSettings = async () => {
    try {
      // Try relative URL first (works for same-domain requests)
      const url = '/api/admin/settings/public';
      console.log('[DEBUG] Fetching pricing settings from:', url);
      
      const response = await fetch(url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {}
      });

      console.log('[DEBUG] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch admin settings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('[DEBUG] Received settings data:', data);
      
      // The response should already be the admin_settings document
      if (!data) {
        console.error('[ERROR] Admin settings not found');
        return;
      }

      console.log('[DEBUG] Using admin settings:', {
        distanceFeeEnabled: data.distanceFeeEnabled,
        distanceThreshold: data.distanceThreshold,
        distanceFee: data.distanceFee,
        perMileFeeEnabled: data.perMileFeeEnabled,
        perMileFee: data.perMileFee,
        minFee: data.minFee,
        maxFee: data.maxFee,
        stopPrice: data.stopPrice,
        distanceTiers: data.distanceTiers,
        timeSurcharges: data.timeSurcharges,
        vehiclePackagePricing: data.vehiclePackagePricing,
        feeRules: data.feeRules,
        carSeatPrice: data.carSeatPrice,
        boosterSeatPrice: data.boosterSeatPrice
      });

      setSettings({
        distanceFeeEnabled: data.distanceFeeEnabled ?? true,
        distanceThreshold: data.distanceThreshold ?? 40,
        distanceFee: data.distanceFee ?? 49,
        perMileFeeEnabled: data.perMileFeeEnabled ?? false,
        perMileFee: data.perMileFee ?? 2,
        minFee: data.minFee ?? 0,
        maxFee: data.maxFee ?? 1000,
        stopPrice: data.stopPrice ?? 25,
        distanceTiers: data.distanceTiers ?? [
          { minDistance: 0, maxDistance: 40, fee: 0 },
          { minDistance: 40, maxDistance: 60, fee: 49 },
          { minDistance: 60, maxDistance: 100, fee: 99 }
        ],
        timeSurcharges: data.timeSurcharges ?? [],
        vehiclePackagePricing: data.vehiclePackagePricing ?? [],
        feeRules: data.feeRules ?? [],
        carSeatPrice: data.carSeatPrice ?? 15,
        boosterSeatPrice: data.boosterSeatPrice ?? 10
      });
    } catch (error) {
      console.error('[ERROR] Error fetching admin settings:', error);
      console.log('[DEBUG] Using default settings due to error');
      // Keep default settings if API call fails
    }
  };

  const getVehicleById = (id: string) => {
    return vehicles.find(vehicle => vehicle.id === id);
  };

  const getPackageById = (id: string): ServicePackage | undefined => {
    return servicePackages.find(pkg => pkg.id === id || pkg._id === id);
  };

  const calculateTotal = () => {
    let total = 0;

    // Calculate base price
    if (selectedPackage) {
      if (selectedPackage.is_hourly) {
        // For hourly packages, use the selected hours or minimum hours
        const hours = Number(bookingDetails.hours) || selectedPackage.minimum_hours || 0;
        total = selectedPackage.base_price * hours;
      } else {
        // For fixed price packages, just use the base price
        total = selectedPackage.base_price;
      }
    } else if (selectedVehicle) {
      if (selectedVehicle.fixedPrice) {
        total = selectedVehicle.fixedPrice;
      } else {
        // For hourly vehicles, use the selected hours or 0
        const hours = Number(bookingDetails.hours) || 0;
        total = selectedVehicle.pricePerHour * hours;
      }
    }

    // Add distance-based fees
    if (settings.distanceFeeEnabled && bookingDetails.distance?.value) {
      const distanceInMiles = bookingDetails.distance.value / 1609.34;
      
      // Find applicable distance tier - handle distances beyond the highest tier
      let applicableTier = settings.distanceTiers.find(tier => 
        (tier.maxDistance === Infinity || tier.maxDistance === null) && distanceInMiles >= tier.minDistance ||
        (distanceInMiles >= tier.minDistance && distanceInMiles <= tier.maxDistance)
      );
      
      // If no tier found and distance exceeds all tiers, use the highest tier
      if (!applicableTier && settings.distanceTiers.length > 0) {
        const sortedTiers = [...settings.distanceTiers].sort((a, b) => 
          (a.maxDistance === Infinity || a.maxDistance === null ? Infinity : a.maxDistance) - 
          (b.maxDistance === Infinity || b.maxDistance === null ? Infinity : b.maxDistance)
        );
        const highestTier = sortedTiers[sortedTiers.length - 1];
        if (distanceInMiles >= highestTier.minDistance) {
          applicableTier = highestTier;
        }
      }

      if (applicableTier) {
        total += applicableTier.fee;
      }

      // Add per-mile fee if enabled and distance exceeds threshold
      if (settings.perMileFeeEnabled && distanceInMiles > settings.distanceThreshold) {
        const excessMiles = distanceInMiles - settings.distanceThreshold;
        total += excessMiles * settings.perMileFee;
      }
    }

    // Add time-based surcharges
    if (bookingDetails.pickupTime && settings.timeSurcharges.length > 0) {
      const pickupTime = new Date(bookingDetails.pickupTime);
      const pickupHour = pickupTime.getHours();
      const pickupMinute = pickupTime.getMinutes();
      const pickupTimeString = `${pickupHour.toString().padStart(2, '0')}:${pickupMinute.toString().padStart(2, '0')}`;

      const applicableSurcharge = settings.timeSurcharges.find(surcharge => {
        const [startHour, startMinute] = surcharge.startTime.split(':').map(Number);
        const [endHour, endMinute] = surcharge.endTime.split(':').map(Number);
        const pickupTimeMinutes = pickupHour * 60 + pickupMinute;
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;

        return pickupTimeMinutes >= startTimeMinutes && pickupTimeMinutes <= endTimeMinutes;
      });

      if (applicableSurcharge) {
        total += applicableSurcharge.surcharge;
      }
    }

    // Add fees for additional stops
    if (bookingDetails.stops && bookingDetails.stops.length > 0) {
      const stopFees = bookingDetails.stops.reduce((sum, stop) => {
        return sum + (stop.price || settings.stopPrice);
      }, 0);
      total += stopFees;
    }

    // Add car seat and booster seat fees
    if (bookingDetails.carSeats && bookingDetails.carSeats > 0) {
      total += bookingDetails.carSeats * settings.carSeatPrice;
    }
    if (bookingDetails.boosterSeats && bookingDetails.boosterSeats > 0) {
      total += bookingDetails.boosterSeats * settings.boosterSeatPrice;
    }

    // Apply fee rules
    if (settings.feeRules.length > 0) {
      settings.feeRules.forEach(rule => {
        // Here you can add logic to evaluate conditions and apply fees
        // For example, if rule.condition is a string that can be evaluated
        try {
          const condition = new Function('bookingDetails', 'settings', `return ${rule.condition}`);
          if (condition(bookingDetails, settings)) {
            total += rule.fee;
          }
        } catch (error) {
          console.error('[ERROR] Error evaluating fee rule:', error);
        }
      });
    }

    // Apply minimum and maximum fee constraints
    if (settings.minFee > 0) {
      total = Math.max(total, settings.minFee);
    }
    if (settings.maxFee > 0) {
      total = Math.min(total, settings.maxFee);
    }

    // Update the total price in state
    const finalTotal = Math.round(total * 100) / 100;
    setTotalPrice(finalTotal);
    return finalTotal;
  };

  // Calculate total with gratuity
  const calculateTotalWithGratuity = () => {
    // Calculate base total without calling the state-updating calculateTotal function
    let total = 0;
    
    // Base price calculation
    if (selectedPackage) {
      total = selectedPackage.base_price;
    } else if (selectedVehicle) {
      if (selectedVehicle.fixedPrice) {
        total = selectedVehicle.fixedPrice;
      } else if (bookingDetails.hours && selectedVehicle.pricePerHour) {
        total = bookingDetails.hours * selectedVehicle.pricePerHour;
      }
    }

    // Add distance-based fees
    if (settings.distanceFeeEnabled && bookingDetails.distance?.value) {
      const distanceInMiles = bookingDetails.distance.value / 1609.34;
      
      const applicableTier = settings.distanceTiers.find(tier => 
        (tier.maxDistance === Infinity || tier.maxDistance === null) && distanceInMiles >= tier.minDistance ||
        (distanceInMiles >= tier.minDistance && distanceInMiles <= tier.maxDistance)
      );

      if (applicableTier) {
        total += applicableTier.fee;
      }

      if (settings.perMileFeeEnabled && distanceInMiles > settings.distanceThreshold) {
        const excessMiles = distanceInMiles - settings.distanceThreshold;
        total += excessMiles * settings.perMileFee;
      }
    }

    // Add fees for additional stops
    if (bookingDetails.stops && bookingDetails.stops.length > 0) {
      const stopFees = bookingDetails.stops.reduce((sum, stop) => {
        return sum + (stop.price || settings.stopPrice);
      }, 0);
      total += stopFees;
    }

    // Add car seat and booster seat fees
    if (bookingDetails.carSeats && bookingDetails.carSeats > 0) {
      total += bookingDetails.carSeats * settings.carSeatPrice;
    }
    if (bookingDetails.boosterSeats && bookingDetails.boosterSeats > 0) {
      total += bookingDetails.boosterSeats * settings.boosterSeatPrice;
    }

    // Apply minimum and maximum fee constraints
    if (settings.minFee > 0) {
      total = Math.max(total, settings.minFee);
    }
    if (settings.maxFee > 0) {
      total = Math.min(total, settings.maxFee);
    }

    const baseTotal = Math.round(total * 100) / 100;
    
    if (gratuityInfo.type === 'percentage' && gratuityInfo.percentage) {
      const gratuityAmount = baseTotal * gratuityInfo.percentage / 100;
      return baseTotal + gratuityAmount;
    } else if (gratuityInfo.type === 'custom' && gratuityInfo.customAmount) {
      return baseTotal + gratuityInfo.customAmount;
    }
    return baseTotal;
  };

  // Update total price whenever relevant details change
  useEffect(() => {
    calculateTotal();
  }, [selectedPackage, selectedVehicle, bookingDetails, settings]);

  const resetBooking = () => {
    setSelectedVehicle(null);
    setSelectedPackage(null);
    setSelectedAirport(null);
    setBookingDetails({});
    setCustomerInfo({});
    setPaymentInfo({});
    setGratuityInfo({
      type: 'none',
      amount: 0
    });
    setCurrentBooking(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedVehicle,
        setSelectedVehicle,
        selectedPackage,
        setSelectedPackage,
        selectedAirport,
        setSelectedAirport,
        bookingDetails,
        setBookingDetails,
        customerInfo,
        setCustomerInfo,
        paymentInfo,
        setPaymentInfo,
        gratuityInfo,
        setGratuityInfo,
        currentBooking,
        setCurrentBooking,
        calculateTotal,
        calculateTotalWithGratuity,
        resetBooking,
        getVehicleById,
        getPackageById,
        settings,
        totalPrice
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}