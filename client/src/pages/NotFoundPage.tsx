import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-xl shadow-md border border-slate-200">
        <h1 className="text-3xl font-bold text-rose-600 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Page Not Found</h2>
        <p className="text-slate-600 text-sm mb-6">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
};
