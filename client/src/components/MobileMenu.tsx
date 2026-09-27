import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Shield, LayoutDashboard } from 'lucide-react';

export const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const closeMenu = () => {
    setIsOpen(false);
    setIsCoursesOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg px-4 py-4 space-y-3 z-50 animate-in slide-in-from-top-2 duration-150">
          <Link
            to="/"
            onClick={closeMenu}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === '/'
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>

          <div>
            <button
              type="button"
              onClick={() => setIsCoursesOpen((prev) => !prev)}
              className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Courses</span>
              <svg
                className={`w-5 h-5 transition-transform ${isCoursesOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isCoursesOpen && (
              <div className="pl-4 mt-1 space-y-1 border-l-2 border-indigo-100 ml-3">
                <Link
                  to="/courses/math"
                  onClick={closeMenu}
                  className="block px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  Mathematics
                </Link>
                <Link
                  to="/courses/coding"
                  onClick={closeMenu}
                  className="block px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  Coding
                </Link>
                <Link
                  to="/courses/english"
                  onClick={closeMenu}
                  className="block px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  English
                </Link>
                <Link
                  to="/courses/science"
                  onClick={closeMenu}
                  className="block px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  Science
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <div className="space-y-2">
                {user.role === 'ADMIN' ? (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-100 text-purple-700 font-bold text-sm rounded-xl hover:bg-purple-200 border border-purple-300"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Portal</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 border border-indigo-200"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Parent Dashboard</span>
                    </Link>
                    <Link
                      to="/book"
                      onClick={closeMenu}
                      className="block text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow"
                    >
                      Book a Free Trial
                    </Link>
                  </>
                )}
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium text-center">
                  Signed in as <strong className="text-slate-800">{user.name}</strong> ({user.role})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full text-center px-4 py-2.5 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/book"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm rounded-lg shadow hover:opacity-95"
                >
                  Book a Free Trial
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2 border border-indigo-200 text-indigo-600 font-medium text-sm rounded-lg hover:bg-indigo-50"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
