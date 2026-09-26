import React, { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '../components/AdminHeader.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';

interface AdminMentor {
  id: string;
  name: string;
  email: string;
  timezone: string;
  active: boolean;
  maxDailyBookings: number;
  dailyBookingCount: number;
  totalBookingsCount?: number;
  createdAt: string;
}

export const AdminMentorsPage: React.FC = () => {
  const { accessToken } = useAuth();

  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch('/api/admin/mentors', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch mentors list');
      }

      setMentors(data.mentors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading mentors');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleToggleStatus = async (mentor: AdminMentor) => {
    setTogglingId(mentor.id);
    setError(null);
    setActionSuccess(null);

    const newActiveState = !mentor.active;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`/api/admin/mentors/${mentor.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: newActiveState }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update mentor active status');
      }

      setMentors((prev) =>
        prev.map((m) => (m.id === mentor.id ? { ...m, active: data.mentor.active } : m))
      );

      setActionSuccess(
        `Mentor "${mentor.name}" status updated to ${data.mentor.active ? 'ACTIVE' : 'INACTIVE'}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <AdminHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Management</h1>
            <p className="text-xs text-slate-600 mt-1">
              Activate or deactivate mentors, inspect mentor timezones, and monitor daily booking
              count.
            </p>
          </div>
          <button
            onClick={fetchMentors}
            className="self-start sm:self-auto px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Refresh Mentors</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>✓ {actionSuccess}</span>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading CodeYoung mentors...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No mentors found in system.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Mentor Name & Email</th>
                    <th className="px-6 py-3 font-semibold">Timezone</th>
                    <th className="px-6 py-3 font-semibold">Daily Booking Limit</th>
                    <th className="px-6 py-3 font-semibold">Today&apos;s Bookings</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mentors.map((m) => {
                    const isUpdating = togglingId === m.id;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900">{m.name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{m.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px]">
                            {m.timezone}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {m.maxDailyBookings} classes / day
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`font-black text-xs px-2.5 py-1 rounded-lg w-fit ${
                                m.dailyBookingCount >= m.maxDailyBookings
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.dailyBookingCount} / {m.maxDailyBookings} today
                            </span>
                            {typeof m.totalBookingsCount === 'number' && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {m.totalBookingsCount} total active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 ${
                              m.active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                m.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{m.active ? 'ACTIVE' : 'INACTIVE'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(m)}
                            disabled={isUpdating}
                            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                              m.active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isUpdating ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Updating...
                              </span>
                            ) : m.active ? (
                              'Deactivate Mentor'
                            ) : (
                              'Activate Mentor'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
