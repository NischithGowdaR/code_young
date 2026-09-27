import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';
import { UserPlus, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/New_York', label: 'US - Eastern Time (America/New_York)' },
  { value: 'America/Chicago', label: 'US - Central Time (America/Chicago)' },
  { value: 'America/Denver', label: 'US - Mountain Time (America/Denver)' },
  { value: 'America/Los_Angeles', label: 'US - Pacific Time (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'UK - London Time (Europe/London)' },
];

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [otpCode, setOtpCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const { user, sendRegistrationOtp, register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendEmailOtp = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setOtpSuccess(null);

    if (!name || !email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const result = await sendRegistrationOtp(email, name);
      setStep('OTP');
      setOtpCode('');
      setCooldown(result.cooldownSeconds || 60);
      setOtpSuccess(`A 6-digit verification code has been sent to ${email}. Please check your email inbox.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setFormError(msg);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setFormError(null);
    setOtpSuccess(null);

    try {
      const result = await sendRegistrationOtp(email, name);
      setCooldown(result.cooldownSeconds || 60);
      setOtpCode('');
      setOtpSuccess(`A new verification code has been sent to ${email}. Please check your email inbox.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.';
      setFormError(msg);
    }
  };

  const handleVerifyAndRegister = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setFormError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      await register(name, email, password, phoneNumber || undefined, timezone, otpCode.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Registration failed. Please check the OTP code.';
      setFormError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              {step === 'FORM' ? <UserPlus className="w-7 h-7" /> : <Mail className="w-7 h-7" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {step === 'FORM' ? 'Parent Registration' : 'Verify Your Email'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {step === 'FORM'
                ? 'Create your account to book trial classes'
                : `Enter the 6-digit OTP code sent to ${email}`}
            </p>
          </div>

          {otpSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{otpSuccess}</span>
            </div>
          )}

          {(formError || error) && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          {step === 'FORM' ? (
            /* STEP 1: REGISTRATION FORM */
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Password (min 6 chars) *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Phone Number (Optional)
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="timezone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Primary Timezone *
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <span>Continue & Verify Email →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: EMAIL OTP VERIFICATION */
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Email Verification Code *
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-center text-xl tracking-widest font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length < 4}
                className="w-full py-3.5 bg-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Creating Account...</span>
                  </>
                ) : (
                  <span>Verify Email & Complete Registration</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ← Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isLoading}
                  className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
