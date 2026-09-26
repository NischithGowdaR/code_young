import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext.js';
import { App } from '../App.js';

// Mock fetch for AuthProvider bootstrap check
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  })
);

describe('Landing Page & Navigation', () => {
  it('renders landing page header, hero, sections, and footer', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    // Hero Section Headline
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Empower Your Child with Fun & Future-Ready Learning/i,
      })
    ).toBeInTheDocument();

    // CTA buttons in hero
    expect(screen.getAllByRole('link', { name: /Book a Free Trial/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Explore Courses/i })).toBeInTheDocument();

    // Why Choose Us section
    expect(screen.getByText('Why Thousands of Parents Trust Us')).toBeInTheDocument();

    // Popular Courses section
    expect(screen.getByText('Explore Our Popular Courses')).toBeInTheDocument();

    // How it works section
    expect(screen.getByText('How CodeYoung Works for Your Child')).toBeInTheDocument();

    // Footer
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it('handles CourseDropdown interactions: click open, Escape key, and click outside', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    const dropdownButton = screen.getByRole('button', { name: /Courses/i });
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(dropdownButton);
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Mathematics/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Coding/i })).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(dropdownButton, { key: 'Escape', code: 'Escape' });
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open again
    fireEvent.click(dropdownButton);
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');

    // Click outside to close
    fireEvent.mouseDown(document.body);
    expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('navigates to placeholder routes correctly', () => {
    render(
      <MemoryRouter initialEntries={['/courses/math']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('STEM Mathematics Course')).toBeInTheDocument();
  });
});
