import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import GooglePlacesAutocomplete from '../../components/common/GooglePlacesAutocomplete';
import GooglePlacesAutocomplete2 from '../../components/common/GooglePlacesAutocomplete2';

export default function EditBookingModal({ booking, onSave, onClose }: { booking: any, onSave: (updated: any) => void, onClose: () => void }) {
  const [form, setForm] = useState({
    pickupLocation: booking.pickupLocation || '',
    dropoffLocation: booking.dropoffLocation || '',
    pickupDate: '',
    pickupTime: '',
    status: booking.status || '',
    price: booking.price || '',
    notes: booking.notes || '',
    airportCode: booking.airportCode || '',
    passengers: booking.passengers || '',
  });
  const [saving, setSaving] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Extract date and time from ISO string on component mount
  useEffect(() => {
    if (booking.pickupTime) {
      try {
        const dateObj = new Date(booking.pickupTime);
        if (!isNaN(dateObj.getTime())) {
          // Format date as YYYY-MM-DD for the date input
          const formattedDate = dateObj.toISOString().split('T')[0];
          // Format time as HH:MM for the time input
          const formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          setForm(prev => ({
            ...prev,
            pickupDate: formattedDate,
            pickupTime: formattedTime
          }));
        }
      } catch (err) {
        console.error('Error parsing booking date:', err);
      }
    }
  }, [booking]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for price validation
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setPriceError('Price must be a positive number');
      } else {
        setPriceError('');
      }
    }
    
    setForm({ ...form, [name]: value });
  };

  // Handle address field changes
  const handleAddressChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('form', form);
    
    // Validate price before submission
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setPriceError('Price must be a positive number');
      return;
    }
    
    setSaving(true);
    
    // Combine date and time back into ISO format
    try {
      const { pickupDate, pickupTime, ...otherFormData } = form;
      
      // Create a combined ISO datetime
      const combinedDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const pickupTimeISO = combinedDateTime.toISOString();
      
      // Ensure passengers is numeric if provided
      const formattedData = {
        ...otherFormData,
        pickupTime: pickupTimeISO
      };
      
      if (formattedData.passengers) {
        formattedData.passengers = Number(formattedData.passengers);
      }
      
      // Send the updated data with ISO format pickupTime
      await onSave(formattedData);
    } catch (err) {
      console.error('Error saving booking:', err);
      alert('There was a problem saving the booking. Please check the date and time format.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
        <h2 className="text-2xl font-bold mb-4">Edit Booking</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Price ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input 
                name="price" 
                type="number" 
                step="0.01"
                min="0"
                value={form.price} 
                onChange={handleChange} 
                className={`w-full border rounded p-2 pl-7 ${priceError ? 'border-red-500' : ''}`}
                required 
              />
            </div>
            {priceError && <p className="text-red-500 text-sm mt-1">{priceError}</p>}
          </div>
          <GooglePlacesAutocomplete
            label="Pickup Location"
            name="pickupLocation"
            value={form.pickupLocation}
            onChange={(value) => handleAddressChange('pickupLocation', value)}
            required
            placeholder="Enter pickup address"
          />
          
          <GooglePlacesAutocomplete
            label="Dropoff Location"
            name="dropoffLocation"
            value={form.dropoffLocation}
            onChange={(value) => handleAddressChange('dropoffLocation', value)}
            required
            placeholder="Enter dropoff address"
          />
          
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Pickup Date</label>
              <input type="date" name="pickupDate" value={form.pickupDate} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Pickup Time</label>
              <input type="time" name="pickupTime" value={form.pickupTime} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded p-2">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Passengers</label>
            <input name="passengers" type="number" min="1" value={form.passengers} onChange={handleChange} className="w-full border rounded p-2" placeholder="Number of passengers" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded p-2" rows={2} />
          </div>
          
          {/* Display airport code field if it's a Airport Special package */}
          {booking.packageId === 'lax-special' && (
            <div>
              <label className="block font-semibold mb-1">Airport</label>
              <select 
                name="airportCode" 
                value={form.airportCode} 
                onChange={handleChange} 
                className="w-full border rounded p-2"
              >
                <option value="">Select Airport</option>
                <option value="LAX">LAX - Los Angeles International</option>
                <option value="SNA">SNA - John Wayne/Orange County</option>
                <option value="LGB">LGB - Long Beach</option>
                <option value="ONT">ONT - Ontario</option>
              </select>
            </div>
          )}
          <div className="mt-6 text-right">
            <Button variant="outline" onClick={onClose} type="button" className="mr-2">Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 