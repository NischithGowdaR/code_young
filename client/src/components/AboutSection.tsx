import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Quote,
  Award,
  Calendar,
  PhoneCall,
  ArrowRight,
  GraduationCap,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-gradient-to-b from-white via-indigo-50/30 to-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-violet-100/50 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Headline & 2. Mission / Belief with Left & Right Innovative Parent-Child Visuals */}
        <div className="mb-20 lg:mb-24">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>About Codeyoung</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Our Story &amp; Passion for Empowering Kids
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center max-w-6xl mx-auto">
            {/* Left Image: Parent & Child Coding */}
            <div className="lg:col-span-3 order-2 lg:order-1 max-w-md mx-auto w-full">
              <div className="relative group rounded-3xl overflow-hidden shadow-xl border border-slate-100/80 bg-white p-2">
                <div className="aspect-[16/10] sm:aspect-[4/3] lg:aspect-[3/4] rounded-2xl overflow-hidden relative">
                  <img
                    src="/images/about/family_coding.jpg"
                    alt="Parent and child exploring interactive coding together"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                    <span className="text-white text-xs font-bold leading-tight">
                      Creative Coding &amp; Logic
                    </span>
                    <span className="text-indigo-200 text-[10px] sm:text-[11px]">
                      Parent-guided discovery
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Mission & Belief Statement */}
            <div className="lg:col-span-6 order-1 lg:order-2 text-center bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 border border-indigo-100/80 shadow-xl shadow-indigo-950/5 relative">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 sm:mb-4 shadow-inner">
                <Quote className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-sm sm:text-base lg:text-xl text-slate-700 leading-relaxed font-medium">
                &ldquo;We firmly believe that today’s children are tomorrow’s bold innovators and changemakers.
                Our mission is to empower young minds through simplified, highly engaging, and practical
                education that strips away complexity and sparks genuine curiosity. By providing
                mentor-guided exploration, we unlock each child’s unique learning potential and help
                them thrive in an ever-evolving world.&rdquo;
              </p>
              <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold text-indigo-700">
                <span className="w-6 sm:w-8 h-0.5 bg-indigo-200 rounded-full" />
                <span>The Codeyoung Learning Philosophy</span>
                <span className="w-6 sm:w-8 h-0.5 bg-indigo-200 rounded-full" />
              </div>
            </div>

            {/* Right Image: Parent & Child Robotics */}
            <div className="lg:col-span-3 order-3 max-w-md mx-auto w-full">
              <div className="relative group rounded-3xl overflow-hidden shadow-xl border border-slate-100/80 bg-white p-2">
                <div className="aspect-[16/10] sm:aspect-[4/3] lg:aspect-[3/4] rounded-2xl overflow-hidden relative">
                  <img
                    src="/images/about/family_robotics.jpg"
                    alt="Parent and child building STEM and robotics projects"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                    <span className="text-white text-xs font-bold leading-tight">
                      STEM &amp; Robotics Hands-on
                    </span>
                    <span className="text-amber-200 text-[10px] sm:text-[11px]">
                      Future-ready skills
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Meet the Founders */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Meet the Founders Behind the Vision
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl mx-auto">
              Driven by their background at IIT Delhi, our founders set out to build an educational
              experience where every child discovers the joy of creating and problem-solving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
            {/* Founder 1: Shailendra Dhakad */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-950/5 border border-slate-100 flex flex-col justify-between relative group hover:border-indigo-200 transition-all duration-300">
              <div className="absolute top-6 right-6 text-indigo-100 group-hover:text-indigo-200 transition-colors">
                <Quote className="w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center gap-4 sm:gap-5 mb-6">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/10 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all shrink-0">
                    <img
                      src="/images/founders/shailendra_dhakad.png"
                      alt="Shailendra Dhakad – Co-founder & CEO"
                      className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Shailendra Dhakad
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-indigo-600">Co-founder &amp; CEO</p>
                    <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      <span>IIT Delhi</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed italic relative z-10">
                  &ldquo;True education should unlock new capabilities for young learners, equipping
                  them with the confidence and practical skills to accomplish things they never thought
                  possible before.&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Product Architecture &amp; Vision</span>
              </div>
            </div>

            {/* Founder 2: Rupika Taneja */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-950/5 border border-slate-100 flex flex-col justify-between relative group hover:border-indigo-200 transition-all duration-300">
              <div className="absolute top-6 right-6 text-indigo-100 group-hover:text-indigo-200 transition-colors">
                <Quote className="w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center gap-4 sm:gap-5 mb-6">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-tr from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/10 ring-4 ring-violet-50 group-hover:ring-violet-100 transition-all shrink-0">
                    <img
                      src="/images/founders/rupika_taneja.png"
                      alt="Rupika Taneja – Co-founder & COO"
                      className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Rupika Taneja
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-indigo-600">Co-founder &amp; COO</p>
                    <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      <span>IIT Delhi</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed italic relative z-10">
                  &ldquo;When we patiently nurture a child’s natural creative instincts and guide them
                  with structured mentorship, we build resilient, future-ready leaders.&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Learning Operations &amp; Student Mentorship</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. The Journey */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl mb-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Our Journey Since 2019</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                From a Bold Dream to a Global Learning Community
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Codeyoung was founded at the end of 2019 with a simple yet ambitious goal: to give
                parents the highest standard of support in guiding their child’s academic and creative
                journey. Over the years, our student-centric approach has garnered prestigious
                accolades from global education bodies and earned deep trust from thousands of families
                across the globe.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Today, more than <strong className="text-slate-900 font-bold">20,000+ students</strong> are
                actively enrolled and learning through our platform, forming an ever-expanding international
                family of young problem solvers.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">20,000+</div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Enrolled Students</div>
                <p className="text-[11px] text-slate-500 mt-1">Thriving globally</p>
              </div>

              <div className="p-5 rounded-2xl bg-violet-50/70 border border-violet-100 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-violet-600">2019</div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Year Founded</div>
                <p className="text-[11px] text-slate-500 mt-1">Proven track record</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800">Global Recognition</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Top-tier EdTech accolades</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800">Parent Approved</div>
                <p className="text-[11px] text-slate-500 mt-0.5">High satisfaction rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Call-To-Action (CTA) */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle glow circle */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left space-y-3">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Join thousands of happy parents to provide quality, effective learning to your child today.
              </h3>
              <p className="text-indigo-200 text-sm sm:text-base">
                Discover how our personalized 1-on-1 and small group live classes unlock your child’s
                full potential.
              </p>
              <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-indigo-200 text-xs sm:text-sm">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Need guidance? Call us at: </span>
                <a
                  href="tel:+918884459977"
                  className="font-bold text-white hover:text-amber-300 underline underline-offset-4 transition-colors"
                >
                  +91-88844-59977
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/book"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Book a FREE trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-indigo-300 text-center">
                100% Free • No Credit Card Required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
