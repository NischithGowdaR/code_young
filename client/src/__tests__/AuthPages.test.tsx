import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.js';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.js';
import { TermsPage } from '../pages/TermsPage.js';
import { PrivacyPage } from '../pages/PrivacyPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

describe('Auth & Legal Pages (Registration, Login, Forgot Password, Terms, Privacy)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. Registration form validation and error handling', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Parent Registration/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password \(min 6 chars\) \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Primary Timezone \*/i)).toBeInTheDocument();
    });

    // Fill short password
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: 'Jane Parent' } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password \(min 6 chars\) \*/i), {
      target: { value: '123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Continue & Verify Email/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
    });
  });

  it('2. Successful registration flow with Email OTP verification', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/api/auth/send-registration-otp')) {
        const payload = {
          success: true,
          message: 'Verification code sent to email',
          cooldownSeconds: 60,
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      if (u.includes('/api/auth/register')) {
        const payload = {
          message: 'Account created successfully',
          accessToken: 'mock-jwt-token-123',
          user: {
            id: 'u-1',
            name: 'Jane Parent',
            email: 'jane@example.com',
            role: 'PARENT',
            timezone: 'Asia/Kolkata',
          },
        };
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue & Verify Email/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: 'Jane Parent' } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password \(min 6 chars\) \*/i), {
      target: { value: 'password123' },
    });

    const sendOtpBtn = screen.getByRole('button', { name: /Continue & Verify Email/i });
    fireEvent.submit(sendOtpBtn.closest('form')!);

    // Step 2: OTP screen should be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Verify Your Email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/6-Digit Email Verification Code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/6-Digit Email Verification Code/i), {
      target: { value: '123456' },
    });

    const verifyBtn = screen.getByRole('button', {
      name: /Verify Email & Complete Registration/i,
    });
    fireEvent.submit(verifyBtn.closest('form')!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('3. Login form validation and error on invalid credentials', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/api/auth/login')) {
        const payload = {
          error: 'Unauthorized',
          message: 'Invalid email or password',
        };
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpass' },
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('4. Login page contains Forgot Password? link', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const forgotLink = screen.getByRole('link', { name: /Forgot Password\?/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  it('5. Forgot Password multi-step flow: send OTP, verify OTP, and reset password', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/api/auth/forgot-password/send-otp')) {
        const payload = {
          message: 'A 6-digit OTP has been sent to your email.',
          cooldownSeconds: 60,
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      if (u.includes('/api/auth/forgot-password/verify-otp')) {
        const payload = {
          message: 'OTP verified successfully.',
          resetToken: 'mock-signed-reset-token-12345',
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      if (u.includes('/api/auth/forgot-password/reset-password')) {
        const payload = {
          message: 'Your password has been reset successfully.',
          user: {
            id: 'u-123',
            name: 'Parent User',
            email: 'parent.reset@example.com',
            role: 'PARENT',
            timezone: 'Asia/Kolkata',
          },
          accessToken: 'mock-new-access-token',
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(payload),
          text: () => Promise.resolve(JSON.stringify(payload)),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ForgotPasswordPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Step 1: Email Form
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'parent.reset@example.com' },
    });

    const sendOtpBtn = screen.getByRole('button', { name: /Send OTP/i });
    fireEvent.submit(sendOtpBtn.closest('form')!);

    // Step 2: OTP Verification
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Enter OTP/i })).toBeInTheDocument();
      expect(screen.getByText(/A 6-digit OTP has been sent to your email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/6-Digit Verification Code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/6-Digit Verification Code/i), {
      target: { value: '123456' },
    });

    const verifyOtpBtn = screen.getByRole('button', { name: /Verify OTP/i });
    fireEvent.submit(verifyOtpBtn.closest('form')!);

    // Step 3: Create New Password
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create New Password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'NewSecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: 'NewSecurePass123!' },
    });

    const resetBtn = screen.getByRole('button', { name: /Reset Password/i });
    fireEvent.submit(resetBtn.closest('form')!);

    // Step 4: Success state
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Password Reset Successful!/i })).toBeInTheDocument();
      expect(screen.getByText(/Your password has been reset successfully/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to Parent Dashboard Now/i })).toBeInTheDocument();
    });
  });

  it('6. Terms and Privacy pages render correctly', () => {
    const { unmount: unmountTerms } = render(
      <MemoryRouter>
        <AuthProvider>
          <TermsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Terms of Use/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to CodeYoung/i)).toBeInTheDocument();
    unmountTerms();

    render(
      <MemoryRouter>
        <AuthProvider>
          <PrivacyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/data privacy/i)).toBeInTheDocument();
  });

  it('7. Dashboard displays "Not selected yet" for parents without any bookings', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              accessToken: 'mock-token',
              user: { id: 'u-1', name: 'New Parent', email: 'parent@example.com', role: 'PARENT' },
            }),
        });
      }
      if (u.includes('/api/parent/dashboard')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              user: {
                id: 'u-1',
                name: 'New Parent',
                email: 'parent@example.com',
                phoneNumber: null,
                timezone: 'Asia/Kolkata',
                role: 'PARENT',
              },
              studentSummary: {
                totalTrialRequests: 0,
                primaryCourse: null,
                grade: null,
              },
              upcomingBookings: [],
              previousBookings: [],
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Student Info & Grade')).toBeInTheDocument();
      expect(screen.getByText('Not selected yet')).toBeInTheDocument();
      expect(screen.getByText('No trial class booked yet')).toBeInTheDocument();
      expect(screen.getByText('0 Total Requests')).toBeInTheDocument();
    });
  });

  it('8. Dashboard displays real grade and course when bookings exist', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              accessToken: 'mock-token',
              user: { id: 'u-2', name: 'Booked Parent', email: 'booked@example.com', role: 'PARENT' },
            }),
        });
      }
      if (u.includes('/api/parent/dashboard')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              user: {
                id: 'u-2',
                name: 'Booked Parent',
                email: 'booked@example.com',
                phoneNumber: '+15550199',
                timezone: 'America/New_York',
                role: 'PARENT',
              },
              studentSummary: {
                totalTrialRequests: 1,
                primaryCourse: 'ROBOTICS',
                grade: 'Grade 7',
              },
              upcomingBookings: [
                {
                  id: 'b-1',
                  course: 'ROBOTICS',
                  studentGrade: 'Grade 7',
                  studentSubject: 'Robotics 101',
                  status: 'CONFIRMED',
                },
              ],
              previousBookings: [],
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Grade 7')).toBeInTheDocument();
      expect(screen.getByText('Course: ROBOTICS')).toBeInTheDocument();
      expect(screen.getByText('1 Total Requests')).toBeInTheDocument();
    });
  });

  it('9. Session is preserved across simulated page reloads via localStorage', async () => {
    // Set localStorage as if user had already logged in previously
    localStorage.setItem(
      'cy_auth_user',
      JSON.stringify({
        id: 'u-persistent',
        name: 'Persistent Parent',
        email: 'persistent@example.com',
        role: 'PARENT',
        timezone: 'Asia/Kolkata',
      })
    );
    localStorage.setItem('cy_access_token', 'cached-access-token-123');

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              user: {
                id: 'u-persistent',
                name: 'Persistent Parent',
                email: 'persistent@example.com',
                role: 'PARENT',
                timezone: 'Asia/Kolkata',
              },
            }),
        });
      }
      if (u.includes('/api/parent/dashboard')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              user: {
                id: 'u-persistent',
                name: 'Persistent Parent',
                email: 'persistent@example.com',
                phoneNumber: null,
                timezone: 'Asia/Kolkata',
                role: 'PARENT',
              },
              studentSummary: {
                totalTrialRequests: 0,
                primaryCourse: null,
                grade: null,
              },
              upcomingBookings: [],
              previousBookings: [],
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Should immediately render parent dashboard without redirecting to login
    await waitFor(() => {
      expect(screen.getAllByText('Persistent Parent').length).toBeGreaterThan(0);
      expect(screen.getByText('persistent@example.com')).toBeInTheDocument();
    });

    localStorage.clear();
  });
});
