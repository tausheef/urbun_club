import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import DocketForm from './pages/DocketForm';
import HomePages from './pages/HomePages';
import TotalBooking from './pages/TotalBooking';
import EwayBill from './pages/EwayBill';
import MisReports from './pages/MisReports';
import UpdateDocket from './pages/UpdateDocket';
import ViewDocket from './pages/ViewDocket';
import HtmlToPdf from './pages/HtmltoPdf';
import UpdateActivity from './pages/UpdateActivity';
import ExpiredEwayBills from './pages/ExpiredEwayBills';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

// ✅ Cancellation Pages
import CancelDocket from './pages/CancelDocket';
import CancelledDockets from './pages/CancelledDockets';

// ✅ NEW: Module Pages (Delivery Status)
import Delivered from './modules/Delivered';
import Undelivered from './modules/Undelivered';
import Pending from './modules/Pending';
import RTO from './modules/Rto';
import ProofOfDelivery from './modules/ProofOfDelivery';
import CoLoaderEntry from './coloader/CoLoaderEntry';
import CoLoaderBookings from './coloader/CoLoaderBookings';
import CoLoaderDetails from './coloader/CoLoaderDetails';
import CoLoaderModify from './coloader/CoLoaderModify';

// Layout wrapper component
function LayoutWithSidebar({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* ========== PROTECTED ROUTES (ALL USERS) ========== */}
          
          {/* Homepage */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <HomePages />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Docket Entry */}
          <Route
            path="/docketentry"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <DocketForm />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Total Booking */}
          <Route
            path="/totalbooking"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <TotalBooking />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* E-way Bill */}
          <Route
            path="/ewaybill"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <EwayBill />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* MIS Reports */}
          <Route
            path="/misreports"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <MisReports />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Update Activity */}
          <Route
            path="/update-activity/:id"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <UpdateActivity />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Expired E-way Bills */}
          <Route
            path="/expired-ewaybills"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <ExpiredEwayBills />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: Delivered Dockets */}
          <Route
            path="/delivered"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <Delivered />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: Undelivered Dockets */}
          <Route
            path="/undelivered"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <Undelivered />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: Pending Dockets */}
          <Route
            path="/pending"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <Pending />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: RTO (Return to Origin) Dockets */}
          <Route
            path="/rto"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <RTO />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ Proof of Delivery */}
          <Route
            path="/proofofdelivery"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <ProofOfDelivery/>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ Co-Loader Entry - Create new co-loader */}
          <Route
            path="/coloader-entry"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <CoLoaderEntry/>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ Co-Loader Bookings - View all co-loaders */}
          <Route
            path="/coloader-bookings"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <CoLoaderBookings/>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ Co-Loader Details - View single co-loader */}
          <Route
            path="/coloader-details/:id"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <CoLoaderDetails/>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ FIXED: Co-Loader Modify - Edit co-loader (with :id parameter) */}
          <Route
            path="/coloader-modify/:id"
            element={
              <ProtectedRoute adminOnly={true}>
                <LayoutWithSidebar>
                  <CoLoaderModify/>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* View Docket (Read-only for all users) */}
          <Route
            path="/view-docket/:id"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <ViewDocket />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ========== ADMIN ONLY ROUTES ========== */}
          
          {/* Update Docket - Search Mode (Admin only) */}
          <Route
            path="/update-docket"
            element={
              <ProtectedRoute adminOnly={true}>
                <LayoutWithSidebar>
                  <UpdateDocket />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Update Docket - Edit Mode (Admin only) */}
          <Route
            path="/update-docket/:id"
            element={
              <ProtectedRoute adminOnly={true}>
                <LayoutWithSidebar>
                  <UpdateDocket />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: Cancel Docket (Admin only) */}
          <Route
            path="/cancel-docket"
            element={
              <ProtectedRoute adminOnly={true}>
                <LayoutWithSidebar>
                  <CancelDocket />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* ✅ NEW: View Cancelled Dockets (Admin only) */}
          <Route
            path="/cancelled-dockets"
            element={
              <ProtectedRoute adminOnly={true}>
                <LayoutWithSidebar>
                  <CancelledDockets />
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* HTML to PDF (No sidebar) */}
          <Route
            path="/html-to-pdf/:id"
            element={
              <ProtectedRoute>
                <HtmlToPdf />
              </ProtectedRoute>
            }
          />

          {/* Docket Upload */}
          <Route
            path="/docket/docket-upload"
            element={
              <ProtectedRoute>
                <LayoutWithSidebar>
                  <div className="p-6">
                    <h1>Docket Upload</h1>
                  </div>
                </LayoutWithSidebar>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home if logged in, login if not */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}