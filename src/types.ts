export interface ServicePackage {
  id: string;
  _id?: string;  // Optional MongoDB _id field
  name: string;
  description: string;
  base_price: number;
  duration: number;
  vehicle_id: string;
  image_url: string;
  is_active: boolean;
  airports: string[];
  is_hourly?: boolean;
  minimum_hours?: number;
} 