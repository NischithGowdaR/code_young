import React from 'react';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Terms of Use</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Welcome to CodeYoung. By accessing or using our trial class booking system and educational
          platform, you agree to comply with our terms and guidelines.
        </p>
        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          Placeholder Terms of Use document for CodeYoung Trial Class Booking System.
        </div>
      </main>
      <Footer />
    </div>
  );
};
