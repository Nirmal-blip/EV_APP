import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import AppPreview from './components/AppPreview';
import DashboardSection from './components/DashboardSection';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';
import AdminEVChargingFinder from './pages/admin/Admin_EVChargingFinder';
import EVChargingFinder from './pages/EVChargingFinder';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const LandingPage = () => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    if (currentUser.profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex flex-col w-full">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <AppPreview />
      <DashboardSection />
      <DownloadSection />
    </main>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen font-sans antialiased bg-slate-50 text-slate-900 selection:bg-primary/30">
          <Toaster position="top-right" />
          <Navbar />
          
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/deploy-charger" element={
                <ProtectedRoute>
                  <AdminEVChargingFinder />
                </ProtectedRoute>
              } />
              <Route path="/find-charger" element={
                <ProtectedRoute>
                  <EVChargingFinder />
                </ProtectedRoute>
              } />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute blockAdmin={true}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

