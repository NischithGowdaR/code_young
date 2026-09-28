import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Microscope,
  Compass,
  Atom,
} from 'lucide-react';

export const SciencePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      <Header />
      <main className="flex-grow">
        {/* Course Hero Section */}
        <section className="bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 py-12 lg:py-20 border-b border-slate-200/80 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ages 7 – 16 &bull; Interactive Labs &bull; Live 1-on-1 Discovery</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Interactive Science:{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
                    Physics, Chemistry, Biology &amp; Space Labs
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Science is not just textbooks—it is exploration. Our hands-on virtual laboratory
                  curriculum brings forces, molecular reactions, ecosystems, and planetary physics to
                  life with guided experiments and real-world simulations.
                </p>

                {/* Key Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Microscope className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Virtual Labs</div>
                      <div className="text-[10px] text-slate-500">Live Experiments</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                    <Atom className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Physics &amp; Chem</div>
                      <div className="text-[10px] text-slate-500">Deep Concepts</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 col-span-2 sm:col-span-1">
                    <Compass className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Astronomy</div>
                      <div className="text-[10px] text-slate-500">Cosmic Science</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/book"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-emerald-300/40 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>Book a Free Trial Class</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs text-slate-500">100% Free &bull; No Credit Card Required</span>
                </div>
              </div>

              {/* Right Column: High-Res Picture */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 bg-white p-2">
                  <div className="aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden relative">
                    <img
                      src="/images/courses/science_course.jpg"
                      alt="Students conducting interactive science experiments"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>New Course</span>
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
              Interactive Science Discovery Tracks
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Transforming curious questions into evidence-based scientific thinking and practical lab skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Ages 7 – 9: Junior Explorers
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Forces, Habitats &amp; Matter</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                States of matter, magnetism, simple machines, plant biology, and interactive weather simulations.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Interactive Kitchen Science</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Observation &amp; Diagramming</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-emerald-200 ring-2 ring-emerald-500/20 shadow-lg transition-all relative">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
                Ages 10 – 13: Middle Lab
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Energy, Cells &amp; Reactions</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Chemical reactions, cellular biology, electricity &amp; circuits, light refraction, and the solar system.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Virtual Chemical Reaction Labs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Circuit Diagrams &amp; Electricity</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Ages 14 – 16: Senior STEM
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Advanced Mechanics &amp; Genetics</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Newtonian mechanics, thermodynamics, genetics &amp; DNA, organic chemistry basics, and astrophysics.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Scientific Method &amp; Lab Reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Astrophysics &amp; Planetary Physics</span>
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
