import { Profile as ProfileType } from '../types'; // Removed CustomerInfo
import { toast } from 'react-hot-toast';

// Type for the actual Customer document from backend (simplified)
interface BackendCustomer {
  _id: string;
  profileId: string; // or ProfileType if populated
  companyName?: string;
  billingAddress?: string;
  // ... other customer specific fields from schema
}

// Define the expected response structure from GET /api/customers/by-profile/:profileId
export interface CustomerProfileResponse {
  profile: ProfileType; // Assuming ProfileType is defined in ../types and matches backend Profile schema (excluding password)
  customer: BackendCustomer | null; // Customer can be null
}

// Fetch customer details by their Profile ID
export async function getCustomerByProfileId(profileId: string, token: string): Promise<{ data: CustomerProfileResponse | null; error: any }> {
  try {
    const response = await fetch(`/api/customers/by-profile/${profileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch customer data (status ${response.status})` }));
      throw new Error(errorData.message || errorData.error || `Failed to fetch customer data (status ${response.status})`);
    }

    const data: CustomerProfileResponse = await response.json();
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching customer by profile ID:', error);
    toast.error(error.message || 'Could not fetch customer details.');
    return { data: null, error };
  }
}

// Placeholder for updating customer details if needed later
// export async function updateCustomer(customerId: string, updates: Partial<CustomerInfo>, token: string): Promise<{ data: CustomerInfo | null; error: any }> { 
//   // ... implementation ...
// } 