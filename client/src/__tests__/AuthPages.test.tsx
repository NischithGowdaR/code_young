import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.js';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { TermsPage } from '../pages/TermsPage.js';
import { PrivacyPage } from '../pages/PrivacyPage.js';

describe('Auth & Legal Pages (Registration, Login, Terms, Privacy)', () => {
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
        '/api/auth/register',
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

  it('4. Terms and Privacy pages render correctly', () => {
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
});
