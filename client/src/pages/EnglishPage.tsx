import React from 'react';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';

export const EnglishPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl mx-auto">
            🗣️
          </div>
          <h1 className="text-3xl font-bold text-slate-900">English Communication</h1>
          <p className="text-sm text-slate-600">
            Build confidence through public speaking, phonics, grammar, debate, and creative
            writing.
          </p>
          <div className="p-3 bg-violet-50 text-violet-800 rounded-lg text-xs font-semibold">
            Status: Course Placeholder Route (/courses/english)
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
