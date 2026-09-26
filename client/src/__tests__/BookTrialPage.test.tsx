import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.js';
import { BookTrialPage } from '../pages/BookTrialPage.js';

describe('BookTrialPage - Parent Booking Flow & States', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. Parent info form rendering & validation', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <BookTrialPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Header & Step Indicator
    expect(
      screen.getByRole('heading', { name: /Book Your Child's Free Trial Class/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Course/i)).toBeInTheDocument();
  });

  it('2. Slot loading, date selection, timezone display & empty availability state', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/send-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ cooldownSeconds: 60 }),
        });
      }
      if (u.includes('/verify-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ phoneVerified: true }),
        });
      }
      if (u.includes('/api/trial-requests')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ trialRequestId: 'tr_test_ui_123' }),
        });
      }
      if (u.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ slots: [] }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <BookTrialPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Fill & Submit Form
    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), {
      target: { value: 'Jane Parent' },
    });
    fireEvent.change(screen.getByLabelText(/Parent Email Address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1555018899' } });
    fireEvent.change(screen.getByLabelText(/Student Grade/i), { target: { value: 'Grade 5' } });
    fireEvent.click(screen.getByLabelText(/Terms of Use/i));
    fireEvent.click(screen.getByLabelText(/Privacy Policy/i));

    const submitBtn = screen.getByRole('button', { name: /Submit & Proceed/i });
    fireEvent.submit(submitBtn.closest('form')!);

    // Verify OTP Step appears
    await waitFor(
      () => {
        expect(screen.getByText(/Verify Parent Phone Number/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Enter OTP Code and Submit
    fireEvent.change(screen.getByLabelText(/6-Digit OTP Code/i), { target: { value: '123456' } });
    const otpForm = screen.getByRole('button', { name: /Verify Phone Number/i }).closest('form')!;
    fireEvent.submit(otpForm);

    // Verify Step 3: Slot selection & empty availability message
    await waitFor(
      () => {
        expect(screen.getByText(/Select Date & Local Time Slot/i)).toBeInTheDocument();
        expect(screen.getByText(/No Slots Available/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Date selection element exists
    expect(screen.getByLabelText(/Select Class Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Timezone/i)).toBeInTheDocument();
  });

  it('3. Successful slot selection & booking transaction with correct confirmation details', async () => {
    const mockSlot = {
      startUtc: '2026-10-12T05:00:00.000Z',
      endUtc: '2026-10-12T05:45:00.000Z',
      parentLocalDisplay: '2026-10-12 01:00 EDT (-04:00)',
      parentTimezone: 'America/New_York',
      durationMinutes: 45,
      available: true,
    };

    const mockBookingResult = {
      id: 'b-ui-confirmed-100',
      parentId: 'u-1',
      mentorId: 'm-1',
      mentorName: 'Aarav Sharma',
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: '2026-10-12T05:00:00.000Z',
      endUtc: '2026-10-12T05:45:00.000Z',
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-uiconfirmed123',
      status: 'CONFIRMED',
      parentLocalDisplay: '2026-10-12 01:00 EDT (-04:00)',
      mentorLocalDisplay: '2026-10-12 10:30 IST (+05:30)',
      createdAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/send-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ cooldownSeconds: 60 }),
        });
      }
      if (u.includes('/verify-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ phoneVerified: true }),
        });
      }
      if (u.includes('/api/trial-requests')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ trialRequestId: 'tr_test_success' }),
        });
      }
      if (u.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ slots: [mockSlot] }),
        });
      }
      if (u.includes('/api/bookings')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ message: 'Booked', booking: mockBookingResult }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <BookTrialPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), {
      target: { value: 'Jane Parent' },
    });
    fireEvent.change(screen.getByLabelText(/Parent Email Address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1555018899' } });
    fireEvent.change(screen.getByLabelText(/Student Grade/i), { target: { value: 'Grade 5' } });
    fireEvent.click(screen.getByLabelText(/Terms of Use/i));
    fireEvent.click(screen.getByLabelText(/Privacy Policy/i));

    const submitBtn = screen.getByRole('button', { name: /Submit & Proceed/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(
      () => {
        expect(screen.getByText(/Verify Parent Phone Number/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.change(screen.getByLabelText(/6-Digit OTP Code/i), { target: { value: '123456' } });
    const otpForm = screen.getByRole('button', { name: /Verify Phone Number/i }).closest('form')!;
    fireEvent.submit(otpForm);

    // Select Slot
    await waitFor(
      () => {
        expect(screen.getAllByText('2026-10-12 01:00 EDT (-04:00)')[0]).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getAllByText('2026-10-12 01:00 EDT (-04:00)')[0]);

    // Confirm Booking
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /Confirm Trial Class Booking/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirm Trial Class Booking/i }));

    // Assert Confirmation Screen
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /Trial Class Confirmed!/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getAllByText('Aarav Sharma')[0]).toBeInTheDocument();
    expect(
      screen.getByText('https://meet.codeyoung.example/room/cy-uiconfirmed123')
    ).toBeInTheDocument();
    expect(screen.getAllByText('2026-10-12 01:00 EDT (-04:00)')[0]).toBeInTheDocument();
    expect(screen.getByText('2026-10-12 10:30 IST (+05:30)')).toBeInTheDocument();
  }, 10000);

  it('4. Slot conflict error handling: displays prompt to refresh slots', async () => {
    const mockSlot = {
      startUtc: '2026-10-12T05:00:00.000Z',
      endUtc: '2026-10-12T05:45:00.000Z',
      parentLocalDisplay: '2026-10-12 01:00 EDT (-04:00)',
      parentTimezone: 'America/New_York',
      durationMinutes: 45,
      available: true,
    };

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/send-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ cooldownSeconds: 60 }),
        });
      }
      if (u.includes('/verify-otp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ phoneVerified: true }),
        });
      }
      if (u.includes('/api/trial-requests')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ trialRequestId: 'tr_test_conflict' }),
        });
      }
      if (u.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ slots: [mockSlot] }),
        });
      }
      if (u.includes('/api/bookings')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              code: 'NO_MENTOR_AVAILABLE',
              message: 'No mentors are available for this time. Please choose another slot.',
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <BookTrialPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Parent Full Name/i), {
      target: { value: 'Jane Parent' },
    });
    fireEvent.change(screen.getByLabelText(/Parent Email Address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1555018899' } });
    fireEvent.change(screen.getByLabelText(/Student Grade/i), { target: { value: 'Grade 5' } });
    fireEvent.click(screen.getByLabelText(/Terms of Use/i));
    fireEvent.click(screen.getByLabelText(/Privacy Policy/i));

    const submitBtn = screen.getByRole('button', { name: /Submit & Proceed/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(
      () => {
        expect(screen.getByText(/Verify Parent Phone Number/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.change(screen.getByLabelText(/6-Digit OTP Code/i), { target: { value: '123456' } });
    const otpForm = screen.getByRole('button', { name: /Verify Phone Number/i }).closest('form')!;
    fireEvent.submit(otpForm);

    await waitFor(
      () => {
        expect(screen.getAllByText('2026-10-12 01:00 EDT (-04:00)')[0]).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getAllByText('2026-10-12 01:00 EDT (-04:00)')[0]);

    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /Confirm Trial Class Booking/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirm Trial Class Booking/i }));

    // Assert Conflict Message & Refresh Slots Button
    await waitFor(
      () => {
        expect(screen.getByText(/The selected slot just became unavailable/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Refresh Slots/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }, 10000);
});
