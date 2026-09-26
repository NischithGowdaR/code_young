import React, { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '../components/AdminHeader.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';

interface AdminBooking {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  course: string;
  studentGrade: string;
  startUtc: string;
  endUtc: string;
  parentTimezone: string;
  mentorTimezoneSnapshot: string;
  parentLocalDisplay: string;
  mentorLocalDisplay: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  classLink: string | null;
  status: string;
  createdAt: string;
}

export const AdminBookingsPage: React.FC = () => {
  const { accessToken } = useAuth();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<AdminBooking | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch('/api/admin/bookings', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch bookings list');
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading bookings');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancel(true);
    setError(null);
    setActionSuccess(null);

    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`/api/admin/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === cancellingBooking.id ? { ...b, status: 'CANCELLED' } : b))
      );

      setActionSuccess(
        `Booking for "${cancellingBooking.parentName}" (${cancellingBooking.course}) has been cancelled and notification emails sent.`
      );
      setCancellingBooking(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (filterDate) {
      const startStr = b.parentLocalDisplay || b.mentorLocalDisplay || b.createdAt || '';
      const datePart = b.createdAt ? b.createdAt.split('T')[0] : '';
      if (datePart !== filterDate && !startStr.includes(filterDate)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <AdminHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Trial Class Bookings
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Inspect parent-local & mentor-local times, filter by date/status, launch class links, or cancel bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
              <span className="text-xs text-slate-400 font-bold">📅</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                title="Filter by Specific Date"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-1"
                  title="Clear Date Filter"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'CONFIRMED' | 'CANCELLED')}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Filter: All Statuses ({bookings.length})</option>
              <option value="CONFIRMED">Filter: Confirmed Only</option>
              <option value="CANCELLED">Filter: Cancelled Only</option>
            </select>

            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
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

        {/* Bookings Table */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading bookings list...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No bookings match the selected criteria.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Parent Contact & Student</th>
                    <th className="px-6 py-3 font-semibold">Course</th>
                    <th className="px-6 py-3 font-semibold">Parent Local Time</th>
                    <th className="px-6 py-3 font-semibold">Mentor Local Time</th>
                    <th className="px-6 py-3 font-semibold">Assigned Mentor</th>
                    <th className="px-6 py-3 font-semibold">Meeting Class Link</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900">{b.parentName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{b.parentEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-indigo-700 block">{b.course}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {b.studentGrade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-900">
                          {b.parentLocalDisplay}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {b.parentTimezone}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-slate-700">{b.mentorLocalDisplay}</div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {b.mentorTimezoneSnapshot}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{b.mentorName}</div>
                        <div className="text-[11px] text-slate-400">{b.mentorEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        {b.classLink ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={b.classLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-indigo-600 hover:underline max-w-[140px] truncate block font-bold"
                            >
                              {b.classLink}
                            </a>
                            <button
                              onClick={() => copyToClipboard(b.classLink!, b.id)}
                              className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded"
                            >
                              {copiedLinkId === b.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-block ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {b.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => setCancellingBooking(b)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition-all shadow-sm"
                          >
                            Cancel Booking
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal Dialog */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
                ⚠️
              </div>

              <div className="text-center">
                <h3 className="text-lg font-extrabold text-slate-900">Cancel Trial Booking?</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Are you sure you want to cancel the <strong>{cancellingBooking.course}</strong>{' '}
                  trial class for parent <strong>{cancellingBooking.parentName}</strong> scheduled
                  with <strong>{cancellingBooking.mentorName}</strong>?
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cancellation email notifications will be automatically dispatched to both parent
                  and mentor.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  disabled={isSubmittingCancel}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isSubmittingCancel}
                  className="flex-1 py-3 bg-rose-600 text-white font-extrabold text-xs rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingCancel ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Yes, Cancel Booking</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
