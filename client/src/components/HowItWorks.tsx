import React from 'react';

const STEPS = [
  {
    step: '01',
    title: 'Book a Free Trial',
    description:
      'Select your preferred subject, date, and timezone for a personalized 1-on-1 trial session.',
  },
  {
    step: '02',
    title: 'Meet Your Mentor',
    description:
      'Connect with a certified expert mentor who tailors the session to your child’s learning style.',
  },
  {
    step: '03',
    title: 'Interactive Session',
    description:
      'Experience live coding, problem solving, or communication exercises through engaging projects.',
  },
  {
    step: '04',
    title: 'Get Assessment & Plan',
    description:
      'Receive detailed feedback and a custom roadmap to continue your child’s educational journey.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
            Simple 4-Step Process
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How CodeYoung Works for Your Child
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl relative hover:border-indigo-500 transition-colors"
            >
              <div className="text-4xl font-black text-indigo-500/40 mb-4 font-mono">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
