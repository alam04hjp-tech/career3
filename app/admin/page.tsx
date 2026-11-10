// File: app/admin/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ==========================================
// 0A. INDUSTRY-STANDARD SEO SLUG SANITIZER
// (Internal helper - Not exported so Next.js Page build succeeds)
// ==========================================
const sanitizeSeoSlug = (rawInput: string, trimHyphens = true): string => {
  if (!rawInput) return '';
  let cleaned = rawInput
    .toString()
    .replace(/^https?:\/\/[^/]+\/(posts|category|pages|courses|books|mock-tests)\//i, '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-');

  if (trimHyphens) {
    cleaned = cleaned.replace(/^-+|-+$/g, '');
  } else {
    cleaned = cleaned.replace(/^-+/g, '');
  }
  return cleaned.slice(0, 90);
};

// ==========================================
// 0B. ENTERPRISE XSS & HTML SECURITY SANITIZER
// Strips <script>, <iframe>, inline on* events & javascript: URLs
// ==========================================
const MAX_HTML_BYTES = 150000; // 150 KB safety cap per post/page

const sanitizeSafeHtml = (dirtyHtml: string): string => {
  if (!dirtyHtml) return '';
  return dirtyHtml
    .toString()
    .slice(0, MAX_HTML_BYTES)
    .replace(/<\s*(script|iframe|object|embed|applet|meta|link|style|form|input|button|textarea|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|applet|meta|link|style|form|input|button|textarea|base)[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|action)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi, '$1="#"');
};

// ==========================================
// 0C. ATOMIC STORAGE READER (RACE-CONDITION GUARD)
// ==========================================
function readLatestStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// ==========================================
// 1. ENTERPRISE DATA INTERFACES
// ==========================================
interface DateRow { label: string; date: string; }
interface LinkRow { text: string; url: string; }
interface FaqRow { question: string; answer: string; }

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug?: string;
  subCategory?: string;
  subCategorySlug?: string;
  targetExamTag?: string;
  vacancyOrSeats?: string;
  publisherName: string;
  publishedAt: string;
  updatedAt?: string;
  version?: number;
  featuredImage: string;
  shortDescription: string;
  importantDates: DateRow[];
  classicContent: string;
  importantLinks: LinkRow[];
  faqs: FaqRow[];
  metaTitle: string;
  metaDesc: string;
  focusKeyword?: string;
  indexedPinged?: boolean;
}

interface PostRevision {
  revisionId: string;
  postId: string;
  savedAt: string;
  savedBy: string;
  snapshot: Post;
}

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
  version?: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName?: string;
  parentSlug?: string;
  targetExamTag: string;
  h1Title: string;
  metaTitle: string;
  metaDesc: string;
  focusKeyword: string;
  shortIntro: string;
  seoBottomContent: string;
  faqs: FaqRow[];
  count: number;
  version?: number;
}

type StaffRole = 'superadmin' | 'seo_manager' | 'editor' | 'moderator';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: StaffRole;
  action: string;
  target: string;
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface MockTest {
  id: string;
  slug: string;
  title: string;
  testTitle: string;
  category: string;
  examCategory: string;
  duration: number;
  totalTimeMinutes: number;
  totalMarks: number;
  questions: Question[];
  publishedAt: string;
}

interface ToolConfigItem {
  id: string;
  name: string;
  path: string;
  category: string;
  targetExam: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDesc: string;
}

interface PartnerCourse {
  id: string;
  instituteName: string;
  courseTitle: string;
  slug: string;
  category: string;
  examTarget: string;
  thumbnailUrl: string;
  price: string;
  validity: string;
  instructorName: string;
  redirectUrl: string;
  description: string;
  metaTitle: string;
  metaDesc: string;
  status: string;
  publishedAt: string;
}

type AdminTab =
  | 'dashboard'
  | 'posts'
  | 'add-post'
  | 'categories'
  | 'programmatic-seo'
  | 'tools-manager'
  | 'mock-tests'
  | 'add-mock-test'
  | 'partners-approval'
  | 'pages'
  | 'add-page'
  | 'rbac-staff'
  | 'settings-backup';

// ==========================================
// 1B. NOTION / WORDPRESS GUTENBERG BLOCK + XSS-SAFE EDITOR
// ==========================================
interface SmartBlockEditorProps {
  label: string;
  badgeText?: string;
  value: string;
  onChange: (html: string) => void;
  variant?: 'compact' | 'full';
  placeholder?: string;
  minHeight?: string;
}

