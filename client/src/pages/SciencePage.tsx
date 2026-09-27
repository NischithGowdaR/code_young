import React from 'react';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { FlaskConical } from 'lucide-react';

export const SciencePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <FlaskConical className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Interactive Science</h1>
          <p className="text-sm text-slate-600">
            Explore Physics, Chemistry, Biology, and Astronomy through interactive experiments and
            virtual labs.
          </p>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
            Status: Course Placeholder Route (/courses/science)
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
