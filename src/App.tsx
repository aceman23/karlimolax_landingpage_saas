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

// Pages - Lazy load for code splitting
import { lazy, Suspense } from 'react';
import HomePage from './pages/HomePage'; // Keep HomePage non-lazy for initial load
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CustomerInfoPage = lazy(() => import('./pages/CustomerInfoPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const TestEmail = lazy(() => import('./pages/auth/TestEmail'));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'));

// Admin Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminDrivers = lazy(() => import('./pages/admin/AdminDrivers'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AddDriverPage = lazy(() => import('./pages/admin/AddDriver'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfile'));
const AdminVehicles = lazy(() => import('./pages/admin/AdminVehicles'));
const DriverDetails = lazy(() => import('./pages/admin/DriverDetails'));
const AdminServicePackages = lazy(() => import('./pages/admin/AdminServicePackages'));
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing'));

// Driver Pages
const DriverLayout = lazy(() => import('./components/driver/DriverLayout'));
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverRides = lazy(() => import('./pages/driver/DriverRides'));
const DriverProfile = lazy(() => import('./pages/driver/DriverProfile'));
const DriverBookings = lazy(() => import('./pages/driver/DriverBookings'));
const EditDriverProfilePage = lazy(() => import('./pages/driver/EditDriverProfilePage'));

// Customer Pages
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage'));
const BookingDetailsPage = lazy(() => import('./pages/customer/BookingDetailsPage'));
const EditProfilePage = lazy(() => import('./pages/customer/EditProfilePage'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
  </div>
);

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
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminLayout />
                    </Suspense>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
                <Route path="bookings" element={<Suspense fallback={<LoadingFallback />}><AdminBookings /></Suspense>} />
                <Route path="drivers" element={<Suspense fallback={<LoadingFallback />}><AdminDrivers /></Suspense>} />
                <Route path="drivers/:id" element={<Suspense fallback={<LoadingFallback />}><DriverDetails /></Suspense>} />
                <Route path="users" element={<Suspense fallback={<LoadingFallback />}><AdminUsers /></Suspense>} />
                <Route path="add-driver" element={<Suspense fallback={<LoadingFallback />}><AddDriverPage /></Suspense>} />
                <Route path="vehicles" element={<Suspense fallback={<LoadingFallback />}><AdminVehicles /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<LoadingFallback />}><AdminServicePackages /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><AdminProfilePage /></Suspense>} />
                <Route path="pricing" element={<Suspense fallback={<LoadingFallback />}><AdminPricing /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense>} />
              </Route>

              {/* Driver Routes */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute requiredRole="driver">
                    <Suspense fallback={<LoadingFallback />}>
                      <DriverLayout />
                    </Suspense>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<LoadingFallback />}><DriverDashboard /></Suspense>} />
                <Route path="rides" element={<Suspense fallback={<LoadingFallback />}><DriverRides /></Suspense>} />
                <Route path="bookings" element={<Suspense fallback={<LoadingFallback />}><DriverBookings /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><DriverProfile /></Suspense>} />
                <Route path="edit-profile" element={<Suspense fallback={<LoadingFallback />}><EditDriverProfilePage /></Suspense>} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>} />
              <Route path="/forgot-password" element={<Suspense fallback={<LoadingFallback />}><ForgotPasswordPage /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense>} />
              <Route path="/test-email" element={<Suspense fallback={<LoadingFallback />}><TestEmail /></Suspense>} />
              <Route path="/verify-email" element={<Suspense fallback={<LoadingFallback />}><EmailVerificationPage /></Suspense>} />
              <Route path="/verify-email/:token" element={<Suspense fallback={<LoadingFallback />}><EmailVerificationPage /></Suspense>} />
              
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
                    <Suspense fallback={<LoadingFallback />}>
                      <VehiclesPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/booking" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <BookingPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/customer-info" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <CustomerInfoPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/payment" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <PaymentPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/booking-success" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <BookingSuccess />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/confirmation" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <ConfirmationPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/about" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <AboutPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/contact" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <ContactPage />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/privacy" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <PrivacyPolicy />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/terms" element={
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <Suspense fallback={<LoadingFallback />}>
                      <TermsOfService />
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <CustomerProfilePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/edit-profile" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <EditProfilePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/booking-details/:id" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                      <Suspense fallback={<LoadingFallback />}>
                        <BookingDetailsPage />
                      </Suspense>
                    </main>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
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