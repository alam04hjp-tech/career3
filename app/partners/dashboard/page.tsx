'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Partner {
  id: string;
  instituteName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: string;
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

export default function PartnerDashboard() {
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [partnerData, setPartnerData] = useState<Partner | null>(null);
  const [partnerCourses, setPartnerCourses] = useState<PartnerCourse[]>([]);

  // Course Form States with SEO Fields
  const [courseTitle, setCourseTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('SSC / Banking');
  const [examTarget, setExamTarget] = useState('SSC CGL 2026');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [price, setPrice] = useState('');
  const [validity, setValidity] = useState('12 Months');
  const [instructorName, setInstructorName] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load partner courses if logged in
    if (partnerData) {
      const allCourses = JSON.parse(localStorage.getItem('careersathi_partner_courses') || '[]');
      const myCourses = allCourses.filter((c: PartnerCourse) => c.instituteName === partnerData.instituteName);
      setPartnerCourses(myCourses);
    }
  }, [partnerData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const partners = JSON.parse(localStorage.getItem('careersathi_partners') || '[]');
    const found = partners.find((p: Partner) => p.phone === phone);

    if (!found) {
      alert('Mobile number not registered! Please register first.');
      return;
    }

    if (found.status !== 'approved') {
      alert('Your institute registration is still pending admin approval!');
      return;
    }

    setPartnerData(found);
    setIsLoggedIn(true);
  };

  const handleTitleChange = (val: string) => {
    setCourseTitle(val);
    // Auto generate SEO friendly URL slug
    const generatedSlug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setSlug(generatedSlug);
    setMetaTitle(val + ' | CareerSathi Marketplace');
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !slug || !redirectUrl) {
      alert('Please fill all required SEO and course fields!');
      return;
    }

    const newCourse: PartnerCourse = {
      id: Date.now().toString(),
      instituteName: partnerData ? partnerData.instituteName : 'Partner Institute',
      courseTitle,
      slug,
      category,
      examTarget,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      price: price || 'Paid',
      validity,
      instructorName: instructorName || 'Expert Faculty',
      redirectUrl,
      description,
      metaTitle: metaTitle || courseTitle,
      metaDesc: metaDesc || description.slice(0, 150),
      status: 'approved', // Live on marketplace
      publishedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const existingCourses = JSON.parse(localStorage.getItem('careersathi_partner_courses') || '[]');
    const updated = [newCourse, ...existingCourses];
    localStorage.setItem('careersathi_partner_courses', JSON.stringify(updated));
    
    setPartnerCourses(updated.filter((c: PartnerCourse) => c.instituteName === partnerData?.instituteName));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
        <p className="text-xs text-blue-100 mt-1">Professional Partner Dashboard & SEO Course Publisher</p>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 my-8 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
          
          {!isLoggedIn ? (
            /* PARTNER LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-6">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-blue-900">🔐 Partner Portal Login</h1>
                <p className="text-xs text-slate-500">Enter your approved WhatsApp number to manage & publish SEO-optimized courses.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition text-sm"
              >
                Access Partner Dashboard ➔
              </button>

              <div className="text-center pt-2">
                <Link href="/partners" className="text-xs font-bold text-blue-600 hover:underline">
                  Want to register a new coaching institute? Click here →
                </Link>
              </div>
            </form>
          ) : (
            /* PARTNER DASHBOARD & SEO COURSE PUBLISHER */
            <div className="space-y-8">
              
              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-xl border border-blue-200 gap-3">
                <div>
                  <h2 className="text-lg font-black text-blue-900">🏛️ {partnerData?.instituteName}</h2>
                  <p className="text-xs text-slate-600">Owner: {partnerData?.ownerName} | 🟢 Authorized Partner</p>
                </div>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded font-bold transition"
                >
                  Logout 🔓
                </button>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                  <h3 className="text-lg font-bold text-slate-900">Course Published Successfully!</h3>
                  <p className="text-xs text-slate-600">
                    Your course is now live on the CareerSathi marketplace with optimized SEO tags for search rankings.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setCourseTitle('');
                      setSlug('');
                      setPrice('');
                      setThumbnailUrl('');
                      setRedirectUrl('');
                      setDescription('');
                      setMetaDesc('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow"
                  >
                    + Publish Another Course
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddCourse} className="space-y-5">
                  <div className="border-b pb-2">
                    <h3 className="text-base font-black text-slate-900">🚀 Add New Course (SEO Optimized)</h3>
                    <p className="text-xs text-slate-500">Fill in accurate details so your course ranks higher on Google search results.</p>
                  </div>

                  {/* Course Title & Auto Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Course / Batch Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={courseTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. SSC CGL Complete Foundation Batch 2026"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SEO URL Slug (Auto-generated)</label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="ssc-cgl-foundation-batch-2026"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={examTarget}
                        onChange={(e) => setExamTarget(e.target.value)}
                        placeholder="e.g. SSC CGL / JEE Main / NEET"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Category, Price & Validity */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Exam Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      >
                        <option value="SSC / Banking">SSC / Banking</option>
                        <option value="Railway & Police">Railway & Police</option>
                        <option value="Engineering & Medical">Engineering & Medical</option>
                        <option value="Board Exams">Board Exams (8th-12th)</option>
                        <option value="State PSC / UPSC">State PSC / UPSC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. ₹1,499 (or Free)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Validity</label>
                      <input
                        type="text"
                        value={validity}
                        onChange={(e) => setValidity(e.target.value)}
                        placeholder="e.g. 1 Year / Till Exam"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Thumbnail & Redirect Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thumbnail Image URL <span className="text-red-500">*</span></label>
                      <input
                        type="url"
                        required
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://.../banner.jpg"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Enrollment / Redirect Link <span className="text-red-500">*</span></label>
                      <input
                        type="url"
                        required
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://yourwebsite.com/course-enroll"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Instructor Name & Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instructor / Faculty Name</label>
                    <input
                      type="text"
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      placeholder="e.g. Expert Faculty Team"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Course Description & Features (Rich Content)</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write detailed description including live classes, mock tests, PDF notes, and syllabus..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>

                  {/* SEO Meta Tags Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">🔍 SEO Optimization for Google Ranking</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Meta Title (Recommended 50-60 chars)</label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Meta Description (Recommended 150-160 chars for Google snippet)</label>
                      <textarea
                        rows={2}
                        value={metaDesc}
                        onChange={(e) => setMetaDesc(e.target.value)}
                        placeholder="Write a catchy summary with keywords like 'best coaching batch 2026, live classes, mock test'..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition text-sm"
                  >
                    Publish SEO-Optimized Course Live 🚀
                  </button>
                </form>
              )}

              {/* Partner's Active Courses List */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-black text-slate-800">📚 Your Published Courses ({partnerCourses.length})</h3>
                {partnerCourses.length === 0 ? (
                  <p className="text-xs text-slate-500">You haven&apos;t published any courses yet. Use the form above to list your first batch!</p>
                ) : (
                  <div className="space-y-3">
                    {partnerCourses.map(course => (
                      <div key={course.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{course.category}</span>
                          <h4 className="font-bold text-xs sm:text-sm text-blue-900">{course.courseTitle}</h4>
                          <div className="text-[11px] text-slate-500">Slug: <span className="font-mono text-slate-700">{course.slug}</span> | Price: <strong className="text-red-600">{course.price}</strong></div>
                        </div>
                        <a
                          href={course.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow whitespace-nowrap"
                        >
                          Visit ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs">
        <p>© 2026 CareerSathi.com — All Rights Reserved.</p>
      </footer>
    </div>
  );
}