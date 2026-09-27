import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-base">
                CY
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Code<span className="text-indigo-500">Young</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering K-12 students worldwide with future-ready STEM, Coding, Mathematics,
              Science, and English skills through live interactive classes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-indigo-400 transition-colors">
                  Book Free Trial
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-indigo-400 transition-colors">
                  Parent Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Course Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Our Courses
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses/math" className="hover:text-indigo-400 transition-colors">
                  Mathematics
                </Link>
              </li>
              <li>
                <Link to="/courses/coding" className="hover:text-indigo-400 transition-colors">
                  Coding for Kids
                </Link>
              </li>
              <li>
                <Link to="/courses/english" className="hover:text-indigo-400 transition-colors">
                  English Communication
                </Link>
              </li>
              <li>
                <Link to="/courses/science" className="hover:text-indigo-400 transition-colors">
                  Interactive Science
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact Placeholder */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Legal & Contact
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="hover:text-indigo-400 transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-500">Email: support@codeyoung.example</li>
              <li className="text-xs text-slate-500">Phone: +1 (800) 123-4567</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} CodeYoung Trial Class Booking System. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-slate-400">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-400">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
