// File: app/category/[...slug]/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface FaqRow {
  question: string;
  answer: string;
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
}

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
  publishedAt: string;
  updatedAt?: string;
  shortDescription: string;
  importantDates?: { label: string; date: string }[];
}

const FALLBACK_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Latest Jobs',
    slug: 'latest-jobs',
    parentId: null,
    targetExamTag: 'ALL',
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
    count: 0,
  },
  {
    id: 'cat-2',
    name: 'Admit Card',
    slug: 'admit-card',
    parentId: null,
    targetExamTag: 'ALL',
    h1Title: 'Sarkari Exam Admit Card 2026 — Download Hall Ticket & Exam City',
    metaTitle: 'Download Admit Card 2026 | SSC, Railway, Bank & State Exam Hall Ticket',
    metaDesc: 'Direct official links to download 2026 exam admit cards, application status, and exam city intimation slips.',
    focusKeyword: 'Admit Card 2026 Download',
    shortIntro: 'Download your official CBT exam hall ticket, check application status, shift timing, and exam city intimation slips directly.',
    seoBottomContent: '<h2>How to Download Your Exam Admit Card Online?</h2><p>Select your exam from the list above and enter your Registration Number and Date of Birth to print your A4 Admit Card.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'cat-3',
    name: 'Results',
    slug: 'results',
    parentId: null,
    targetExamTag: 'ALL',
    h1Title: 'Sarkari Exam Results 2026 — Merit List, Cut-Off & Scorecard',
    metaTitle: 'Sarkari Result 2026 | Check Exam Merit List, Cut Off Marks & Scorecard',
    metaDesc: 'Check latest government exam results 2026, roll number wise merit lists, category-wise cut-off marks, and normalized scorecards online.',
    focusKeyword: 'Sarkari Result 2026',
    shortIntro: 'Instant direct links to official exam results, selection PDF merit lists, tier-wise cut-off marks, and final scorecards.',
    seoBottomContent: '<h2>Check Roll Number Wise Merit List & Cut-Off</h2><p>All official result PDFs and scorecard login links are updated in real time.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'cat-4',
    name: 'Answer Key',
    slug: 'answer-key',
    parentId: null,
    targetExamTag: 'SSC',
    h1Title: 'Official Answer Key 2026 — Response Sheet & Instant Score Calculator',
    metaTitle: 'Exam Answer Key 2026 | Calculate Marks from Digialm Response Sheet URL',
    metaDesc: 'Download official provisional and final answer keys for SSC, RRB, and State exams.',
    focusKeyword: 'Answer Key 2026',
    shortIntro: 'Download your CBT response sheet and check your exact raw score, negative marking, and accuracy using our Answer Key Analyzer.',
    seoBottomContent: '<h2>Calculate Marks Instantly from Your Answer Key URL</h2><p>Copy your Digialm candidate response URL and paste it into the CareerSathi Answer Key Analyzer tool.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'sub-101',
    name: 'SSC Exams',
    slug: 'ssc-exams',
    parentId: 'cat-1',
    parentName: 'Latest Jobs',
    parentSlug: 'latest-jobs',
    targetExamTag: 'SSC',
    h1Title: 'SSC Recruitment 2026 — CGL, CHSL, GD Constable, MTS & CPO Online Forms',
    metaTitle: 'SSC Jobs 2026 | SSC CGL, GD, CHSL, MTS Notification & 6x2cm Sign Tool',
    metaDesc: 'Apply online for all Staff Selection Commission (SSC) 2026 recruitments. Check OTR registration, live photo rules, and 6x2cm signature resizer.',
    focusKeyword: 'SSC Recruitment 2026',
    shortIntro: 'All Staff Selection Commission (SSC) recruitment notifications, One-Time Registration (OTR) guides, and SSC 6x2cm signature formatting tools.',
    seoBottomContent: '<h2>SSC 2026 Photo & 6x2cm Signature Guidelines</h2><p>Ensure your signature is resized to 6.0 cm × 2.0 cm (10KB–20KB) using the CareerSathi SSC Form Tool.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'sub-102',
    name: 'Railway RRB Jobs',
    slug: 'railway-rrb-jobs',
    parentId: 'cat-1',
    parentName: 'Latest Jobs',
    parentSlug: 'latest-jobs',
    targetExamTag: 'RAILWAY',
    h1Title: 'Railway Recruitment 2026 (RRB) — NTPC, Group D, ALP & Technician Jobs',
    metaTitle: 'Railway RRB Jobs 2026 | NTPC, Group D, ALP Online Form & Eligibility',
    metaDesc: 'Latest Indian Railways RRB & RRC recruitment 2026 notifications for NTPC, Group D, ALP, JE, and Paramedical posts.',
    focusKeyword: 'Railway RRB Recruitment 2026',
    shortIntro: 'Zone-wise Indian Railway Recruitment Board (RRB) notifications, vacancy tables, and online application links.',
    seoBottomContent: '<h2>How to Apply for Railway RRB Exams</h2><p>Check zone-wise vacancies and prepare your white-background passport photo before submitting your RRB application.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'sub-103',
    name: 'Bihar Sarkari Jobs',
    slug: 'bihar-sarkari-jobs',
    parentId: 'cat-1',
    parentName: 'Latest Jobs',
    parentSlug: 'latest-jobs',
    targetExamTag: 'STATE',
    h1Title: 'Bihar Government Jobs 2026 — BPSC, BSSC, CSBC Bihar Police & Beltron',
    metaTitle: 'Bihar Sarkari Naukri 2026 | BPSC, BSSC, Bihar Police Online Form',
    metaDesc: 'Get fastest updates on Bihar Government Jobs 2026 including BPSC TRE Teacher, BSSC Inter/Graduate Level, and Bihar Police Constable.',
    focusKeyword: 'Bihar Sarkari Jobs 2026',
    shortIntro: 'Dedicated hub for Bihar State Government recruitment notifications (BPSC, BSSC, CSBC, BPSSC, and BCECE).',
    seoBottomContent: '<h2>Bihar State Exam Document Requirements</h2><p>Keep your Bihar Domicile Certificate, NCL/EWS Certificate, and 10th/12th Marksheet PDFs compressed under 100KB–200KB.</p>',
    faqs: [],
    count: 0,
  },
];

