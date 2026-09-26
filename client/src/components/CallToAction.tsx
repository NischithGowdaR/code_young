import React from 'react';
import { Link } from 'react-router-dom';

export const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Ready to Unlock Your Child’s Potential?
        </h2>
        <p className="text-lg text-indigo-100 max-w-2xl mx-auto font-normal">
          Book a 45-minute 1-on-1 live trial class today. Discover how fun and engaging learning can
          be!
        </p>

        <div className="pt-4">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-extrabold text-base rounded-xl shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Book Your Free Trial Now</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        <p className="text-xs text-indigo-200 font-medium">
          No credit card required • Flexible schedule • 100% Satisfaction guarantee
        </p>
      </div>
    </section>
  );
};
