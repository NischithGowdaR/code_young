import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';
import { apiUrl } from '../config/api.js';
import { CheckCircle2, Calendar, AlertCircle, ExternalLink, Check } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/New_York', label: 'US - Eastern Time (America/New_York)' },
  { value: 'America/Chicago', label: 'US - Central Time (America/Chicago)' },
  { value: 'America/Denver', label: 'US - Mountain Time (America/Denver)' },
  { value: 'America/Los_Angeles', label: 'US - Pacific Time (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'UK - London Time (Europe/London)' },
];

const bookTrialSchema = z.object({
  parentName: z.string().trim().min(2, 'Parent name is required'),
  parentEmail: z.string().trim().email('Invalid email address'),
  parentPhone: z
    .string()
    .trim()
    .min(7, 'Valid phone number is required')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format'),
  studentGrade: z.string().trim().min(1, 'Student grade is required'),
  course: z.enum(['MATHEMATICS', 'CODING', 'ENGLISH', 'SCIENCE'], {
    errorMap: () => ({ message: 'Course selection is required' }),
  }),
  timezone: z.string().trim().min(1, 'Timezone is required'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Terms of Use must be accepted',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'Privacy Policy must be accepted',
  }),
});

export type BookTrialFormData = z.infer<typeof bookTrialSchema>;

interface TrialSession {
  trialRequestId: string;
  parentName: string;
  parentPhone: string;
  course: string;
  phoneVerified: boolean;
  studentGrade: string;
  studentSubject?: string;
}

interface SlotItem {
  startUtc: string;
  endUtc: string;
  parentLocalDisplay: string;
  parentTimezone: string;
  durationMinutes: number;
  available: boolean;
}

interface BookingResult {
  id: string;
  parentId: string;
  mentorId: string;
  mentorName: string;
  course: string;
  studentGrade: string;
  startUtc: string;
  endUtc: string;
  parentTimezone: string;
  mentorTimezoneSnapshot: string;
  classLink: string;
  status: string;
  parentLocalDisplay: string;
  mentorLocalDisplay: string;
  createdAt: string;
}

