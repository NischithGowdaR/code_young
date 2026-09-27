import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { BookTrialPage } from './pages/BookTrialPage.js';
import { MathPage } from './pages/MathPage.js';
import { CodingPage } from './pages/CodingPage.js';
import { EnglishPage } from './pages/EnglishPage.js';
import { SciencePage } from './pages/SciencePage.js';
import { TermsPage } from './pages/TermsPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { BlogPage } from './pages/BlogPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { AdminMentorsPage } from './pages/AdminMentorsPage.js';
import { AdminBookingsPage } from './pages/AdminBookingsPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/courses/math" element={<MathPage />} />
      <Route path="/courses/coding" element={<CodingPage />} />
      <Route path="/courses/english" element={<EnglishPage />} />
      <Route path="/courses/science" element={<SciencePage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Protected Trial Booking Route */}
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <BookTrialPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/book-trial"
        element={
          <ProtectedRoute>
            <BookTrialPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/bookings"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mentors"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminMentorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
