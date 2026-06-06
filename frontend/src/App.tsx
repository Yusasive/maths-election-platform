import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Toaster from './components/Toaster';
import { Footer } from './components/Footer';

import ElectionsListPage from './pages/ElectionsListPage';
import VoterLoginPage from './pages/VoterLoginPage';
import VotePage from './pages/VotePage';
import CongratulationsPage from './pages/CongratulationsPage';
import ResultsPage from './pages/ResultsPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import AdminPendingPage from './pages/admin/AdminPendingPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCreateElectionPage from './pages/admin/AdminCreateElectionPage';
import AdminElectionPage from './pages/admin/AdminElectionPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

import SuperAdminLayout from './pages/super-admin/SuperAdminLayout';
import SuperAdminDashboardPage from './pages/super-admin/SuperAdminDashboardPage';
import SuperAdminAdminsPage from './pages/super-admin/SuperAdminAdminsPage';
import SuperAdminElectionsPage from './pages/super-admin/SuperAdminElectionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          {/* Public voter routes */}
          <Route path="/" element={<ElectionsListPage />} />
          <Route path="/vote/:slug" element={<VoterLoginPage />} />
          <Route path="/vote/:slug/cast" element={<VotePage />} />
          <Route path="/vote/:slug/done" element={<CongratulationsPage />} />
          <Route path="/vote/:slug/results" element={<ResultsPage />} />

          {/* Admin auth routes (no sidebar) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/admin/pending" element={<AdminPendingPage />} />

          {/* Admin panel with sidebar */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="elections/new" element={<AdminCreateElectionPage />} />
            <Route path="elections/:slug" element={<AdminElectionPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Super admin routes */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="admins" element={<SuperAdminAdminsPage />} />
            <Route path="elections" element={<SuperAdminElectionsPage />} />
          </Route>
        </Routes>
        <Toaster />
        <Footer />
      </NotificationProvider>
    </BrowserRouter>
  );
}
