import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.js';
import { AdminDashboardPage } from '../pages/AdminDashboardPage.js';
import { AdminMentorsPage } from '../pages/AdminMentorsPage.js';
import { AdminBookingsPage } from '../pages/AdminBookingsPage.js';

describe('Admin Frontend Pages', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockAdminMentor = {
    id: 'm-101',
    name: 'Aarav Sharma',
    email: 'aarav@codeyoung.example',
    timezone: 'Asia/Kolkata',
    active: true,
    maxDailyBookings: 2,
    dailyBookingCount: 1,
    createdAt: new Date().toISOString(),
  };

  const mockAdminBooking = {
    id: 'b-301',
    parentId: 'u-parent-1',
    parentName: 'Jane Parent',
    parentEmail: 'jane@example.com',
    course: 'CODING',
    studentGrade: 'Grade 5',
    startUtc: '2026-10-12T05:00:00.000Z',
    endUtc: '2026-10-12T05:45:00.000Z',
    parentTimezone: 'America/New_York',
    mentorTimezoneSnapshot: 'Asia/Kolkata',
    parentLocalDisplay: '2026-10-12 01:00 EDT (-04:00)',
    mentorLocalDisplay: '2026-10-12 10:30 IST (+05:30)',
    mentorId: 'm-101',
    mentorName: 'Aarav Sharma',
    mentorEmail: 'aarav@codeyoung.example',
    classLink: 'https://meet.codeyoung.example/room/cy-uiconfirmed123',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  it('1. Admin Overview Page rendering & metrics', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/api/admin/mentors')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ mentors: [mockAdminMentor] }),
        });
      }
      if (u.includes('/api/admin/bookings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ bookings: [mockAdminBooking] }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /Admin Overview Dashboard/i })
        ).toBeInTheDocument();
        expect(screen.getByText('Total Mentors')).toBeInTheDocument();
        expect(screen.getByText('Active Mentors')).toBeInTheDocument();
        expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('2. Admin Mentors Page: displays mentor details & toggles active status', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ message: 'Updated', mentor: { ...mockAdminMentor, active: false } }),
        });
      }
      if (u.includes('/api/admin/mentors')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ mentors: [mockAdminMentor] }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminMentorsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /Mentor Management/i })).toBeInTheDocument();
        expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
        expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const deactivateBtn = screen.getByRole('button', { name: /Deactivate Mentor/i });
    fireEvent.click(deactivateBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/status updated to INACTIVE/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('3. Admin Bookings Page: displays bookings & handles cancellation', async () => {
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/api/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
      }
      if (u.includes('/cancel')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              message: 'Cancelled',
              booking: { ...mockAdminBooking, status: 'CANCELLED' },
            }),
        });
      }
      if (u.includes('/api/admin/bookings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ bookings: [mockAdminBooking] }),
        });
      }
      return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminBookingsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /Trial Class Bookings/i })).toBeInTheDocument();
        expect(screen.getByText('Jane Parent')).toBeInTheDocument();
        expect(
          screen.getByText('https://meet.codeyoung.example/room/cy-uiconfirmed123')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click Cancel Booking
    const cancelBtn = screen.getByRole('button', { name: /Cancel Booking/i });
    fireEvent.click(cancelBtn);

    // Confirm Modal
    await waitFor(
      () => {
        expect(screen.getByText(/Cancel Trial Booking\?/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const confirmCancelBtn = screen.getByRole('button', { name: /Yes, Cancel Booking/i });
    fireEvent.click(confirmCancelBtn);

    await waitFor(
      () => {
        expect(
          screen.getByText(/has been cancelled and notification emails sent/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
