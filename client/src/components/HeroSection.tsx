import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Calculator, FlaskConical, MessageSquare, Check, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white py-16 lg:py-24">
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide uppercase shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Live 1-on-1 & Small Group Interactive Classes
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Empower Your Child with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500">
                Fun & Future-Ready
              </span>{' '}
              Learning
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Spark curiosity and build real-world problem-solving skills in Coding, Mathematics,
              Science, and English. Designed for ages 5–17 with world-class mentors.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/book"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-indigo-200 hover:brightness-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span>Book a Free Trial</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>

              <a
                href="#courses"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-800 font-semibold text-base rounded-xl hover:border-indigo-300 hover:bg-slate-50 transition-all text-center"
              >
                Explore Courses
              </a>
            </div>

            {/* Quick Stats Banner */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">50,000+</div>
                <div className="text-xs text-slate-500 font-medium">Happy Students</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">4.9 / 5</div>
                <div className="text-xs text-slate-500 font-medium">Parent Rating</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">100+</div>
                <div className="text-xs text-slate-500 font-medium">Global Mentors</div>
              </div>
            </div>
          </div>

          {/* Right Column: Large Seamless Student Visual with Subtle Innovative Accents */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative mt-4 lg:mt-0">
            {/* Soft Ambient Radial Halo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px] bg-gradient-to-tr from-indigo-200/50 via-violet-200/40 to-amber-200/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-xl flex items-end justify-center">
              {/* Large Seamless Student Image without enclosing border/box */}
              <img
                src="/images/hero/hero_student_cutout.png"
                alt="Codeyoung Student"
                className="w-full max-h-[340px] sm:max-h-[460px] lg:max-h-[580px] object-contain object-bottom relative z-10 drop-shadow-xl hover:scale-[1.02] transition-transform duration-500 ease-out"
                loading="eager"
              />

              {/* Top Compact Floating Badge: Live Coding Lab */}
              <div className="absolute top-2 sm:top-4 left-0 sm:left-2 bg-slate-900/90 backdrop-blur-md rounded-xl py-1.5 px-2.5 sm:px-3 shadow-lg border border-white/15 text-white font-mono text-[9px] sm:text-[10px] space-y-0.5 z-20 hidden xs:block sm:block">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400 text-[8px] sm:text-[9px] font-sans font-medium ml-1">
                    Live Coding Lab
                  </span>
                </div>
                <div>
                  <span className="text-pink-400">const</span> future = <span className="text-sky-300">new</span> Codeyoung();
                </div>
              </div>

              {/* Bottom Compact Floating Badge: 1:1 Live Trial Class */}
              <div className="absolute bottom-2 sm:bottom-6 right-0 sm:right-2 bg-white/95 backdrop-blur-md rounded-xl py-1 px-2.5 sm:py-1.5 sm:px-3 shadow-lg border border-slate-100/90 flex items-center gap-2 z-20 max-w-[90%]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 font-bold" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">
                    Live 1:1 Trial Class
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span>Free Session &bull; Certified Mentor</span>
                  </div>
                </div>
              </div>

              {/* Side Floating Subject Accents */}
              <div className="absolute top-1/3 -right-2 sm:right-0 bg-white/90 backdrop-blur-md rounded-xl p-1 sm:p-1.5 shadow-md border border-slate-100 hidden lg:flex flex-col gap-1 z-20">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                  <Code2 className="w-2.5 h-2.5" />
                  <span>Coding</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-bold">
                  <Calculator className="w-2.5 h-2.5" />
                  <span>Math</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                  <FlaskConical className="w-2.5 h-2.5" />
                  <span>Science</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-[9px] font-bold">
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span>English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
