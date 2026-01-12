import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Car, FileText, Settings, Home, UserCog, Package, User, DollarSign, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarOpen = () => setSidebarOpen(true);

  return (
    <div className="flex min-h-screen">
      {/* Mobile Hamburger Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-gray-900 text-white p-2 rounded-md shadow-lg focus:outline-none"
        onClick={handleSidebarOpen}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col p-6 space-y-4 transform transition-transform duration-200
          md:static md:translate-x-0 md:flex md:w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between mb-8 md:hidden">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <button onClick={handleSidebarClose} aria-label="Close sidebar">
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Title for desktop */}
        <h2 className="text-2xl font-bold mb-8 hidden md:block">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          <Link to="/admin" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
          <Link to="/admin/bookings" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Calendar className="w-5 h-5" /> Bookings</Link>
          <Link to="/admin/drivers" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><UserCog className="w-5 h-5" /> Drivers</Link>
          <Link to="/admin/vehicles" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Car className="w-5 h-5" /> Vehicles</Link>
          <Link to="/admin/services" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Package className="w-5 h-5" /> Services</Link>
          <Link to="/admin/users" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Users className="w-5 h-5" /> Users</Link>
          <Link to="/admin/pricing" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><DollarSign className="w-5 h-5" /> Pricing</Link>
          <Link to="/admin/settings" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Settings className="w-5 h-5" /> Settings</Link>
          <Link to="/admin/profile" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><User className="w-5 h-5" /> My Profile</Link>
          <Link to="/" className="hover:text-cyan-400 flex items-center gap-2" onClick={handleSidebarClose}><Home className="w-5 h-5" /> Main Website</Link>
        </nav>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden"
          onClick={handleSidebarClose}
          aria-label="Sidebar overlay"
        />
      )}
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}