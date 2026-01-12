import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import CookieConsent from './components/common/CookieConsent';

// Pages
import HomePage from './pages/HomePage';
import VehiclesPage from './pages/VehiclesPage';
import BookingPage from './pages/BookingPage';
import CustomerInfoPage from './pages/CustomerInfoPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import BookingSuccess from './pages/BookingSuccess';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TestEmail from './pages/auth/TestEmail';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';
import AddDriverPage from './pages/admin/AddDriver';
import AdminProfilePage from './pages/admin/AdminProfile';
import AdminVehicles from './pages/admin/AdminVehicles';
import DriverDetails from './pages/admin/DriverDetails';
import AdminServicePackages from './pages/admin/AdminServicePackages';
import AdminPricing from './pages/admin/AdminPricing';

// Driver Pages
import DriverLayout from './components/driver/DriverLayout';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRides from './pages/driver/DriverRides';
import DriverProfile from './pages/driver/DriverProfile';
import DriverBookings from './pages/driver/DriverBookings';
import EditDriverProfilePage from './pages/driver/EditDriverProfilePage';

// Customer Pages
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import BookingDetailsPage from './pages/customer/BookingDetailsPage';
import EditProfilePage from './pages/customer/EditProfilePage';

// New import for EmailVerificationPage
import EmailVerificationPage from './pages/auth/EmailVerificationPage';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <BookingProvider>
            <Helmet>
              <html lang="en" />
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Helmet>
            <ScrollToTop />
            
            <Routes>
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="drivers" element={<AdminDrivers />} />
                <Route path="drivers/:id" element={<DriverDetails />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="add-driver" element={<AddDriverPage />} />
                <Route path="vehicles" element={<AdminVehicles />} />
                <Route path="services" element={<AdminServicePackages />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="pricing" element={<AdminPricing />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Driver Routes */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute requiredRole="driver">
                    <DriverLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DriverDashboard />} />
                <Route path="rides" element={<DriverRides />} />
                <Route path="bookings" element={<DriverBookings />} />
                <Route path="profile" element={<DriverProfile />} />
                <Route path="edit-profile" element={<EditDriverProfilePage />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/test-email" element={<TestEmail />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
              
              {/* Public Routes */}
              <Route path="/" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <HomePage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/vehicles" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <VehiclesPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/booking" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <BookingPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/customer-info" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <CustomerInfoPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/payment" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <PaymentPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/booking-success" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <BookingSuccess />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/confirmation" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <ConfirmationPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/about" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <AboutPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/contact" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <ContactPage />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/privacy" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <PrivacyPolicy />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/terms" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <TermsOfService />
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <CustomerProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/edit-profile" element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/booking-details/:id" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                      <BookingDetailsPage />
                    </main>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <CookieConsent />
            <Toaster position="top-center" />
          </BookingProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;