export default function UnifiedCategoryAndSubcategoryPage() {
  const params = useParams();
  const slugArray = Array.isArray(params?.slug)
    ? params.slug
    : params?.slug
    ? [params.slug]
    : ['latest-jobs'];

  const primarySlug = slugArray[0] || 'latest-jobs';
  const secondarySlug = slugArray[1] || null;

  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const savedCats = localStorage.getItem('careersathi_categories');
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      } catch {}
    }

    const savedPosts = localStorage.getItem('careersathi_posts');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch {}
    }
  }, []);

  // Resolve Active Taxonomy Item (Works for both Main Category & Subcategory!)
  const { activeItem, parentCategory, siblingSubcategories, isSubcategoryView } = useMemo(() => {
    const mainCats = categories.filter((c) => c.parentId === null);

    // Case 1: /category/latest-jobs/bihar-sarkari-jobs (2 slugs)
    if (secondarySlug) {
      const parentObj =
        mainCats.find((c) => c.slug === primarySlug) ||
        FALLBACK_CATEGORIES.find((c) => c.slug === primarySlug) ||
        mainCats[0];
      const subObj = categories.find(
        (c) => c.slug === secondarySlug && (!parentObj || c.parentId === parentObj.id)
      );
      const resolvedActive: CategoryItem = subObj || {
        id: 'dynamic-sub',
        name: secondarySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        slug: secondarySlug,
        parentId: parentObj?.id || 'cat-1',
        parentName: parentObj?.name || 'Latest Jobs',
        parentSlug: parentObj?.slug || primarySlug,
        targetExamTag: 'ALL',
        h1Title: `${secondarySlug.replace(/-/g, ' ').toUpperCase()} 2026 — Notifications, Dates & Online Form`,
        metaTitle: `${secondarySlug.replace(/-/g, ' ').toUpperCase()} 2026 | CareerSathi`,
        metaDesc: `Check all official updates and online forms for ${secondarySlug.replace(/-/g, ' ')}.`,
        focusKeyword: secondarySlug.replace(/-/g, ' '),
        shortIntro: `Verified official updates, important dates, and application links for ${secondarySlug.replace(/-/g, ' ')}.`,
        seoBottomContent: '',
        faqs: [],
        count: 0,
      };
      const siblings = parentObj ? categories.filter((c) => c.parentId === parentObj.id) : [];
      return {
        activeItem: resolvedActive,
        parentCategory: parentObj || null,
        siblingSubcategories: siblings,
        isSubcategoryView: true,
      };
    }

    // Case 2: /category/latest-jobs (1 slug - could be Main Category OR direct Subcategory slug)
    const foundItem = categories.find((c) => c.slug === primarySlug);
    if (foundItem && foundItem.parentId !== null) {
      const parentObj = mainCats.find((c) => c.id === foundItem.parentId) || null;
      const siblings = parentObj ? categories.filter((c) => c.parentId === parentObj.id) : [];
      return {
        activeItem: foundItem,
        parentCategory: parentObj,
        siblingSubcategories: siblings,
        isSubcategoryView: true,
      };
    }

    const mainObj: CategoryItem = foundItem || {
      id: 'dynamic-main',
      name: primarySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      slug: primarySlug,
      parentId: null,
      targetExamTag: 'ALL',
      h1Title: `${primarySlug.replace(/-/g, ' ').toUpperCase()} 2026 — Official Updates & Online Forms`,
      metaTitle: `${primarySlug.replace(/-/g, ' ').toUpperCase()} 2026 | CareerSathi`,
      metaDesc: `Latest updates and online application links for ${primarySlug.replace(/-/g, ' ')} 2026.`,
      focusKeyword: primarySlug.replace(/-/g, ' '),
      shortIntro: `Check all latest notifications, important dates, and direct links under ${primarySlug.replace(/-/g, ' ')}.`,
      seoBottomContent: '',
      faqs: [],
      count: 0,
    };

    const childSubs = categories.filter((c) => c.parentId === mainObj.id);
    return {
      activeItem: mainObj,
      parentCategory: mainObj,
      siblingSubcategories: childSubs,
      isSubcategoryView: false,
    };
  }, [categories, primarySlug, secondarySlug]);

  // Dynamically update Browser Title & Meta Description for SEO
  useEffect(() => {
    if (activeItem?.metaTitle) {
      document.title = activeItem.metaTitle;
    }
  }, [activeItem]);

  // Filter Posts belonging to this Category or Subcategory
  const matchingPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesTaxonomy = isSubcategoryView
        ? p.subCategorySlug === activeItem.slug ||
          p.subCategory?.toLowerCase() === activeItem.name.toLowerCase() ||
          p.targetExamTag?.toLowerCase() === activeItem.targetExamTag?.toLowerCase()
        : p.categorySlug === activeItem.slug ||
          p.category.toLowerCase() === activeItem.name.toLowerCase();

      if (!matchesTaxonomy) return false;
      if (!searchFilter.trim()) return true;
      return (
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    });
  }, [posts, activeItem, isSubcategoryView, searchFilter]);

  // Build Google JSON-LD Structured Data (CollectionPage + BreadcrumbList + ItemList + FAQPage)
  const jsonLdSchema = useMemo(() => {
    const breadcrumbElements: any[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://career3.vercel.app/',
      },
    ];

    if (isSubcategoryView && parentCategory) {
      breadcrumbElements.push({
        '@type': 'ListItem',
        position: 2,
        name: parentCategory.name,
        item: `https://career3.vercel.app/category/${parentCategory.slug}`,
      });
      breadcrumbElements.push({
        '@type': 'ListItem',
        position: 3,
        name: activeItem.name,
        item: `https://career3.vercel.app/category/${parentCategory.slug}/${activeItem.slug}`,
      });
    } else {
      breadcrumbElements.push({
        '@type': 'ListItem',
        position: 2,
        name: activeItem.name,
        item: `https://career3.vercel.app/category/${activeItem.slug}`,
      });
    }

    const graphs: any[] = [
      {
        '@type': 'CollectionPage',
        name: activeItem.h1Title || activeItem.name,
        description: activeItem.metaDesc || activeItem.shortIntro,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbElements,
      },
      {
        '@type': 'ItemList',
        name: `${activeItem.name} List 2026`,
        numberOfItems: matchingPosts.length,
        itemListElement: matchingPosts.slice(0, 30).map((post, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: post.title,
          url: `https://career3.vercel.app/posts/${post.slug}`,
        })),
      },
    ];

    if (activeItem.faqs && activeItem.faqs.length > 0) {
      graphs.push({
        '@type': 'FAQPage',
        mainEntity: activeItem.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      });
    }

    return {
      '@context': 'https://schema.org',
      '@graph': graphs,
    };
  }, [activeItem, parentCategory, isSubcategoryView, matchingPosts]);

  const allMainCategories = categories.filter((c) => c.parentId === null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* GOOGLE JSON-LD SCHEMA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* TOP PORTAL NAVBAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-xl font-black text-white tracking-tight">
            CAREERSATHI<span className="text-amber-400">.COM</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <Link href="/" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300">
              🏠 Home
            </Link>
            {allMainCategories.map((mc) => {
              const isCurrent =
                mc.slug === activeItem.slug || (parentCategory && mc.slug === parentCategory.slug);
              return (
                <Link
                  key={mc.id}
                  href={`/category/${mc.slug}`}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {mc.name}
                </Link>
              );
            })}
            <Link
              href="/tools/form-tool"
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black"
            >
              ⚡ Form Tool
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* SEO BREADCRUMB BAR */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:text-amber-400 font-bold">
            🏠 Home
          </Link>
          <span>›</span>
          {isSubcategoryView && parentCategory ? (
            <>
              <Link
                href={`/category/${parentCategory.slug}`}
                className="hover:text-amber-400 font-bold text-slate-300"
              >
                {parentCategory.name}
              </Link>
              <span>›</span>
              <span className="text-cyan-400 font-black">{activeItem.name}</span>
            </>
          ) : (
            <span className="text-amber-400 font-black">{activeItem.name}</span>
          )}
        </nav>

        {/* HERO SEO HEADER BANNER (UNIFIED FOR CATEGORY & SUBCATEGORY) */}
        <section className="bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 p-6 rounded-3xl border border-blue-500/30 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
              {isSubcategoryView ? `Subcategory • ${parentCategory?.name || 'Exams'}` : 'Official Category Hub'}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Updated for 2026 Exams
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {activeItem.h1Title || `${activeItem.name} 2026`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
            {activeItem.shortIntro}
          </p>

          {/* SUBCATEGORY SILO PILLS (Allows 1-Click Switching Between Parent & Subcategories) */}
          {siblingSubcategories.length > 0 && parentCategory && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                🔍 Filter by Subcategory under {parentCategory.name}:
              </span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/category/${parentCategory.slug}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    !isSubcategoryView
                      ? 'bg-amber-500 text-slate-950 shadow-lg'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-400'
                  }`}
                >
                  All {parentCategory.name}
                </Link>
                {siblingSubcategories.map((sub) => {
                  const isActiveSub = isSubcategoryView && activeItem.slug === sub.slug;
                  return (
                    <Link
                      key={sub.id}
                      href={`/category/${parentCategory.slug}/${sub.slug}`}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                        isActiveSub
                          ? 'bg-cyan-500 text-slate-950 shadow-lg'
                          : 'bg-slate-950 text-cyan-300 border border-slate-800 hover:border-cyan-400'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* MAIN CONTENT GRID: POSTS TABLE + CONTEXTUAL STUDENT TOOLS SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLS: HIGH-CTR EXAM LISTINGS */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-xs font-black text-white">
                📋 Showing {matchingPosts.length} Verified Updates in &ldquo;{activeItem.name}&rdquo;
              </div>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`🔍 Search inside ${activeItem.name}...`}
                className="w-full sm:w-64 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            {matchingPosts.length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center space-y-3">
                <div className="text-3xl">📂</div>
                <h2 className="text-base font-black text-white">
                  No Posts Published in &ldquo;{activeItem.name}&rdquo; Yet
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Open the Admin Command Center to publish a new exam post or run the Programmatic SEO Bulk Generator for {activeItem.name}.
                </p>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl"
                  >
                    + Add Post in Admin CMS →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {matchingPosts.map((post) => {
                  const lastDateObj = post.importantDates?.find((d) =>
                    d.label.toLowerCase().includes('last date')
                  );
                  return (
                    <article
                      key={post.id}
                      className="p-4 sm:p-5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-black">
                            {post.category}
                          </span>
                          {post.subCategory && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold">
                              {post.subCategory}
                            </span>
                          )}
                          {post.vacancyOrSeats && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-black">
                              🔥 {post.vacancyOrSeats}
                            </span>
                          )}
                        </div>

                        <h2 className="text-sm sm:text-base font-black text-white hover:text-amber-400 transition">
                          <Link href={`/posts/${post.slug}`}>👉 {post.title}</Link>
                        </h2>

                        <p className="text-xs text-slate-400 line-clamp-2">
                          {post.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>📅 Published: {post.publishedAt}</span>
                          {lastDateObj?.date && (
                            <span className="text-rose-400 font-bold">
                              ⏳ Last Date: {lastDateObj.date}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl text-center shadow"
                        >
                          View Details →
                        </Link>
                        <Link
                          href="/tools/form-tool"
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-bold rounded-xl text-center"
                        >
                          ⚡ Photo/Sign Tool
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* BOTTOM LONG-FORM SEO CONTENT (FOR GOOGLE RANKING) */}
            {activeItem.seoBottomContent && (
              <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div
                  className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 space-y-2"
                  dangerouslySetInnerHTML={{ __html: activeItem.seoBottomContent }}
                />
              </section>
            )}

            {/* RICH SNIPPET FAQ SECTION */}
            {activeItem.faqs && activeItem.faqs.length > 0 && (
              <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h2 className="text-base sm:text-lg font-black text-amber-400">
                  ❓ Frequently Asked Questions — {activeItem.name}
                </h2>
                <div className="space-y-3">
                  {activeItem.faqs.map((fq, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1"
                    >
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Q{i + 1}. {fq.question}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{fq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT 4 COLS: INTERNAL LINKING SILO & STUDENT TOOLS */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-slate-900 p-5 rounded-3xl border border-amber-500/40 space-y-3">
              <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase">
                Free Exam Utilities
              </span>
              <h3 className="text-sm font-black text-white">
                🛠️ Prepare Documents for {activeItem.name}
              </h3>
              <div className="space-y-2 text-xs">
                <Link
                  href="/tools/form-tool"
                  className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-amber-300"
                >
                  ⚡ All-in-One Photo &amp; 6×2cm Sign Resizer →
                </Link>
                <Link
                  href="/tools/one-tap-form-copilot"
                  className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-emerald-300"
                >
                  🤖 AI Marksheet Scanner &amp; Form Co-Pilot →
                </Link>
                <Link
                  href="/tools/passport-photo-maker"
                  className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-blue-300"
                >
                  🪪 Passport Photo with Name &amp; Date Maker →
                </Link>
                <Link
                  href="/tools/pdf-compressor"
                  className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-purple-300"
                >
                  🗜️ Compress Certificate PDF to Exact KB →
                </Link>
                <Link
                  href="/tools/answer-key-analyzer"
                  className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-cyan-300"
                >
                  🔑 SSC / Railway Answer Key Score Calculator →
                </Link>
              </div>
            </div>

            {/* QUICK CATEGORY SILO LINKS FOR CRAWLERS */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 text-xs">
              <h3 className="text-sm font-black text-white uppercase">
                🗂️ Browse All Exam Categories
              </h3>
              <div className="space-y-1.5">
                {allMainCategories.map((mc) => (
                  <Link
                    key={mc.id}
                    href={`/category/${mc.slug}`}
                    className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 font-bold text-slate-200"
                  >
                    <span>📁 {mc.name}</span>
                    <span className="text-[10px] text-amber-400">Explore →</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}