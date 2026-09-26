import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from '../../client/src/context/AuthContext.js';
import { App } from '../../client/src/App.js';

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  })
);

describe('Frontend Integration Tests', () => {
  it('renders landing page correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Empower Your Child with Fun & Future-Ready Learning/i,
      })
    ).toBeInTheDocument();
  });
});
