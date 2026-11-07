// File: app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from './Navbar';
import Footer from './Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://career3.vercel.app'),
  title: 'CareerSathi — Latest Sarkari Jobs 2026, Admit Card & Free Form Tools',
  description:
    'India’s #1 Student Portal for Government Job Alerts, Admit Cards, Answer Key Calculators, 6x2cm Signature Resizer, and Exact KB PDF Compressors.',
  openGraph: {
    title: 'CareerSathi — Sarkari Jobs & Instant Exam Form Tools',
    description:
      'Check latest government jobs, calculate answer key marks, and resize form photos/PDFs in 1 click.',
    url: 'https://career3.vercel.app',
    siteName: 'CareerSathi',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerSathi — Sarkari Jobs & Student Form Studio',
    description: 'All-in-One Sarkari Exam Portal & Document Resizer Tools.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        {/* Global Header & Menu */}
        <Navbar />

        {/* All Pages Render Here */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}