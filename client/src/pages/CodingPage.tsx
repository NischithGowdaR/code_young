import React from 'react';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { Code2 } from 'lucide-react';

export const CodingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Code2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Coding for Kids</h1>
          <p className="text-sm text-slate-600">
            From Scratch & block coding to Python, Web Development, and Artificial Intelligence.
          </p>
          <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-semibold">
            Status: Course Placeholder Route (/courses/coding)
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
