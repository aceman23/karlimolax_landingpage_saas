import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface DatabaseUtilsProps {
  onSuccess?: () => void;
}

export default function DatabaseUtils({ onSuccess }: DatabaseUtilsProps) {
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [healthResult, setHealthResult] = useState<any>(null);

  const checkDatabaseHealth = async () => {
    if (healthLoading) return;
    
    try {
      setHealthLoading(true);
      toast.loading('Checking database health...', { id: 'health-check' });
      
      const response = await fetch('/api/health/database');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Health check failed');
      }
      
      const result = await response.json();
      setHealthResult(result);
      
      const hasErrors = result.errors && result.errors.length > 0;
      const isConnected = result.connectionStatus === 'connected';
      
      if (isConnected && !hasErrors) {
        toast.success('Database health check passed!', { id: 'health-check', duration: 3000 });
      } else {
        toast.error(`Database issues detected: ${result.errors.join(', ')}`, { 
          id: 'health-check',
          duration: 5000 
        });
      }
      
    } catch (error) {
      console.error('Error checking database health:', error);
      toast.error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'health-check' 
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const bootstrapEssentialData = async () => {
    if (bootstrapLoading) return;
    
    try {
      setBootstrapLoading(true);
      toast.loading('Bootstrapping essential data...', { id: 'bootstrap' });
      
      const response = await fetch('/api/bootstrap/essential-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Bootstrap failed');
      }
      
      const result = await response.json();
      setLastResult(result);
      
      const { vehicles, servicePackages } = result.result;
      const totalCreated = vehicles.created + servicePackages.created;
      const totalExisting = vehicles.existing + servicePackages.existing;
      
      if (totalCreated > 0) {
        toast.success(`Bootstrap completed! Created ${vehicles.created} vehicles and ${servicePackages.created} service packages`, { 
          id: 'bootstrap',
          duration: 5000 
        });
      } else if (totalExisting > 0) {
        toast.success(`Data already exists: ${vehicles.existing} vehicles, ${servicePackages.existing} service packages`, { 
          id: 'bootstrap',
          duration: 3000 
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error bootstrapping data:', error);
      toast.error(`Bootstrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'bootstrap' 
      });
    } finally {
      setBootstrapLoading(false);
    }
  };

  const initializeServicePackages = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      toast.loading('Initializing service packages...', { id: 'init-packages' });
      
      const response = await fetch('/api/service-packages/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to initialize');
      }
      
      const result = await response.json();
      setLastResult(result);
      
      toast.success(`Service packages initialized! Created: ${result.result.created}, Updated: ${result.result.updated}, Total: ${result.result.total}`, { 
        id: 'init-packages',
        duration: 5000 
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error initializing service packages:', error);
      toast.error(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'init-packages' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-6 w-6 text-cyan-600" />
        <h2 className="text-xl font-semibold text-gray-900">Database Utilities</h2>
      </div>
      
      <div className="space-y-4">
        {/* Health Check Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">Database Health Check</h3>
              <p className="text-sm text-gray-500">
                Check database connection, models, and collections status
              </p>
            </div>
            <button
              onClick={checkDatabaseHealth}
              disabled={healthLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                healthLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Activity className={`h-4 w-4 ${healthLoading ? 'animate-pulse' : ''}`} />
              {healthLoading ? 'Checking...' : 'Check Health'}
            </button>
          </div>
          
          {healthResult && (
            <div className={`mt-3 p-3 border rounded-lg ${
              healthResult.connectionStatus === 'connected' && healthResult.errors.length === 0
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-sm space-y-1">
                <div><strong>Connection:</strong> {healthResult.connectionStatus}</div>
                <div><strong>Environment:</strong> {healthResult.environment}</div>
                <div><strong>Collections:</strong> 
                  {healthResult.collections?.vehicles ? ` Vehicles: ${healthResult.collections.vehicles.count}` : ' Vehicles: N/A'}
                  {healthResult.collections?.servicePackages ? `, Packages: ${healthResult.collections.servicePackages.count}` : ', Packages: N/A'}
                </div>
                {healthResult.errors.length > 0 && (
                  <div className="text-red-700"><strong>Errors:</strong> {healthResult.errors.join(', ')}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bootstrap Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">Bootstrap Essential Data</h3>
              <p className="text-sm text-gray-500">
                Create default vehicles and service packages if missing
              </p>
            </div>
            <button
              onClick={bootstrapEssentialData}
              disabled={bootstrapLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bootstrapLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Zap className={`h-4 w-4 ${bootstrapLoading ? 'animate-spin' : ''}`} />
              {bootstrapLoading ? 'Bootstrapping...' : 'Bootstrap'}
            </button>
          </div>
        </div>

        {/* Service Package Initialization */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">Service Packages Initialization</h3>
              <p className="text-sm text-gray-500">
                Initialize default service packages or fix schema issues
              </p>
            </div>
            <button
              onClick={initializeServicePackages}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Initializing...' : 'Initialize'}
            </button>
          </div>
          
          {lastResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Last Operation Result</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                {lastResult.result?.vehicles && (
                  <>
                    <div>• Vehicles Created: {lastResult.result.vehicles.created}</div>
                    <div>• Vehicles Existing: {lastResult.result.vehicles.existing}</div>
                  </>
                )}
                {lastResult.result?.servicePackages && (
                  <>
                    <div>• Packages Created: {lastResult.result.servicePackages?.created || lastResult.result.created || 0}</div>
                    <div>• Packages Updated: {lastResult.result.servicePackages?.existing || lastResult.result.updated || 0}</div>
                    <div>• Total Packages: {lastResult.result.servicePackages?.existing + lastResult.result.servicePackages?.created || lastResult.result.total || 0}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Production Database Fix</p>
              <p>
                If you're seeing "500 Internal Server Error" when loading data:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>First, run "Check Health" to diagnose the issue</li>
                <li>If collections are missing, click "Bootstrap" to create essential data</li>
                <li>If only service packages are missing, use "Initialize"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 