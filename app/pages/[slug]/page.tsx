'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
}

export default function DynamicStaticPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const savedPages = localStorage.getItem('careersathi_pages');
    if (savedPages) {
      const pages: CustomPage[] = JSON.parse(savedPages);
      const found = pages.find(p => p.slug === slug);
      if (found) {
        setPageData(found);
      }
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Loading page...</div>;
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Page Not Found</h1>
        <p className="text-sm text-slate-600 mb-4">The page you are looking for does not exist.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold shadow">
          ← Back to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
      </header>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto p-6 my-8 w-full">
        <article className="bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 space-y-6">
          
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline inline-block">
            ← Back to Homepage
          </Link>

          <div className="border-b pb-4">
            <h1 className="text-3xl font-black text-blue-900">{pageData.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Published On: {pageData.publishedAt}</p>
          </div>

          <div 
            className="prose max-w-none text-sm text-slate-800 space-y-4"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs">
        <p>© 2026 CareerSathi.com — All Rights Reserved.</p>
      </footer>
    </div>
  );
}