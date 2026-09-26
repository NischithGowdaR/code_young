import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    timezone: string;
    role: string;
  };
  studentSummary: {
    totalTrialRequests: number;
    primaryCourse: string;
    grade: string;
  };
  upcomingBookings: Array<{
    id: string;
    course: string;
    studentGrade: string;
    studentSubject?: string;
    status: string;
    startUtc?: string | null;
    parentTimezone?: string;
    createdAt?: string;
  }>;
  previousBookings: Array<{
    id: string;
    course: string;
    studentGrade: string;
    status: string;
    startUtc?: string | null;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine active tab from current URL path
  const currentPath = location.pathname;
  const activeTab = currentPath.includes('/bookings')
    ? 'bookings'
    : currentPath.includes('/profile')
      ? 'profile'
      : 'overview';

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const res = await fetch('/api/parent/dashboard', { headers });
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || 'Failed to load parent dashboard');
        }

        setData(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [accessToken]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Welcome Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Parent Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back,{' '}
              <span className="text-indigo-600">{data?.user.name || user?.name || 'Parent'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your student’s trial class bookings, schedules, and learning profiles.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/book"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-bold text-sm rounded-xl shadow hover:brightness-105 active:scale-95 transition-all text-center"
            >
              + Book a Free Trial Class
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-2">
          <Link
            to="/dashboard"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            📊 Overview
          </Link>

          <Link
            to="/dashboard/bookings"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            🗓️ My Bookings
          </Link>

          <Link
            to="/dashboard/profile"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            👤 Parent Profile
          </Link>

          <Link
            to="/book"
            className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap ml-auto"
          >
            ⚡ Quick Book Trial
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl">
            {error}
          </div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Parent Account
                    </div>
                    <div className="text-xl font-bold text-slate-900">{data?.user.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{data?.user.email}</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Student Info & Grade
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {data?.studentSummary.grade || 'Grade 5'}
                    </div>
                    <div className="text-xs text-indigo-600 font-semibold mt-1">
                      Course: {data?.studentSummary.primaryCourse}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Trial Requests
                    </div>
                    <div className="text-xl font-bold text-indigo-600">
                      {data?.studentSummary.totalTrialRequests || 0} Total Requests
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Timezone: {data?.user.timezone}
                    </div>
                  </div>
                </div>

                {/* Upcoming Bookings Section */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Upcoming Trial Bookings</h2>
                    <Link to="/book" className="text-xs font-bold text-indigo-600 hover:underline">
                      + Book New Trial
                    </Link>
                  </div>

                  {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {data.upcomingBookings.map((b) => (
                        <div key={b.id} className="py-4 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-base font-bold text-slate-900">{b.course}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {b.studentGrade} • {b.studentSubject || 'Interactive Session'}
                            </div>
                          </div>

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-600 font-medium">
                        No upcoming trial class bookings.
                      </p>
                      <Link
                        to="/book"
                        className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                      >
                        Book Your First Free Trial
                      </Link>
                    </div>
                  )}
                </div>

                {/* Previous Bookings Section */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Previous Bookings History</h2>
                  {data?.previousBookings && data.previousBookings.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {data.previousBookings.map((b) => (
                        <div key={b.id} className="py-3 flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-800">{b.course}</div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No past trial class history recorded yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">All Trial Class Bookings</h2>
                    <p className="text-xs text-slate-500">
                      History and status of your trial requests
                    </p>
                  </div>

                  <Link
                    to="/book"
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                  >
                    + Book New Trial
                  </Link>
                </div>

                {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {data.upcomingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{b.course}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {b.studentGrade} • Request ID:{' '}
                            <code className="font-mono text-indigo-600">{b.id}</code>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full">
                          Status: {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No trial bookings found.</p>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                <h2 className="text-2xl font-bold text-slate-900">Parent Profile Details</h2>

                <div className="space-y-4 divide-y divide-slate-100 text-sm">
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500 font-medium">Full Name</span>
                    <span className="font-bold text-slate-900">{data?.user.name}</span>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <span className="text-slate-500 font-medium">Email Address</span>
                    <span className="font-bold text-slate-900">{data?.user.email}</span>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <span className="text-slate-500 font-medium">Phone Number</span>
                    <span className="font-bold text-slate-900">
                      {data?.user.phoneNumber || '+1 555-0199'}
                    </span>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <span className="text-slate-500 font-medium">Primary Timezone</span>
                    <span className="font-bold text-indigo-600">{data?.user.timezone}</span>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <span className="text-slate-500 font-medium">Account Role</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold text-xs uppercase">
                      {data?.user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
