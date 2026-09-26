import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../components/AdminHeader.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';

interface MentorItem {
  id: string;
  name: string;
  email: string;
  timezone: string;
  active: boolean;
  dailyBookingCount: number;
}

interface BookingItem {
  id: string;
  parentName: string;
  parentEmail: string;
  course: string;
  studentGrade: string;
  parentLocalDisplay: string;
  mentorLocalDisplay: string;
  mentorName: string;
  classLink: string | null;
  status: string;
  createdAt: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { accessToken } = useAuth();

  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar Modal State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Selected Date for Schedule & Daily Capacity Explorer
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const [resMentors, resBookings] = await Promise.all([
          fetch('/api/admin/mentors', { headers }),
          fetch('/api/admin/bookings', { headers }),
        ]);

        const dataMentors = await resMentors.json();
        const dataBookings = await resBookings.json();

        if (!resMentors.ok) throw new Error(dataMentors.message || 'Failed to load mentors');
        if (!resBookings.ok) throw new Error(dataBookings.message || 'Failed to load bookings');

        setMentors(dataMentors.mentors || []);
        setBookings(dataBookings.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading admin dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter((m) => m.active).length;
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  // Compute daily metrics for selectedDate
  const maxDailyCapacity = activeMentors * 2; // 20 when 10 active mentors
  const bookingsOnDate = bookings.filter((b) => {
    const startStr = b.parentLocalDisplay || b.mentorLocalDisplay || b.createdAt || '';
    const datePart = b.createdAt ? b.createdAt.split('T')[0] : '';
    return datePart === selectedDate || startStr.includes(selectedDate);
  });
  const confirmedOnDate = bookingsOnDate.filter((b) => b.status === 'CONFIRMED').length;
  const remainingSlotsOnDate = Math.max(0, maxDailyCapacity - confirmedOnDate);
  const capacityPercent = maxDailyCapacity > 0 ? Math.min(100, Math.round((confirmedOnDate / maxDailyCapacity) * 100)) : 0;

  // Month summary
  const selectedMonth = selectedDate.slice(0, 7); // YYYY-MM
  const bookingsInMonth = bookings.filter((b) => {
    const datePart = b.createdAt ? b.createdAt.slice(0, 7) : '';
    const displayPart = b.parentLocalDisplay || '';
    return datePart === selectedMonth || displayPart.includes(selectedMonth);
  }).length;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <AdminHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Overview Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage CodeYoung trial mentors, view real-time bookings across timezones, and inspect daily 20-slot capacity.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading admin metrics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Total Mentors
                  </span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block">
                    {totalMentors}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">10 Registered Mentors</span>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                  👨‍🏫
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Active Mentors
                  </span>
                  <span className="text-3xl font-black text-emerald-600 mt-1 block">
                    {activeMentors}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                    Max {activeMentors * 2} slots/day
                  </span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Total Bookings
                  </span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block">
                    {totalBookings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="mt-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1"
                  >
                    <span>📅</span>
                    <span>Calendar Slot Check</span>
                  </button>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                  📅
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Confirmed Classes
                  </span>
                  <span className="text-3xl font-black text-indigo-600 mt-1 block">
                    {confirmedBookings}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
                    {bookingsInMonth} in {selectedMonth}
                  </span>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                  🎯
                </div>
              </div>
            </div>

            {/* DAILY CAPACITY & SCHEDULE CALENDAR EXPLORER */}
            <div id="calendar-section" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-6">
              <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      Live Schedule Explorer
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Month: <strong className="text-white">{selectedMonth}</strong> ({bookingsInMonth} total bookings)
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
                    Daily Booking Slots & Capacity
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Select any date to see exact filled slots, mentor loads, and remaining capacity out of the maximum 20 daily slots (2 per mentor).
                  </p>
                </div>

                {/* Date Controls */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-xl transition-colors"
                    title="Previous Day"
                  >
                    ◀ Prev
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 bg-slate-900 text-white border border-slate-600 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleNextDay}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-xl transition-colors"
                    title="Next Day"
                  >
                    Next ▶
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Capacity Progress & Stats on Selected Date */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Selected Date
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {selectedDate}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Slots Booked / Daily Limit
                    </span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      <span className="text-indigo-600">{confirmedOnDate}</span> / {maxDailyCapacity} max
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Remaining Free Slots
                    </span>
                    <span className={`text-lg font-black mt-1 block ${remainingSlotsOnDate > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {remainingSlotsOnDate} slots available
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Daily Capacity Utilization</span>
                    <span className={capacityPercent >= 100 ? 'text-rose-600' : capacityPercent >= 75 ? 'text-amber-600' : 'text-emerald-600'}>
                      {capacityPercent}% Filled ({confirmedOnDate}/{maxDailyCapacity} Booked)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        capacityPercent >= 100
                          ? 'bg-rose-600'
                          : capacityPercent >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, capacityPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Booked Slots List for Selected Date */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Filled Slots on {selectedDate} ({bookingsOnDate.length})
                  </h3>
                  {bookingsOnDate.length > 0 && (
                    <span className="text-xs font-bold text-slate-500">
                      Showing all booked sessions for this calendar day
                    </span>
                  )}
                </div>

                {bookingsOnDate.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <span className="text-3xl block mb-2">✨</span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      0 Bookings on {selectedDate}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      All {maxDailyCapacity} demo class slots (2 per mentor across {activeMentors} active mentors) are completely open and available for parents to book.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Slot Time (Parent Local)</th>
                          <th className="px-5 py-3 font-semibold">Mentor Time (IST)</th>
                          <th className="px-5 py-3 font-semibold">Assigned Mentor</th>
                          <th className="px-5 py-3 font-semibold">Parent & Student</th>
                          <th className="px-5 py-3 font-semibold">Course & Grade</th>
                          <th className="px-5 py-3 font-semibold">Classroom Link</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {bookingsOnDate.map((b) => (
                          <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                              {b.parentLocalDisplay || 'Scheduled Slot'}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-600">
                              {b.mentorLocalDisplay || 'IST Time'}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-indigo-700">
                              {b.mentorName}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{b.parentName}</div>
                              <div className="text-[11px] text-slate-400">{b.parentEmail}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-slate-800">{b.course}</span>
                              <span className="block text-[11px] text-slate-500">{b.studentGrade}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {b.classLink ? (
                                <a
                                  href={b.classLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                  <span>🔗</span>
                                  <span>Join Class</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">No link</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  b.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Management Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Mentor Availability</h2>
                  <Link
                    to="/admin/mentors"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All Mentors →
                  </Link>
                </div>
                <p className="text-xs text-slate-500">
                  Toggle mentor active status, inspect IANA timezones, and monitor daily booking
                  capacity limit (max 2 per day).
                </p>
                <div className="pt-2">
                  <Link
                    to="/admin/mentors"
                    className="inline-block px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow hover:bg-indigo-700 transition-all"
                  >
                    Manage Mentors List
                  </Link>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Trial Class Bookings</h2>
                  <Link
                    to="/admin/bookings"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All Bookings →
                  </Link>
                </div>
                <p className="text-xs text-slate-500">
                  Review booked trial classes, inspect parent-local vs mentor-local times, launch
                  classroom meeting links, or trigger cancellation emails.
                </p>
                <div className="pt-2">
                  <Link
                    to="/admin/bookings"
                    className="inline-block px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow hover:bg-slate-800 transition-all"
                  >
                    Manage Bookings & Links
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Bookings Table Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Recent Trial Bookings</h2>
                <Link
                  to="/admin/bookings"
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  See Full List ({bookings.length})
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No trial class bookings recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Parent & Student</th>
                        <th className="px-6 py-3 font-semibold">Course</th>
                        <th className="px-6 py-3 font-semibold">Parent Local Time</th>
                        <th className="px-6 py-3 font-semibold">Mentor Local Time</th>
                        <th className="px-6 py-3 font-semibold">Assigned Mentor</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{b.parentName}</div>
                            <div className="text-slate-400 text-[11px]">{b.parentEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-indigo-700">{b.course}</span>
                            <span className="block text-[11px] text-slate-500">
                              {b.studentGrade}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-900">
                            {b.parentLocalDisplay}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">
                            {b.mentorLocalDisplay}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">{b.mentorName}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                b.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* CALENDAR POPUP MODAL DIALOG */}
      {isCalendarModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h3 className="text-lg font-black tracking-tight">Date Availability & Slot Checker</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select any date to check booked slots vs remaining free slots (out of 20 max per day).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors"
                title="Close Calendar"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Date Selector Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label htmlFor="modal-date-picker" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Choose Calendar Date:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="modal-date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextDay}
                    className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    Tomorrow ▶
                  </button>
                </div>
              </div>

              {/* Real-time Capacity Metrics Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 block">
                    Max Daily Limit
                  </span>
                  <span className="text-xl font-black text-indigo-900 mt-1 block">
                    {maxDailyCapacity} Slots
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">(2 per mentor)</span>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
                    Bookings Over / Filled
                  </span>
                  <span className="text-xl font-black text-rose-700 mt-1 block">
                    {confirmedOnDate} Booked
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">on {selectedDate}</span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                    Free Slots Available
                  </span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">
                    {remainingSlotsOnDate} Free
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">ready to book</span>
                </div>
              </div>

              {/* Visual Capacity Bar */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Capacity for {selectedDate}:</span>
                  <span className={capacityPercent >= 100 ? 'text-rose-600' : 'text-emerald-600'}>
                    {confirmedOnDate} / {maxDailyCapacity} Booked ({capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      capacityPercent >= 100
                        ? 'bg-rose-600'
                        : capacityPercent >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, capacityPercent)}%` }}
                  />
                </div>
              </div>

              {/* Filled Slots List on Selected Date */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">
                  Filled Sessions on {selectedDate} ({bookingsOnDate.length})
                </h4>

                {bookingsOnDate.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                    <span className="text-2xl block mb-1">✨</span>
                    <p className="text-xs font-bold text-slate-700">No bookings on {selectedDate}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All {maxDailyCapacity} demo class slots are 100% free and open for parents to book.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bookingsOnDate.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {b.parentName} ({b.course} - {b.studentGrade})
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Parent Time: {b.parentLocalDisplay || 'Scheduled'}
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium">
                            Mentor: {b.mentorName} (IST: {b.mentorLocalDisplay || 'IST'})
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.classLink && (
                            <a
                              href={b.classLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              🔗 Join Class
                            </a>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
