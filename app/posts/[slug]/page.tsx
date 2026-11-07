'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/app/Breadcrumbs';

interface DateRow {
  label: string;
  date: string;
}

interface LinkRow {
  text: string;
  url: string;
}

interface FaqRow {
  question: string;
  answer: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  publisherName: string;
  publishedAt: string;
  updatedAt?: string;
  featuredImage: string;
  shortDescription: string;
  importantDates: DateRow[];
  classicContent: string;
  importantLinks: LinkRow[];
  faqs: FaqRow[];
}

export default function PostDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const savedPosts = localStorage.getItem('careersathi_posts');
    if (savedPosts) {
      const posts: Post[] = JSON.parse(savedPosts);
      const found = posts.find(p => p.slug === slug);
      if (found) {
        setPost(found);
      }
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Post Not Found</h1>
        <p className="text-sm text-slate-600 mb-4">The post you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold shadow">
          ← Back to Homepage
        </Link>
      </div>
    );
  }

  // JSON-LD Schema Markup for Google Search & Discover Ranking
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': post.title,
    'description': post.shortDescription,
    'image': [post.featuredImage],
    'datePublished': post.publishedAt,
    'dateModified': post.updatedAt || post.publishedAt,
    'author': [{
      '@type': 'Person',
      'name': post.publisherName
    }]
  };

  const faqSchema = post.faqs && post.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': post.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* JSON-LD Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Header Banner */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
      </header>

      {/* Main Post Detail */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 my-6">
        <article className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
          
        <Breadcrumbs/>
          <Link
            href="/"
            className="text-xs font-bold text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Back to Homepage
          </Link>

          {/* Title & Metadata */}
          <div className="text-center border-b pb-4 space-y-2">
            <span className="text-xs uppercase bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded">{post.category}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-blue-900">{post.title}</h1>
            <div className="text-xs text-gray-500 flex justify-center gap-2">
              <span>Publisher: <strong className="text-gray-800">{post.publisherName}</strong></span>
              <span>•</span>
              <span>Published: <strong className="text-gray-800">{post.publishedAt}</strong></span>
              {post.updatedAt && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600 font-semibold">Updated: {post.updatedAt}</span>
                </>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="flex justify-center">
              <img src={post.featuredImage} alt={post.title} className="max-h-72 rounded-md object-cover border shadow-sm" />
            </div>
          )}

          {/* Short Description */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded text-sm text-gray-800 font-medium">
            {post.shortDescription}
          </div>

          {/* Important Dates Table */}
          {post.importantDates && post.importantDates.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">📅 Important Dates</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <tbody>
                  {post.importantDates.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border p-2 bg-gray-50 font-semibold w-1/2">{row.label}</td>
                      <td className="border p-2 w-1/2 font-bold text-red-600">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Classic Content */}
          <div className="prose max-w-none text-sm text-gray-800 space-y-3" dangerouslySetInnerHTML={{ __html: post.classicContent }} />

          {/* Important Links */}
          {post.importantLinks && post.importantLinks.length > 0 && (
            <div className="bg-slate-100 border border-slate-300 p-4 rounded-lg text-center space-y-3">
              <h2 className="text-md font-bold text-slate-900">🔗 Important Links</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {post.importantLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs shadow">
                    {link.text} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {post.faqs && post.faqs.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h2 className="text-md font-bold text-gray-800">❓ Frequently Asked Questions (FAQs)</h2>
              {post.faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded border text-sm space-y-1">
                  <div className="font-bold text-blue-900">Q. {faq.question}</div>
                  <div className="text-gray-700">Ans. {faq.answer}</div>
                </div>
              ))}
            </div>
          )}
        </article>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs mt-12">
        <p>© 2026 CareerSathi.com — Fast Exam Alerts & Results. All Rights Reserved.</p>
      </footer>
    </div>
  );
}