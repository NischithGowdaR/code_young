import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  Laptop,
  Flame,
} from 'lucide-react';

export const CodingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      <Header />
      <main className="flex-grow">
        {/* Course Hero Section */}
        <section className="bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 py-12 lg:py-20 border-b border-slate-200/80 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ages 6 – 17 &bull; Live 1-on-1 &amp; Small Group</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Coding for Kids &amp; Teens:{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                    From Game Logic to Real Python &amp; AI
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Turn your child’s passive screen time into active creation. Our STEM-certified coding
                  program guides learners step-by-step from interactive block coding to text-based
                  Python, web development, algorithms, and artificial intelligence.
                </p>

                {/* Key Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Laptop className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Hands-on</div>
                      <div className="text-[10px] text-slate-500">Real Projects</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Accredited</div>
                      <div className="text-[10px] text-slate-500">STEM Certified</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 col-span-2 sm:col-span-1">
                    <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">1:1 Mentors</div>
                      <div className="text-[10px] text-slate-500">Live Guidance</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/book"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-indigo-300/40 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>Book a Free Trial Class</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-500">100% Free &bull; No Credit Card Required</span>
                </div>
              </div>

              {/* Right Column: High-Res Picture */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-indigo-100 bg-white p-2">
                  <div className="aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden relative">
                    <img
                      src="/images/courses/coding_course.jpg"
                      alt="Student coding and learning with laptop"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Levels Grid */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Structured Coding Learning Roadmap
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Progressive modules designed to nurture computational thinking from fundamentals to production code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Level 1: Ages 6 – 9
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Visual &amp; Block Coding</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Master sequencing, loops, variables, and coordinate grids by designing custom animated stories and arcade games in Scratch.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Interactive 2D Game Design</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Conditional Logic &amp; Events</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-indigo-200 ring-2 ring-indigo-500/20 shadow-lg transition-all relative">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Level 2: Ages 10 – 13
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Python &amp; App Development</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Transition to real text code. Build CLI utilities, automation scripts, turtle graphics, and web applications using Python &amp; HTML/CSS.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Python Syntax &amp; Data Structures</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Web Basics (HTML, CSS, JS)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                Level 3: Ages 14 – 17
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">AI, Algorithms &amp; Robotics</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Explore machine learning models, API integration, data science charts, and computer vision with hands-on mentor supervision.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Machine Learning Basics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Capstone Portfolio Project</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
