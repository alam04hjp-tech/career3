'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [course, setCourse] = useState<PartnerCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const allCourses = JSON.parse(localStorage.getItem('careersathi_partner_courses') || '[]');
      const found = allCourses.find((c: PartnerCourse) => c.slug === slug);
      if (found) {
        setCourse(found);
        // Dynamically update document title for SEO representation
        document.title = found.metaTitle || found.courseTitle;
      }
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans">
        <p className="text-sm font-bold animate-pulse">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-4 font-sans">
        <h1 className="text-2xl font-black text-slate-800">404 - Course Not Found</h1>
        <p className="text-xs text-slate-600 max-w-md">
          The course or batch you are looking for might have been removed, or the URL slug is incorrect.
        </p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow">
          ← Back to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
        <p className="text-xs text-blue-100 mt-1">Official Course & Batch Marketplace</p>
      </header>

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4">
        <div className="max-w-4xl mx-auto text-xs text-slate-600 font-medium">
          <Link href="/" className="hover:underline text-blue-600">Home</Link> &gt; 
          <span className="text-slate-500"> {course.category}</span> &gt; 
          <span className="text-slate-900 font-bold"> {course.courseTitle}</span>
        </div>
      </div>

      {/* Main Course Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 my-6 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-6">
          
          {/* Course Banner Image */}
          <div className="relative w-full h-56 sm:h-80 bg-slate-900">
            <img 
              src={course.thumbnailUrl} 
              alt={course.courseTitle} 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute top-4 left-4 bg-blue-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-lg shadow">
              {course.category}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  🏛️ Offered by: <strong className="text-blue-900">{course.instituteName}</strong>
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Target Exam: {course.examTarget}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {course.courseTitle}
              </h1>

              <p className="text-xs text-slate-500">
                Published on {course.publishedAt} | Faculty: <strong className="text-slate-700">{course.instructorName}</strong>
              </p>
            </div>

            {/* Pricing and Enrollment Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">Batch Fee & Validity</div>
                <div className="text-2xl font-black text-red-600">{course.price} <span className="text-xs text-slate-500 font-normal">({course.validity} Validity)</span></div>
              </div>
              <div className="w-full sm:w-auto">
                <a
                  href={course.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="block text-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
                >
                  Enroll & Join Now ↗
                </a>
              </div>
            </div>

            {/* Description / Syllabus */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-black text-slate-900 border-b pb-2">📖 Complete Course Overview & Features</h3>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {course.description || 'Comprehensive live classes, study materials, mock tests, and doubt clearing sessions designed specifically to help you crack the exam.'}
              </div>
            </div>

            {/* Key Highlights Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-900">🎥 Live & Recorded Classes</div>
                <div className="text-slate-600">Access high-definition classes anytime with unlimited views.</div>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1">
                <div className="font-bold text-emerald-900">📚 Chapter PDF Notes</div>
                <div className="text-slate-600">Downloadable study notes and formula sheets for quick revision.</div>
              </div>
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs space-y-1">
                <div className="font-bold text-purple-900">📝 Mock Test Series</div>
                <div className="text-slate-600">All India rank tests based on the latest exam patterns.</div>
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-1">
                <div className="font-bold text-amber-900">💡 Dedicated Doubt Solving</div>
                <div className="text-slate-600">Direct interaction with expert faculty to clear all concepts.</div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs mt-12">
        <p>© 2026 CareerSathi.com — All Rights Reserved.</p>
      </footer>
    </div>
  );
}