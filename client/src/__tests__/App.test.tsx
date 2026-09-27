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

    // About Us section
    expect(screen.getByText('Our Story & Passion for Empowering Kids')).toBeInTheDocument();
    expect(screen.getByText('Meet the Founders Behind the Vision')).toBeInTheDocument();
    expect(screen.getByText('Shailendra Dhakad')).toBeInTheDocument();
    expect(screen.getByText('Rupika Taneja')).toBeInTheDocument();
    expect(screen.getByText('Our Journey Since 2019')).toBeInTheDocument();

    // Blog & Insights section
    expect(screen.getByText('Insights for Parents & Young Learners')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coding For Kids & Teens' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Financial Literacy for Kids' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English For Kids' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Science For Kids' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Math For Kids' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parenting Tips' })).toBeInTheDocument();
    expect(screen.getByText('Ananya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kulkarni')).toBeInTheDocument();
    expect(screen.getByText(/Turn your child’s curiosity into creativity/i)).toBeInTheDocument();

    // Contact Us section
    expect(screen.getByRole('heading', { level: 2, name: /Contact Us/i })).toBeInTheDocument();
    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp & Live Chat')).toBeInTheDocument();
    expect(screen.getByText('support@codeyoung.com')).toBeInTheDocument();
    expect(screen.getByText("We're Here at Every Step")).toBeInTheDocument();
    expect(screen.getByText('grievances@codeyoung.com')).toBeInTheDocument();
    expect(screen.getByText('rupika@codeyoung.com')).toBeInTheDocument();
    expect(screen.getAllByText(/CIN: U80904KA2020PTC132006/i).length).toBeGreaterThan(0);

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

  it('navigates to dedicated /contact route correctly', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2, name: /Contact Us/i })).toBeInTheDocument();
    expect(screen.getByText('Not sure where to start?')).toBeInTheDocument();
    expect(screen.getByText('support@codeyoung.com')).toBeInTheDocument();
    expect(screen.getByText('grievances@codeyoung.com')).toBeInTheDocument();
    expect(screen.getByText('rupika@codeyoung.com')).toBeInTheDocument();
  });

  it('navigates to dedicated /blog route and filters articles by category tab', () => {
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Codeyoung Perspectives')).toBeInTheDocument();
    expect(screen.getByText('Insights for Parents & Young Learners')).toBeInTheDocument();

    // Filter by 'Financial Literacy for Kids'
    const financeTab = screen.getByRole('button', { name: 'Financial Literacy for Kids' });
    fireEvent.click(financeTab);

    expect(screen.getByText(/Should You Pay Your Child for Doing Chores\?/i)).toBeInTheDocument();
    expect(screen.getByText('Neha Banerjee')).toBeInTheDocument();

    // Reset to 'All Articles'
    const allTab = screen.getByRole('button', { name: 'All Articles' });
    fireEvent.click(allTab);

    expect(screen.getByText(/Is Your Child Ready to Transition Beyond Scratch/i)).toBeInTheDocument();
  });
});
