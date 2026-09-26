import React from 'react';
import { Link } from 'react-router-dom';

export interface CourseCardProps {
  title: string;
  ageRange: string;
  description: string;
  highlights: string[];
  path: string;
  badge: string;
  icon: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  ageRange,
  description,
  highlights,
  path,
  badge,
  icon,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {badge}
          </span>
        </div>

        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Ages {ageRange}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{description}</p>

        <ul className="space-y-2 mb-6">
          {highlights.map((highlight, index) => (
            <li key={index} className="flex items-center text-xs text-slate-700 font-medium gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={path}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          <span>Learn More</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          to="/book"
          className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          Trial Class
        </Link>
      </div>
    </div>
  );
};
