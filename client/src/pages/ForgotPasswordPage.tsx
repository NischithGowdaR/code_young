import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
} from 'lucide-react';

type Step = 'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  const { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Success auto-redirect timer
  useEffect(() => {
    if (step !== 'SUCCESS') return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, navigate]);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendForgotPasswordOtp(trimmedEmail);
      setInfoMessage(res.message || 'A 6-digit OTP has been sent to your email.');
      setCooldown(res.cooldownSeconds || 60);
      setStep('OTP');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to send OTP. Please check your email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setFormError(null);
    setInfoMessage(null);

    setIsSubmitting(true);
    try {
      const res = await sendForgotPasswordOtp(email.trim().toLowerCase());
      setInfoMessage(res.message || 'A fresh 6-digit OTP has been sent to your email.');
      setCooldown(res.cooldownSeconds || 60);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setFormError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyForgotPasswordOtp(email.trim().toLowerCase(), cleanOtp);
      setResetToken(res.resetToken);
      setInfoMessage(null);
      setStep('RESET');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 3: Reset Password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim().toLowerCase(), resetToken, newPassword, confirmPassword);
      setStep('SUCCESS');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200/80 backdrop-blur-sm transition-all">
          {/* Top Progress Tracker */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'EMAIL'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                1
              </span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Email</span>
            </div>
            <div
              className={`h-0.5 w-8 transition-colors ${
                step === 'OTP' || step === 'RESET' || step === 'SUCCESS'
                  ? 'bg-indigo-600'
                  : 'bg-slate-200'
              }`}
            />
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'OTP'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                    : step === 'RESET' || step === 'SUCCESS'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Verify</span>
            </div>
            <div
              className={`h-0.5 w-8 transition-colors ${
                step === 'RESET' || step === 'SUCCESS' ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'RESET'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                    : step === 'SUCCESS'
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Reset</span>
            </div>
          </div>

          {/* Feedback messages */}
          {formError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-xl flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'EMAIL' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Enter your registered email ID and we’ll send you a 6-digit OTP to reset your
                  password.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send OTP</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 'OTP' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enter OTP</h1>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  A 6-digit OTP has been sent to{' '}
                  <span className="font-semibold text-slate-800">{email}</span>. Valid for 10
                  minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp-code"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3.5 py-3 text-center text-2xl font-mono tracking-widest font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>
              </form>

              {/* Resend & Change Email Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setOtpCode('');
                    setFormError(null);
                    setInfoMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isSubmitting}
                  className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === 'RESET' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create New Password
                </h1>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Set a new secure password for <span className="font-semibold">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password validation indicators */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                        newPassword.length >= 6
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>At least 6 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                        newPassword && newPassword === confirmPassword
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>Passwords match</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS STATE */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Password Reset Successful!
              </h1>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your password has been reset successfully. You are now logged in.
              </p>
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700">
                Redirecting to your dashboard in {redirectCountdown} second
                {redirectCountdown === 1 ? '' : 's'}...
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                >
                  Go to Parent Dashboard Now
                </button>
                <Link
                  to="/login"
                  className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
