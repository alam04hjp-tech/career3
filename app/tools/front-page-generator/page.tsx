'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

type TemplateStyle = 'academic' | 'tech' | 'biodata' | 'minimal';
type BorderStyle = 'classic' | 'double' | 'gradient' | 'none';

export default function FrontPageGeneratorStudio() {
  const [template, setTemplate] = useState<TemplateStyle>('academic');
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('double');
  const [accentColor, setAccentColor] = useState<string>('#1e3a8a');

  const [institution, setInstitution] = useState<string>('National Institute of Technology (NIT), Patna');
  const [department, setDepartment] = useState<string>('Department of Computer Science & Engineering');
  const [reportType, setReportType] = useState<string>('Major Project Report / Assignment');
  const [title, setTitle] = useState<string>('AI-Powered Student Utility Portal & Cloud Deployment Suite');
  const [subtitle, setSubtitle] = useState<string>('Submitted in partial fulfillment of the requirements for the degree of Bachelor of Technology');
  
  const [authorName, setAuthorName] = useState<string>('Er. Rahul Kumar Sharma');
  const [rollNo, setRollNo] = useState<string>('210405102');
  const [semester, setSemester] = useState<string>('8th Semester (Final Year)');
  const [sessionYear, setSessionYear] = useState<string>('2025 – 2026');

  const [guideName, setGuideName] = useState<string>('Dr. Alok Kumar Sinha');
  const [guideDesignation, setGuideDesignation] = useState<string>('Professor & Head of Department');

  const [techStack, setTechStack] = useState<string>('Next.js, React, TypeScript, Tailwind CSS, PDF-Lib, Vercel Cloud');

  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleLoadSample = () => {
    setInstitution('National Institute of Technology (NIT), Patna');
    setDepartment('Department of Computer Science & Engineering');
    setTitle('CareerSathi: All-in-One Student Portal & Exam Form Toolkit');
    setAuthorName('Er. Rahul Kumar Sharma');
    setRollNo('210405102');
    setGuideName('Dr. Alok Kumar Sinha');
  };

  // Zero-Dependency Print / Save as PDF via Browser Native Engine
  const handlePrintOrPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Print-Only Styling Injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-cover, #printable-cover * {
            visibility: visible;
          }
          #printable-cover {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 40px;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-blue-400 transition"
            >
              ← CareerSathi Home
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                🎓 AI Front Page &amp; Project Cover Generator{' '}
                <span className="text-[11px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-black">
                  PRO STUDIO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Design stunning academic assignment covers &amp; project reports instantly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl transition"
          >
            ✨ Load Demo Data
          </button>
        </div>

        {/* Main Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: CONTROLS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-black text-white uppercase text-[11px]">
                1. Choose Cover Template
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'academic', title: '🎓 University Assignment' },
                  { id: 'tech', title: '💻 B.Tech / Code Report' },
                  { id: 'biodata', title: '📜 Professional Bio-Data' },
                  { id: 'minimal', title: '✨ Modern Minimal' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as TemplateStyle)}
                    className={`p-3 rounded-xl border text-left font-bold transition ${
                      template === t.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-black text-white uppercase text-[11px]">
                2. Theme &amp; Border Style
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'double', label: 'Double Line' },
                  { id: 'classic', label: 'Classic' },
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'none', label: 'Clean' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBorderStyle(b.id as BorderStyle)}
                    className={`py-2 px-1 rounded-xl font-bold border text-center ${
                      borderStyle === b.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 font-bold">Primary Accent Color:</span>
                <div className="flex gap-2">
                  {['#1e3a8a', '#0f766e', '#7c2d12', '#4c1d95', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        accentColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-black text-white uppercase text-[11px]">
                3. Institution &amp; Details
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Institution / University Name</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Department / Stream</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Report Type / Subtitle</label>
                <input
                  type="text"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Project Main Title</label>
                <textarea
                  rows={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              {template === 'tech' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Tech Stack / Tools Used</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Author Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Roll No</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Submitted To (Guide)</label>
                  <input
                    type="text"
                    value={guideName}
                    onChange={(e) => setGuideName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Session / Year</label>
                  <input
                    type="text"
                    value={sessionYear}
                    onChange={(e) => setSessionYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: LIVE A4 PREVIEW (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-amber-400">👀 Live A4 Page Preview (Print Ready)</span>
              <button
                type="button"
                onClick={handlePrintOrPdf}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg transition"
              >
                🖨️ Print / Save as A4 PDF
              </button>
            </div>

            {/* A4 Printable Render Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center overflow-auto">
              <div
                id="printable-cover"
                ref={previewRef}
                className="w-[595px] h-[842px] bg-white text-slate-900 p-10 flex flex-col justify-between relative shadow-2xl select-none shrink-0"
                style={{
                  border:
                    borderStyle === 'double'
                      ? `6px double ${accentColor}`
                      : borderStyle === 'classic'
                      ? `3px solid ${accentColor}`
                      : borderStyle === 'gradient'
                      ? '6px solid transparent'
                      : 'none',
                }}
              >
                <div className="text-center space-y-2 pt-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-2xl shadow-inner">
                    🏛️
                  </div>
                  <h2 className="text-lg font-extrabold uppercase tracking-wide" style={{ color: accentColor }}>
                    {institution}
                  </h2>
                  <p className="text-xs font-bold text-slate-600 tracking-wider">{department}</p>
                  <div className="w-32 h-1 mx-auto rounded-full my-3" style={{ backgroundColor: accentColor }} />
                  <span className="inline-block px-4 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-300">
                    {reportType}
                  </span>
                </div>

                <div className="text-center space-y-4 my-auto px-6">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug">
                    {title}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {subtitle}
                  </p>
                  {template === 'tech' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 inline-block">
                      ⚡ <strong className="text-slate-900">Tech Stack:</strong> {techStack}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted By:</span>
                    <div className="font-extrabold text-slate-900 text-sm">{authorName}</div>
                    <div className="text-slate-600 font-medium">Roll No: {rollNo}</div>
                    <div className="text-slate-600 font-medium">{semester}</div>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted To:</span>
                    <div className="font-extrabold text-slate-900 text-sm">{guideName}</div>
                    <div className="text-slate-600 font-medium">{guideDesignation}</div>
                    <div className="text-slate-600 font-medium">Session: {sessionYear}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}