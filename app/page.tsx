'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  publisherName: string;
  publishedAt: string;
  vacancyOrSeats?: string;
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
  redirectUrl: string;
  description: string;
  status: string;
}

interface MockTest {
  id: string;
  title: string;
  slug: string;
  examCategory?: string;
  duration: number;
  totalMarks: number;
}

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [partnerCourses, setPartnerCourses] = useState<PartnerCourse[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userExamInterest, setUserExamInterest] = useState<string>('SSC');

  useEffect(() => {
    // 1. Load User Exam Interest
    if (typeof window !== 'undefined') {
      const savedInterest = localStorage.getItem('user_preferred_exam') || 'SSC';
      setUserExamInterest(savedInterest);
    }

    // 2. Load Posts Safely
    const savedPosts = localStorage.getItem('careersathi_posts');
    if (savedPosts) {
      try { setPosts(JSON.parse(savedPosts)); } catch (e) { console.error(e); }
    } else {
      const initial: Post[] = [
        {
          id: '1',
          title: 'SSC GD Constable Recruitment 2026 Online Form',
          slug: 'ssc-gd-constable-recruitment-2026',
          category: 'Latest Jobs',
          publisherName: 'Admin Team',
          publishedAt: '24 Oct 2026',
          vacancyOrSeats: '39,481 Posts'
        }
      ];
      setPosts(initial);
      localStorage.setItem('careersathi_posts', JSON.stringify(initial));
    }

    // 3. Load Partner Courses
    const savedCourses = localStorage.getItem('careersathi_partner_courses');
    if (savedCourses) {
      try { setPartnerCourses(JSON.parse(savedCourses)); } catch (e) { console.error(e); }
    }

    // 4. Load Mock Tests from Admin CMS Storage
    const savedMocks = localStorage.getItem('careersathi_mock_tests') || localStorage.getItem('cs_mock_tests');
    if (savedMocks) {
      try {
        const parsed = JSON.parse(savedMocks);
        if (Array.isArray(parsed)) setMockTests(parsed.filter(m => m && m.title));
      } catch (e) { console.error(e); }
    }

    // 5. Load Static Pages from Admin CMS Storage
    const savedPages = localStorage.getItem('careersathi_pages') || localStorage.getItem('cs_pages');
    if (savedPages) {
      try {
        const parsed = JSON.parse(savedPages);
        if (Array.isArray(parsed)) setStaticPages(parsed.filter(p => p && p.title && p.slug));
      } catch (e) { console.error(e); }
    }
  }, []);

  const getPostsByCategory = (catName: string) => {
    return posts.filter(p => p.category.toLowerCase() === catName.toLowerCase());
  };

  const isTopThree = (postId: string) => {
    const topThreeIds = posts.slice(0, 3).map(p => p.id);
    return topThreeIds.includes(postId);
  };

  const searchResults = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const approvedCourses = partnerCourses.filter(c => c.status === 'approved');

  // Filter courses by user interest
  const recommendedCourses = approvedCourses.filter(c => 
    c.examTarget?.toLowerCase().includes(userExamInterest.toLowerCase()) ||
    c.category?.toLowerCase().includes(userExamInterest.toLowerCase())
  );

  const displayedCourses = recommendedCourses.length > 0 ? recommendedCourses : approvedCourses;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      

      {/* Quick Utility Strip for Students */}
      <div className="bg-blue-950 py-2 px-4 border-b border-blue-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-bold text-amber-400">🔥 Popular Tools:</span>
            <Link href="/tools/form-tool" className="hover:text-white underline">All-in-One Form Tool</Link>
            <span>•</span>
            <Link href="/tools/passport-photo-maker" className="hover:text-white underline">Passport Photo Maker</Link>
            <span>•</span>
            <Link href="/tools/pdf-compressor" className="hover:text-white underline">PDF Compressor (Exact KB)</Link>
            <span>•</span>
            <Link href="/tools/scan-to-pdf" className="hover:text-white underline">Scan to PDF</Link>
          </div>
          <Link href="/tools/form-tool" className="text-amber-300 hover:underline font-bold">
            SSC 6×2cm Sign &amp; Banking Tools Available →
          </Link>
        </div>
      </div>

      {/* Homepage Live Search Bar */}
      <div className="bg-blue-800 py-4 px-4 shadow-inner">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search exams, results, admit card, jobs, mock tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white text-slate-900 placeholder-slate-400 rounded-lg shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 my-6 space-y-8 flex-1 w-full">
        
        {/* ================= SECTION 1: ALL-IN-ONE STUDENT UTILITY TOOLS ================= */}
        <section id="student-tools-section" className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6 space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded uppercase">
                Free Student Tools
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">🛠️ Online Exam Form &amp; PDF Tools</h2>
            </div>
            <Link
              href="/tools/form-tool"
              className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
            >
              Open Form Tool (SSC, Banking, RRB Presets) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 text-xs">
            <Link
              href="/tools/form-tool"
              className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400/80 rounded-xl hover:shadow-lg transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">⚡</span>
                <div className="font-black text-slate-900 text-sm group-hover:text-amber-700">Exam Form Master Tool</div>
                <p className="text-[11px] text-slate-600">Auto-sets Photo, 6×2cm Sign, Thumb &amp; Declaration for SSC, IBPS, RRB.</p>
              </div>
              <span className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded w-fit">2025–26 Ready</span>
            </Link>

            <Link
              href="/tools/passport-photo-maker"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">🪪</span>
                <div className="font-black text-slate-900 group-hover:text-blue-600">Passport Photo Maker</div>
                <p className="text-[11px] text-slate-600">Pro Studio Clarity, BG Color Change, DOP Name/Date &amp; A4 Print Sheet.</p>
              </div>
              <span className="mt-2 text-[10px] text-blue-600 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/pdf-compressor"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">🗜️</span>
                <div className="font-black text-slate-900 group-hover:text-emerald-600">PDF Compressor (Exact KB)</div>
                <p className="text-[11px] text-slate-600">Compress Marksheet &amp; Certificate PDFs to exact 50KB, 100KB, 200KB.</p>
              </div>
              <span className="mt-2 text-[10px] text-emerald-600 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/jpg-to-pdf"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">📄</span>
                <div className="font-black text-slate-900 group-hover:text-blue-600">JPG to PDF Converter</div>
                <p className="text-[11px] text-slate-600">Merge multiple marksheet photos into a single PDF document.</p>
              </div>
              <span className="mt-2 text-[10px] text-blue-600 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/scan-to-pdf"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-cyan-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">📸</span>
                <div className="font-black text-slate-900 group-hover:text-cyan-600">Scan to PDF Studio</div>
                <p className="text-[11px] text-slate-600">CamScanner alternative: removes phone shadow &amp; whitens document paper.</p>
              </div>
              <span className="mt-2 text-[10px] text-cyan-700 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/pdf-editor"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-purple-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">✏️</span>
                <div className="font-black text-slate-900 group-hover:text-purple-600">Visual PDF Editor</div>
                <p className="text-[11px] text-slate-600">Sejda style: click directly on text to edit, whiteout, or sign PDF.</p>
              </div>
              <span className="mt-2 text-[10px] text-purple-600 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/pdf-to-word"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">📘</span>
                <div className="font-black text-slate-900 group-hover:text-indigo-600">PDF to Word (AI OCR)</div>
                <p className="text-[11px] text-slate-600">Convert scanned Hindi/English PDFs to editable .DOCX Word files.</p>
              </div>
              <span className="mt-2 text-[10px] text-indigo-600 font-bold">Open Tool →</span>
            </Link>

            <Link
              href="/tools/answer-key-analyzer"
              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl hover:shadow transition flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <span className="text-2xl">🔑</span>
                <div className="font-black text-slate-900 group-hover:text-emerald-600">Answer Key Analyzer</div>
                <p className="text-[11px] text-slate-600">Calculate exact SSC/Railway marks directly from Digialm URL.</p>
              </div>
              <span className="mt-2 text-[10px] text-emerald-600 font-bold">Check Score →</span>
            </Link>
          </div>
        </section>

        {/* ================= SEARCH RESULTS OR MAIN PORTAL BOXES ================= */}
        {searchQuery.trim() !== '' ? (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-blue-900 border-b pb-2 flex justify-between items-center">
              <span>Search Results for &quot;{searchQuery}&quot;</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">{searchResults.length} found</span>
            </h2>

            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No matching exams or updates found. Try searching with another keyword!
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 space-y-2">
                {searchResults.map(post => (
                  <li key={post.id} className="pt-2 flex items-center justify-between gap-2">
                    <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-bold text-sm sm:text-base flex-1">
                      👉 {post.title} <span className="text-xs uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded ml-2">{post.category}</span>
                    </Link>
                    {post.vacancyOrSeats && (
                      <span className="text-red-600 text-xs font-bold whitespace-nowrap">({post.vacancyOrSeats})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Results Box */}
            <div id="results" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-red-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Results
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Results').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No results published yet.</p>
                ) : (
                  getPostsByCategory('Results').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Admit Card Box */}
            <div id="admit-card" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-emerald-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Admit Card
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Admit Card').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No admit cards published yet.</p>
                ) : (
                  getPostsByCategory('Admit Card').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Latest Jobs Box */}
            <div id="latest-jobs" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-blue-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Latest Jobs
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Latest Jobs').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No jobs published yet.</p>
                ) : (
                  getPostsByCategory('Latest Jobs').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title} {post.vacancyOrSeats && <span className="text-red-500 text-[10px]">({post.vacancyOrSeats})</span>}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Answer Key Box */}
            <div id="answer-key" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-purple-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Answer Key
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Answer Key').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No answer keys published yet.</p>
                ) : (
                  getPostsByCategory('Answer Key').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Admission Box */}
            <div id="admission" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-amber-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Admission
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Admission').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No admissions published yet.</p>
                ) : (
                  getPostsByCategory('Admission').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Sarkari Yojana Box */}
            <div id="yojana" className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col scroll-mt-20">
              <div className="bg-teal-600 text-white p-3 font-black text-center text-sm uppercase tracking-wide">
                Sarkari Yojana
              </div>
              <ul className="divide-y divide-gray-100 p-3 text-sm flex-1 min-h-[200px]">
                {getPostsByCategory('Sarkari Yojana').length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No yojanas published yet.</p>
                ) : (
                  getPostsByCategory('Sarkari Yojana').map(post => (
                    <li key={post.id} className="py-2 flex items-center justify-between gap-2">
                      <Link href={`/posts/${post.slug}`} className="text-blue-600 hover:underline font-semibold text-left text-xs sm:text-sm flex-1">
                        👉 {post.title}
                      </Link>
                      {isTopThree(post.id) && (
                        <span className="animate-pulse bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          NEW 🔥
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

          </div>
        )}

        {/* ================= ADMIN MOCK TESTS SECTION ================= */}
        <section id="mock-tests-section" className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded uppercase">
                Admin Published Mock Tests ({mockTests.length})
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">📝 Free Online CBT Mock Tests</h2>
            </div>
            <Link href="/admin" className="text-xs font-bold text-blue-600 hover:underline">
              + Manage in Admin CMS
            </Link>
          </div>

          {mockTests.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-xs font-bold text-slate-600">No mock tests published from Admin CMS yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mockTests.map((mock) => (
                <div key={mock.id} className="border border-slate-200 hover:border-emerald-500 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3 transition">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{mock.examCategory || 'Practice Set'}</span>
                    <h3 className="font-bold text-sm text-slate-900">{mock.title}</h3>
                    <p className="text-xs text-slate-500">⏱️ {mock.duration || 60} Mins | 🏆 {mock.totalMarks || 100} Marks</p>
                  </div>
                  <Link
                    href={`/mock-tests/${mock.slug}`}
                    className="block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow"
                  >
                    Start Mock Test ▶
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= CONTEXTUAL TARGETED COACHING COURSES SECTION ================= */}
        <section className="my-10">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-blue-500/30">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-blue-700/60 pb-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[10px] uppercase font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded">
                    Partner Marketplace
                  </span>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                    Targeted for {userExamInterest}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-1">🎓 Recommended Coaching Courses &amp; Batches</h2>
                <p className="text-xs text-blue-200">Personalized courses &amp; study material based on your exam preparation.</p>
              </div>
              
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Link href="/partners" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl shadow transition">
                  + Register Institute
                </Link>
                <Link href="/partners/dashboard" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow transition border border-blue-500">
                  Partner Login 🔐
                </Link>
              </div>
            </div>

            {/* Approved Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayedCourses.length === 0 ? (
                <div className="col-span-full text-center py-8 text-blue-200 text-xs">
                  No sponsored coaching courses live right now. Institutes can register and publish courses via their dashboard!
                </div>
              ) : (
                displayedCourses.map((course) => (
                  <div key={course.id} className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <img src={course.thumbnailUrl} alt={course.courseTitle} className="w-full h-36 object-cover" />
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{course.instituteName}</span>
                          <span className="text-xs font-black text-red-600">{course.price}</span>
                        </div>
                        <h3 className="font-bold text-sm text-blue-900 line-clamp-2">{course.courseTitle}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{course.description || 'Access comprehensive live batches and test series.'}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow"
                      >
                        View Details &amp; Enroll ↗
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ================= ADMIN STATIC PAGES SECTION ================= */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              📄 Important Information &amp; Static Pages ({staticPages.length})
            </h3>
            <Link href="/admin" className="text-xs font-bold text-blue-600 hover:underline">
              + Add Pages in Admin
            </Link>
          </div>

          {staticPages.length === 0 ? (
            <p className="text-xs text-slate-400">No static pages published yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {staticPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className="text-xs font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition shadow-sm"
                >
                  📌 {page.title} ↗
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}