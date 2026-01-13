import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const FixCustomerInfoButton: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fixCustomerInfo = async () => {
    if (!token) {
      toast.error('You must be logged in as an admin to perform this action');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/fix-booking-customer-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      toast.success(`Fixed ${data.updatedCount} bookings, ${data.errorCount} errors`);
    } catch (error) {
      console.error('Error fixing customer information:', error);
      toast.error('Failed to fix customer information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Database Maintenance</h3>
      <div className="flex flex-col space-y-4">
        <div>
          <p className="mb-2 text-sm text-gray-600">
            This tool will fix missing customer information in booking entries.
            It will update all bookings that are missing name or email information.
          </p>
          <button
            onClick={fixCustomerInfo}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {loading ? 'Processing...' : 'Fix Customer Information'}
          </button>
        </div>

        {results && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Results:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p>Total Updated: {results.updatedCount}</p>
              <p>Errors: {results.errorCount}</p>
              {results.updatedCount > 0 && (
                <p className="text-green-600 mt-2">✅ Customer information has been fixed</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixCustomerInfoButton; 