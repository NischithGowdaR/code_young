import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface CourseOption {
  name: string;
  path: string;
  description: string;
}

const COURSES: CourseOption[] = [
  { name: 'Mathematics', path: '/courses/math', description: 'Logic, mental math & Olympiad' },
  { name: 'Coding', path: '/courses/coding', description: 'Python, Scratch, Web & AI' },
  { name: 'English', path: '/courses/english', description: 'Public speaking & creative writing' },
  { name: 'Science', path: '/courses/science', description: 'Interactive physics, chem & bio' },
];

export const CourseDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const location = useLocation();

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLUListElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const isCourseActive = COURSES.some((c) => location.pathname === c.path);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="courses-dropdown-menu"
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isCourseActive || isOpen
            ? 'text-indigo-600 bg-indigo-50 font-semibold'
            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
        }`}
      >
        <span>Courses</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          ref={menuRef}
          id="courses-dropdown-menu"
          role="menu"
          onKeyDown={handleKeyDown}
          aria-orientation="vertical"
          className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 focus:outline-none z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {COURSES.map((course) => (
            <li key={course.path} role="none">
              <Link
                to={course.path}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 ${
                  location.pathname === course.path
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-800'
                }`}
              >
                <div className="font-medium">{course.name}</div>
                <div className="text-xs text-slate-500 font-normal mt-0.5">
                  {course.description}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