export const BookTrialPage: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Detect parent's local IANA timezone
  const detectedTimezone = React.useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = TIMEZONES.find((t) => t.value === tz);
      return match ? match.value : 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  }, []);

  const [trialSession, setTrialSession] = useState<TrialSession | null>(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Slot Selection & Booking States (Step 3: Slot Selection)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedTimezone, setSelectedTimezone] = useState(detectedTimezone);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Booking Execution State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConflictError, setBookingConflictError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BookTrialFormData>({
    resolver: zodResolver(bookTrialSchema),
    defaultValues: {
      parentName: user?.name || '',
      parentEmail: user?.email || '',
      parentPhone: user?.phoneNumber || '',
      studentGrade: 'Grade 5',
      course: 'CODING',
      timezone: detectedTimezone,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user) {
      if (user.name) setValue('parentName', user.name);
      if (user.email) setValue('parentEmail', user.email);
      if (user.phoneNumber) setValue('parentPhone', user.phoneNumber);
      if (user.timezone) {
        setValue('timezone', user.timezone);
        setSelectedTimezone(user.timezone);
      }
    }
  }, [user, setValue]);

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (trialRequestId: string) => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const headers: Record<string, string> = {};
      const token = accessToken || localStorage.getItem('cy_access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/trial-requests/${trialRequestId}/send-otp`), {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      setOtpCode('');
      setOtpSuccess('A 6-digit verification code has been sent to your email inbox. Please check your inbox.');
      setCooldown(data.cooldownSeconds || 60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!trialSession || cooldown > 0) return;
    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      const headers: Record<string, string> = {};
      const token = accessToken || localStorage.getItem('cy_access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/trial-requests/${trialSession.trialRequestId}/resend-otp`), {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      setOtpCode('');
      setOtpSuccess('A new verification code has been sent to your email inbox.');
      setCooldown(data.cooldownSeconds || 60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP';
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onSubmitForm = async (data: BookTrialFormData) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        ...data,
        studentSubject: 'Interactive Session',
      };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = accessToken || localStorage.getItem('cy_access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/api/trial-requests'), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'Failed to submit trial request');
      }

      const session: TrialSession = {
        trialRequestId: responseData.trialRequestId,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        course: data.course,
        phoneVerified: false,
        studentGrade: data.studentGrade,
      };

      setTrialSession(session);
      await handleSendOtp(session.trialRequestId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialSession) return;
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter a valid verification OTP code');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = accessToken || localStorage.getItem('cy_access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`/api/trial-requests/${trialSession.trialRequestId}/verify-otp`), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ code: otpCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      setTrialSession((prev) => (prev ? { ...prev, phoneVerified: true } : null));
      setOtpSuccess(
        'Phone number verified successfully! Please select your preferred class date and time slot.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setOtpError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch available slots from backend (GET /api/availability?date=...&timezone=...)
  const fetchAvailableSlots = useCallback(
    async (keepConflictError = false) => {
      if (!selectedDate || !selectedTimezone) return;
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot(null);
      if (!keepConflictError) {
        setBookingConflictError(null);
      }

      try {
        const params = new URLSearchParams({
          date: selectedDate,
          timezone: selectedTimezone,
        });

        const res = await fetch(apiUrl(`/api/availability?${params.toString()}`), {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch available slots');
        }

        setSlots(data.slots || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch slots';
        setSlotsError(msg);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [selectedDate, selectedTimezone]
  );

  useEffect(() => {
    if (trialSession?.phoneVerified) {
      fetchAvailableSlots();
    }
  }, [trialSession?.phoneVerified, fetchAvailableSlots]);

  // Handle final booking submission (POST /api/bookings)
  const handleConfirmBooking = async () => {
    if (!trialSession || !selectedSlot) return;

    setIsBooking(true);
    setBookingConflictError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = accessToken || localStorage.getItem('cy_access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          trialRequestId: trialSession.trialRequestId,
          startUtc: selectedSlot.startUtc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NO_MENTOR_AVAILABLE') {
          setBookingConflictError(
            'The selected slot just became unavailable or booked out. Please select another slot.'
          );
          // Refresh slots list to reflect current availability
          fetchAvailableSlots(true);
          return;
        }
        throw new Error(data.message || 'Failed to complete booking transaction');
      }

      setBookingResult(data.booking);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Booking failed. Please try again.';
      setBookingConflictError(msg);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Heading */}
        <div className="text-center mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-100 text-indigo-700 inline-block mb-3">
            Free 45-Minute 1-on-1 Trial
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Book Your Child&apos;s Free Trial Class
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Experience CodeYoung&apos;s live interactive learning. Select your subject, verify phone
            number, and choose your local time slot.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
              !trialSession
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Parent Info</span>
          </div>

          <div className="w-6 h-0.5 bg-slate-200" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
              trialSession && !trialSession.phoneVerified
                ? 'bg-indigo-600 text-white shadow-md'
                : trialSession?.phoneVerified
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>OTP Verification</span>
          </div>

          <div className="w-6 h-0.5 bg-slate-200" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
              trialSession?.phoneVerified && !bookingResult
                ? 'bg-indigo-600 text-white shadow-md'
                : bookingResult
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Slot & Confirmation</span>
          </div>
        </div>

        {/* STEP 4: SUCCESSFUL BOOKING CONFIRMATION DISPLAY */}
        {bookingResult ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-200 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trial Class Confirmed!
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Your 45-minute live trial class has been scheduled with expert mentor{' '}
              <strong className="text-slate-900">{bookingResult.mentorName}</strong>.
            </p>

            {/* Confirmed Details Grid */}
            <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Course & Grade
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {bookingResult.course} ({bookingResult.studentGrade})
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Assigned Mentor
                  </span>
                  <span className="text-sm font-extrabold text-indigo-700">
                    {bookingResult.mentorName}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                    Your Local Time ({bookingResult.parentTimezone})
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {bookingResult.parentLocalDisplay}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Mentor Local Time ({bookingResult.mentorTimezoneSnapshot})
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {bookingResult.mentorLocalDisplay}
                  </span>
                </div>
              </div>

              {/* Class Link Display */}
              <div className="border-t border-slate-200 pt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Live Classroom Meeting Link
                </span>
                <div className="flex items-center gap-2 bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
                  <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <a
                    href={bookingResult.classLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-mono font-bold text-indigo-700 hover:underline truncate"
                  >
                    {bookingResult.classLink}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-lg hover:bg-indigo-700 transition-all text-center"
              >
                Go to Parent Dashboard
              </Link>
              <button
                onClick={() => {
                  setBookingResult(null);
                  setTrialSession(null);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-300 transition-all text-center"
              >
                Book Another Trial
              </button>
            </div>
          </div>
        ) : trialSession?.phoneVerified ? (
          /* STEP 3: SLOT SELECTION & CONFIRMATION */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select Date & Local Time Slot</h2>
                <p className="text-xs text-slate-500">
                  Phone verified for{' '}
                  <strong className="text-slate-800">{trialSession.parentPhone}</strong>
                </p>
              </div>
              <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                <Check className="w-3.5 h-3.5" />
                <span>Phone Verified</span>
              </span>
            </div>

            {/* Display Verified Parent & Student Information */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Parent</span>
                <span className="font-bold text-slate-900">{trialSession.parentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Course & Grade</span>
                <span className="font-bold text-indigo-700">
                  {trialSession.course} ({trialSession.studentGrade})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Parent Phone</span>
                <span className="font-bold text-slate-900">{trialSession.parentPhone}</span>
              </div>
            </div>

            {/* Date Selection & Timezone Correction Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slot-date" className="block text-xs font-bold text-slate-700 mb-1">
                  Select Class Date *
                </label>
                <input
                  id="slot-date"
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label htmlFor="slot-tz" className="block text-xs font-bold text-slate-700 mb-1">
                  Parent Timezone (Auto-detected) *
                </label>
                <select
                  id="slot-tz"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slot Conflict Error Display */}
            {bookingConflictError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{bookingConflictError}</span>
                </div>
                <button
                  onClick={() => fetchAvailableSlots()}
                  className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all text-xs"
                >
                  Refresh Slots
                </button>
              </div>
            )}

            {/* Slots Loading State */}
            {isLoadingSlots ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  Fetching available 45-minute slots in {selectedTimezone}...
                </p>
              </div>
            ) : slotsError ? (
              /* Server Error State */
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-medium text-center space-y-2">
                <p>Failed to load availability: {slotsError}</p>
                <button
                  onClick={() => fetchAvailableSlots()}
                  className="px-4 py-2 bg-amber-700 text-white font-bold rounded-xl text-xs hover:bg-amber-800 transition-all"
                >
                  Retry Loading Slots
                </button>
              </div>
            ) : slots.length === 0 ? (
              /* No Available Slots State */
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-extrabold text-slate-800">No Slots Available</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All mentors are fully booked or unavailable on {selectedDate} in{' '}
                  {selectedTimezone}.
                </p>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setSelectedDate(nextDay.toISOString().split('T')[0]);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Check Next Day Availability
                </button>
              </div>
            ) : (
              /* Slots Grid Display in Parent-Local Time */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700">
                    Available Slots ({slots.length}) in Parent Local Time
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {selectedTimezone}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startUtc === slot.startUtc;
                    return (
                      <button
                        key={slot.startUtc}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="font-extrabold text-sm tracking-tight">
                          {slot.parentLocalDisplay}
                        </div>
                        <div
                          className={`text-[11px] mt-1 font-medium ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          Duration: {slot.durationMinutes} mins
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm Booking Action Button */}
            {selectedSlot && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  Selected Slot:{' '}
                  <strong className="text-slate-900 font-extrabold">
                    {selectedSlot.parentLocalDisplay}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-emerald-200 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Locking Slot & Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Trial Class Booking</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : trialSession ? (
          /* STEP 2: PHONE OTP VERIFICATION DISPLAY */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Verify Parent Phone Number</h2>
            <p className="text-xs text-slate-600 mb-6">
              Enter the 6-digit OTP sent to your email inbox.
            </p>

            {otpSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-medium">
                {otpSuccess}
              </div>
            )}

            {otpError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-medium">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit OTP Code *
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-center text-xl tracking-widest font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || otpCode.trim().length < 4}
                className="w-full py-3.5 bg-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <span>Verify Phone Number & Continue</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isSendingOtp}
                className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Verification OTP'}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: PARENT TRIAL REQUEST FORM */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
            {apiError && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
              {/* Parent Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600">
                  Parent Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="parentName"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Parent Full Name *
                    </label>
                    <input
                      id="parentName"
                      type="text"
                      {...register('parentName')}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.parentName && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.parentName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="parentEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Parent Email Address *
                    </label>
                    <input
                      id="parentEmail"
                      type="email"
                      {...register('parentEmail')}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.parentEmail && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.parentEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="parentPhone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="parentPhone"
                      type="tel"
                      {...register('parentPhone')}
                      placeholder="+1555018899"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.parentPhone && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.parentPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Timezone *
                    </label>
                    <select
                      id="timezone"
                      {...register('timezone')}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.timezone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student & Course Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600">
                  Student & Course Selection
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="course"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Select Course *
                    </label>
                    <select
                      id="course"
                      {...register('course')}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                    >
                      <option value="CODING">Coding (Python, Scratch, Web)</option>
                      <option value="MATHEMATICS">Mathematics & Logic</option>
                      <option value="ENGLISH">English & Creative Writing</option>
                      <option value="SCIENCE">Science & Robotics</option>
                    </select>
                    {errors.course && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.course.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="studentGrade"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Student Grade *
                    </label>
                    <select
                      id="studentGrade"
                      {...register('studentGrade')}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    >
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                    </select>
                    {errors.studentGrade && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        {errors.studentGrade.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-slate-600">
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-indigo-600 underline font-semibold"
                    >
                      Terms of Use
                    </Link>{' '}
                    for CodeYoung trial classes. *
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-xs text-rose-600 font-medium">{errors.acceptTerms.message}</p>
                )}

                <div className="flex items-start gap-2.5">
                  <input
                    id="acceptPrivacy"
                    type="checkbox"
                    {...register('acceptPrivacy')}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptPrivacy" className="text-xs text-slate-600">
                    I accept the{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="text-indigo-600 underline font-semibold"
                    >
                      Privacy Policy
                    </Link>{' '}
                    and consent to processing contact info for scheduling. *
                  </label>
                </div>
                {errors.acceptPrivacy && (
                  <p className="text-xs text-rose-600 font-medium">
                    {errors.acceptPrivacy.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-indigo-200 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <span>Submit & Proceed to OTP Verification</span>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
