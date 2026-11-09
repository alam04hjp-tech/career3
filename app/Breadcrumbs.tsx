
// File: app/Breadcrumbs.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  siteUrl?: string;
}

export default function Breadcrumbs({
  items,
  siteUrl = 'https://career3.vercel.app',
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const [autoItems, setAutoItems] = useState<BreadcrumbItem[]>([]);

  // Format slug into readable text (e.g. "bihar-sarkari-jobs" -> "Bihar Sarkari Jobs")
  const formatSlug = (slug: string) =>
    decodeURIComponent(slug)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    // Agar page ne khud custom items bheje hain, toh auto-calculation ki zaroorat nahi
    if (items && items.length > 0) return;
    if (!pathname || pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/tools')) {
      setAutoItems([]);
      return;
    }

    const segments = pathname.split('/').filter(Boolean);
    const trail: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    try {
      // CASE 1: POST DETAIL PAGE (/posts/[slug])
      if (segments[0] === 'posts' && segments[1]) {
        const postSlug = segments[1];
        const savedPosts = localStorage.getItem('careersathi_posts');
        const postsList = savedPosts ? JSON.parse(savedPosts) : [];
        const matchedPost = postsList.find((p: any) => p.slug === postSlug);

        if (matchedPost) {
          const catSlug =
            matchedPost.categorySlug ||
            (matchedPost.category || 'latest-jobs')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-');

          trail.push({
            label: matchedPost.category || 'Latest Jobs',
            href: `/category/${catSlug}`,
          });

          if (matchedPost.subCategory) {
            const subSlug =
              matchedPost.subCategorySlug ||
              matchedPost.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            trail.push({
              label: matchedPost.subCategory,
              href: `/category/${catSlug}/${subSlug}`,
            });
          }

          trail.push({ label: matchedPost.title });
        } else {
          trail.push({ label: 'Latest Jobs', href: '/category/latest-jobs' });
          trail.push({ label: formatSlug(postSlug) });
        }
      }
      // CASE 2: CATEGORY & SUBCATEGORY PAGE (/category/[catSlug]/[subSlug])
      else if (segments[0] === 'category') {
        const savedCats = localStorage.getItem('careersathi_categories');
        const catsList = savedCats ? JSON.parse(savedCats) : [];

        if (segments[1]) {
          const mainCat = catsList.find((c: any) => c.slug === segments[1]);
          trail.push({
            label: mainCat?.name || formatSlug(segments[1]),
            href: segments[2] ? `/category/${segments[1]}` : undefined,
          });
        }
        if (segments[2]) {
          const subCat = catsList.find((c: any) => c.slug === segments[2]);
          trail.push({
            label: subCat?.name || formatSlug(segments[2]),
          });
        }
      }
      // CASE 3: COURSES (/courses/...)
      else if (segments[0] === 'courses') {
        trail.push({
          label: 'Courses',
          href: segments.length > 1 ? '/courses/ssc' : undefined,
        });
        if (segments[1]) {
          trail.push({
            label: formatSlug(segments[1]),
            href: segments[2] ? `/courses/${segments[1]}` : undefined,
          });
        }
        if (segments[2]) {
          trail.push({ label: formatSlug(segments[2]) });
        }
      }
      // CASE 4: BOOKS (/books/...)
      else if (segments[0] === 'books') {
        trail.push({
          label: 'Books',
          href: segments.length > 1 ? '/books/railway' : undefined,
        });
        if (segments[1]) {
          trail.push({
            label: formatSlug(segments[1]),
            href: segments[2] ? `/books/${segments[1]}` : undefined,
          });
        }
        if (segments[2]) {
          trail.push({ label: formatSlug(segments[2]) });
        }
      }
      // CASE 5: STATIC PAGES (/pages/[slug])
      else if (segments[0] === 'pages' && segments[1]) {
        trail.push({ label: formatSlug(segments[1]) });
      }
      // DEFAULT FALLBACK
      else {
        segments.forEach((seg, idx) => {
          const isLast = idx === segments.length - 1;
          trail.push({
            label: formatSlug(seg),
            href: isLast ? undefined : `/${segments.slice(0, idx + 1).join('/')}`,
          });
        });
      }
    } catch {
      // Fallback if localStorage parsing fails
    }

    setAutoItems(trail);
  }, [pathname, items]);

  const finalItems = items && items.length > 0 ? items : autoItems;

  // Generate Google BreadcrumbList JSON-LD Schema
  const breadcrumbSchema = useMemo(() => {
    if (!finalItems || finalItems.length <= 1) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: finalItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href ? `${siteUrl}${item.href}` : `${siteUrl}${pathname || ''}`,
      })),
    };
  }, [finalItems, siteUrl, pathname]);

  if (!finalItems || finalItems.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full bg-slate-900/70 border border-slate-800/90 rounded-2xl px-4 py-2.5 text-xs text-slate-400 shadow-sm"
    >
      {/* Google Rich Snippet BreadcrumbList Schema */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {finalItems.map((item, idx) => {
          const isLast = idx === finalItems.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5 sm:gap-2">
              {idx > 0 && <span className="text-slate-600 select-none">›</span>}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-bold text-slate-300 hover:text-amber-400 transition flex items-center gap-1"
                >
                  {idx === 0 && <span>🏠</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="font-black text-amber-400 truncate max-w-[220px] sm:max-w-md"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}