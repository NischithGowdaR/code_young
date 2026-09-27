import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CourseDropdown } from './CourseDropdown.js';
import { MobileMenu } from './MobileMenu.js';
import { useAuth } from '../context/AuthContext.js';
import { Shield, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-400 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
          CY
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Code<span className="text-indigo-600">Young</span>
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          to="/"
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            location.pathname === '/'
              ? 'text-indigo-600 bg-indigo-50 font-semibold'
              : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          Home
        </Link>

        {/* Courses Dropdown */}
        <CourseDropdown />
      </div>

      {/* Action Buttons */}
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            {user.role === 'ADMIN' ? (
              <Link
                to="/admin"
                className="px-3 py-1.5 text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/book"
                  className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:brightness-110 transition-all shadow-sm"
                >
                  Book a Trial
                </Link>
              </>
            )}
            <span className="text-sm font-medium text-slate-700">
              Hi, <span className="font-semibold text-indigo-600">{user.name}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Register
            </Link>

            <Link
              to="/book"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Book a Free Trial
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <MobileMenu />
    </nav>
  );
};
