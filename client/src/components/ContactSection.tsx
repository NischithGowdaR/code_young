import React, { useState } from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Building2,
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200/80 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Headline & Intro */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/90 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
            <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Get in Touch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Contact Us
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Have questions about our curriculum, mentor availability, or your child&apos;s trial session?
            Our friendly learning advisory team is here to assist you every step of the way.
          </p>
        </div>

        {/* 2. General Inquiries Section */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-900/5 border border-slate-200/80 max-w-5xl mx-auto">
            <div className="text-center md:text-left mb-8">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Quick Assistance
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Not sure where to start?
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
                If you&apos;re unsure which team member or department to contact, simply reach out
                through either channel below. Your inquiry will be immediately routed to the right
                specialist for a prompt response.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* WhatsApp / Live Chat Card */}
              <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white rounded-2xl p-6 sm:p-8 border border-emerald-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-300 group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Instant Response
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    WhatsApp &amp; Live Chat
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Message us on WhatsApp for fast answers about trial classes, scheduling, and course roadmaps.
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-100 mb-6">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-wide flex-grow">
                      +91 88844 59977
                    </span>
                    <button
                      type="button"
                      aria-label="Copy WhatsApp phone number"
                      onClick={() => copyToClipboard('+918884459977', 'whatsapp')}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      {copiedItem === 'whatsapp' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href="https://wa.me/918884459977"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="tel:+918884459977"
                    className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 text-center"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Us</span>
                  </a>
                </div>
              </div>

              {/* General Support Email Card */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-white rounded-2xl p-6 sm:p-8 border border-indigo-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all duration-300 group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100/90 text-indigo-800 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Within 24 Hours
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    General Inquiries &amp; Support
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Write to us for curriculum counseling, mentor inquiries, or general parent support.
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-indigo-100 mb-6">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-wide flex-grow truncate">
                      support@codeyoung.com
                    </span>
                    <button
                      type="button"
                      aria-label="Copy support email address"
                      onClick={() => copyToClipboard('support@codeyoung.com', 'support')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {copiedItem === 'support' ? (
                        <Check className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href="mailto:support@codeyoung.com"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send an Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Escalation / Support Promise Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Our Parent Commitment</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  We&apos;re Here at Every Step
                </h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                  Your family&apos;s peace of mind and satisfaction come first. We have instituted a
                  transparent escalation protocol so no issue ever goes unresolved.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level 1 Escalation Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          Level 1 Escalation
                        </span>
                        <h4 className="text-base font-bold text-white">
                          Grievance Redressal Officer
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                      If your query or concern has not been resolved within <strong className="text-white font-semibold">72 hours</strong>,
                      our dedicated Grievance Redressal Officer will take ownership immediately to review
                      and rectify the situation.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Direct Email:</span>
                    <a
                      href="mailto:grievances@codeyoung.com"
                      className="text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4 transition-colors font-mono"
                    >
                      grievances@codeyoung.com
                    </a>
                  </div>
                </div>

                {/* Level 2 Escalation Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                          Level 2 Escalation
                        </span>
                        <h4 className="text-base font-bold text-white">
                          Co-founder&apos;s Direct Desk
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                      In the rare event that an issue remains unresolved after <strong className="text-white font-semibold">7 days</strong>,
                      our Co-founder will personally step in to ensure a swift, fair, and decisive resolution.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Executive Email:</span>
                    <a
                      href="mailto:rupika@codeyoung.com"
                      className="text-xs sm:text-sm font-semibold text-purple-300 hover:text-purple-200 underline underline-offset-4 transition-colors font-mono"
                    >
                      rupika@codeyoung.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Company Registration Info */}
        <div className="max-w-5xl mx-auto text-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Codeyoung (Entity Info) &bull;</span>
            <span className="font-mono font-medium text-slate-600">CIN: U80904KA2020PTC132006</span>
          </div>
        </div>
      </div>
    </section>
  );
};
