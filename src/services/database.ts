import {
  Profile as ProfileType,
  Vehicle as VehicleType,
  Booking as BookingType,
  CustomerInfo as CustomerType,
  ServicePackage as ServicePackageType
  // DriverDocument & DriverRating are not in ../types, will define placeholders below
} from '../types';

const API_BASE_URL = '/api';

// Define placeholders for types not available in ../types
interface DriverDocumentType { // Placeholder
  id: string;
  driverId: string;
  type: string;
  // ... other fields as necessary
}

interface DriverRatingType { // Placeholder
  id: string;
  driverId: string;
  bookingId: string;
  rating: number;
  // ... other fields as necessary
}

interface BookingStatusHistoryDataType {
  bookingId: string;
  status: string;
  changedBy: string;
  comment?: string;
}


// Profile operations
export async function getProfiles(): Promise<ProfileType[]> {
  const response = await fetch(`${API_BASE_URL}/profiles`);
  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }
  return response.json();
}

export async function getProfileById(id: string): Promise<ProfileType> {
  const response = await fetch(`${API_BASE_URL}/profiles/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

export async function createProfile(profile: Partial<ProfileType>): Promise<ProfileType> {
  const response = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create profile' }));
    throw new Error(errorData.message || 'Failed to create profile');
  }
  return response.json();
}

export async function updateProfile(id: string, profile: Partial<ProfileType>): Promise<ProfileType> {
  const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(errorData.message || 'Failed to update profile');
  }
  return response.json();
}

export async function deleteProfile(id: string) {
  const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete profile');
  }
  return response.json();
}

// Vehicle operations
export async function getVehicles(): Promise<VehicleType[]> {
  const response = await fetch(`${API_BASE_URL}/vehicles`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicles');
  }
  return response.json();
}

export async function getVehicleById(id: string): Promise<VehicleType> {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle');
  }
  return response.json();
}

export async function createVehicle(vehicle: Partial<VehicleType>): Promise<VehicleType> {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vehicle),
  });
  if (!response.ok) {
    throw new Error('Failed to create vehicle');
  }
  return response.json();
}

export async function updateVehicle(id: string, vehicle: Partial<VehicleType>): Promise<VehicleType> {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vehicle),
  });
  if (!response.ok) {
    throw new Error('Failed to update vehicle');
  }
  return response.json();
}

export async function deleteVehicle(id: string) {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete vehicle');
  }
  return response.json();
}

// Booking operations
export async function getBookings(): Promise<BookingType[]> {
  const response = await fetch(`${API_BASE_URL}/bookings`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
}

export async function getBookingById(id: string): Promise<BookingType> {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch booking');
  }
  return response.json();
}

export async function createBooking(booking: Partial<BookingType>): Promise<BookingType> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    throw new Error('Failed to create booking');
  }
  return response.json();
}

export async function updateBooking(id: string, booking: Partial<BookingType>): Promise<BookingType> {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    throw new Error('Failed to update booking');
  }
  return response.json();
}

export async function deleteBooking(id: string) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete booking');
  }
  return response.json();
}

// Customer operations
export async function getCustomers(): Promise<CustomerType[]> {
  const response = await fetch(`${API_BASE_URL}/customers`);
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

export async function getCustomerById(id: string): Promise<CustomerType> {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }
  return response.json();
}

export async function createCustomer(customer: Partial<CustomerType>): Promise<CustomerType> {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customer),
  });
  if (!response.ok) {
    throw new Error('Failed to create customer');
  }
  return response.json();
}

export async function updateCustomer(id: string, customer: Partial<CustomerType>): Promise<CustomerType> {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customer),
  });
  if (!response.ok) {
    throw new Error('Failed to update customer');
  }
  return response.json();
}

export async function deleteCustomer(id: string) {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete customer');
  }
  return response.json();
}

// SMS Log operations
export async function getSMSLogs() {
  const response = await fetch(`${API_BASE_URL}/sms-logs`);
  if (!response.ok) {
    throw new Error('Failed to fetch SMS logs');
  }
  return response.json();
}

export async function createSMSLog(data: any) {
  const response = await fetch(`${API_BASE_URL}/sms-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create SMS log');
  }
  return response.json();
}

// Admin Settings operations
export async function getAdminSettings() {
  const response = await fetch(`${API_BASE_URL}/admin-settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch admin settings');
  }
  return response.json();
}

export async function getAdminSetting(key: string) {
  const response = await fetch(`${API_BASE_URL}/admin-settings/${key}`);
  if (!response.ok) {
    throw new Error('Failed to fetch admin setting');
  }
  return response.json();
}

export async function updateAdminSetting(key: string, value: any) {
  const response = await fetch(`${API_BASE_URL}/admin-settings/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    throw new Error('Failed to update admin setting');
  }
  return response.json();
}

// Service Package operations
export async function getServicePackages(): Promise<ServicePackageType[]> {
  const response = await fetch(`${API_BASE_URL}/service-packages`);
  if (!response.ok) {
    throw new Error('Failed to fetch service packages');
  }
  return response.json();
}

export async function getServicePackage(id: string): Promise<ServicePackageType> {
  const response = await fetch(`${API_BASE_URL}/service-packages/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch service package');
  }
  return response.json();
}

export async function createServicePackage(data: Partial<ServicePackageType>): Promise<ServicePackageType> {
  console.log('here1');
  const response = await fetch(`${API_BASE_URL}/service-packages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create service package' }));
    throw new Error(errorData.message || 'Failed to create service package');
  }
  return response.json();
}

export async function updateServicePackage(id: string, data: Partial<ServicePackageType>): Promise<ServicePackageType> {
  const response = await fetch(`${API_BASE_URL}/service-packages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update service package' }));
    const errorMessage = errorData.error || errorData.message || errorData.details || 'Failed to update service package';
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function deleteServicePackage(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/service-packages/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete service package' }));
    throw new Error(errorData.message || 'Failed to delete service package');
  }
}

// Driver Document operations
export async function getDriverDocuments(driverId: string): Promise<DriverDocumentType[]> {
  const response = await fetch(`${API_BASE_URL}/driver-documents?driverId=${driverId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch driver documents');
  }
  return response.json();
}

export async function createDriverDocument(data: Partial<DriverDocumentType>): Promise<DriverDocumentType> {
  const response = await fetch(`${API_BASE_URL}/driver-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create driver document');
  }
  return response.json();
}

export async function updateDriverDocument(id: string, data: Partial<DriverDocumentType>): Promise<DriverDocumentType> {
  const response = await fetch(`${API_BASE_URL}/driver-documents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update driver document');
  }
  return response.json();
}

// Driver Rating operations
export async function getDriverRatings(driverId: string): Promise<DriverRatingType[]> {
  const response = await fetch(`${API_BASE_URL}/driver-ratings?driverId=${driverId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch driver ratings');
  }
  return response.json();
}

export async function createDriverRating(data: Partial<DriverRatingType>): Promise<DriverRatingType> {
  const response = await fetch(`${API_BASE_URL}/driver-ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create driver rating');
  }
  return response.json();
}

// Booking Status History operations
export async function getBookingStatusHistory(bookingId: string) {
  const response = await fetch(`${API_BASE_URL}/booking-status-history?bookingId=${bookingId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch booking status history');
  }
  return response.json();
}

export async function createBookingStatusHistory(data: BookingStatusHistoryDataType): Promise<any> { // Used placeholder type
  const response = await fetch(`${API_BASE_URL}/booking-status-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create booking status history' }));
    throw new Error(errorData.message || 'Failed to create booking status history');
  }
  return response.json();
} 