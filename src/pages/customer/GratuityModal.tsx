import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';

interface Booking {
  id: string;
  _id?: string;
  price: number;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

interface GratuityModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdate: (gratuityData: any) => void;
}

export default function GratuityModal({ booking, onClose, onUpdate }: GratuityModalProps) {
  const [gratuityType, setGratuityType] = useState<'none' | 'percentage' | 'custom' | 'cash'>(
    booking.gratuity?.type || 'none'
  );
  const [percentage, setPercentage] = useState<number>(booking.gratuity?.percentage || 15);
  const [customAmount, setCustomAmount] = useState<string>(
    booking.gratuity?.customAmount?.toString() || ''
  );
  const [gratuityAmount, setGratuityAmount] = useState<number>(booking.gratuity?.amount || 0);

  // Calculate gratuity amount when type or values change
  useEffect(() => {
    let amount = 0;
    
    if (gratuityType === 'percentage') {
      amount = (booking.price * percentage) / 100;
    } else if (gratuityType === 'custom') {
      amount = parseFloat(customAmount) || 0;
    } else if (gratuityType === 'cash') {
      amount = parseFloat(customAmount) || 0;
    }
    
    setGratuityAmount(amount);
  }, [gratuityType, percentage, customAmount, booking.price]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gratuityData = {
      type: gratuityType,
      amount: gratuityAmount,
      ...(gratuityType === 'percentage' && { percentage }),
      ...(gratuityType === 'custom' && { customAmount: parseFloat(customAmount) || 0 }),
      ...(gratuityType === 'cash' && { customAmount: parseFloat(customAmount) || 0 })
    };
    
    onUpdate(gratuityData);
  };

  const totalAmount = booking.price + gratuityAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-4">Add Gratuity</h2>
        <p className="text-gray-600 mb-6">Show your appreciation for excellent service</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gratuity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gratuity Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGratuityType('none')}
                className={`p-3 text-sm font-medium rounded-lg border ${
                  gratuityType === 'none'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                No Gratuity
              </button>
              <button
                type="button"
                onClick={() => setGratuityType('percentage')}
                className={`p-3 text-sm font-medium rounded-lg border ${
                  gratuityType === 'percentage'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setGratuityType('custom')}
                className={`p-3 text-sm font-medium rounded-lg border ${
                  gratuityType === 'custom'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Custom Amount
              </button>
              <button
                type="button"
                onClick={() => setGratuityType('cash')}
                className={`p-3 text-sm font-medium rounded-lg border ${
                  gratuityType === 'cash'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Percentage Selection */}
          {gratuityType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 18, 20, 25, 30].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setPercentage(percent)}
                    className={`p-2 text-sm font-medium rounded border ${
                      percentage === percent
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount Input */}
          {(gratuityType === 'custom' || gratuityType === 'cash') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {gratuityType === 'custom' ? 'Custom Amount' : 'Cash Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price:</span>
                <span>${booking.price.toFixed(2)}</span>
              </div>
              {gratuityType !== 'none' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gratuity:</span>
                  <span>${gratuityAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={gratuityType === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)}
            >
              {booking.gratuity && booking.gratuity.type !== 'none' ? 'Update Gratuity' : 'Add Gratuity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
