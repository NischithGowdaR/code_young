import React from 'react';
import { Link } from 'react-router-dom';

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

          {/* Right Column: Original SVG Graphic Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col justify-between border border-white/20">
              {/* Decorative Geometric Patterns */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl" />

              {/* Code Snippet Box */}
              <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/10 font-mono text-xs text-indigo-300 space-y-1.5 z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 text-[10px] ml-auto">
                    CodeYoung Interactive Lab
                  </span>
                </div>
                <div>
                  <span className="text-pink-400">const</span>{' '}
                  <span className="text-amber-300">futureLeader</span> ={' '}
                  <span className="text-sky-300">new</span> Student();
                </div>
                <div>
                  <span className="text-indigo-400">futureLeader</span>.
                  <span className="text-emerald-300">learn</span>(['Coding', 'Math', 'Science']);
                </div>
                <div className="text-emerald-400 font-bold">// Status: Ready to Launch! 🚀</div>
              </div>

              {/* Subject Badges */}
              <div className="grid grid-cols-2 gap-3 z-10 my-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white flex items-center gap-2">
                  <span className="text-xl">💻</span>
                  <div>
                    <div className="text-xs font-bold">Coding</div>
                    <div className="text-[10px] text-white/80">Python & AI</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white flex items-center gap-2">
                  <span className="text-xl">📐</span>
                  <div>
                    <div className="text-xs font-bold">STEM Math</div>
                    <div className="text-[10px] text-white/80">Mental & Logic</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white flex items-center gap-2">
                  <span className="text-xl">🔬</span>
                  <div>
                    <div className="text-xs font-bold">Science</div>
                    <div className="text-[10px] text-white/80">Hands-on Labs</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white flex items-center gap-2">
                  <span className="text-xl">🗣️</span>
                  <div>
                    <div className="text-xs font-bold">English</div>
                    <div className="text-[10px] text-white/80">Public Speaking</div>
                  </div>
                </div>
              </div>

              {/* Floating Achievement Banner */}
              <div className="bg-white text-slate-900 rounded-xl p-3 shadow-lg flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold">1-on-1 Free Class</div>
                    <div className="text-[10px] text-slate-500">Live mentor feedback</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  FREE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
