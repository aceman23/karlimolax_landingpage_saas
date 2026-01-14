import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Car, 
  ChevronDown, 
  LogOut, 
  Menu, 
  User, 
  X,
  MapPin,
  Home,
  Bell,
  Settings,
  BarChart,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DriverLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === `/driver${path}` ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700';
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Car className="h-7 w-7 text-brand-500" />
            <span className="font-bold text-lg">Driver Panel</span>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/driver" end className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-gray-800 text-gray-200'}`}>
            <Car className="mr-3 h-5 w-5" /> Dashboard
          </NavLink>
          <NavLink to="/driver/rides" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-gray-800 text-gray-200'}`}>
            <MapPin className="mr-3 h-5 w-5" /> My Rides
          </NavLink>
          <NavLink to="/driver/profile" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-gray-800 text-gray-200'}`}>
            <User className="mr-3 h-5 w-5" /> Profile
          </NavLink>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="flex items-center bg-white shadow px-4 py-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <span className="ml-4 font-semibold text-lg">Driver Panel</span>
        </header>
        <header className="hidden md:flex items-center justify-between bg-white shadow px-6 py-3">
          <div className="flex items-center">
            <span className="font-semibold text-lg">Driver Panel</span>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            ← Back to Main
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 w-full overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}