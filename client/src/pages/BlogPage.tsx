import React from 'react';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { BlogSection } from '../components/BlogSection.js';

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased text-slate-800">
      <Header />
      <main className="flex-grow">
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
};
