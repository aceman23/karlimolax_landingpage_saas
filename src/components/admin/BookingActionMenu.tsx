import { useState } from 'react';
import { MoreVertical, Send, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { updateBookingAssignments, updateBooking } from '../../services/booking';
import { sendSMS } from '../../services/sms';
import toast from 'react-hot-toast';

interface BookingActionMenuProps {
  booking: any;
  drivers: any[];
  vehicles: any[];
  onBookingUpdated: () => void;
}

export default function BookingActionMenu({ booking, drivers, vehicles, onBookingUpdated }: BookingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAssignmentsMenu, setShowAssignmentsMenu] = useState(false);
  const [showSendSmsModal, setShowSendSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState(booking.driverId?._id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState(booking.vehicleId?._id || '');
  const [processing, setProcessing] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setShowAssignmentsMenu(false);
    }
  };

  const openAssignmentsMenu = () => {
    setSelectedDriverId(booking.driverId?._id || '');
    setSelectedVehicleId(booking.vehicleId?._id || '');
    setShowAssignmentsMenu(true);
    setShowSendSmsModal(false);
  };

  const handleUpdateAssignments = async () => {
    if (!selectedDriverId && !selectedVehicleId) {
      toast.error('Please select at least one assignment to update');
      return;
    }
    
    try {
      setProcessing(true);
      
      const updates: { driverId?: string; vehicleId?: string } = {};
      if (selectedDriverId) updates.driverId = selectedDriverId;
      if (selectedVehicleId) updates.vehicleId = selectedVehicleId;
      
      const result = await updateBookingAssignments(booking._id, updates);
      
      if (result.success) {
        toast.success('Assignments updated successfully');
        setShowAssignmentsMenu(false);
        setIsOpen(false);
        onBookingUpdated();
      } else {
        toast.error(result.error || 'Failed to update assignments');
      }
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast.error('An error occurred while updating assignments');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    
    if (!booking.customerId?.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const customerPhoneNumber = booking.customerId.phone;
    
    try {
      setProcessing(true);
      
      const result = await sendSMS({
        to: customerPhoneNumber,
        message: `DapperLimoLax: ${smsMessage}`,
        type: 'booking_update'
      });
      
      if (result.success) {
        toast.success('SMS sent successfully');
        setSmsMessage('');
        setShowSendSmsModal(false);
        setIsOpen(false);
      } else {
        toast.error(String(result.error) || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error(error.message || 'An error occurred while sending SMS');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      setProcessing(true);
      
      const result = await updateBooking(
        booking._id,
        { status: newStatus } as any 
      );
      
      if (result && !result.error) {
        toast.success(`Booking status updated to ${newStatus}`);
        setIsOpen(false);
        onBookingUpdated();
      } else {
        toast.error(String(result?.error) || 'Failed to update booking status');
      }
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error(error.message || 'An error occurred while updating status');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="p-1 rounded-full hover:bg-gray-100"
        aria-label="Booking actions"
      >
        <MoreVertical className="h-5 w-5 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={openAssignmentsMenu}
          >
            <User className="h-4 w-4 mr-2 text-gray-500" />
            Change Assignments
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => {
              setShowSendSmsModal(true);
              setShowAssignmentsMenu(false);
            }}
          >
            <Send className="h-4 w-4 mr-2 text-gray-500" />
            Send SMS
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleStatusChange('confirmed')}
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Mark Confirmed
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleStatusChange('in_progress')}
          >
            <Clock className="h-4 w-4 mr-2 text-cyan-500" />
            Mark In Progress
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleStatusChange('completed')}
          >
            <CheckCircle className="h-4 w-4 mr-2 text-cyan-500" />
            Mark Completed
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
            onClick={() => handleStatusChange('cancelled')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Booking
          </button>
        </div>
      )}
      
      {showAssignmentsMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Update Assignments</h3>
          
          {/* Driver Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              <option value="">{booking.driverId ? 'Change driver...' : 'Select a driver'}</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName || driver.first_name} {driver.lastName || driver.last_name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Vehicle Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">{booking.vehicleId ? 'Change vehicle...' : 'Select a vehicle'}</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.make} {vehicle.model} ({vehicle.capacity} seats)
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end">
            <button
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 mr-2"
              onClick={() => setShowAssignmentsMenu(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
              onClick={handleUpdateAssignments}
              disabled={processing || (!selectedDriverId && !selectedVehicleId)}
            >
              {processing ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      )}
      
      {showSendSmsModal && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Send SMS to Customer</h3>
          <textarea
            className="w-full p-2 border border-gray-300 rounded mb-4 h-32"
            placeholder="Enter your message to the customer..."
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
          ></textarea>
          
          <div className="flex justify-end">
            <button
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 mr-2"
              onClick={() => setShowSendSmsModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
              onClick={handleSendSms}
              disabled={processing || !smsMessage.trim()}
            >
              {processing ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}