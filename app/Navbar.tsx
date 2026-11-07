// File: app/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================================
// 🎛️ EASY HEADER & MENU CUSTOMIZATION PANEL (Yahan se sab kuch badlein)
// ============================================================================
const HEADER_CONFIG = {
  // 1. Logo vs Text Title Switch
  useImageLogo: false,                // Image logo lagana ho toh true karein
  logoImageUrl: '/logo.png',          // public/logo.png mein apni image daalein
  logoWidthPx: 150,                   // Image logo ki चौड़ाई (width)
  
  // 2. Text Title Settings
  siteTitleMain: 'CAREERSATHI',       // Pehla hissa (White color)
  siteTitleAccent: '.COM',            // Doosra hissa (Highlight color)
  siteTagline: 'Sarkari Job & Form Studio',
  titleFontSize: 'text-xl sm:text-2xl', // Options: 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'
  titleMainColor: 'text-white',
  titleAccentColor: 'text-amber-400',

  // 3. Header Bar Background & Height
  headerBgColor: 'bg-slate-900',      // Options: 'bg-slate-900', 'bg-blue-950', 'bg-black'
  headerPaddingY: 'py-3',             // Options: 'py-2' (Compact), 'py-3' (Normal), 'py-4' (Tall)

  // 4. Menu Link Styling
  menuFontSize: 'text-xs sm:text-sm', // Options: 'text-xs', 'text-sm', 'text-base'
  menuTextColor: 'text-slate-200',    // Normal link color
  menuHoverColor: 'hover:text-amber-400 hover:bg-slate-800/80',

  // 5. Navigation Menu Links (Yahan naya link add ya hata sakte hain)
  menuLinks: [
    { name: '🏠 Home', href: '/' },
    { name: '📢 Latest Jobs', href: '/category/latest-jobs' },
    { name: '🎫 Admit Card', href: '/category/admit-card' },
    { name: '🔑 Answer Key', href: '/category/answer-key' },
    { name: '🏆 Results', href: '/category/results' },
    { name: '🎓 Courses', href: '/courses/ssc' },
    { name: '📚 Books', href: '/books/railway' },
  ],

  // 6. Quick Student Tools Sub-Bar (Header ke niche patli strip)
  showQuickToolsStrip: true,
  quickTools: [
    { name: '🤖 1-Tap Form Co-Pilot', href: '/one-tap-form-copilot' },
    { name: '🪪 Passport Photo Maker', href: '/passport-photo-maker' },
    { name: '🗜️ Exact KB PDF Compressor', href: '/pdf-compressor' },
    { name: '✂️ Split PDF', href: '/split-pdf' },
    { name: '⌨️ Typing Test', href: '/typing-test' },
  ],
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin panel (/admin) par public header automatically hide rahega
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`${HEADER_CONFIG.headerBgColor} border-b border-slate-800 sticky top-0 z-50 shadow-lg font-sans`}>
      {/* MAIN HEADER BAR */}
      <div className={`max-w-7xl mx-auto px-4 ${HEADER_CONFIG.headerPaddingY} flex items-center justify-between gap-4`}>
        
        {/* LEFT: LOGO OR SITE TITLE */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {HEADER_CONFIG.useImageLogo ? (
            <img
              src={HEADER_CONFIG.logoImageUrl}
              alt={HEADER_CONFIG.siteTitleMain}
              style={{ width: `${HEADER_CONFIG.logoWidthPx}px` }}
              className="h-auto object-contain"
            />
          ) : (
            <div>
              <div className={`${HEADER_CONFIG.titleFontSize} font-black tracking-tight leading-none ${HEADER_CONFIG.titleMainColor}`}>
                {HEADER_CONFIG.siteTitleMain}
                <span className={HEADER_CONFIG.titleAccentColor}>{HEADER_CONFIG.siteTitleAccent}</span>
              </div>
              {HEADER_CONFIG.siteTagline && (
                <span className="block text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">
                  {HEADER_CONFIG.siteTagline}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* CENTER/RIGHT: DESKTOP MENU LINKS */}
        <nav className="hidden lg:flex items-center gap-1">
          {HEADER_CONFIG.menuLinks.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${HEADER_CONFIG.menuFontSize} font-bold px-3 py-2 rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : `${HEADER_CONFIG.menuTextColor} ${HEADER_CONFIG.menuHoverColor}`
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {/* Highlighted Action Button */}
          <Link
            href="/one-tap-form-copilot"
            className="ml-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow transition"
          >
            ⚡ AI Form Tool
          </Link>
        </nav>

        {/* MOBILE HAMBURGER BUTTON */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/one-tap-form-copilot"
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg"
          >
            ⚡ Form Tool
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-sm font-black"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* QUICK STUDENT TOOLS STRIP (Desktop & Mobile Horizontal Scroll) */}
      {HEADER_CONFIG.showQuickToolsStrip && (
        <div className="bg-slate-950/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-amber-400 font-black uppercase shrink-0">
              🛠️ Free Tools:
            </span>
            {HEADER_CONFIG.quickTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold shrink-0 transition"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 space-y-1.5">
          {HEADER_CONFIG.menuLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-400"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}