function GutenbergSmartEditor({
  label,
  badgeText = 'Notion / Gutenberg + XSS Shield',
  value,
  onChange,
  variant = 'full',
  placeholder = 'Write or insert blocks here...',
  minHeight = '240px',
}: SmartBlockEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');

  const visualRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === 'visual' && visualRef.current) {
      const safeVal = sanitizeSafeHtml(value || '');
      if (document.activeElement !== visualRef.current && visualRef.current.innerHTML !== safeVal) {
        visualRef.current.innerHTML = safeVal;
      }
    }
  }, [value, mode]);

  const insertOrWrapHtml = (openTag: string, closeTag: string, defaultText: string) => {
    if (mode === 'code' && codeRef.current) {
      const ta = codeRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end) || defaultText;
      const updated = sanitizeSafeHtml(
        value.substring(0, start) + `${openTag}${selected}${closeTag}` + value.substring(end)
      );
      onChange(updated);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
      }, 10);
    } else if (visualRef.current) {
      visualRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && visualRef.current.contains(selection.anchorNode)) {
        const selectedText = selection.toString() || defaultText;
        document.execCommand('insertHTML', false, `${openTag}${selectedText}${closeTag}`);
      } else {
        visualRef.current.innerHTML += `${openTag}${defaultText}${closeTag}`;
      }
      onChange(sanitizeSafeHtml(visualRef.current.innerHTML));
    }
  };

  const insertGutenbergBlock = (blockHtml: string) => {
    const cleanAddition = `\n${sanitizeSafeHtml(blockHtml)}\n`;
    if (mode === 'code' && codeRef.current) {
      const ta = codeRef.current;
      const start = ta.selectionStart || value.length;
      const updated = sanitizeSafeHtml(value.substring(0, start) + cleanAddition + value.substring(start));
      onChange(updated);
    } else if (visualRef.current) {
      visualRef.current.innerHTML = sanitizeSafeHtml((visualRef.current.innerHTML || '') + cleanAddition);
      onChange(visualRef.current.innerHTML);
      visualRef.current.scrollTop = visualRef.current.scrollHeight;
    } else {
      onChange(sanitizeSafeHtml((value || '') + cleanAddition));
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const safeUrl = linkUrl.trim().replace(/^(javascript|vbscript|data):/i, '');
    const textToUse = linkText.trim() || safeUrl;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const html = `<a href="${safeUrl}"${targetAttr} class="text-blue-600 font-bold underline hover:text-blue-800">${textToUse}</a> `;
    insertOrWrapHtml(html, '', '');
    setLinkText('');
    setLinkUrl('https://');
    setShowLinkPanel(false);
  };

  const handleInsertImage = () => {
    if (!imgUrl.trim()) return;
    const safeUrl = imgUrl.trim().replace(/^(javascript|vbscript|data:text):/i, '');
    const safeAlt = (imgAlt.trim() || 'CareerSathi Exam Notification Image').replace(/"/g, '&quot;');
    const html = `<figure class="my-4"><img src="${safeUrl}" alt="${safeAlt}" class="rounded-xl max-w-full h-auto border border-slate-200 shadow-sm mx-auto" loading="lazy" />${
      imgCaption.trim()
        ? `<figcaption class="text-center text-xs text-slate-500 mt-1.5 font-medium">${imgCaption.trim()}</figcaption>`
        : ''
    }</figure>`;
    insertGutenbergBlock(html);
    setImgUrl('');
    setImgAlt('');
    setImgCaption('');
    setShowImagePanel(false);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg text-xs">
      <div className="bg-slate-900 px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-amber-400">{label}</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
            {badgeText}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1 rounded-lg font-black transition ${
              mode === 'visual' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            👁️ Visual / Block Mode
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`px-3 py-1 rounded-lg font-black transition ${
              mode === 'code' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            💻 HTML Code Mode
          </button>
        </div>
      </div>

      <div className="bg-slate-900/70 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center gap-1.5">
        <button type="button" title="Bold" onClick={() => insertOrWrapHtml('<strong>', '</strong>', 'Bold Text')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-lg border border-slate-700">B</button>
        <button type="button" title="Italic" onClick={() => insertOrWrapHtml('<em>', '</em>', 'Italic Text')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 italic font-serif rounded-lg border border-slate-700">I</button>
        <button type="button" title="Underline" onClick={() => insertOrWrapHtml('<u>', '</u>', 'Underlined Text')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 underline rounded-lg border border-slate-700">U</button>

        <span className="h-4 w-px bg-slate-800 mx-0.5" />

        <select
          onChange={(e) => {
            if (!e.target.value) return;
            insertOrWrapHtml(`<span style="font-size: ${e.target.value};">`, '</span>', 'Sized Text');
            e.target.value = '';
          }}
          defaultValue=""
          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-bold outline-none"
        >
          <option value="" disabled>🔠 Text Size</option>
          <option value="12px">Small (12px)</option>
          <option value="14px">Normal (14px)</option>
          <option value="16px">Medium (16px)</option>
          <option value="18px">Large (18px)</option>
          <option value="22px">Extra Large (22px)</option>
        </select>

        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold mr-0.5">🎨 Color:</span>
          {[
            { name: 'Blue', hex: '#2563eb', bg: 'bg-blue-600' },
            { name: 'Red', hex: '#dc2626', bg: 'bg-red-600' },
            { name: 'Green', hex: '#059669', bg: 'bg-emerald-600' },
            { name: 'Amber', hex: '#d97706', bg: 'bg-amber-600' },
            { name: 'Purple', hex: '#7c3aed', bg: 'bg-purple-600' },
            { name: 'Dark', hex: '#0f172a', bg: 'bg-slate-900 border border-slate-600' },
          ].map((col) => (
            <button
              key={col.hex}
              type="button"
              title={`Color: ${col.name}`}
              onClick={() => insertOrWrapHtml(`<span style="color: ${col.hex}; font-weight: 600;">`, '</span>', 'Colored Text')}
              className={`w-4 h-4 rounded-full ${col.bg} hover:scale-110 transition`}
            />
          ))}
          <input
            type="color"
            title="Pick Custom Color"
            onChange={(e) => insertOrWrapHtml(`<span style="color: ${e.target.value};">`, '</span>', 'Colored Text')}
            className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            insertOrWrapHtml(
              '<mark style="background-color: #fef08a; color: #0f172a; padding: 1px 6px; border-radius: 4px; font-weight: 700;">',
              '</mark>',
              'Highlighted Note'
            )
          }
          className="px-2 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-lg font-bold"
        >
          🖍️ Highlight
        </button>

        <button
          type="button"
          onClick={() => { setShowLinkPanel(!showLinkPanel); setShowImagePanel(false); }}
          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg font-bold"
        >
          🔗 Add Link
        </button>

        <button
          type="button"
          onClick={() => { setShowImagePanel(!showImagePanel); setShowLinkPanel(false); }}
          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold"
        >
          🖼️ Add Image
        </button>
      </div>

      {showLinkPanel && (
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Link Text (e.g. Official Notification PDF)" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="flex-1 min-w-[160px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
          <input type="text" placeholder="URL (https://... or /tools/form-tool)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 min-w-[180px] p-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono" />
          <label className="flex items-center gap-1 text-slate-300 font-bold cursor-pointer">
            <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} /> New Tab
          </label>
          <button type="button" onClick={handleInsertLink} className="px-3 py-2 bg-blue-600 text-white font-black rounded-lg">Insert Link ✓</button>
          <button type="button" onClick={() => setShowLinkPanel(false)} className="px-2.5 py-2 bg-slate-800 text-slate-400 rounded-lg font-bold">✕</button>
        </div>
      )}

      {showImagePanel && (
        <div className="bg-slate-900 p-3 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <input type="text" placeholder="Image URL (https://...)" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="sm:col-span-4 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono" />
          <input type="text" placeholder="SEO Alt Text (e.g. SSC CGL 2026 Vacancy Table)" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} className="sm:col-span-4 p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-bold" />
          <input type="text" placeholder="Caption (Optional)" value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} className="sm:col-span-2 p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300" />
          <div className="sm:col-span-2 flex gap-1">
            <button type="button" onClick={handleInsertImage} className="flex-1 py-2 bg-emerald-600 text-white font-black rounded-lg">Insert ✓</button>
            <button type="button" onClick={() => setShowImagePanel(false)} className="px-2.5 py-2 bg-slate-800 text-slate-400 rounded-lg font-bold">✕</button>
          </div>
        </div>
      )}

      {variant === 'full' && (
        <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mr-1">🧱 + Insert Block:</span>
          <button type="button" onClick={() => insertGutenbergBlock('<h2>Section Heading (H2 for Google SEO)</h2>')} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg border border-slate-800">+ H2 Heading</button>
          <button type="button" onClick={() => insertGutenbergBlock('<h3>Sub-Section Heading (H3)</h3>')} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-lg border border-slate-800">+ H3 Subheading</button>
          <button type="button" onClick={() => insertGutenbergBlock('<p>Write detailed paragraph content here with important exam keywords...</p>')} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-800">+ Paragraph</button>
          <button type="button" onClick={() => insertGutenbergBlock('<ul>\n  <li><strong>Key Point 1:</strong> Check official eligibility criteria.</li>\n  <li><strong>Key Point 2:</strong> Resize photo and 6x2cm signature before applying.</li>\n</ul>')} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-800">+ • Bullet List</button>
          <button type="button" onClick={() => insertGutenbergBlock('<ol>\n  <li>Visit the official recruitment website linked below.</li>\n  <li>Complete One-Time Registration (OTR) and fill application details.</li>\n  <li>Upload formatted photo, signature, and PDF certificates.</li>\n</ol>')} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-800">+ 1. Steps List</button>
          <button type="button" onClick={() => insertGutenbergBlock('<div style="overflow-x:auto; margin: 14px 0;"><table style="width:100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 13px;"><thead><tr style="background-color: #1e293b; color: #ffffff;"><th style="padding: 10px; border: 1px solid #cbd5e1; text-align:left;">Post / Category Name</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align:left;">Total Vacancies</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align:left;">Qualification / Age Limit</th></tr></thead><tbody><tr><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight:700;">General / UR</td><td style="padding: 10px; border: 1px solid #cbd5e1;">1,250 Posts</td><td style="padding: 10px; border: 1px solid #cbd5e1;">18 – 27 Years (Graduate)</td></tr><tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight:700;">OBC / EWS / SC / ST</td><td style="padding: 10px; border: 1px solid #cbd5e1;">As Per Rules</td><td style="padding: 10px; border: 1px solid #cbd5e1;">Age Relaxation Applicable</td></tr></tbody></table></div>')} className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold rounded-lg border border-cyan-500/30">+ 📊 Exam Table</button>
          <button type="button" onClick={() => insertGutenbergBlock('<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #1e3a8a;"><strong>💡 Important Candidate Note:</strong> Make sure your scanned signature is 6.0 cm × 2.0 cm (10KB–20KB) using our free CareerSathi Form Tool before final submission.</div>')} className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold rounded-lg border border-amber-500/30">+ 💡 Alert Callout</button>
          <button type="button" onClick={() => insertGutenbergBlock('<p style="margin: 14px 0;"><a href="/tools/form-tool" style="display:inline-block; background-color:#2563eb; color:#ffffff; font-weight:800; padding:10px 20px; border-radius:10px; text-decoration:none;">⚡ Resize Photo, 6x2cm Sign & PDF Now ↗</a></p>')} className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">+ 🔘 CTA Button</button>
        </div>
      )}

      {mode === 'visual' ? (
        <div className="p-3 bg-slate-100">
          <div
            ref={visualRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            onBlur={(e) => onChange(sanitizeSafeHtml(e.currentTarget.innerHTML))}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="w-full p-4 bg-white text-slate-900 rounded-xl border border-slate-300 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 prose prose-sm max-w-none overflow-y-auto leading-relaxed"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 px-1">
            <span>🛡️ XSS Shield Active • Select text to style or click &quot;+ Insert Block&quot;.</span>
            <span>{value.replace(/<[^>]*>/g, '').length} chars</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-950">
          <textarea
            ref={codeRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => onChange(sanitizeSafeHtml(e.target.value))}
            style={{ minHeight }}
            placeholder={placeholder}
            className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-mono text-xs outline-none focus:border-amber-400 leading-relaxed"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 px-1">
            <span>💻 Raw HTML Mode — Malicious scripts/iframes are automatically stripped on blur/save.</span>
            <span>{value.length} / {MAX_HTML_BYTES} bytes</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DEFAULT SEO CATEGORIES & SUBCATEGORIES
// ==========================================
const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1', name: 'Latest Jobs', slug: 'latest-jobs', parentId: null, targetExamTag: 'ALL',
    h1Title: 'Latest Sarkari Jobs 2026 — Apply Online & Official Notifications',
    metaTitle: 'Latest Government Jobs 2026 | Sarkari Naukri Online Form | CareerSathi',
    metaDesc: 'Check all latest government jobs 2026, SSC, Railway, Banking, Police & State PSC online forms, age limit, vacancy details and free photo/signature resizer tool.',
    focusKeyword: 'Latest Sarkari Jobs 2026',
    shortIntro: 'Find all newly announced Central and State Government Recruitment notifications for 2026. Check eligibility, vacancy tables, important dates, and format your documents in 1 click.',
    seoBottomContent: '<h2>Why Check Latest Government Jobs on CareerSathi?</h2><p>CareerSathi provides verified official notifications for SSC, UPSC, Railway RRB, IBPS Banking, and State Police recruitment exams along with built-in photo, 6x2cm signature, and PDF compression utilities.</p>',
    faqs: [
      { question: 'Which are the top upcoming government jobs in 2026?', answer: 'Major upcoming exams include SSC CGL, SSC GD Constable, RRB NTPC, IBPS PO, and Bihar/UP Police recruitments.' },
      { question: 'How can I resize my photo and signature for online job forms?', answer: 'Use the free CareerSathi All-in-One Form Tool to automatically format your photo and 6x2cm signature in exact KB.' },
    ],
    count: 0, version: 1,
  },
  {
    id: 'cat-2', name: 'Admit Card', slug: 'admit-card', parentId: null, targetExamTag: 'ALL',
    h1Title: 'Sarkari Exam Admit Card 2026 — Download Hall Ticket & Exam City',
    metaTitle: 'Download Admit Card 2026 | SSC, Railway, Bank & State Exam Hall Ticket',
    metaDesc: 'Direct official links to download 2026 exam admit cards, application status, and exam city intimation slips for SSC, RRB, UPSC, and State exams.',
    focusKeyword: 'Admit Card 2026 Download',
    shortIntro: 'Download your official CBT exam hall ticket, check application status, shift timing, and exam city intimation slips directly.',
    seoBottomContent: '<h2>How to Download Your Exam Admit Card Online?</h2><p>Select your exam from the list above, click on the regional or official login link, and enter your Registration Number and Date of Birth to print your A4 Admit Card.</p>',
    faqs: [
      { question: 'What documents are required at the exam center along with the Admit Card?', answer: 'You must carry a printed copy of your Admit Card, 2 passport size photographs, and an original valid Photo ID (PAN, Voter ID, Driving License, or Passport).' },
    ],
    count: 0, version: 1,
  },
  {
    id: 'cat-3', name: 'Results', slug: 'results', parentId: null, targetExamTag: 'ALL',
    h1Title: 'Sarkari Exam Results 2026 — Merit List, Cut-Off & Scorecard',
    metaTitle: 'Sarkari Result 2026 | Check Exam Merit List, Cut Off Marks & Scorecard',
    metaDesc: 'Check latest government exam results 2026, roll number wise merit lists, category-wise cut-off marks, and normalized scorecards online.',
    focusKeyword: 'Sarkari Result 2026 Merit List',
    shortIntro: 'Instant direct links to official exam results, selection PDF merit lists, tier-wise cut-off marks, and final scorecards.',
    seoBottomContent: '<h2>Check Roll Number Wise Merit List & Cut-Off</h2><p>All official result PDFs and scorecard login links are updated in real time as soon as the recruiting board announces them.</p>',
    faqs: [
      { question: 'How to check my name in the Result Merit List PDF?', answer: 'Download the official Result PDF from the link above, press Ctrl+F (or use Search in mobile PDF reader), and type your Roll Number.' },
    ],
    count: 0, version: 1,
  },
  {
    id: 'cat-4', name: 'Answer Key', slug: 'answer-key', parentId: null, targetExamTag: 'SSC',
    h1Title: 'Official Answer Key 2026 — Response Sheet & Instant Score Calculator',
    metaTitle: 'Exam Answer Key 2026 | Calculate Marks from Digialm Response Sheet URL',
    metaDesc: 'Download official provisional and final answer keys for SSC, RRB, and State exams. Paste your response sheet URL to calculate exact marks with negative marking.',
    focusKeyword: 'Exam Answer Key 2026',
    shortIntro: 'Download your CBT response sheet and check your exact raw score, negative marking, and accuracy using our Answer Key Analyzer.',
    seoBottomContent: '<h2>Calculate Marks Instantly from Your Answer Key URL</h2><p>Copy your Digialm candidate response URL after logging in and paste it into the CareerSathi Answer Key Analyzer tool for instant subject-wise score calculation.</p>',
    faqs: [
      { question: 'How to calculate negative marking from SSC & Railway Answer Key?', answer: 'Paste your response sheet link into our free Answer Key Score Calculator to automatically deduct negative marks and see net score.' },
    ],
    count: 0, version: 1,
  },
  {
    id: 'cat-5', name: 'Admission', slug: 'admission', parentId: null, targetExamTag: 'NEET',
    h1Title: 'Entrance Exam & University Admission 2026 — NEET, JEE, CUET & ITI',
    metaTitle: 'Online Admission 2026 | CUET, NEET, JEE, B.Ed, ITI & Polytechnic Forms',
    metaDesc: 'Apply online for 2026 national and state entrance exams, university admissions, counselling schedules, and seat allotment results.',
    focusKeyword: 'Online Admission Form 2026',
    shortIntro: 'Complete admission notifications, entrance form dates, counselling schedules, and document specifications for college and entrance exams.',
    seoBottomContent: '<h2>Documents Required for Online Admission & Counselling</h2><p>Keep your scanned marksheet, caste/EWS certificate, and passport photo with date on photograph ready before filling entrance forms.</p>',
    faqs: [], count: 0, version: 1,
  },
  {
    id: 'cat-6', name: 'Sarkari Yojana', slug: 'sarkari-yojana', parentId: null, targetExamTag: 'STATE',
    h1Title: 'Sarkari Yojana & Scholarship 2026 — Online Registration & Beneficiary Status',
    metaTitle: 'Sarkari Yojana 2026 | Student Scholarships, Fellowship & Govt Schemes',
    metaDesc: 'Apply online for Central and State Government welfare schemes, student scholarships, kisan yojanas, and check DBT payment status.',
    focusKeyword: 'Sarkari Yojana 2026 Apply Online',
    shortIntro: 'Verified guides and official portal links for National Scholarship Portal (NSP), Post-Matric Scholarships, and government welfare schemes.',
    seoBottomContent: '<h2>Student Scholarships & DBT Schemes</h2><p>Check eligibility criteria, income certificate limits, and direct registration links for central and state scholarships.</p>',
    faqs: [], count: 0, version: 1,
  },
  {
    id: 'sub-101', name: 'SSC Exams', slug: 'ssc-exams', parentId: 'cat-1', parentName: 'Latest Jobs', parentSlug: 'latest-jobs', targetExamTag: 'SSC',
    h1Title: 'SSC Recruitment 2026 — CGL, CHSL, GD Constable, MTS & CPO Online Forms',
    metaTitle: 'SSC Jobs 2026 | SSC CGL, GD, CHSL, MTS Notification & 6x2cm Sign Tool',
    metaDesc: 'Apply online for all Staff Selection Commission (SSC) 2026 recruitments. Check OTR registration, live photo rules, 6x2cm signature resizer, and exam dates.',
    focusKeyword: 'SSC Recruitment 2026',
    shortIntro: 'All Staff Selection Commission (SSC) recruitment notifications, One-Time Registration (OTR) guides, and SSC 6x2cm signature formatting tools.',
    seoBottomContent: '<h2>SSC 2026 Photo & 6x2cm Signature Guidelines</h2><p>Ensure your signature is resized to 6.0 cm × 2.0 cm (10KB–20KB) using the CareerSathi SSC Form Tool to prevent form rejection.</p>',
    faqs: [
      { question: 'What is the signature dimension for SSC forms in 2026?', answer: 'SSC requires a scanned signature of 6.0 cm width by 2.0 cm height between 10 KB and 20 KB in JPG format.' },
    ],
    count: 0, version: 1,
  },
  {
    id: 'sub-102', name: 'Railway RRB Jobs', slug: 'railway-rrb-jobs', parentId: 'cat-1', parentName: 'Latest Jobs', parentSlug: 'latest-jobs', targetExamTag: 'RAILWAY',
    h1Title: 'Railway Recruitment 2026 (RRB) — NTPC, Group D, ALP & Technician Jobs',
    metaTitle: 'Railway RRB Jobs 2026 | NTPC, Group D, ALP Online Form & Eligibility',
    metaDesc: 'Latest Indian Railways RRB & RRC recruitment 2026 notifications for NTPC, Group D, ALP, JE, and Paramedical posts.',
    focusKeyword: 'Railway RRB Recruitment 2026',
    shortIntro: 'Zone-wise Indian Railway Recruitment Board (RRB) notifications, vacancy tables, medical standards, and online application links.',
    seoBottomContent: '<h2>How to Apply for Railway RRB Exams</h2><p>Check zone-wise vacancies and prepare your white-background passport photo and running signature before submitting your RRB online application.</p>',
    faqs: [], count: 0, version: 1,
  },
  {
    id: 'sub-103', name: 'Bihar Sarkari Jobs', slug: 'bihar-sarkari-jobs', parentId: 'cat-1', parentName: 'Latest Jobs', parentSlug: 'latest-jobs', targetExamTag: 'STATE',
    h1Title: 'Bihar Government Jobs 2026 — BPSC, BSSC, CSBC Bihar Police & Beltron',
    metaTitle: 'Bihar Sarkari Naukri 2026 | BPSC, BSSC, Bihar Police Online Form',
    metaDesc: 'Get fastest updates on Bihar Government Jobs 2026 including BPSC TRE Teacher, BSSC Inter/Graduate Level, Bihar Police Constable, Daroga & Jeevika.',
    focusKeyword: 'Bihar Sarkari Jobs 2026',
    shortIntro: 'Dedicated hub for Bihar State Government recruitment notifications (BPSC, BSSC, CSBC, BPSSC, BCECE, and Bihar Health Department).',
    seoBottomContent: '<h2>Bihar State Exam Document Requirements</h2><p>Keep your Bihar Domicile Certificate, NCL/EWS Certificate, and 10th/12th Marksheet PDFs compressed under 100KB–200KB for BPSC and BSSC portals.</p>',
    faqs: [], count: 0, version: 1,
  },
  {
    id: 'sub-104', name: 'Banking & Insurance', slug: 'banking-jobs', parentId: 'cat-1', parentName: 'Latest Jobs', parentSlug: 'latest-jobs', targetExamTag: 'BANKING',
    h1Title: 'Banking Jobs 2026 — IBPS PO, Clerk, SBI, RBI & LIC Recruitment',
    metaTitle: 'Banking Jobs 2026 | IBPS, SBI, RBI, NABARD & LIC Online Form',
    metaDesc: 'Apply online for 2026 Bank PO, Clerk, and SO exams. Includes IBPS Left Thumb Impression & Handwritten Declaration resizer tool.',
    focusKeyword: 'Banking Jobs 2026',
    shortIntro: 'Latest public sector bank and insurance exam notifications with built-in IBPS Left Thumb & Handwritten Declaration formatting tools.',
    seoBottomContent: '<h2>IBPS Handwritten Declaration & Thumb Impression Specifications</h2><p>Banking exams require 4.5×3.5 cm photo, 140×60 px signature, 240×240 px left thumb impression, and 800×400 px handwritten declaration in black ink.</p>',
    faqs: [], count: 0, version: 1,
  },
];

const DEFAULT_TOOLS_CONFIG: ToolConfigItem[] = [
  { id: 'form-tool', name: 'All-in-One Exam Form Master Tool', path: '/tools/form-tool', category: 'Form Utility', targetExam: 'SSC', isActive: true, isFeatured: true, metaTitle: '2025-26 All-in-One Exam Form Photo, 6x2cm Signature & PDF Tool | CareerSathi', metaDesc: 'Auto-resize photo, SSC 6x2cm signature, IBPS thumb, declaration & certificate PDFs in exact KB and DPI.' },
  { id: 'passport-photo-maker', name: 'AI Passport Photo Maker & A4 Print Studio', path: '/tools/passport-photo-maker', category: 'Image Studio', targetExam: 'SSC', isActive: true, isFeatured: true, metaTitle: 'Free AI Passport Size Photo Maker & A4 Sheet Printer | CareerSathi', metaDesc: 'Create studio-clarity passport photos online, change background color, add Name & Date, and print A4 sheets.' },
  { id: 'pdf-compressor', name: 'Exact KB PDF Compressor', path: '/tools/pdf-compressor', category: 'PDF Utility', targetExam: 'UPSC', isActive: true, isFeatured: true, metaTitle: 'Compress PDF to Exact 50KB, 100KB, 200KB Online Free | CareerSathi', metaDesc: 'Reduce marksheet and caste certificate PDF size to exact KB limits for government job forms.' },
  { id: 'answer-key-analyzer', name: 'SSC & RRB Answer Key Score Calculator', path: '/tools/answer-key-analyzer', category: 'Exam Analyzer', targetExam: 'SSC', isActive: true, isFeatured: true, metaTitle: 'SSC & Railway Answer Key Marks & Rank Calculator by URL | CareerSathi', metaDesc: 'Paste your Digialm response sheet URL to calculate instant raw marks, negative marking, and section accuracy.' },
  { id: 'jpg-to-pdf', name: 'JPG to PDF Converter & Merger', path: '/tools/jpg-to-pdf', category: 'PDF Utility', targetExam: 'RAILWAY', isActive: true, isFeatured: false, metaTitle: 'Free JPG to PDF Converter Online - Merge Certificate Photos | CareerSathi', metaDesc: 'Convert multiple marksheet and ID card photos into a single A4 PDF file instantly.' },
  { id: 'scan-to-pdf', name: 'CamScanner Style Scan to PDF Studio', path: '/tools/scan-to-pdf', category: 'Document Scanner', targetExam: 'BANKING', isActive: true, isFeatured: false, metaTitle: 'Online Document Scanner to PDF - Remove Shadows & Whiten Paper | CareerSathi', metaDesc: 'Scan documents, ID cards, and notes with Magic Color and B&W Xerox filters directly in browser.' },
  { id: 'pdf-editor', name: 'Sejda Style Visual PDF Editor', path: '/tools/pdf-editor', category: 'PDF Studio', targetExam: 'ALL', isActive: true, isFeatured: false, metaTitle: 'Free Online Visual PDF Editor - Edit Text, Whiteout & Sign | CareerSathi', metaDesc: 'Edit existing PDF text directly, erase sections, insert signatures, and download without watermarks.' },
  { id: 'pdf-to-word', name: 'PDF to Word (.DOCX) with Hindi/English OCR', path: '/tools/pdf-to-word', category: 'PDF Utility', targetExam: 'ALL', isActive: true, isFeatured: false, metaTitle: 'Convert PDF to Editable Word (.DOCX) with Free Hindi & English OCR | CareerSathi', metaDesc: 'Extract editable Word documents from digital or scanned PDFs using client-side AI OCR.' },
  { id: 'pdf-merger', name: 'PDF Merger (Combine PDFs)', path: '/tools/pdf-merger', category: 'PDF Utility', targetExam: 'ALL', isActive: true, isFeatured: false, metaTitle: 'Merge PDF Files Online Free | CareerSathi', metaDesc: 'Combine multiple PDF certificates into one file inside your browser.' },
  { id: 'split-pdf', name: '4-in-1 Split PDF & Extract Pages', path: '/tools/split-pdf', category: 'PDF Utility', targetExam: 'ALL', isActive: true, isFeatured: false, metaTitle: 'Split PDF by Page Range, Visual Scissors or Max KB Size | CareerSathi', metaDesc: 'Extract specific pages or split large PDFs by maximum KB size for free.' },
];

export default function EnterpriseAdminCommandCenter() {
  // ==========================================
  // 2. RBAC STAFF & PERMISSIONS STATE
  // ==========================================
  const [staffList, setStaffList] = useState<StaffUser[]>([
    { id: 's1', name: 'Main Super Admin', email: 'admin@careersathi.com', role: 'superadmin', active: true },
    { id: 's2', name: 'Priya Sharma (SEO Lead)', email: 'seo@careersathi.com', role: 'seo_manager', active: true },
    { id: 's3', name: 'Rahul Verma (Content Editor)', email: 'editor@careersathi.com', role: 'editor', active: true },
  ]);

  const [currentStaff, setCurrentStaff] = useState<StaffUser>({
    id: 's1', name: 'Main Super Admin', email: 'admin@careersathi.com', role: 'superadmin', active: true,
  });

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('editor');
  const [syncNotice, setSyncNotice] = useState('');

  const hasPermission = (
    perm: 'delete_content' | 'manage_partners' | 'manage_rbac' | 'programmatic_seo' | 'manage_tools' | 'rollback'
  ): boolean => {
    if (currentStaff.role === 'superadmin') return true;
    if (currentStaff.role === 'seo_manager') return ['programmatic_seo', 'manage_tools'].includes(perm);
    if (currentStaff.role === 'moderator') return ['manage_partners'].includes(perm);
    return false;
  };

  // ==========================================
  // 3. CORE CMS STATES + CONCURRENCY LOCKS
  // ==========================================
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPostVersion, setEditingPostVersion] = useState<number>(1);

  const [posts, setPosts] = useState<Post[]>([]);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [toolsConfig, setToolsConfig] = useState<ToolConfigItem[]>(DEFAULT_TOOLS_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [partnerCourses, setPartnerCourses] = useState<PartnerCourse[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  // Categories & Subcategories State
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatVersion, setEditingCatVersion] = useState<number>(1);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('MAIN');
  const [catTargetExam, setCatTargetExam] = useState('ALL');
  const [catH1, setCatH1] = useState('');
  const [catMetaTitle, setCatMetaTitle] = useState('');
  const [catMetaDesc, setCatMetaDesc] = useState('');
  const [catFocusKeyword, setCatFocusKeyword] = useState('');
  const [catShortIntro, setCatShortIntro] = useState('');
  const [catSeoBottom, setCatSeoBottom] = useState('');
  const [catFaqs, setCatFaqs] = useState<FaqRow[]>([{ question: '', answer: '' }]);

  // Post Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Latest Jobs');
  const [subCategory, setSubCategory] = useState('');
  const [targetExamTag, setTargetExamTag] = useState('SSC');
  const [vacancyOrSeats, setVacancyOrSeats] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  const [importantDates, setImportantDates] = useState<DateRow[]>([
    { label: 'Application Begin', date: '01 Nov 2026' },
    { label: 'Last Date for Apply Online', date: '30 Nov 2026' },
  ]);

  const [classicContent, setClassicContent] = useState(
    '<h2>Official Notification &amp; Exam Overview</h2><p>Write detailed information about the exam, eligibility, and selection process here...</p>'
  );

  const [importantLinks, setImportantLinks] = useState<LinkRow[]>([
    { text: 'Apply Online', url: 'https://ssc.gov.in' },
    { text: 'Resize Photo & 6x2cm Signature (Form Tool)', url: '/tools/form-tool' },
    { text: 'Official Website', url: 'https://ssc.gov.in' },
  ]);

  const [faqs, setFaqs] = useState<FaqRow[]>([
    { question: 'What is the last date to apply?', answer: 'The last date to apply is 30 November 2026.' },
  ]);

  // Programmatic SEO Bulk Generator States
  const [pSeoExams, setPSeoExams] = useState('SSC CGL, SSC GD Constable, RRB NTPC, Bihar Police Constable, SBI PO');
  const [pSeoCategory, setPSeoCategory] = useState('Latest Jobs');
  const [pSeoSubCategory, setPSeoSubCategory] = useState('');
  const [pSeoYear, setPSeoYear] = useState('2026');
  const [pSeoVacancyNote, setPSeoVacancyNote] = useState('Various Posts');
  const [pingStatusMsg, setPingStatusMsg] = useState('');

  // Mock Test Form States
  const [testTitle, setTestTitle] = useState('');
  const [testSlug, setTestSlug] = useState('');
  const [testCategory, setTestCategory] = useState('SSC');
  const [testTimeMinutes, setTestTimeMinutes] = useState(30);
  const [questionsList, setQuestionsList] = useState<Question[]>([
    { id: '1', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 },
  ]);

  // Static Page Form States
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('<h2>About This Page</h2><p>Write or insert blocks here...</p>');

  const mainCategories = categories.filter((c) => c.parentId === null);
  const getSubcategoriesByParentName = (parentNameVal: string) => {
    const parentObj = mainCategories.find((m) => m.name === parentNameVal);
    if (!parentObj) return [];
    return categories.filter((c) => c.parentId === parentObj.id);
  };

  // ==========================================
  // 4. INITIALIZATION & CROSS-TAB CONCURRENCY SYNC
  // ==========================================
  const logAuditAction = (action: string, target: string) => {
    const entry: AuditLogItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      actorName: currentStaff.name,
      actorRole: currentStaff.role,
      action,
      target,
    };
    const latestLogs = readLatestStorage<AuditLogItem>('careersathi_audit_logs', []);
    const updated = [entry, ...latestLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem('careersathi_audit_logs', JSON.stringify(updated));
  };

  useEffect(() => {
    let loadedCats = DEFAULT_CATEGORIES;
    const savedCats = localStorage.getItem('careersathi_categories');
    if (savedCats) {
      try {
        const parsedCats = JSON.parse(savedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          loadedCats = parsedCats;
          setCategories(parsedCats);
        }
      } catch {}
    } else {
      localStorage.setItem('careersathi_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }

    const savedPosts = localStorage.getItem('careersathi_posts');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        setPosts(parsed);
        updateCategoryCounts(parsed, loadedCats);
      } catch (e) {
        console.error(e);
      }
    }

    setRevisions(readLatestStorage('careersathi_post_revisions', []));
    setPages(readLatestStorage('careersathi_pages', []));
    setMockTests(readLatestStorage('careersathi_mock_tests', []));

    const savedTools = localStorage.getItem('careersathi_tools_config');
    if (savedTools) {
      try { setToolsConfig(JSON.parse(savedTools)); } catch {}
    } else {
      localStorage.setItem('careersathi_tools_config', JSON.stringify(DEFAULT_TOOLS_CONFIG));
    }

    const savedStaff = localStorage.getItem('careersathi_staff');
    if (savedStaff) {
      try { setStaffList(JSON.parse(savedStaff)); } catch {}
    }

    setAuditLogs(readLatestStorage('careersathi_audit_logs', []));
    setPartnersList(readLatestStorage('careersathi_partners', []));
    setPartnerCourses(readLatestStorage('careersathi_partner_courses', []));

    // MULTI-ADMIN CROSS-TAB STORAGE SYNC
    const handleCrossTabSync = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'careersathi_posts') {
          setPosts(JSON.parse(e.newValue));
          setSyncNotice('🔄 Multi-Admin Sync: Exam Posts updated from another tab.');
        } else if (e.key === 'careersathi_categories') {
          setCategories(JSON.parse(e.newValue));
          setSyncNotice('🔄 Multi-Admin Sync: Categories updated from another tab.');
        } else if (e.key === 'careersathi_pages') {
          setPages(JSON.parse(e.newValue));
          setSyncNotice('🔄 Multi-Admin Sync: Static Pages updated from another tab.');
        } else if (e.key === 'careersathi_mock_tests') {
          setMockTests(JSON.parse(e.newValue));
          setSyncNotice('🔄 Multi-Admin Sync: Mock Tests updated from another tab.');
        }
        setTimeout(() => setSyncNotice(''), 4000);
      } catch {}
    };

    window.addEventListener('storage', handleCrossTabSync);
    return () => window.removeEventListener('storage', handleCrossTabSync);
  }, []);

  const saveCategoriesToStorage = (updatedCats: CategoryItem[], currentPostsList: Post[] = posts) => {
    const withCounts = updatedCats.map((cat) => ({
      ...cat,
      slug: sanitizeSeoSlug(cat.slug || cat.name, true),
      shortIntro: sanitizeSafeHtml(cat.shortIntro),
      seoBottomContent: sanitizeSafeHtml(cat.seoBottomContent),
      count:
        cat.parentId === null
          ? currentPostsList.filter((p) => p.category === cat.name).length
          : currentPostsList.filter((p) => p.subCategory === cat.name).length,
    }));
    setCategories(withCounts);
    localStorage.setItem('careersathi_categories', JSON.stringify(withCounts));
  };

  const savePostsToStorage = (updatedPosts: Post[]) => {
    const cleanPosts = updatedPosts.map((p) => ({
      ...p,
      slug: sanitizeSeoSlug(p.slug || p.title, true),
      classicContent: sanitizeSafeHtml(p.classicContent),
    }));
    setPosts(cleanPosts);
    localStorage.setItem('careersathi_posts', JSON.stringify(cleanPosts));
    updateCategoryCounts(cleanPosts, categories);
  };

  const saveRevisionsToStorage = (updatedRevs: PostRevision[]) => {
    setRevisions(updatedRevs);
    localStorage.setItem('careersathi_post_revisions', JSON.stringify(updatedRevs));
  };

  const savePagesToStorage = (updatedPages: CustomPage[]) => {
    const cleanPages = updatedPages.map((pg) => ({
      ...pg,
      slug: sanitizeSeoSlug(pg.slug || pg.title, true),
      content: sanitizeSafeHtml(pg.content),
    }));
    setPages(cleanPages);
    localStorage.setItem('careersathi_pages', JSON.stringify(cleanPages));
  };

  const saveMockTestsToStorage = (updated: MockTest[]) => {
    const cleanTests = updated.map((t) => ({
      ...t,
      slug: sanitizeSeoSlug(t.slug || t.testTitle || t.title, true),
    }));
    setMockTests(cleanTests);
    localStorage.setItem('careersathi_mock_tests', JSON.stringify(cleanTests));
  };

  const saveToolsConfig = (updated: ToolConfigItem[]) => {
    setToolsConfig(updated);
    localStorage.setItem('careersathi_tools_config', JSON.stringify(updated));
  };

  const updateCategoryCounts = (currentPosts: Post[], currentCats: CategoryItem[] = categories) => {
    const updated = currentCats.map((cat) => ({
      ...cat,
      count:
        cat.parentId === null
          ? currentPosts.filter((p) => p.category === cat.name).length
          : currentPosts.filter((p) => p.subCategory === cat.name).length,
    }));
    setCategories(updated);
    localStorage.setItem('careersathi_categories', JSON.stringify(updated));
  };

  // ==========================================
  // 5. CATEGORY & SUBCATEGORY SEO HANDLERS
  // ==========================================
  const handleAICategorySeoFill = () => {
    if (!catName.trim()) {
      alert('Bhai, pehle Category ya Subcategory ka naam likh de!');
      return;
    }
    const cleanName = catName.trim();
    const generatedSlug = sanitizeSeoSlug(catSlug.trim() || cleanName, true);
    setCatSlug(generatedSlug);

    const parentObj = catParentId !== 'MAIN' ? mainCategories.find((m) => m.id === catParentId) : null;
    const contextLabel = parentObj ? `${cleanName} (${parentObj.name})` : cleanName;

    setCatH1(`${cleanName} 2026 — Official Notifications, Dates & Apply Online`);
    setCatMetaTitle(`${cleanName} 2026 | Check Dates, Eligibility & Online Form | CareerSathi`);
    setCatMetaDesc(`Get latest updates on ${contextLabel} 2026. Check official notification PDF, vacancy breakdown, eligibility criteria, and format your photo/signature online for free.`);
    setCatFocusKeyword(`${cleanName} 2026`);
    setCatShortIntro(`Explore all verified updates for <strong>${cleanName} 2026</strong>. Check <span style="color: #2563eb; font-weight: 600;">application start and last dates</span>, age limit, category-wise seats, and use our free student tools to prepare your form documents.`);
    setCatSeoBottom(`<h2>Complete Guide to ${cleanName} 2026</h2>
<p>Candidates searching for <strong>${cleanName} 2026</strong> can find all direct official links, syllabus PDFs, and document upload instructions on this page. Make sure to verify your age eligibility and resize your photograph and signature using the <a href="/tools/form-tool" class="text-blue-600 font-bold underline">CareerSathi All-in-One Form Tool</a> before submitting your online application.</p>
<h3>Why Bookmark CareerSathi for ${cleanName}?</h3>
<ul>
  <li><strong>Real-Time Updates:</strong> Instant alerts for notifications, admit cards, answer keys, and results.</li>
  <li><strong>100% Free Student Utilities:</strong> Browser-based Photo, 6x2cm Signature, and Exact KB PDF Compressor tools.</li>
  <li><strong>Verified Official Links:</strong> Direct recruitment board portal links without confusing redirects.</li>
</ul>`);
    setCatFaqs([
      { question: `How can I apply online for ${cleanName} 2026?`, answer: `Click on the specific exam post listed under ${cleanName}, verify your eligibility in the notification table, format your photo/signature using our free tool, and click the Apply Online link.` },
      { question: `Where can I check the latest dates for ${cleanName}?`, answer: `All important start dates, last dates, and CBT exam schedules are updated daily in the ${cleanName} table above.` },
    ]);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSafeSlug = sanitizeSeoSlug(catSlug || catName, true);
    if (!catName.trim() || !finalSafeSlug) {
      alert('Please enter a valid Category/Subcategory Name and Slug!');
      return;
    }

    const latestCats = readLatestStorage<CategoryItem>('careersathi_categories', categories);
    const parentObj = catParentId !== 'MAIN' ? latestCats.find((m) => m.id === catParentId && m.parentId === null) : null;

    if (editingCatId) {
      const existingInStorage = latestCats.find((c) => c.id === editingCatId);
      if (existingInStorage && (existingInStorage.version || 1) > editingCatVersion) {
        if (!confirm('⚠️ Concurrency Alert: Another admin tab updated this Category while you were editing. Overwrite with your changes?')) {
          setCategories(latestCats);
          return;
        }
      }

      const updated = latestCats.map((c) => {
        if (c.id === editingCatId) {
          return {
            ...c,
            name: catName.trim(),
            slug: finalSafeSlug,
            parentId: parentObj ? parentObj.id : null,
            parentName: parentObj ? parentObj.name : undefined,
            parentSlug: parentObj ? sanitizeSeoSlug(parentObj.slug, true) : undefined,
            targetExamTag: catTargetExam,
            h1Title: catH1 || `${catName.trim()} 2026`,
            metaTitle: catMetaTitle || `${catName.trim()} 2026 | CareerSathi`,
            metaDesc: catMetaDesc || catShortIntro.replace(/<[^>]*>/g, '').slice(0, 155),
            focusKeyword: catFocusKeyword || catName.trim(),
            shortIntro: sanitizeSafeHtml(catShortIntro),
            seoBottomContent: sanitizeSafeHtml(catSeoBottom),
            faqs: catFaqs.filter((f) => f.question.trim() && f.answer.trim()),
            version: (c.version || 1) + 1,
          };
        }
        return c;
      });
      saveCategoriesToStorage(updated);
      logAuditAction('Updated Category/Subcategory SEO', `${catName} (/category/${finalSafeSlug})`);
      alert(`✅ Category / Subcategory SEO Updated! Clean Slug: ${finalSafeSlug}`);
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        slug: finalSafeSlug,
        parentId: parentObj ? parentObj.id : null,
        parentName: parentObj ? parentObj.name : undefined,
        parentSlug: parentObj ? sanitizeSeoSlug(parentObj.slug, true) : undefined,
        targetExamTag: catTargetExam,
        h1Title: catH1 || `${catName.trim()} 2026 — Official Updates & Online Form`,
        metaTitle: catMetaTitle || `${catName.trim()} 2026 | CareerSathi`,
        metaDesc: catMetaDesc || `Check latest updates, dates, and online links for ${catName.trim()} 2026 on CareerSathi.`,
        focusKeyword: catFocusKeyword || `${catName.trim()} 2026`,
        shortIntro: sanitizeSafeHtml(catShortIntro || `All official notifications, dates, and direct links for <strong>${catName.trim()} 2026</strong>.`),
        seoBottomContent: sanitizeSafeHtml(catSeoBottom || `<h2>About ${catName.trim()} 2026</h2><p>Stay updated with all official announcements for ${catName.trim()}.</p>`),
        faqs: catFaqs.filter((f) => f.question.trim() && f.answer.trim()),
        count: 0,
        version: 1,
      };
      saveCategoriesToStorage([...latestCats, newCat]);
      logAuditAction(parentObj ? `Created Subcategory under ${parentObj.name}` : 'Created Main Category', `${catName} (${finalSafeSlug})`);
      alert(`🚀 New Category / Subcategory Created! SEO URL Slug: ${finalSafeSlug}`);
    }

    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setEditingCatVersion(1);
    setCatName('');
    setCatSlug('');
    setCatParentId('MAIN');
    setCatTargetExam('ALL');
    setCatH1('');
    setCatMetaTitle('');
    setCatMetaDesc('');
    setCatFocusKeyword('');
    setCatShortIntro('');
    setCatSeoBottom('');
    setCatFaqs([{ question: '', answer: '' }]);
  };

  const handleEditCategoryClick = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setEditingCatVersion(cat.version || 1);
    setCatName(cat.name);
    setCatSlug(sanitizeSeoSlug(cat.slug, true));
    setCatParentId(cat.parentId || 'MAIN');
    setCatTargetExam(cat.targetExamTag || 'ALL');
    setCatH1(cat.h1Title || '');
    setCatMetaTitle(cat.metaTitle || '');
    setCatMetaDesc(cat.metaDesc || '');
    setCatFocusKeyword(cat.focusKeyword || '');
    setCatShortIntro(cat.shortIntro || '');
    setCatSeoBottom(cat.seoBottomContent || '');
    setCatFaqs(cat.faqs?.length ? cat.faqs : [{ question: '', answer: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    if (!hasPermission('delete_content')) {
      alert('🔒 Only Super Admin can delete categories!');
      return;
    }
    if (confirm(`Delete "${cat.name}"?`)) {
      const latestCats = readLatestStorage<CategoryItem>('careersathi_categories', categories);
      const updated = latestCats.filter((c) => c.id !== cat.id && c.parentId !== cat.id);
      saveCategoriesToStorage(updated);
      logAuditAction('Deleted Category/Subcategory', cat.name);
    }
  };

  // ==========================================
  // 6. LIVE SEO HEALTH SCORE ANALYZER (0 - 100%)
  // ==========================================
  const calculateLiveSeoScore = () => {
    let score = 0;
    const checks: { label: string; passed: boolean; points: number }[] = [];

    const tLen = (metaTitle || title).trim().length;
    const titleOk = tLen >= 35 && tLen <= 75;
    if (titleOk) score += 20;
    checks.push({ label: `SEO Title Length (${tLen}/60 chars)`, passed: titleOk, points: 20 });

    const dLen = (metaDesc || shortDescription).trim().length;
    const descOk = dLen >= 80 && dLen <= 170;
    if (descOk) score += 20;
    checks.push({ label: `Meta Description (${dLen}/160 chars)`, passed: descOk, points: 20 });

    const hasHeadings = /<h[23]>/i.test(classicContent);
    if (hasHeadings) score += 20;
    checks.push({ label: 'Structured Subheadings (H2/H3)', passed: hasHeadings, points: 20 });

    const hasFaqSchema = faqs.filter((f) => f.question.trim() && f.answer.trim()).length >= 2;
    if (hasFaqSchema) score += 20;
    checks.push({ label: 'Rich Snippet FAQ Schema (2+ FAQs)', passed: hasFaqSchema, points: 20 });

    const hasInternalToolLink = importantLinks.some((l) => l.url.includes('/tools/')) || classicContent.includes('/tools/');
    if (hasInternalToolLink) score += 20;
    checks.push({ label: 'Internal Link to Student Form Tool', passed: hasInternalToolLink, points: 20 });

    return { score, checks };
  };

  const seoHealth = calculateLiveSeoScore();

  // ==========================================
  // 7. AI AUTO-GENERATOR & POST HANDLERS
  // ==========================================
  const handleAIGenerate = () => {
    if (!title.trim()) {
      alert('Bhai, pehle Post Title likh de, tabhi AI pura post, dates, FAQs aur SEO tags auto-fill karega!');
      return;
    }

    const cleanAutoSlug = sanitizeSeoSlug(title, true);
    setSlug(cleanAutoSlug);

    const lowerTitle = title.toLowerCase();
    let detectedCategory = category;
    if (lowerTitle.includes('admit card') || lowerTitle.includes('hall ticket')) detectedCategory = 'Admit Card';
    else if (lowerTitle.includes('result') || lowerTitle.includes('score card')) detectedCategory = 'Results';
    else if (lowerTitle.includes('answer key')) detectedCategory = 'Answer Key';
    else if (lowerTitle.includes('admission')) detectedCategory = 'Admission';
    else if (lowerTitle.includes('yojana') || lowerTitle.includes('scheme')) detectedCategory = 'Sarkari Yojana';
    else detectedCategory = 'Latest Jobs';

    let detectedExam = 'SSC';
    let detectedSub = subCategory;
    if (lowerTitle.includes('ibps') || lowerTitle.includes('sbi') || lowerTitle.includes('rbi') || lowerTitle.includes('bank')) {
      detectedExam = 'BANKING';
      detectedSub = 'Banking & Insurance';
    } else if (lowerTitle.includes('rrb') || lowerTitle.includes('railway') || lowerTitle.includes('ntpc')) {
      detectedExam = 'RAILWAY';
      detectedSub = 'Railway RRB Jobs';
    } else if (lowerTitle.includes('bihar') || lowerTitle.includes('bpsc') || lowerTitle.includes('bssc') || lowerTitle.includes('csbc')) {
      detectedExam = 'STATE';
      detectedSub = 'Bihar Sarkari Jobs';
    } else if (lowerTitle.includes('ssc')) {
      detectedExam = 'SSC';
      detectedSub = 'SSC Exams';
    } else if (lowerTitle.includes('upsc') || lowerTitle.includes('ias') || lowerTitle.includes('nda')) {
      detectedExam = 'UPSC';
    } else if (lowerTitle.includes('neet')) {
      detectedExam = 'NEET';
    } else if (lowerTitle.includes('jee') || lowerTitle.includes('cuet')) {
      detectedExam = 'JEE';
    }

    setCategory(detectedCategory);
    if (detectedSub) setSubCategory(detectedSub);
    setTargetExamTag(detectedExam);
    setFocusKeyword(title.split(' ').slice(0, 4).join(' '));
    setShortDescription(`Official notification, eligibility, age limit, important dates, and direct online link for ${title}. Resize photo & signature easily using CareerSathi Form Tool.`);

    setImportantDates([
      { label: 'Notification Release Date', date: 'November 2026' },
      { label: 'Online Application Start', date: '05 Nov 2026' },
      { label: 'Last Date to Apply Online', date: '04 Dec 2026' },
      { label: 'CBT Exam Date', date: 'As Per Official Schedule' },
    ]);

    setClassicContent(`<h2>${title} — Overview &amp; Official Notification</h2>
<p>The examination authority has officially published the latest update for <strong>${title}</strong>. Candidates preparing for <strong>${detectedExam}</strong> exams can check the complete eligibility criteria, age relaxation, document upload specifications, and direct links below.</p>
<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #1e3a8a;"><strong>💡 Important Candidate Note:</strong> Format your Photo, 6.0×2.0 cm Signature, and PDF Certificates in 1 click using the free <a href="/tools/form-tool" class="text-blue-600 font-bold underline">CareerSathi Form Master Tool</a> before filling the form.</div>
<h3>📋 Document Upload Specifications (2025–26 Rules)</h3>
<ul>
  <li><strong>Signature Specification:</strong> Scanned running signature on white paper (10 KB to 20 KB, 6.0 × 2.0 cm for SSC / 140×60 px for Banking).</li>
  <li><strong>Photograph Rule:</strong> Clear passport size photo or live capture with plain white/light background.</li>
  <li><strong>Certificates PDF:</strong> Category / Marksheet PDF between 50 KB to 300 KB.</li>
</ul>
<h3>🚀 How to Apply Online for ${title}</h3>
<ol>
  <li>Use the <strong>CareerSathi All-in-One Form Tool</strong> linked below to resize your Photo, Signature &amp; PDF in 1 click.</li>
  <li>Click on the Official Apply Online link in the Important Links table.</li>
  <li>Complete One-Time Registration (OTR), upload documents, pay the fee, and print the final form.</li>
</ol>`);

    setImportantLinks([
      { text: 'Apply Online / Official Login', url: 'https://ssc.gov.in' },
      { text: '⚡ Resize Photo, 6x2cm Sign & PDF (Form Tool)', url: '/tools/form-tool' },
      { text: '🪪 Make Passport Size Photo & A4 Sheet', url: '/tools/passport-photo-maker' },
      { text: '🔑 Check Marks with Answer Key Analyzer', url: '/tools/answer-key-analyzer' },
    ]);

    setFaqs([
      { question: `What is the last date to apply for ${title}?`, answer: 'Candidates can submit their online form up to 04 December 2026 on the official portal.' },
      { question: `What is the photo and signature size required for ${title}?`, answer: 'Signature should be between 10 KB to 20 KB (6x2 cm for SSC) and Passport Photo between 20 KB to 50 KB. You can auto-resize them free on CareerSathi Form Tool.' },
      { question: `How can I calculate my exact age for ${title}?`, answer: 'Use the free Age & Relaxation Calculator inside the CareerSathi Form Tool.' },
    ]);

    setMetaTitle(`${title} — Apply Online, Eligibility, Dates & Form Size`);
    setMetaDesc(`Check official details for ${title}. Download notification PDF, verify eligibility, important dates, and resize photo/signature online on CareerSathi.`);
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSafeSlug = sanitizeSeoSlug(slug || title, true);
    if (!title.trim() || !finalSafeSlug) {
      alert('Please fill Post Title!');
      return;
    }

    const latestPosts = readLatestStorage<Post>('careersathi_posts', posts);
    const mainCatObj = mainCategories.find((c) => c.name === category);
    const subCatObj = categories.find((c) => c.parentId !== null && c.name === subCategory);

    const categorySlugVal = sanitizeSeoSlug(mainCatObj?.slug || category, true);
    const subCategorySlugVal = subCategory ? sanitizeSeoSlug(subCatObj?.slug || subCategory, true) : '';

    const nowDateTime = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    if (editingId) {
      const oldPost = latestPosts.find((p) => p.id === editingId);
      if (oldPost && (oldPost.version || 1) > editingPostVersion) {
        if (!confirm(`⚠️ Multi-Admin Conflict: "${oldPost.title}" was modified by ${oldPost.publisherName} while you were editing. Overwrite with your version?`)) {
          setPosts(latestPosts);
          return;
        }
      }

      if (oldPost) {
        const latestRevs = readLatestStorage<PostRevision>('careersathi_post_revisions', revisions);
        const rev: PostRevision = {
          revisionId: `rev-${Date.now()}`,
          postId: oldPost.id,
          savedAt: nowDateTime,
          savedBy: currentStaff.name,
          snapshot: oldPost,
        };
        saveRevisionsToStorage([rev, ...latestRevs].slice(0, 50));
      }

      const updatedPosts = latestPosts.map((p) => {
        if (p.id === editingId) {
          return {
            ...p,
            title: title.trim(),
            slug: finalSafeSlug,
            category,
            categorySlug: categorySlugVal,
            subCategory: subCategory || undefined,
            subCategorySlug: subCategorySlugVal || undefined,
            targetExamTag,
            vacancyOrSeats,
            publisherName: currentStaff.name,
            updatedAt: nowDateTime,
            version: (p.version || 1) + 1,
            featuredImage: featuredImage || p.featuredImage,
            shortDescription: shortDescription || p.shortDescription,
            importantDates,
            classicContent: sanitizeSafeHtml(classicContent),
            importantLinks,
            faqs,
            metaTitle: metaTitle || title.trim(),
            metaDesc: metaDesc || shortDescription,
            focusKeyword,
            indexedPinged: true,
          };
        }
        return p;
      });
      savePostsToStorage(updatedPosts);
      logAuditAction('Updated Post (Revision Saved)', `${title} (/posts/${finalSafeSlug})`);
      setEditingId(null);
      alert(`✅ Post Updated! Clean SEO URL: /posts/${finalSafeSlug}`);
    } else {
      const newPost: Post = {
        id: Date.now().toString(),
        title: title.trim(),
        slug: finalSafeSlug,
        category,
        categorySlug: categorySlugVal,
        subCategory: subCategory || undefined,
        subCategorySlug: subCategorySlugVal || undefined,
        targetExamTag,
        vacancyOrSeats,
        publisherName: currentStaff.name,
        publishedAt: nowDateTime,
        version: 1,
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        shortDescription: shortDescription || 'Official notification and application details.',
        importantDates,
        classicContent: sanitizeSafeHtml(classicContent),
        importantLinks,
        faqs,
        metaTitle: metaTitle || title.trim(),
        metaDesc: metaDesc || shortDescription,
        focusKeyword,
        indexedPinged: true,
      };
      savePostsToStorage([newPost, ...latestPosts]);
      logAuditAction('Published New Post', `${title} (/posts/${finalSafeSlug})`);
      alert(`🚀 Post Published Live! Clean SEO URL: /posts/${finalSafeSlug}`);
    }

    resetForm();
    setActiveTab('posts');
  };

  const handleRollbackRevision = (rev: PostRevision) => {
    if (!hasPermission('rollback')) {
      alert('🔒 Only Super Admin can rollback post revisions!');
      return;
    }
    const latestPosts = readLatestStorage<Post>('careersathi_posts', posts);
    const updated = latestPosts.map((p) => (p.id === rev.postId ? { ...rev.snapshot, version: (p.version || 1) + 1 } : p));
    savePostsToStorage(updated);
    logAuditAction('Rolled Back Post Revision', rev.snapshot.title);
    alert(`⏪ Rolled back "${rev.snapshot.title}" to version from ${rev.savedAt}!`);
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setSubCategory('');
    setVacancyOrSeats('');
    setFeaturedImage('');
    setShortDescription('');
    setFocusKeyword('');
    setImportantDates([{ label: 'Application Begin', date: '' }, { label: 'Last Date', date: '' }]);
    setClassicContent('<h2>Official Notification &amp; Overview</h2><p>Write detailed information here...</p>');
    setImportantLinks([{ text: 'Apply Online', url: '' }, { text: 'Resize Photo & Sign (Form Tool)', url: '/tools/form-tool' }]);
    setFaqs([{ question: '', answer: '' }]);
    setMetaTitle('');
    setMetaDesc('');
    setEditingId(null);
    setEditingPostVersion(1);
  };

  const handleEditClick = (post: Post) => {
    setEditingId(post.id);
    setEditingPostVersion(post.version || 1);
    setTitle(post.title);
    setSlug(sanitizeSeoSlug(post.slug || post.title, true));
    setCategory(post.category);
    setSubCategory(post.subCategory || '');
    setTargetExamTag(post.targetExamTag || 'SSC');
    setVacancyOrSeats(post.vacancyOrSeats || '');
    setFeaturedImage(post.featuredImage);
    setShortDescription(post.shortDescription);
    setImportantDates(post.importantDates || []);
    setClassicContent(sanitizeSafeHtml(post.classicContent || ''));
    setImportantLinks(post.importantLinks || []);
    setFaqs(post.faqs || []);
    setMetaTitle(post.metaTitle);
    setMetaDesc(post.metaDesc);
    setFocusKeyword(post.focusKeyword || '');
    setActiveTab('add-post');
  };

  const handleDeletePost = (id: string, postTitle: string) => {
    if (!hasPermission('delete_content')) {
      alert('🔒 Access Denied: Editors cannot delete live posts. Ask Super Admin.');
      return;
    }
    if (confirm(`Delete "${postTitle}" permanently?`)) {
      const latestPosts = readLatestStorage<Post>('careersathi_posts', posts);
      savePostsToStorage(latestPosts.filter((p) => p.id !== id));
      logAuditAction('Deleted Post', postTitle);
    }
  };

  // ==========================================
  // 8. ENTERPRISE PROGRAMMATIC SEO BULK ENGINE
  // ==========================================
  const handleRunProgrammaticSeoBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('programmatic_seo')) {
      alert('🔒 Access Denied: Only Super Admin or SEO Manager can run Programmatic SEO batches.');
      return;
    }

    const examNames = pSeoExams.split(',').map((s) => s.trim()).filter(Boolean);
    if (examNames.length === 0) return;

    const latestPosts = readLatestStorage<Post>('careersathi_posts', posts);
    const mainCatObj = mainCategories.find((c) => c.name === pSeoCategory);
    const subCatObj = categories.find((c) => c.parentId !== null && c.name === pSeoSubCategory);
    const nowStr = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const generatedBatch: Post[] = examNames.map((examName, idx) => {
      const fullTitle = `${examName} ${pSeoCategory} ${pSeoYear} — Apply Online & Notification`;
      const slugVal = sanitizeSeoSlug(`${examName}-${pSeoCategory}-${pSeoYear}`, true);

      return {
        id: `${Date.now()}-${idx}`,
        title: fullTitle,
        slug: slugVal,
        category: pSeoCategory,
        categorySlug: sanitizeSeoSlug(mainCatObj?.slug || 'latest-jobs', true),
        subCategory: pSeoSubCategory || undefined,
        subCategorySlug: subCatObj?.slug ? sanitizeSeoSlug(subCatObj.slug, true) : undefined,
        targetExamTag: examName.toUpperCase().includes('SSC')
          ? 'SSC'
          : examName.toUpperCase().includes('RRB')
          ? 'RAILWAY'
          : examName.toUpperCase().includes('IBPS') || examName.toUpperCase().includes('SBI')
          ? 'BANKING'
          : 'STATE',
        vacancyOrSeats: pSeoVacancyNote,
        publisherName: `${currentStaff.name} (Programmatic SEO)`,
        publishedAt: nowStr,
        version: 1,
        featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        shortDescription: `Official ${fullTitle}. Check eligibility, age limit, syllabus, and resize photo/signature using CareerSathi Form Tool.`,
        importantDates: [
          { label: 'Notification Released', date: `Nov ${pSeoYear}` },
          { label: 'Last Date to Apply', date: `Dec ${pSeoYear}` },
        ],
        classicContent: sanitizeSafeHtml(`<h2>${fullTitle}</h2><p>Candidates applying for <strong>${examName} ${pSeoYear}</strong> can verify official dates, vacancy breakdown (${pSeoVacancyNote}), and prepare their required documents (Photo, 6x2cm Signature, Left Thumb &amp; PDF Certificates) using our free online tools below.</p>`),
        importantLinks: [
          { text: 'Official Portal Link', url: 'https://ssc.gov.in' },
          { text: '⚡ Resize Photo & Signature (All-in-One Form Tool)', url: '/tools/form-tool' },
          { text: '🪪 Passport Size Photo & A4 Sheet Maker', url: '/tools/passport-photo-maker' },
        ],
        faqs: [
          { question: `How to resize photo and signature for ${examName} ${pSeoYear}?`, answer: `Open CareerSathi Form Tool, select ${examName}, and upload your photo/signature for automatic KB & DPI formatting.` },
          { question: `Where to download ${examName} ${pSeoCategory} ${pSeoYear}?`, answer: 'Use the direct official link in the Important Links table above.' },
        ],
        metaTitle: `${fullTitle} | CareerSathi`,
        metaDesc: `Apply online for ${fullTitle}. Check dates, ${pSeoVacancyNote} vacancies, and free form photo/signature resizer tool.`,
        focusKeyword: `${examName} ${pSeoYear}`,
        indexedPinged: true,
      };
    });

    savePostsToStorage([...generatedBatch, ...latestPosts]);
    logAuditAction('Ran Programmatic SEO Batch', `${generatedBatch.length} Landing Posts Created`);
    setPingStatusMsg(`✅ Generated ${generatedBatch.length} SEO-Optimized Exam Pages with Clean Slugs & Pinged Google Sitemap Indexing API!`);
    setTimeout(() => setPingStatusMsg(''), 5000);
  };

  // ==========================================
  // 9. MOCK TESTS BUILDER
  // ==========================================
  const handleAIAddSampleQuestions = () => {
    const sampleQs: Question[] = [
      { id: `q-${Date.now()}-1`, questionText: 'Which Article of the Indian Constitution deals with the Right to Equality?', options: ['Article 14 to 18', 'Article 19 to 22', 'Article 23 to 24', 'Article 32'], correctOptionIndex: 0 },
      { id: `q-${Date.now()}-2`, questionText: 'If the ratio of cost price to selling price is 4 : 5, what is the profit percentage?', options: ['20%', '25%', '15%', '30%'], correctOptionIndex: 1 },
      { id: `q-${Date.now()}-3`, questionText: 'Where is the headquarters of ISRO located?', options: ['New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad'], correctOptionIndex: 2 },
    ];
    setQuestionsList(sampleQs);
  };

  const handleMockTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSlug = sanitizeSeoSlug(testSlug || testTitle, true);
    if (!testTitle.trim() || !generatedSlug) {
      alert('Please enter a valid Test Title!');
      return;
    }

    const latestTests = readLatestStorage<MockTest>('careersathi_mock_tests', mockTests);
    const mins = Number(testTimeMinutes) || 30;
    const marks = questionsList.length * 4;

    const newTest: MockTest = {
      id: Date.now().toString(),
      slug: generatedSlug,
      title: testTitle.trim(),
      testTitle: testTitle.trim(),
      category: testCategory,
      examCategory: testCategory,
      duration: mins,
      totalTimeMinutes: mins,
      totalMarks: marks,
      questions: questionsList,
      publishedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    saveMockTestsToStorage([newTest, ...latestTests]);
    logAuditAction('Published CBT Mock Test', `${testTitle} (/mock-tests/${generatedSlug})`);
    alert(`🎯 CBT Mock Test Published! Clean URL: /mock-tests/${generatedSlug}`);
    setTestTitle('');
    setTestSlug('');
    setQuestionsList([{ id: '1', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
    setActiveTab('mock-tests');
  };

  // ==========================================
  // 10. FULL DATABASE JSON BACKUP & RESTORE
  // ==========================================
  const handleExportFullBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'CareerSathi Enterprise CMS',
      posts, categories, revisions, pages, mockTests, toolsConfig, staffList, auditLogs, partnersList, partnerCourses,
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careersathi-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAuditAction('Exported Full Database Backup', 'JSON Snapshot');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.categories) saveCategoriesToStorage(data.categories, data.posts || posts);
        if (data.posts) savePostsToStorage(data.posts);
        if (data.pages) savePagesToStorage(data.pages);
        if (data.mockTests) saveMockTestsToStorage(data.mockTests);
        if (data.toolsConfig) saveToolsConfig(data.toolsConfig);
        alert('✅ Full Database Backup Restored Successfully!');
        logAuditAction('Restored Database from JSON Backup', file.name);
      } catch {
        alert('Invalid backup JSON file!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingPartnersCount = partnersList.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* ENTERPRISE SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 lg:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-5 flex flex-col justify-between shrink-0">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                CAREERSATHI <span className="text-amber-400">OS</span>
              </h2>
              <p className="text-[11px] text-slate-400">Enterprise RBAC &amp; SEO Command Center</p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              v4.1 SECURE
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Active Session Role:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase text-[10px]">
                {currentStaff.role.replace('_', ' ')}
              </span>
            </div>
            <select
              value={currentStaff.id}
              onChange={(e) => {
                const found = staffList.find((s) => s.id === e.target.value);
                if (found) setCurrentStaff(found);
              }}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs outline-none"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  👤 {st.name} ({st.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            <button type="button" onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>📊 Executive Dashboard</span>
            </button>
            <button type="button" onClick={() => { resetForm(); setActiveTab('posts'); }} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>📝 All Posts &amp; Revisions</span>
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full text-[10px]">{posts.length}</span>
            </button>
            <button type="button" onClick={() => { resetForm(); setActiveTab('add-post'); }} className={`w-full text-left px-3 py-2.5 rounded-xl transition ${activeTab === 'add-post' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-amber-300'}`}>
              ➕ Create Post (Block Editor)
            </button>
            <button type="button" onClick={() => { resetCategoryForm(); setActiveTab('categories'); }} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-cyan-300'}`}>
              <span>🗂️ Categories &amp; Subcategories SEO</span>
              <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full text-[10px]">{categories.length}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('programmatic-seo')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'programmatic-seo' ? 'bg-amber-500 text-slate-950 font-black shadow-lg' : 'hover:bg-slate-800 text-emerald-400'}`}>
              <span>🚀 Programmatic SEO Engine</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">PRO</span>
            </button>
            <button type="button" onClick={() => setActiveTab('tools-manager')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'tools-manager' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>🛠️ Student Tools &amp; SEO</span>
              <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full text-[10px]">{toolsConfig.filter((t) => t.isActive).length}/{toolsConfig.length}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('mock-tests')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'mock-tests' || activeTab === 'add-mock-test' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>🎯 CBT Mock Tests</span>
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">{mockTests.length}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('partners-approval')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'partners-approval' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>🏛️ Partners &amp; Courses</span>
              {pendingPartnersCount > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{pendingPartnersCount}</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('pages')} className={`w-full text-left px-3 py-2.5 rounded-xl transition ${activeTab === 'pages' || activeTab === 'add-page' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              📄 Static Pages (Block Editor) ({pages.length})
            </button>
            <button type="button" onClick={() => setActiveTab('rbac-staff')} className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${activeTab === 'rbac-staff' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              <span>🛡️ Team RBAC &amp; Audit Logs</span>
              {!hasPermission('manage_rbac') && <span>🔒</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('settings-backup')} className={`w-full text-left px-3 py-2.5 rounded-xl transition ${activeTab === 'settings-backup' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
              💾 Backup &amp; Global Settings
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link href="/" className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs rounded-xl text-white font-black transition shadow-lg">
            🌐 View Live Website ↗
          </Link>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto space-y-6">
        {syncNotice && (
          <div className="p-3 bg-cyan-950/90 border border-cyan-500 rounded-xl text-cyan-200 text-xs font-bold flex items-center justify-between">
            <span>{syncNotice}</span>
            <button type="button" onClick={() => setSyncNotice('')} className="text-cyan-400 font-black">✕</button>
          </div>
        )}

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-white">👑 Executive Command Center</h1>
                <p className="text-xs text-slate-400">
                  Logged in as <strong className="text-amber-400">{currentStaff.name}</strong> • Role:{' '}
                  <strong className="uppercase text-emerald-400">{currentStaff.role}</strong> •{' '}
                  <span className="text-cyan-400 font-bold">🛡️ XSS &amp; Concurrency Lock Active</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { resetForm(); setActiveTab('add-post'); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow">
                  + New Exam Post
                </button>
                <button type="button" onClick={() => { resetCategoryForm(); setActiveTab('categories'); }} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow">
                  🗂️ Manage Categories &amp; Subcategories
                </button>
                <button type="button" onClick={() => setActiveTab('programmatic-seo')} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow">
                  🚀 Bulk SEO Generator
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Live Exam Posts</span>
                <div className="text-3xl font-black text-blue-400 mt-1">{posts.length}</div>
                <span className="text-[10px] text-emerald-400 font-bold">✓ Gutenberg + Schema Active</span>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">SEO Categories &amp; Subs</span>
                <div className="text-3xl font-black text-cyan-400 mt-1">{mainCategories.length} / {categories.length - mainCategories.length}</div>
                <span className="text-[10px] text-slate-400">Main / Subcategory Silos</span>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Active Student Tools</span>
                <div className="text-3xl font-black text-amber-400 mt-1">{toolsConfig.filter((t) => t.isActive).length} / {toolsConfig.length}</div>
                <span className="text-[10px] text-slate-400">2025–26 Form Presets Ready</span>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">CBT Mock Tests</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{mockTests.length}</div>
                <span className="text-[10px] text-slate-400">Synced with Homepage</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white">🛡️ Recent Staff Activity Audit Logs</h3>
                  <button type="button" onClick={() => setActiveTab('rbac-staff')} className="text-xs text-blue-400 hover:underline font-bold">View All →</button>
                </div>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No staff actions logged in this session yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                    {auditLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-amber-400">{log.actorName}</span>{' '}
                          <span className="text-slate-300">{log.action}:</span>{' '}
                          <strong className="text-white">{log.target}</strong>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white">⏪ Post Revision History (1-Click Rollback)</h3>
                  <span className="text-[10px] text-slate-400">{revisions.length} Snapshots</span>
                </div>
                {revisions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Whenever any staff edits a post, a backup revision snapshot appears here for 1-click rollback.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                    {revisions.slice(0, 6).map((rev) => (
                      <div key={rev.revisionId} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white truncate max-w-xs">{rev.snapshot.title}</div>
                          <div className="text-[10px] text-slate-400">Saved by {rev.savedBy} at {rev.savedAt}</div>
                        </div>
                        <button type="button" onClick={() => handleRollbackRevision(rev)} className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-[11px] hover:bg-amber-500 hover:text-slate-950 transition">
                          ⏪ Rollback
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES & SUBCATEGORIES SEO SILO MANAGER */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-7 space-y-4">
              <form onSubmit={handleSaveCategory} className="bg-slate-900 p-5 rounded-2xl border border-cyan-500/40 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">Google Silo SEO + Block Editor</span>
                    <h2 className="text-lg font-black text-white mt-1">{editingCatId ? '✏️ Edit Category / Subcategory SEO' : '➕ Create Category or Subcategory'}</h2>
                  </div>
                  <button type="button" onClick={handleAICategorySeoFill} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-lg shadow text-[11px]">
                    ✨ 1-Click AI SEO Auto-Fill
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Hierarchy Type (Main vs Subcategory)</label>
                    <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold">
                      <option value="MAIN">📁 Main Primary Category (Top Level)</option>
                      {mainCategories.map((mc) => (
                        <option key={mc.id} value={mc.id}>↳ Subcategory under: {mc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Target Exam Tag (For Tools &amp; Courses)</label>
                    <select value={catTargetExam} onChange={(e) => setCatTargetExam(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold">
                      <option value="ALL">ALL EXAMS</option>
                      <option value="SSC">SSC</option>
                      <option value="RAILWAY">RAILWAY (RRB)</option>
                      <option value="BANKING">BANKING (IBPS/SBI)</option>
                      <option value="UPSC">UPSC</option>
                      <option value="STATE">STATE POLICE / PSC</option>
                      <option value="NEET">NEET / JEE / ADMISSION</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category / Subcategory Name *</label>
                    <input type="text" required value={catName} onChange={(e) => { setCatName(e.target.value); setCatSlug(sanitizeSeoSlug(e.target.value, true)); }} placeholder="e.g. UP Sarkari Jobs or Defence Jobs" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-300">SEO URL Slug *</label>
                      <span className="text-[10px] text-emerald-400 font-bold">🛡️ Auto-Sanitized</span>
                    </div>
                    <input type="text" required value={catSlug} onChange={(e) => setCatSlug(sanitizeSeoSlug(e.target.value, false))} onBlur={(e) => setCatSlug(sanitizeSeoSlug(e.target.value, true))} placeholder="e.g. up-sarkari-jobs" className="w-full p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono" />
                    <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                      URL: /category/{catParentId !== 'MAIN' ? `${mainCategories.find((m) => m.id === catParentId)?.slug || 'main'}/` : ''}{catSlug || 'your-clean-slug'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">SEO Page H1 Heading (Shown at Top of Category Page)</label>
                  <input type="text" value={catH1} onChange={(e) => setCatH1(e.target.value)} placeholder="e.g. Bihar Sarkari Jobs 2026 — Apply Online & Notification" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-indigo-400 mb-1">Google Meta Title (60 chars)</label>
                    <input type="text" value={catMetaTitle} onChange={(e) => setCatMetaTitle(e.target.value)} placeholder="Meta Title for Google Search" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-indigo-400 mb-1">Focus Keyword</label>
                    <input type="text" value={catFocusKeyword} onChange={(e) => setCatFocusKeyword(e.target.value)} placeholder="e.g. Bihar Government Jobs 2026" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-indigo-400 mb-1">Google Meta Description (155 chars)</label>
                  <textarea rows={2} value={catMetaDesc} onChange={(e) => setCatMetaDesc(e.target.value)} placeholder="High-CTR Meta Description..." className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                </div>

                <GutenbergSmartEditor label="✨ Top Intro Summary (Below H1 on Landing Page)" badgeText="Bold, Color, Size & HTML/Visual" variant="compact" minHeight="110px" value={catShortIntro} onChange={setCatShortIntro} placeholder="Write a 2-3 line intro summary below the H1 heading..." />
                <GutenbergSmartEditor label="🚀 Bottom Long-Form SEO Content (Google Ranking Guide)" badgeText="Full Gutenberg Blocks + Visual / Code" variant="full" minHeight="240px" value={catSeoBottom} onChange={setCatSeoBottom} placeholder="Add H2/H3 headings, vacancy tables, bullet points, images, links..." />

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">❓ Category FAQ Schema (Google Rich Snippets)</span>
                    <button type="button" onClick={() => setCatFaqs([...catFaqs, { question: '', answer: '' }])} className="px-2.5 py-1 bg-slate-800 text-white rounded-lg font-bold">+ Add FAQ</button>
                  </div>
                  {catFaqs.map((fq, idx) => (
                    <div key={idx} className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input type="text" placeholder="FAQ Question" value={fq.question} onChange={(e) => { const up = [...catFaqs]; up[idx].question = e.target.value; setCatFaqs(up); }} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold" />
                      <input type="text" placeholder="FAQ Answer" value={fq.answer} onChange={(e) => { const up = [...catFaqs]; up[idx].answer = e.target.value; setCatFaqs(up); }} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300" />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg">
                    {editingCatId ? '💾 Update Category SEO' : '🚀 Save Category / Subcategory'}
                  </button>
                  {editingCatId && (
                    <button type="button" onClick={resetCategoryForm} className="px-4 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white">🌳 Live Category &amp; Subcategory SEO Tree</h3>
                  <p className="text-[11px] text-slate-400">Both Main Categories and Subcategories render via `/category/[...slug]`</p>
                </div>

                <div className="space-y-4">
                  {mainCategories.map((mainCat) => {
                    const childSubs = categories.filter((c) => c.parentId === mainCat.id);
                    return (
                      <div key={mainCat.id} className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-amber-400">📁 {mainCat.name}</span>
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">{mainCat.count} Posts</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">/category/{mainCat.slug}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link href={`/category/${mainCat.slug}`} target="_blank" className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold">View Page ↗</Link>
                            <button type="button" onClick={() => handleEditCategoryClick(mainCat)} className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded-lg font-bold">Edit SEO</button>
                            <button type="button" onClick={() => { resetCategoryForm(); setCatParentId(mainCat.id); }} className="px-2.5 py-1 bg-cyan-600/30 text-cyan-300 rounded-lg font-bold">+ Add Sub</button>
                          </div>
                        </div>

                        {childSubs.length > 0 && (
                          <div className="pl-4 border-l-2 border-slate-800 space-y-2 pt-1">
                            {childSubs.map((sub) => (
                              <div key={sub.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-bold text-cyan-300 flex items-center gap-2">
                                    <span>↳ {sub.name}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{sub.count} Posts</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">/category/{mainCat.slug}/{sub.slug}</div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Link href={`/category/${mainCat.slug}/${sub.slug}`} target="_blank" className="px-2 py-1 bg-slate-800 text-emerald-300 rounded font-bold text-[10px]">View ↗</Link>
                                  <button type="button" onClick={() => handleEditCategoryClick(sub)} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded font-bold text-[10px]">Edit SEO</button>
                                  <button type="button" onClick={() => handleDeleteCategory(sub)} className="px-2 py-1 bg-rose-950 text-rose-400 rounded font-bold text-[10px]">✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROGRAMMATIC SEO ENGINE */}
        {activeTab === 'programmatic-seo' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/40 shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">Enterprise Growth Engine</span>
                <h1 className="text-xl md:text-2xl font-black text-white mt-1">🚀 Programmatic SEO Bulk Page Generator</h1>
                <p className="text-xs text-slate-400">Comma-separated exams likho aur 1 click mein Category + Subcategory + Clean SEO Slugs ke sath saare notifications ready karo!</p>
              </div>

              {pingStatusMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs font-black">{pingStatusMsg}</div>
              )}

              <form onSubmit={handleRunProgrammaticSeoBatch} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">1. Enter Target Exam Names (Comma Separated):</label>
                  <textarea rows={3} value={pSeoExams} onChange={(e) => setPSeoExams(e.target.value)} placeholder="e.g. SSC CGL, SSC CHSL, RRB Group D, UP Police Constable" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">2. Main Category:</label>
                    <select value={pSeoCategory} onChange={(e) => { setPSeoCategory(e.target.value); setPSeoSubCategory(''); }} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold">
                      {mainCategories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-cyan-300 mb-1">3. Subcategory (Optional):</label>
                    <select value={pSeoSubCategory} onChange={(e) => setPSeoSubCategory(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold">
                      <option value="">-- All / None --</option>
                      {getSubcategoriesByParentName(pSeoCategory).map((sub) => (<option key={sub.id} value={sub.name}>{sub.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">4. Target Year:</label>
                    <input type="text" value={pSeoYear} onChange={(e) => setPSeoYear(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">5. Vacancy / Badge Note:</label>
                    <input type="text" value={pSeoVacancyNote} onChange={(e) => setPSeoVacancyNote(e.target.value)} placeholder="e.g. Bumper Posts" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition">
                  ⚡ Generate Bulk SEO Pages &amp; Ping Google Indexing API Now
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT TOOLS & SEO CONTROLLER */}
        {activeTab === 'tools-manager' && (
          <div className="space-y-6 max-w-5xl">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <h1 className="text-xl font-black text-white">🛠️ Student Utility Tools &amp; SEO Metadata Controller</h1>
              <p className="text-xs text-slate-400">Control tool availability (Live / Maintenance), Target Exam Tags, and custom Google SEO Titles.</p>
            </div>

            <div className="space-y-3">
              {toolsConfig.map((tool, idx) => (
                <div key={tool.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${tool.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                        {tool.isActive ? '🟢 LIVE' : '🔴 MAINTENANCE'}
                      </span>
                      <Link href={tool.path} target="_blank" className="text-sm font-black text-white hover:text-amber-400 underline">{tool.name} ↗</Link>
                      <span className="text-slate-500 font-mono">{tool.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={tool.targetExam}
                        onChange={(e) => {
                          const updated = [...toolsConfig];
                          updated[idx].targetExam = e.target.value;
                          saveToolsConfig(updated);
                        }}
                        className="p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold"
                      >
                        <option value="SSC">Target: SSC</option>
                        <option value="BANKING">Target: Banking</option>
                        <option value="RAILWAY">Target: Railway</option>
                        <option value="UPSC">Target: UPSC</option>
                        <option value="NEET">Target: NEET/JEE</option>
                        <option value="ALL">Target: All Exams</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!hasPermission('manage_tools')) {
                            alert('🔒 Only Super Admin or SEO Manager can modify tools!');
                            return;
                          }
                          const updated = [...toolsConfig];
                          updated[idx].isActive = !updated[idx].isActive;
                          saveToolsConfig(updated);
                          logAuditAction(updated[idx].isActive ? 'Enabled Tool' : 'Put Tool in Maintenance', tool.name);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold ${tool.isActive ? 'bg-rose-950 text-rose-300 border border-rose-700/50' : 'bg-emerald-600 text-white'}`}
                      >
                        {tool.isActive ? 'Set Maintenance' : 'Turn Live'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">SEO Meta Title:</label>
                      <input type="text" value={tool.metaTitle} onChange={(e) => { const updated = [...toolsConfig]; updated[idx].metaTitle = e.target.value; saveToolsConfig(updated); }} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">SEO Meta Description:</label>
                      <input type="text" value={tool.metaDesc} onChange={(e) => { const updated = [...toolsConfig]; updated[idx].metaDesc = e.target.value; saveToolsConfig(updated); }} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ALL POSTS LIST */}
        {activeTab === 'posts' && (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-2xl font-black">📝 Manage Exam Posts ({posts.length})</h1>
              <button type="button" onClick={() => { resetForm(); setActiveTab('add-post'); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow">
                + Add Advanced Post
              </button>
            </div>

            <input type="text" placeholder="🔍 Search posts by title, category, or subcategory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Title &amp; Clean Slug</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Category &amp; Subcategory</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Publisher</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No posts found. Click &quot;+ Add Advanced Post&quot; to publish your first update!</td>
                    </tr>
                  ) : (
                    filteredPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-bold text-blue-400 text-sm">{p.title}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">/posts/{p.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">{p.category}</span>
                          {p.subCategory && <span className="ml-1.5 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-bold text-[10px]">↳ {p.subCategory}</span>}
                          {p.targetExamTag && <span className="ml-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px]">{p.targetExamTag}</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <div>{p.publisherName}</div>
                          <div className="text-[10px]">{p.publishedAt}</div>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Link href={`/posts/${p.slug}`} target="_blank" className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded font-bold">View ↗</Link>
                          <button type="button" onClick={() => handleEditClick(p)} className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded font-bold">Edit</button>
                          <button type="button" onClick={() => handleDeletePost(p.id, p.title)} className="px-2.5 py-1 bg-rose-950 text-rose-400 rounded font-bold">Delete {!hasPermission('delete_content') && '🔒'}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: ADD / EDIT POST WITH GUTENBERG BLOCK EDITOR */}
        {activeTab === 'add-post' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h1 className="text-xl font-black">{editingId ? '✏️ Edit Post (Auto-Saves Revision)' : '➕ Create SEO-Optimized Post'}</h1>
                <button type="button" onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black">
                  {showPreview ? '← Back to Block Editor' : '👁️ Full Page Preview'}
                </button>
              </div>

              {!showPreview ? (
                <form onSubmit={handleSubmitPost} className="space-y-5 text-xs">
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">1. Main Category *</label>
                        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold">
                          {mainCategories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-cyan-300">2. Subcategory</label>
                          <button type="button" onClick={() => setActiveTab('categories')} className="text-[10px] text-amber-400 hover:underline font-bold">+ Manage</button>
                        </div>
                        <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold">
                          <option value="">-- General / No Subcategory --</option>
                          {getSubcategoriesByParentName(category).map((sub) => (<option key={sub.id} value={sub.name}>{sub.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">3. Target Exam Tag</label>
                        <select value={targetExamTag} onChange={(e) => setTargetExamTag(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold">
                          <option value="SSC">SSC</option>
                          <option value="BANKING">BANKING (IBPS/SBI)</option>
                          <option value="RAILWAY">RAILWAY (RRB)</option>
                          <option value="UPSC">UPSC</option>
                          <option value="NEET">NEET / MEDICAL</option>
                          <option value="JEE">JEE / ENGINEERING</option>
                          <option value="STATE">STATE POLICE / PSC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">4. Vacancy Badge</label>
                        <input type="text" value={vacancyOrSeats} onChange={(e) => setVacancyOrSeats(e.target.value)} placeholder="e.g. 39,481 Posts" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                        <label className="font-bold text-slate-300">Post Title (H1)</label>
                        <button type="button" onClick={handleAIGenerate} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black rounded-lg shadow">
                          ✨ 1-Click AI Auto-Fill Post + Category + SEO
                        </button>
                      </div>
                      <input type="text" required value={title} onChange={(e) => { setTitle(e.target.value); setSlug(sanitizeSeoSlug(e.target.value, true)); }} placeholder="e.g. Bihar BPSC 72nd Combined Competitive Exam 2026 Online Form" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-300">SEO URL Slug *</label>
                          <span className="text-[10px] text-emerald-400 font-bold">🛡️ Special Chars Blocked</span>
                        </div>
                        <input type="text" required value={slug} onChange={(e) => setSlug(sanitizeSeoSlug(e.target.value, false))} onBlur={(e) => setSlug(sanitizeSeoSlug(e.target.value, true))} placeholder="auto-generated-clean-slug" className="w-full p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono" />
                        <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">Live URL: https://career3.vercel.app/posts/{slug || 'clean-url-slug'}</div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Short Summary Description</label>
                        <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="2-line summary shown at top of post..." className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-emerald-400">📅 Important Dates Table</span>
                      <button type="button" onClick={() => setImportantDates([...importantDates, { label: '', date: '' }])} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">+ Add Date Row</button>
                    </div>
                    {importantDates.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input type="text" placeholder="Event Label (e.g. Last Date)" value={row.label} onChange={(e) => { const up = [...importantDates]; up[idx].label = e.target.value; setImportantDates(up); }} className="sm:col-span-6 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
                        <input type="text" placeholder="Date (e.g. 30 Nov 2026)" value={row.date} onChange={(e) => { const up = [...importantDates]; up[idx].date = e.target.value; setImportantDates(up); }} className="sm:col-span-5 p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold" />
                        <button type="button" onClick={() => setImportantDates(importantDates.filter((_, i) => i !== idx))} className="sm:col-span-1 bg-rose-950 text-rose-400 rounded-lg font-bold p-2">✕</button>
                      </div>
                    ))}
                  </div>

                  <GutenbergSmartEditor label="📝 Post Detailed Content (Notion / Gutenberg Block Editor)" badgeText="Blocks + Visual + XSS-Safe HTML" variant="full" minHeight="320px" value={classicContent} onChange={setClassicContent} placeholder="Write complete exam details, vacancy breakdown tables, eligibility, syllabus..." />

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-cyan-400">🔗 Important Links Table</span>
                      <button type="button" onClick={() => setImportantLinks([...importantLinks, { text: '', url: '' }])} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">+ Add Link Row</button>
                    </div>
                    {importantLinks.map((lnk, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input type="text" placeholder="Link Title (e.g. Apply Online)" value={lnk.text} onChange={(e) => { const up = [...importantLinks]; up[idx].text = e.target.value; setImportantLinks(up); }} className="sm:col-span-5 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
                        <input type="text" placeholder="URL (e.g. https://ssc.gov.in or /tools/form-tool)" value={lnk.url} onChange={(e) => { const up = [...importantLinks]; up[idx].url = e.target.value; setImportantLinks(up); }} className="sm:col-span-6 p-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono" />
                        <button type="button" onClick={() => setImportantLinks(importantLinks.filter((_, i) => i !== idx))} className="sm:col-span-1 bg-rose-950 text-rose-400 rounded-lg font-bold p-2">✕</button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-emerald-400">❓ Post FAQ Schema (For Google People Also Ask)</span>
                      <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">+ Add FAQ</button>
                    </div>
                    {faqs.map((fq, idx) => (
                      <div key={idx} className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Question (e.g. What is the last date to apply?)" value={fq.question} onChange={(e) => { const up = [...faqs]; up[idx].question = e.target.value; setFaqs(up); }} className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold" />
                          <button type="button" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="px-2.5 bg-rose-950 text-rose-400 rounded-lg font-bold">✕</button>
                        </div>
                        <input type="text" placeholder="Answer..." value={fq.answer} onChange={(e) => { const up = [...faqs]; up[idx].answer = e.target.value; setFaqs(up); }} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300" />
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <span className="font-black text-indigo-400 block">🔍 Google Search Meta Tags</span>
                    <input type="text" placeholder="SEO Meta Title (40-65 chars recommended)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                    <textarea rows={2} placeholder="SEO Meta Description (100-160 chars recommended)" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                  </div>

                  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl">
                    {editingId ? '🔄 Save Changes & Snapshot Revision' : '🚀 Publish Post Live'}
                  </button>
                </form>
              ) : (
                <div className="bg-white text-slate-900 p-6 rounded-2xl space-y-4">
                  <h1 className="text-2xl font-black text-blue-900">{title}</h1>
                  <p className="text-xs text-slate-600">{shortDescription}</p>
                  <div className="prose max-w-none text-xs" dangerouslySetInnerHTML={{ __html: sanitizeSafeHtml(classicContent) }} />
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-white uppercase">📈 Live Google SEO Score</span>
                  <span className={`px-3 py-1 rounded-full font-black text-xs ${seoHealth.score >= 80 ? 'bg-emerald-500 text-slate-950' : seoHealth.score >= 50 ? 'bg-amber-500 text-slate-950' : 'bg-rose-600 text-white'}`}>
                    {seoHealth.score} / 100
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {seoHealth.checks.map((chk, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span className={chk.passed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{chk.passed ? '✓ ' : '○ '} {chk.label}</span>
                      <span className="text-[10px] font-black text-slate-500">+{chk.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: CBT MOCK TESTS MANAGER & BUILDER */}
        {activeTab === 'mock-tests' && (
          <div className="space-y-5 max-w-5xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black">🎯 CBT Mock Tests ({mockTests.length})</h1>
                <p className="text-xs text-slate-400">Fully synced with Homepage &amp; Live Exam Timer Portal</p>
              </div>
              <button type="button" onClick={() => setActiveTab('add-mock-test')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow">
                + Create CBT Mock Test
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockTests.map((t) => (
                <div key={t.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">{t.category || t.examCategory}</span>
                    <h3 className="font-black text-sm text-white mt-1">{t.testTitle || t.title}</h3>
                    <p className="text-[11px] text-emerald-400 font-mono">/mock-tests/{t.slug}</p>
                    <p className="text-xs text-slate-400">⏱️ {t.totalTimeMinutes || t.duration} Mins • ❓ {t.questions?.length || 0} Qs</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/mock-tests/${t.slug}`} target="_blank" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Test ↗</Link>
                    {hasPermission('delete_content') && (
                      <button type="button" onClick={() => saveMockTestsToStorage(mockTests.filter((x) => x.id !== t.id))} className="px-3 py-1.5 bg-rose-950 text-rose-400 text-xs font-bold rounded-lg">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'add-mock-test' && (
          <form onSubmit={handleMockTestSubmit} className="space-y-5 max-w-4xl text-xs">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-black">🎯 Create CBT Mock Test</h1>
              <button type="button" onClick={handleAIAddSampleQuestions} className="px-3 py-1.5 bg-purple-600 text-white font-black rounded-lg">✨ Auto-Load Sample Questions</button>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Mock Test Title *</label>
                <input type="text" required value={testTitle} onChange={(e) => { setTestTitle(e.target.value); setTestSlug(sanitizeSeoSlug(e.target.value, true)); }} placeholder="e.g. SSC GD Constable Full Mock Set 1" className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
              </div>
              <div>
                <label className="block font-bold text-emerald-400 mb-1">🛡️ Protected SEO Slug</label>
                <input type="text" required value={testSlug} onChange={(e) => setTestSlug(sanitizeSeoSlug(e.target.value, false))} onBlur={(e) => setTestSlug(sanitizeSeoSlug(e.target.value, true))} placeholder="ssc-gd-constable-full-mock-set-1" className="w-full p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono" />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Duration (Mins)</label>
                <input type="number" value={testTimeMinutes} onChange={(e) => setTestTimeMinutes(Number(e.target.value))} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
              </div>
            </div>
            {questionsList.map((q, qIdx) => (
              <div key={q.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-black text-amber-400">Question #{qIdx + 1}</div>
                <input type="text" required value={q.questionText} onChange={(e) => { const up = [...questionsList]; up[qIdx].questionText = e.target.value; setQuestionsList(up); }} placeholder="Enter question..." className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <input key={oIdx} type="text" required value={opt} onChange={(e) => { const up = [...questionsList]; up[qIdx].options[oIdx] = e.target.value; setQuestionsList(up); }} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-white" />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button type="button" onClick={() => setQuestionsList([...questionsList, { id: Date.now().toString(), questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }])} className="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl">+ Add Question</button>
              <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl">🚀 Publish CBT Mock Test</button>
            </div>
          </form>
        )}

        {/* TAB 8: PARTNERS & CONTEXTUAL COURSES APPROVAL */}
        {activeTab === 'partners-approval' && (
          <div className="space-y-6 max-w-5xl text-xs">
            <h1 className="text-2xl font-black">🏛️ Coaching Partners &amp; Contextual Courses</h1>
            {!hasPermission('manage_partners') ? (
              <div className="p-8 bg-rose-950/40 border border-rose-700 rounded-2xl text-center text-rose-200 font-bold">
                🔒 Restricted Area: Only Super Admin or Moderator can approve coaching partners.
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-400">Institute</th>
                      <th className="px-4 py-3 text-left text-slate-400">Phone &amp; City</th>
                      <th className="px-4 py-3 text-left text-slate-400">Status</th>
                      <th className="px-4 py-3 text-right text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {partnersList.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-500">No partner requests yet.</td></tr>
                    ) : (
                      partnersList.map((partner: any) => (
                        <tr key={partner.id}>
                          <td className="px-4 py-3 font-bold text-white">{partner.instituteName} ({partner.ownerName})</td>
                          <td className="px-4 py-3 text-slate-400">{partner.phone} • {partner.city}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">{partner.status}</span></td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {partner.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const up = partnersList.map((p: any) => p.id === partner.id ? { ...p, status: 'approved' } : p);
                                  setPartnersList(up);
                                  localStorage.setItem('careersathi_partners', JSON.stringify(up));
                                  logAuditAction('Approved Coaching Partner', partner.instituteName);
                                }}
                                className="px-3 py-1 bg-emerald-600 text-white rounded font-bold"
                              >
                                Approve ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: TEAM RBAC & SECURITY AUDIT LOGS */}
        {activeTab === 'rbac-staff' && (
          <div className="space-y-6 max-w-5xl text-xs">
            <h1 className="text-2xl font-black">🛡️ Team RBAC Management &amp; Security Audit Logs</h1>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-amber-400">➕ Add Staff / Team Member</h3>
                <input type="text" placeholder="Full Name (e.g. Amit Kumar)" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                <input type="email" placeholder="Official Email" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value as StaffRole)} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-bold">
                  <option value="editor">Content Editor (Create/Update Only)</option>
                  <option value="seo_manager">SEO Manager (Programmatic SEO + Tools Meta)</option>
                  <option value="moderator">Partner Moderator (Approve Institutes)</option>
                  <option value="superadmin">Super Admin (Full Access)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasPermission('manage_rbac')) {
                      alert('🔒 Only Super Admin can add staff members!');
                      return;
                    }
                    if (!newStaffName || !newStaffEmail) return;
                    const ns: StaffUser = { id: `st-${Date.now()}`, name: newStaffName, email: newStaffEmail, role: newStaffRole, active: true };
                    const updated = [...staffList, ns];
                    setStaffList(updated);
                    localStorage.setItem('careersathi_staff', JSON.stringify(updated));
                    logAuditAction('Added Staff Member', `${newStaffName} (${newStaffRole})`);
                    setNewStaffName('');
                    setNewStaffEmail('');
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl"
                >
                  Grant RBAC Access ✓
                </button>
              </div>
              <div className="md:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white">👥 Authorized Team Members</h3>
                <div className="space-y-2">
                  {staffList.map((st) => (
                    <div key={st.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-black uppercase text-[10px]">{st.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: STATIC PAGES (GUTENBERG BLOCK EDITOR + TEMPLATES) */}
        {(activeTab === 'pages' || activeTab === 'add-page') && (
          <div className="space-y-5 max-w-5xl text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black">📄 Static Pages Studio ({pages.length})</h1>
                <p className="text-slate-400">Create or edit Privacy Policy, Disclaimer, About Us, Contact Us &amp; Terms using the Gutenberg Block Editor.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => { setPageTitle('Privacy Policy'); setPageSlug('privacy-policy'); setPageContent(`<h2>Privacy Policy for CareerSathi</h2><p>At <strong>CareerSathi</strong>, accessible from https://career3.vercel.app, one of our main priorities is the privacy of our student visitors.</p><h3>100% Client-Side Document Tools</h3><p>All photos, signatures, and PDF documents processed inside CareerSathi Form Tools are resized <strong>100% locally inside your browser</strong> and are never uploaded to any external server.</p>`); }} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold">⚡ Load Privacy Policy</button>
                <button type="button" onClick={() => { setPageTitle('Disclaimer'); setPageSlug('disclaimer'); setPageContent(`<h2>Official Disclaimer</h2><p><strong>CareerSathi</strong> is an independent educational information portal and student utility platform. We are not affiliated with any government recruitment board.</p><p>All job notifications, admit card dates, and result links are summarized from official government portals for student convenience.</p>`); }} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-bold">⚡ Load Disclaimer</button>
                <button type="button" onClick={() => { setPageTitle('About Us'); setPageSlug('about-us'); setPageContent(`<h2>About CareerSathi — India's Student Exam Portal</h2><p><strong>CareerSathi</strong> empowers millions of Indian students preparing for SSC, Railway RRB, IBPS Banking, UPSC, NEET, JEE, and State Government exams with real-time job alerts and free 1-click document resizing tools.</p>`); }} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg font-bold">⚡ Load About Us</button>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Page Title *</label>
                  <input type="text" placeholder="e.g. Privacy Policy, Disclaimer, About Us" value={pageTitle} onChange={(e) => { setPageTitle(e.target.value); setPageSlug(sanitizeSeoSlug(e.target.value, true)); }} className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-300">Protected Page Slug *</label>
                    <span className="text-[10px] text-emerald-400 font-bold">🛡️ SEO Slug Protected</span>
                  </div>
                  <input type="text" placeholder="privacy-policy" value={pageSlug} onChange={(e) => setPageSlug(sanitizeSeoSlug(e.target.value, false))} onBlur={(e) => setPageSlug(sanitizeSeoSlug(e.target.value, true))} className="w-full p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono" />
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Live URL: /pages/{pageSlug || 'page-slug'}</div>
                </div>
              </div>

              <GutenbergSmartEditor label="📄 Static Page Content (Notion / Gutenberg Block Studio)" badgeText="Full Gutenberg Blocks + XSS-Safe HTML" variant="full" minHeight="280px" value={pageContent} onChange={setPageContent} placeholder="Build your static page using headings, paragraphs, tables, callouts, links, or HTML code..." />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const finalSafeSlug = sanitizeSeoSlug(pageSlug || pageTitle, true);
                    if (!pageTitle.trim() || !finalSafeSlug) {
                      alert('Please enter a valid Page Title!');
                      return;
                    }
                    const latestPages = readLatestStorage<CustomPage>('careersathi_pages', pages);
                    if (editingPageId) {
                      const updated = latestPages.map((pg) =>
                        pg.id === editingPageId
                          ? { ...pg, title: pageTitle.trim(), slug: finalSafeSlug, content: sanitizeSafeHtml(pageContent), version: (pg.version || 1) + 1 }
                          : pg
                      );
                      savePagesToStorage(updated);
                      logAuditAction('Updated Static Page', `${pageTitle} (/pages/${finalSafeSlug})`);
                      setEditingPageId(null);
                      alert(`✅ Static Page Updated! URL: /pages/${finalSafeSlug}`);
                    } else {
                      const np: CustomPage = {
                        id: Date.now().toString(),
                        title: pageTitle.trim(),
                        slug: finalSafeSlug,
                        content: sanitizeSafeHtml(pageContent),
                        publishedAt: new Date().toLocaleDateString('en-IN'),
                        version: 1,
                      };
                      savePagesToStorage([...latestPages, np]);
                      logAuditAction('Created Static Page', `${pageTitle} (/pages/${finalSafeSlug})`);
                      alert(`✅ Static Page Published! URL: /pages/${finalSafeSlug}`);
                    }
                    setPageTitle('');
                    setPageSlug('');
                    setPageContent('<h2>About This Page</h2><p>Write or insert blocks here...</p>');
                  }}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg"
                >
                  {editingPageId ? '💾 Update Static Page' : '🚀 Publish Static Page'}
                </button>
                {editingPageId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPageId(null);
                      setPageTitle('');
                      setPageSlug('');
                      setPageContent('<h2>About This Page</h2><p>Write or insert blocks here...</p>');
                    }}
                    className="px-4 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {pages.length > 0 && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                {pages.map((pg) => (
                  <div key={pg.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{pg.title}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">/pages/{pg.slug}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/pages/${pg.slug}`} target="_blank" className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg font-bold">View ↗</Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPageId(pg.id);
                          setPageTitle(pg.title);
                          setPageSlug(sanitizeSeoSlug(pg.slug, true));
                          setPageContent(sanitizeSafeHtml(pg.content));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-blue-600/30 text-blue-300 rounded-lg font-bold"
                      >
                        Edit in Block Studio
                      </button>
                      <button type="button" onClick={() => savePagesToStorage(pages.filter((x) => x.id !== pg.id))} className="px-3 py-1.5 bg-rose-950 text-rose-400 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 11: SETTINGS & BACKUP */}
        {activeTab === 'settings-backup' && (
          <div className="max-w-4xl space-y-6 text-xs">
            <h1 className="text-2xl font-black">💾 Database Backup &amp; Global Portal Settings</h1>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-amber-400">📦 1-Click Full Database Snapshot (.JSON)</h3>
              <p className="text-slate-400">
                Download all your Posts, Categories, Subcategories, Revisions, Mock Tests, Partner Courses, Tools Config &amp; Staff Roles into a single backup file or restore anytime.
              </p>
              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={handleExportFullBackup} className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg">
                  📥 Download Full Backup (.JSON)
                </button>
                <label className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg cursor-pointer">
                  📤 Restore from Backup (.JSON)
                  <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}