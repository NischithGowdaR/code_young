import React from 'react';
import { Link } from 'react-router-dom';

export interface CourseCardProps {
  title: string;
  ageRange: string;
  description: string;
  highlights: string[];
  path: string;
  badge: string;
  icon: React.ReactNode;
  image?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  ageRange,
  description,
  highlights,
  path,
  badge,
  icon,
  image,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {image ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-amber-700 shadow-sm border border-amber-200/60 uppercase tracking-wider">
                {badge}
              </span>
            </div>
            <div className="absolute bottom-3 left-3">
              <div className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md text-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                {icon}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 pb-0 flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {badge}
            </span>
          </div>
        )}

        <div className="p-6 pt-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">
            Ages {ageRange}
          </div>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed line-clamp-2">
            {description}
          </p>

          <ul className="space-y-2 mb-2">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-center text-xs text-slate-700 font-medium gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
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
