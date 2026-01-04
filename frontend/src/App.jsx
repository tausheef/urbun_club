import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DocketForm from './pages/DocketForm';
import HomePages from './pages/HomePages';
import TotalBooking from './pages/TotalBooking';
import EwayBill from './pages/EwayBill';
import MisReports from './pages/MisReports';
import UpdateDocket from './pages/UpdateDocket';
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
      <Routes>
        {/* All routes wrapped with Sidebar */}
        <Route
          path="/"
          element={
            <LayoutWithSidebar>
              <HomePages />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/docketentry"
          element={
            <LayoutWithSidebar>
              <DocketForm />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/totalbooking"
          element={
            <LayoutWithSidebar>
              <TotalBooking />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/ewaybill"
          element={
            <LayoutWithSidebar>
              <EwayBill />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/misreports"
          element={
            <LayoutWithSidebar>
              <MisReports />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/updatedocket"
          element={
            <LayoutWithSidebar>
              <UpdateDocket />
            </LayoutWithSidebar>
          }
        />

        <Route
          path="/docket/docket-upload"
          element={
            <LayoutWithSidebar>
              <div className="p-6">
                <h1>Docket Upload</h1>
              </div>
            </LayoutWithSidebar>
          }
        />

        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}