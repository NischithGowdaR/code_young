import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { HeroSection } from '../components/HeroSection.js';
import { FeatureCard } from '../components/FeatureCard.js';
import { CourseCard } from '../components/CourseCard.js';
import { HowItWorks } from '../components/HowItWorks.js';
import { CallToAction } from '../components/CallToAction.js';
import { Footer } from '../components/Footer.js';
import { useAuth } from '../context/AuthContext.js';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased text-slate-900">
      {/* Header & Navbar */}
      <Header />

      {/* Main Body */}
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* Why Choose Us Section */}
        <section className="py-16 lg:py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                The CodeYoung Advantage
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why Thousands of Parents Trust Us
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon="🌟"
                title="Certified Expert Mentors"
                description="Handpicked, vetted educators passionate about nurturing young talent through engaging interactive pedagogy."
              />
              <FeatureCard
                icon="🚀"
                title="STEM & Future-Ready"
                description="Curriculum designed around practical problem-solving, logic, coding, and real-world application."
              />
              <FeatureCard
                icon="🎯"
                title="1-on-1 & Small Groups"
                description="Personalized attention customized to your child's learning speed, interest, and unique cognitive style."
              />
              <FeatureCard
                icon="📊"
                title="Parent Progress Tracking"
                description="Comprehensive feedback reports, milestone tracking, and project showcases after every learning module."
              />
            </div>
          </div>
        </section>

        {/* Popular Courses Section */}
        <section id="courses" className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                Curriculum Designed for Success
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Explore Our Popular Courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <CourseCard
                icon="💻"
                title="Coding for Kids"
                ageRange="6 – 17"
                description="Build games, apps, Python scripts, and learn fundamentals of AI & Web Development."
                highlights={['Scratch & Block Coding', 'Python & JavaScript', 'AI & Game Logic']}
                path="/courses/coding"
                badge="Most Popular"
              />
              <CourseCard
                icon="📐"
                title="STEM Mathematics"
                ageRange="5 – 16"
                description="Master mental math tricks, logic puzzles, spatial reasoning, and Math Olympiads."
                highlights={['Mental Math Tricks', 'Logic & Aptitude', 'Olympiad Prep']}
                path="/courses/math"
                badge="High Demand"
              />
              <CourseCard
                icon="🗣️"
                title="English Communication"
                ageRange="5 – 15"
                description="Develop strong vocabulary, public speaking, creative writing, and persuasive speech."
                highlights={['Public Speaking', 'Phonics & Grammar', 'Creative Writing']}
                path="/courses/english"
                badge="Interactive"
              />
              <CourseCard
                icon="🔬"
                title="Interactive Science"
                ageRange="7 – 16"
                description="Discover the wonders of Physics, Chemistry, Biology, and astronomy through virtual labs."
                highlights={[
                  'Virtual Experiment Labs',
                  'Physics & Chemistry',
                  'Real-world Science',
                ]}
                path="/courses/science"
                badge="New"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Final Call to Action */}
        <CallToAction />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
