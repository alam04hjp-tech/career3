// File: app/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================================
// 🎛️ EASY FOOTER CUSTOMIZATION PANEL (Yahan se Footer text, color & links badlein)
// ============================================================================
const FOOTER_CONFIG = {
  footerBgColor: 'bg-slate-950',       // Background color
  footerTextColor: 'text-slate-400',   // Basic text color
  headingTextColor: 'text-white',      // Column heading color
  brandTitle: 'CAREERSATHI',
  brandAccent: '.COM',
  aboutText:
    'India’s trusted Sarkari Exam portal for instant Job Notifications, Admit Cards, Answer Key Score Calculators, and 100% free browser-based Form Photo & PDF Tools.',
  copyrightText:
    '© 2026 CareerSathi.com — All Rights Reserved. Disclaimer: This portal is for student assistance and is not affiliated with any government organization.',

  examCategories: [
    { name: 'Latest Government Jobs', href: '/category/latest-jobs' },
    { name: 'SSC Recruitment 2026', href: '/category/latest-jobs/ssc-exams' },
    { name: 'Railway RRB Bharti', href: '/category/latest-jobs/railway-rrb-jobs' },
    { name: 'Bihar Sarkari Jobs', href: '/category/latest-jobs/bihar-sarkari-jobs' },
    { name: 'Exam Admit Cards', href: '/category/admit-card' },
    { name: 'Sarkari Results & Cutoff', href: '/category/results' },
  ],

  studentTools: [
    { name: '1-Tap AI Form Co-Pilot', href: '/one-tap-form-copilot' },
    { name: 'Passport Photo & Name/Date Maker', href: '/passport-photo-maker' },
    { name: 'Exact KB PDF Compressor', href: '/pdf-compressor' },
    { name: 'Visual PDF Editor', href: '/pdf-editor' },
    { name: 'CamScanner Style Scan to PDF', href: '/scan-to-pdf' },
    { name: 'Hindi/English PDF to Word OCR', href: '/pdf-to-word' },
  ],

  legalLinks: [
    { name: 'About CareerSathi', href: '/pages/about-us' },
    { name: 'Privacy Policy', href: '/pages/privacy-policy' },
    { name: 'Terms & Disclaimer', href: '/pages/disclaimer' },
    { name: 'Contact Support', href: '/pages/contact-us' },
    { name: '⚙️ Admin CMS', href: '/admin' },
  ],
};

export default function Footer() {
  const pathname = usePathname();

  // Admin panel (/admin) par footer hide rahega
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className={`${FOOTER_CONFIG.footerBgColor} ${FOOTER_CONFIG.footerTextColor} border-t border-slate-800 text-xs mt-auto font-sans`}>
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* COLUMN 1: BRAND & ABOUT */}
        <div className="space-y-3">
          <Link href="/" className="inline-block text-xl font-black text-white tracking-tight">
            {FOOTER_CONFIG.brandTitle}
            <span className="text-amber-400">{FOOTER_CONFIG.brandAccent}</span>
          </Link>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {FOOTER_CONFIG.aboutText}
          </p>
          <div className="pt-1 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              🔒 100% Browser Privacy
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
              ⚡ Zero Server Upload
            </span>
          </div>
        </div>

        {/* COLUMN 2: EXAM SILO LINKS */}
        <div className="space-y-2.5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${FOOTER_CONFIG.headingTextColor}`}>
            📂 Exam Updates &amp; Silos
          </h3>
          <ul className="space-y-2 text-[11px]">
            {FOOTER_CONFIG.examCategories.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-amber-400 transition">
                  › {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 3: STUDENT FORM TOOLS */}
        <div className="space-y-2.5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${FOOTER_CONFIG.headingTextColor}`}>
            🛠️ Free Form &amp; PDF Tools
          </h3>
          <ul className="space-y-2 text-[11px]">
            {FOOTER_CONFIG.studentTools.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-cyan-400 transition">
                  ⚡ {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 4: QUICK LINKS & LEGAL */}
        <div className="space-y-2.5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${FOOTER_CONFIG.headingTextColor}`}>
            🏛️ Quick Links &amp; Legal
          </h3>
          <ul className="space-y-2 text-[11px]">
            {FOOTER_CONFIG.legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white transition">
                  • {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-[11px] text-slate-500">
        {FOOTER_CONFIG.copyrightText}
      </div>
    </footer>
  );
}