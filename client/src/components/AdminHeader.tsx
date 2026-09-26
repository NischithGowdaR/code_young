import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Overview', path: '/admin' },
    { label: 'Mentors', path: '/admin/mentors' },
    { label: 'Bookings', path: '/admin/bookings' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              CY
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              CodeYoung <span className="text-amber-400">Admin</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Control Center
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right text-xs">
            <div className="font-bold text-slate-200">{user?.name || 'Administrator'}</div>
            <div className="text-slate-400 text-[11px]">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
