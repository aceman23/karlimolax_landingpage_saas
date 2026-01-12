import { Vehicle } from '../types';
import planeImage from '../plane.png';
import disneyImage from '../disneyland.png';
import weddingImage from '../weddings.png';

export const vehicles: Vehicle[] = [
  {
    id: 'mercedes-sprinter',
    name: 'Mercedes Sprinter Limo Van',
    description: 'Luxury Mercedes Sprinter perfect for airport transfers and group transportation.',
    capacity: 12,
    pricePerHour: 120,
    pricePerMile: 3.5,
    imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
    features: ['Leather seating', 'Premium sound system', 'WiFi', 'Bottled water', 'Climate control']
  },
  {
    id: 'sprinter-executive',
    name: 'Executive Sprinter Limo',
    description: 'Business class Mercedes Sprinter with executive amenities for corporate travel.',
    capacity: 10,
    pricePerHour: 150,
    pricePerMile: 4,
    imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
    features: ['Business workstations', 'Power outlets', 'WiFi', 'Premium leather', 'Privacy partition']
  }
];

// Service Packages
export const servicePackages = [
  {
    id: 'lax-special',
    name: 'Airport Special',
    description: 'Luxury transfer to and from LAX and greater Los Angeles airports (SNA, LGB, ONT).',
    base_price: 250,
    duration: 120, // 2 hours in minutes
    vehicle_id: 'mercedes-sprinter',
    image_url: planeImage,
    is_active: true,
    airports: ['LAX', 'SNA', 'LGB', 'ONT']
  },
  {
    id: 'disneyland',
    name: 'Disneyland Park & Hotel / Airports',
    description: 'Direct service to Disneyland Park, hotels, and airports.',
    base_price: 250,
    duration: 120, // 2 hours in minutes
    vehicle_id: 'mercedes-sprinter',
    image_url: disneyImage,
    is_active: true,
    airports: []
  },
  {
    id: 'special-events',
    name: 'Special Events',
    description: 'Perfect for weddings, proms, and other special occasions.',
    base_price: 520, // 4 hours * $130
    duration: 240, // 4 hours in minutes
    vehicle_id: 'mercedes-sprinter',
    image_url: weddingImage,
    is_active: true,
    airports: []
  }
];