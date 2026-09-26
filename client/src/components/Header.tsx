import React from 'react';
import { Navbar } from './Navbar.js';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-100 shadow-sm">
      <Navbar />
    </header>
  );
};
