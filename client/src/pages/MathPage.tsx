import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  Target,
} from 'lucide-react';

export const MathPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      <Header />
      <main className="flex-grow">
        {/* Course Hero Section */}
        <section className="bg-gradient-to-b from-amber-50/60 via-white to-slate-50 py-12 lg:py-20 border-b border-slate-200/80 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ages 5 – 16 &bull; High Demand &bull; Live 1-on-1 Mentorship</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  STEM Mathematics:{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600">
                    Master Mental Math, Logic &amp; Olympiads
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Replace math anxiety with genuine intuition and excitement. Our proven pedagogy
                  empowers students to solve multi-step problems mentally, master geometry &amp; algebra,
                  and excel in competitive mathematics competitions worldwide.
                </p>

                {/* Key Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Speed &amp; Logic</div>
                      <div className="text-[10px] text-slate-500">Mental Shortcuts</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Brain className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Aptitude</div>
                      <div className="text-[10px] text-slate-500">Problem Solving</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 col-span-2 sm:col-span-1">
                    <Target className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Olympiad Prep</div>
                      <div className="text-[10px] text-slate-500">Global Standards</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/book"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl hover:shadow-amber-300/40 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>Book a Free Trial Class</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-500">100% Free &bull; No Credit Card Required</span>
                </div>
              </div>

              {/* Right Column: High-Res Picture */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-amber-100 bg-white p-2">
                  <div className="aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden relative">
                    <img
                      src="/images/courses/math_course.jpg"
                      alt="Student mastering STEM math and geometry"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>High Demand</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Levels */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Progressive STEM Mathematics Tracks
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Building conceptual intuition, spatial awareness, and algorithmic calculation speeds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Ages 5 – 8: Foundational
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Number Sense &amp; Visual Logic</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Patterns, 2D/3D shapes, place values, and intuitive addition/subtraction through gamified manipulatives.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Pattern Recognition &amp; Grouping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Early Mental Calculation</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-amber-200 ring-2 ring-amber-500/20 shadow-lg transition-all relative">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">
                Ages 9 – 12: Intermediate
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Mental Math &amp; Pre-Algebra</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Fractions, decimals, percentages, geometric proofs, and decoding multi-step word problems with ease.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Vedic &amp; Rapid Mental Math</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Word Problem Solving Strategies</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Ages 13 – 16: Advanced
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Olympiad &amp; Advanced Algebra</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Trigonometry, coordinate geometry, combinatorics, and rigorous Olympiad competition problem sets.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Olympiad Math Techniques</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Abstract Reasoning &amp; Logic</span>
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
