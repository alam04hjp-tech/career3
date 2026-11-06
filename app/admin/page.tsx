// File: app/admin/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ==========================================
// 1. ENTERPRISE DATA INTERFACES
// ==========================================

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
  categorySlug?: string;
  subCategory?: string;
  subCategorySlug?: string;
  targetExamTag?: string;
  vacancyOrSeats?: string;
  publisherName: string;
  publishedAt: string;
  updatedAt?: string;
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
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null; // null = Main Category, string = Subcategory's Parent ID
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
// DEFAULT SEO CATEGORIES & SUBCATEGORIES
// ==========================================
const DEFAULT_CATEGORIES: CategoryItem[] = [
  // MAIN CATEGORIES
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
    metaDesc: 'Direct official links to download 2026 exam admit cards, application status, and exam city intimation slips for SSC, RRB, UPSC, and State exams.',
    focusKeyword: 'Admit Card 2026 Download',
    shortIntro: 'Download your official CBT exam hall ticket, check application status, shift timing, and exam city intimation slips directly.',
    seoBottomContent: '<h2>How to Download Your Exam Admit Card Online?</h2><p>Select your exam from the list above, click on the regional or official login link, and enter your Registration Number and Date of Birth to print your A4 Admit Card.</p>',
    faqs: [
      { question: 'What documents are required at the exam center along with the Admit Card?', answer: 'You must carry a printed copy of your Admit Card, 2 passport size photographs, and an original valid Photo ID (Aadhaar, PAN, or Voter ID).' },
    ],
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
    focusKeyword: 'Sarkari Result 2026 Merit List',
    shortIntro: 'Instant direct links to official exam results, selection PDF merit lists, tier-wise cut-off marks, and final scorecards.',
    seoBottomContent: '<h2>Check Roll Number Wise Merit List & Cut-Off</h2><p>All official result PDFs and scorecard login links are updated in real time as soon as the recruiting board announces them.</p>',
    faqs: [
      { question: 'How to check my name in the Result Merit List PDF?', answer: 'Download the official Result PDF from the link above, press Ctrl+F (or use Search in mobile PDF reader), and type your Roll Number.' },
    ],
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
    metaDesc: 'Download official provisional and final answer keys for SSC, RRB, and State exams. Paste your response sheet URL to calculate exact marks with negative marking.',
    focusKeyword: 'Exam Answer Key 2026',
    shortIntro: 'Download your CBT response sheet and check your exact raw score, negative marking, and accuracy using our Answer Key Analyzer.',
    seoBottomContent: '<h2>Calculate Marks Instantly from Your Answer Key URL</h2><p>Copy your Digialm candidate response URL after logging in and paste it into the CareerSathi Answer Key Analyzer tool for instant subject-wise score calculation.</p>',
    faqs: [
      { question: 'How to calculate negative marking from SSC & Railway Answer Key?', answer: 'Paste your response sheet link into our free Answer Key Score Calculator to automatically deduct negative marks and see net score.' },
    ],
    count: 0,
  },
  {
    id: 'cat-5',
    name: 'Admission',
    slug: 'admission',
    parentId: null,
    targetExamTag: 'NEET',
    h1Title: ' Entrance Exam & University Admission 2026 — NEET, JEE, CUET & ITI',
    metaTitle: 'Online Admission 2026 | CUET, NEET, JEE, B.Ed, ITI & Polytechnic Forms',
    metaDesc: 'Apply online for 2026 national and state entrance exams, university admissions, counselling schedules, and seat allotment results.',
    focusKeyword: 'Online Admission Form 2026',
    shortIntro: 'Complete admission notifications, entrance form dates, counselling schedules, and document specifications for college and entrance exams.',
    seoBottomContent: '<h2>Documents Required for Online Admission & Counselling</h2><p>Keep your scanned marksheet, caste/EWS certificate, and passport photo with date on photograph ready before filling entrance forms.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'cat-6',
    name: 'Sarkari Yojana',
    slug: 'sarkari-yojana',
    parentId: null,
    targetExamTag: 'STATE',
    h1Title: 'Sarkari Yojana & Scholarship 2026 — Online Registration & Beneficiary Status',
    metaTitle: 'Sarkari Yojana 2026 | Student Scholarships, Fellowship & Govt Schemes',
    metaDesc: 'Apply online for Central and State Government welfare schemes, student scholarships, kisan yojanas, and check DBT payment status.',
    focusKeyword: 'Sarkari Yojana 2026 Apply Online',
    shortIntro: 'Verified guides and official portal links for National Scholarship Portal (NSP), Post-Matric Scholarships, and government welfare schemes.',
    seoBottomContent: '<h2>Student Scholarships & DBT Schemes</h2><p>Check eligibility criteria, income certificate limits, and direct registration links for central and state scholarships.</p>',
    faqs: [],
    count: 0,
  },

  // HIGH-RANKING SUBCATEGORIES (Pre-linked to "Latest Jobs" cat-1)
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
    metaDesc: 'Apply online for all Staff Selection Commission (SSC) 2026 recruitments. Check OTR registration, live photo rules, 6x2cm signature resizer, and exam dates.',
    focusKeyword: 'SSC Recruitment 2026',
    shortIntro: 'All Staff Selection Commission (SSC) recruitment notifications, One-Time Registration (OTR) guides, and SSC 6x2cm signature formatting tools.',
    seoBottomContent: '<h2>SSC 2026 Photo & 6x2cm Signature Guidelines</h2><p>Ensure your signature is resized to 6.0 cm × 2.0 cm (10KB–20KB) using the CareerSathi SSC Form Tool to prevent form rejection.</p>',
    faqs: [
      { question: 'What is the signature dimension for SSC forms in 2026?', answer: 'SSC requires a scanned signature of 6.0 cm width by 2.0 cm height between 10 KB and 20 KB in JPG format.' },
    ],
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
    shortIntro: 'Zone-wise Indian Railway Recruitment Board (RRB) notifications, vacancy tables, medical standards, and online application links.',
    seoBottomContent: '<h2>How to Apply for Railway RRB Exams</h2><p>Check zone-wise vacancies and prepare your white-background passport photo and running signature before submitting your RRB online application.</p>',
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
    metaDesc: 'Get fastest updates on Bihar Government Jobs 2026 including BPSC TRE Teacher, BSSC Inter/Graduate Level, Bihar Police Constable, Daroga & Jeevika.',
    focusKeyword: 'Bihar Sarkari Jobs 2026',
    shortIntro: 'Dedicated hub for Bihar State Government recruitment notifications (BPSC, BSSC, CSBC, BPSSC, BCECE, and Bihar Health Department).',
    seoBottomContent: '<h2>Bihar State Exam Document Requirements</h2><p>Keep your Bihar Domicile Certificate, NCL/EWS Certificate, and 10th/12th Marksheet PDFs compressed under 100KB–200KB for BPSC and BSSC portals.</p>',
    faqs: [],
    count: 0,
  },
  {
    id: 'sub-104',
    name: 'Banking & Insurance',
    slug: 'banking-jobs',
    parentId: 'cat-1',
    parentName: 'Latest Jobs',
    parentSlug: 'latest-jobs',
    targetExamTag: 'BANKING',
    h1Title: 'Banking Jobs 2026 — IBPS PO, Clerk, SBI, RBI & LIC Recruitment',
    metaTitle: 'Banking Jobs 2026 | IBPS, SBI, RBI, NABARD & LIC Online Form',
    metaDesc: 'Apply online for 2026 Bank PO, Clerk, and SO exams. Includes IBPS Left Thumb Impression & Handwritten Declaration resizer tool.',
    focusKeyword: 'Banking Jobs 2026',
    shortIntro: 'Latest public sector bank and insurance exam notifications with built-in IBPS Left Thumb & Handwritten Declaration formatting tools.',
    seoBottomContent: '<h2>IBPS Handwritten Declaration & Thumb Impression Specifications</h2><p>Banking exams require 4.5×3.5 cm photo, 140×60 px signature, 240×240 px left thumb impression, and 800×400 px handwritten declaration in black ink.</p>',
    faqs: [],
    count: 0,
  },
];

const DEFAULT_TOOLS_CONFIG: ToolConfigItem[] = [
  {
    id: 'form-tool',
    name: 'All-in-One Exam Form Master Tool',
    path: '/tools/form-tool',
    category: 'Form Utility',
    targetExam: 'SSC',
    isActive: true,
    isFeatured: true,
    metaTitle: '2025-26 All-in-One Exam Form Photo, 6x2cm Signature & PDF Tool | CareerSathi',
    metaDesc: 'Auto-resize photo, SSC 6x2cm signature, IBPS thumb, declaration & certificate PDFs in exact KB and DPI.',
  },
  {
    id: 'passport-photo-maker',
    name: 'AI Passport Photo Maker & A4 Print Studio',
    path: '/tools/passport-photo-maker',
    category: 'Image Studio',
    targetExam: 'SSC',
    isActive: true,
    isFeatured: true,
    metaTitle: 'Free AI Passport Size Photo Maker & A4 Sheet Printer | CareerSathi',
    metaDesc: 'Create studio-clarity passport photos online, change background color, add Name & Date, and print A4 sheets.',
  },
  {
    id: 'pdf-compressor',
    name: 'Exact KB PDF Compressor',
    path: '/tools/pdf-compressor',
    category: 'PDF Utility',
    targetExam: 'UPSC',
    isActive: true,
    isFeatured: true,
    metaTitle: 'Compress PDF to Exact 50KB, 100KB, 200KB Online Free | CareerSathi',
    metaDesc: 'Reduce marksheet and caste certificate PDF size to exact KB limits for government job forms.',
  },
  {
    id: 'answer-key-analyzer',
    name: 'SSC & RRB Answer Key Score Calculator',
    path: '/tools/answer-key-analyzer',
    category: 'Exam Analyzer',
    targetExam: 'SSC',
    isActive: true,
    isFeatured: true,
    metaTitle: 'SSC & Railway Answer Key Marks & Rank Calculator by URL | CareerSathi',
    metaDesc: 'Paste your Digialm response sheet URL to calculate instant raw marks, negative marking, and section accuracy.',
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF Converter & Merger',
    path: '/tools/jpg-to-pdf',
    category: 'PDF Utility',
    targetExam: 'RAILWAY',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Free JPG to PDF Converter Online - Merge Certificate Photos | CareerSathi',
    metaDesc: 'Convert multiple marksheet and ID card photos into a single A4 PDF file instantly.',
  },
  {
    id: 'scan-to-pdf',
    name: 'CamScanner Style Scan to PDF Studio',
    path: '/tools/scan-to-pdf',
    category: 'Document Scanner',
    targetExam: 'BANKING',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Online Document Scanner to PDF - Remove Shadows & Whiten Paper | CareerSathi',
    metaDesc: 'Scan documents, ID cards, and notes with Magic Color and B&W Xerox filters directly in browser.',
  },
  {
    id: 'pdf-editor',
    name: 'Sejda Style Visual PDF Editor',
    path: '/tools/pdf-editor',
    category: 'PDF Studio',
    targetExam: 'ALL',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Free Online Visual PDF Editor - Edit Text, Whiteout & Sign | CareerSathi',
    metaDesc: 'Edit existing PDF text directly, erase sections, insert signatures, and download without watermarks.',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word (.DOCX) with Hindi/English OCR',
    path: '/tools/pdf-to-word',
    category: 'PDF Utility',
    targetExam: 'ALL',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Convert PDF to Editable Word (.DOCX) with Free Hindi & English OCR | CareerSathi',
    metaDesc: 'Extract editable Word documents from digital or scanned PDFs using client-side AI OCR.',
  },
  {
    id: 'pdf-merger',
    name: 'PDF Merger (Combine PDFs)',
    path: '/tools/pdf-merger',
    category: 'PDF Utility',
    targetExam: 'ALL',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Merge PDF Files Online Free | CareerSathi',
    metaDesc: 'Combine multiple PDF certificates into one file inside your browser.',
  },
  {
    id: 'split-pdf',
    name: '4-in-1 Split PDF & Extract Pages',
    path: '/tools/split-pdf',
    category: 'PDF Utility',
    targetExam: 'ALL',
    isActive: true,
    isFeatured: false,
    metaTitle: 'Split PDF by Page Range, Visual Scissors or Max KB Size | CareerSathi',
    metaDesc: 'Extract specific pages or split large PDFs by maximum KB size for free.',
  },
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
    id: 's1',
    name: 'Main Super Admin',
    email: 'admin@careersathi.com',
    role: 'superadmin',
    active: true,
  });

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('editor');

  const hasPermission = (
    perm: 'delete_content' | 'manage_partners' | 'manage_rbac' | 'programmatic_seo' | 'manage_tools' | 'rollback'
  ): boolean => {
    if (currentStaff.role === 'superadmin') return true;
    if (currentStaff.role === 'seo_manager') {
      return ['programmatic_seo', 'manage_tools'].includes(perm);
    }
    if (currentStaff.role === 'moderator') {
      return ['manage_partners'].includes(perm);
    }
    return false;
  };

  // ==========================================
  // 3. CORE CMS STATES
  // ==========================================
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code');

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
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState<string>('MAIN'); // 'MAIN' or parent category ID
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
    '<p>Write detailed information about the exam, eligibility, and selection process here...</p>'
  );
  const classicTextareaRef = useRef<HTMLTextAreaElement>(null);

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
  const [testCategory, setTestCategory] = useState('SSC');
  const [testTimeMinutes, setTestTimeMinutes] = useState(30);
  const [questionsList, setQuestionsList] = useState<Question[]>([
    { id: '1', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 },
  ]);

  // Static Page Form States
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('<p>Write page content here...</p>');

  // Helper filters for Main Categories vs Subcategories
  const mainCategories = categories.filter((c) => c.parentId === null);
  const getSubcategoriesByParentName = (parentNameVal: string) => {
    const parentObj = mainCategories.find((m) => m.name === parentNameVal);
    if (!parentObj) return [];
    return categories.filter((c) => c.parentId === parentObj.id);
  };

  // ==========================================
  // 4. INITIALIZATION & STORAGE SYNC
  // ==========================================
  const logAuditAction = (action: string, target: string) => {
    const entry: AuditLogItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actorName: currentStaff.name,
      actorRole: currentStaff.role,
      action,
      target,
    };
    setAuditLogs((prev) => {
      const updated = [entry, ...prev].slice(0, 100);
      localStorage.setItem('careersathi_audit_logs', JSON.stringify(updated));
      return updated;
    });
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

    const savedRevs = localStorage.getItem('careersathi_post_revisions');
    if (savedRevs) {
      try {
        setRevisions(JSON.parse(savedRevs));
      } catch {}
    }

    const savedPages = localStorage.getItem('careersathi_pages');
    if (savedPages) {
      try {
        setPages(JSON.parse(savedPages));
      } catch {}
    }

    const savedMock = localStorage.getItem('careersathi_mock_tests');
    if (savedMock) {
      try {
        setMockTests(JSON.parse(savedMock));
      } catch {}
    }

    const savedTools = localStorage.getItem('careersathi_tools_config');
    if (savedTools) {
      try {
        setToolsConfig(JSON.parse(savedTools));
      } catch {}
    } else {
      localStorage.setItem('careersathi_tools_config', JSON.stringify(DEFAULT_TOOLS_CONFIG));
    }

    const savedStaff = localStorage.getItem('careersathi_staff');
    if (savedStaff) {
      try {
        setStaffList(JSON.parse(savedStaff));
      } catch {}
    }

    const savedLogs = localStorage.getItem('careersathi_audit_logs');
    if (savedLogs) {
      try {
        setAuditLogs(JSON.parse(savedLogs));
      } catch {}
    }

    const savedPartners = localStorage.getItem('careersathi_partners');
    if (savedPartners) {
      try {
        setPartnersList(JSON.parse(savedPartners));
      } catch {}
    }
    const savedCourses = localStorage.getItem('careersathi_partner_courses');
    if (savedCourses) {
      try {
        setPartnerCourses(JSON.parse(savedCourses));
      } catch {}
    }
  }, []);

  const saveCategoriesToStorage = (updatedCats: CategoryItem[], currentPostsList: Post[] = posts) => {
    const withCounts = updatedCats.map((cat) => ({
      ...cat,
      count:
        cat.parentId === null
          ? currentPostsList.filter((p) => p.category === cat.name).length
          : currentPostsList.filter((p) => p.subCategory === cat.name).length,
    }));
    setCategories(withCounts);
    localStorage.setItem('careersathi_categories', JSON.stringify(withCounts));
  };

  const savePostsToStorage = (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem('careersathi_posts', JSON.stringify(updatedPosts));
    updateCategoryCounts(updatedPosts, categories);
  };

  const saveRevisionsToStorage = (updatedRevs: PostRevision[]) => {
    setRevisions(updatedRevs);
    localStorage.setItem('careersathi_post_revisions', JSON.stringify(updatedRevs));
  };

  const savePagesToStorage = (updatedPages: CustomPage[]) => {
    setPages(updatedPages);
    localStorage.setItem('careersathi_pages', JSON.stringify(updatedPages));
  };

  const saveMockTestsToStorage = (updated: MockTest[]) => {
    setMockTests(updated);
    localStorage.setItem('careersathi_mock_tests', JSON.stringify(updated));
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
    const generatedSlug =
      catSlug.trim() ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    setCatSlug(generatedSlug);

    const parentObj = catParentId !== 'MAIN' ? mainCategories.find((m) => m.id === catParentId) : null;
    const contextLabel = parentObj ? `${cleanName} (${parentObj.name})` : cleanName;

    setCatH1(`${cleanName} 2026 — Official Notifications, Dates & Apply Online`);
    setCatMetaTitle(`${cleanName} 2026 | Check Dates, Eligibility & Online Form | CareerSathi`);
    setCatMetaDesc(
      `Get latest updates on ${contextLabel} 2026. Check official notification PDF, vacancy breakdown, eligibility criteria, and format your photo/signature online for free.`
    );
    setCatFocusKeyword(`${cleanName} 2026`);
    setCatShortIntro(
      `Explore all verified updates for ${cleanName} 2026. Check application start and last dates, age limit, category-wise seats, and use our free student tools to prepare your form documents.`
    );
    setCatSeoBottom(`
<h2>Complete Guide to ${cleanName} 2026</h2>
<p>Candidates searching for <strong>${cleanName} 2026</strong> can find all direct official links, syllabus PDFs, and document upload instructions on this page. Make sure to verify your age eligibility and resize your photograph and signature using the CareerSathi Form Tool before submitting your online application.</p>
<h3>Why Bookmark CareerSathi for ${cleanName}?</h3>
<ul>
  <li>Instant real-time alerts for notifications, admit cards, answer keys, and results.</li>
  <li>100% free browser-based Photo, 6x2cm Signature, and Exact KB PDF Compressor tools.</li>
  <li>Direct official portal links without confusing redirects.</li>
</ul>`);
    setCatFaqs([
      {
        question: `How can I apply online for ${cleanName} 2026?`,
        answer: `Click on the specific exam post listed under ${cleanName}, verify your eligibility in the notification table, format your photo/signature using our free tool, and click the Apply Online link.`,
      },
      {
        question: `Where can I check the latest dates for ${cleanName}?`,
        answer: `All important start dates, last dates, and CBT exam schedules are updated daily in the ${cleanName} table above.`,
      },
    ]);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) {
      alert('Please enter Category/Subcategory Name and Slug!');
      return;
    }

    const parentObj = catParentId !== 'MAIN' ? mainCategories.find((m) => m.id === catParentId) : null;

    if (editingCatId) {
      const updated = categories.map((c) => {
        if (c.id === editingCatId) {
          return {
            ...c,
            name: catName.trim(),
            slug: catSlug.trim(),
            parentId: parentObj ? parentObj.id : null,
            parentName: parentObj ? parentObj.name : undefined,
            parentSlug: parentObj ? parentObj.slug : undefined,
            targetExamTag: catTargetExam,
            h1Title: catH1 || `${catName.trim()} 2026`,
            metaTitle: catMetaTitle || `${catName.trim()} 2026 | CareerSathi`,
            metaDesc: catMetaDesc || catShortIntro,
            focusKeyword: catFocusKeyword || catName.trim(),
            shortIntro: catShortIntro,
            seoBottomContent: catSeoBottom,
            faqs: catFaqs.filter((f) => f.question.trim() && f.answer.trim()),
          };
        }
        return c;
      });
      saveCategoriesToStorage(updated);
      logAuditAction('Updated Category/Subcategory SEO', catName);
      alert('✅ Category / Subcategory SEO Updated!');
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        slug: catSlug.trim(),
        parentId: parentObj ? parentObj.id : null,
        parentName: parentObj ? parentObj.name : undefined,
        parentSlug: parentObj ? parentObj.slug : undefined,
        targetExamTag: catTargetExam,
        h1Title: catH1 || `${catName.trim()} 2026 — Official Updates & Online Form`,
        metaTitle: catMetaTitle || `${catName.trim()} 2026 | CareerSathi`,
        metaDesc:
          catMetaDesc ||
          `Check latest updates, dates, and online links for ${catName.trim()} 2026 on CareerSathi.`,
        focusKeyword: catFocusKeyword || `${catName.trim()} 2026`,
        shortIntro:
          catShortIntro ||
          `All official notifications, dates, and direct links for ${catName.trim()} 2026.`,
        seoBottomContent:
          catSeoBottom ||
          `<h2>About ${catName.trim()} 2026</h2><p>Stay updated with all official announcements for ${catName.trim()}.</p>`,
        faqs: catFaqs.filter((f) => f.question.trim() && f.answer.trim()),
        count: 0,
      };
      saveCategoriesToStorage([...categories, newCat]);
      logAuditAction(
        parentObj ? `Created Subcategory under ${parentObj.name}` : 'Created Main Category',
        catName
      );
      alert('🚀 New Category / Subcategory Created with Full SEO Schema!');
    }

    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
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
    setCatName(cat.name);
    setCatSlug(cat.slug);
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
      const updated = categories.filter((c) => c.id !== cat.id && c.parentId !== cat.id);
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

    const hasInternalToolLink = importantLinks.some((l) => l.url.includes('/tools/'));
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
    setShortDescription(
      `Official notification, eligibility, age limit, important dates, and direct online link for ${title}. Resize photo & signature easily using CareerSathi Form Tool.`
    );

    setImportantDates([
      { label: 'Notification Release Date', date: 'November 2026' },
      { label: 'Online Application Start', date: '05 Nov 2026' },
      { label: 'Last Date to Apply Online', date: '04 Dec 2026' },
      { label: 'CBT Exam Date', date: 'As Per Official Schedule' },
    ]);

    setClassicContent(`
<h2>${title} — Overview & Official Notification</h2>
<p>The examination authority has officially published the latest update for <strong>${title}</strong>. Candidates preparing for <strong>${detectedExam}</strong> exams can check the complete eligibility criteria, age relaxation, document upload specifications, and direct links below.</p>

<h3>📋 Document Upload Specifications (2025–26 Rules)</h3>
<ul>
  <li><strong>Signature Specification:</strong> Scanned running signature on white paper (10 KB to 20 KB, 6.0 × 2.0 cm for SSC / 140×60 px for Banking).</li>
  <li><strong>Photograph Rule:</strong> Clear passport size photo or live capture with plain white/light background.</li>
  <li><strong>Certificates PDF:</strong> Category / Marksheet PDF between 50 KB to 300 KB.</li>
</ul>

<h3>🚀 How to Apply Online for ${title}</h3>
<p>1. Use the <strong>CareerSathi All-in-One Form Tool</strong> linked below to resize your Photo, Signature & PDF in 1 click.<br/>2. Click on the Official Apply Online link.<br/>3. Complete One-Time Registration (OTR), upload documents, pay the fee, and print the final form.</p>
`);

    setImportantLinks([
      { text: 'Apply Online / Official Login', url: 'https://ssc.gov.in' },
      { text: '⚡ Resize Photo, 6x2cm Sign & PDF (Form Tool)', url: '/tools/form-tool' },
      { text: '🪪 Make Passport Size Photo & A4 Sheet', url: '/tools/passport-photo-maker' },
      { text: '🔑 Check Marks with Answer Key Analyzer', url: '/tools/answer-key-analyzer' },
    ]);

    setFaqs([
      {
        question: `What is the last date to apply for ${title}?`,
        answer: 'Candidates can submit their online form up to 04 December 2026 on the official portal.',
      },
      {
        question: `What is the photo and signature size required for ${title}?`,
        answer:
          'Signature should be between 10 KB to 20 KB (6x2 cm for SSC) and Passport Photo between 20 KB to 50 KB. You can auto-resize them free on CareerSathi Form Tool.',
      },
      {
        question: `How can I calculate my exact age for ${title}?`,
        answer: 'Use the free Age & Relaxation Calculator inside the CareerSathi Form Tool.',
      },
    ]);

    setMetaTitle(`${title} — Apply Online, Eligibility, Dates & Form Size`);
    setMetaDesc(
      `Check official details for ${title}. Download notification PDF, verify eligibility, important dates, and resize photo/signature online on CareerSathi.`
    );
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      alert('Please fill Post Title!');
      return;
    }

    const mainCatObj = mainCategories.find((c) => c.name === category);
    const subCatObj = categories.find((c) => c.parentId !== null && c.name === subCategory);

    const categorySlugVal =
      mainCatObj?.slug ||
      category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const subCategorySlugVal = subCategory
      ? subCatObj?.slug ||
        subCategory
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : '';

    const nowDateTime = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (editingId) {
      const oldPost = posts.find((p) => p.id === editingId);
      if (oldPost) {
        const rev: PostRevision = {
          revisionId: `rev-${Date.now()}`,
          postId: oldPost.id,
          savedAt: nowDateTime,
          savedBy: currentStaff.name,
          snapshot: oldPost,
        };
        saveRevisionsToStorage([rev, ...revisions].slice(0, 50));
      }

      const updatedPosts = posts.map((p) => {
        if (p.id === editingId) {
          return {
            ...p,
            title,
            slug,
            category,
            categorySlug: categorySlugVal,
            subCategory: subCategory || undefined,
            subCategorySlug: subCategorySlugVal || undefined,
            targetExamTag,
            vacancyOrSeats,
            publisherName: currentStaff.name,
            updatedAt: nowDateTime,
            featuredImage: featuredImage || p.featuredImage,
            shortDescription: shortDescription || p.shortDescription,
            importantDates,
            classicContent,
            importantLinks,
            faqs,
            metaTitle: metaTitle || title,
            metaDesc: metaDesc || shortDescription,
            focusKeyword,
            indexedPinged: true,
          };
        }
        return p;
      });
      savePostsToStorage(updatedPosts);
      logAuditAction('Updated Post (Revision Saved)', title);
      setEditingId(null);
      alert('✅ Post Updated, Revision Snapshot Saved & Google Indexing API Pinged!');
    } else {
      const newPost: Post = {
        id: Date.now().toString(),
        title,
        slug,
        category,
        categorySlug: categorySlugVal,
        subCategory: subCategory || undefined,
        subCategorySlug: subCategorySlugVal || undefined,
        targetExamTag,
        vacancyOrSeats,
        publisherName: currentStaff.name,
        publishedAt: nowDateTime,
        featuredImage:
          featuredImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        shortDescription: shortDescription || 'Official notification and application details.',
        importantDates,
        classicContent,
        importantLinks,
        faqs,
        metaTitle: metaTitle || title,
        metaDesc: metaDesc || shortDescription,
        focusKeyword,
        indexedPinged: true,
      };
      savePostsToStorage([newPost, ...posts]);
      logAuditAction('Published New Post', title);
      alert('🚀 Post Published Live & Google Indexing API Pinged!');
    }

    resetForm();
    setActiveTab('posts');
  };

  const handleRollbackRevision = (rev: PostRevision) => {
    if (!hasPermission('rollback')) {
      alert('🔒 Only Super Admin can rollback post revisions!');
      return;
    }
    const updated = posts.map((p) => (p.id === rev.postId ? rev.snapshot : p));
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
    setImportantDates([
      { label: 'Application Begin', date: '' },
      { label: 'Last Date', date: '' },
    ]);
    setClassicContent('<p>Write detailed information here...</p>');
    setImportantLinks([
      { text: 'Apply Online', url: '' },
      { text: 'Resize Photo & Sign (Form Tool)', url: '/tools/form-tool' },
    ]);
    setFaqs([{ question: '', answer: '' }]);
    setMetaTitle('');
    setMetaDesc('');
    setEditingId(null);
  };

  const handleEditClick = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setSubCategory(post.subCategory || '');
    setTargetExamTag(post.targetExamTag || 'SSC');
    setVacancyOrSeats(post.vacancyOrSeats || '');
    setFeaturedImage(post.featuredImage);
    setShortDescription(post.shortDescription);
    setImportantDates(post.importantDates || []);
    setClassicContent(post.classicContent || '');
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
      savePostsToStorage(posts.filter((p) => p.id !== id));
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

    const examNames = pSeoExams
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (examNames.length === 0) return;

    const mainCatObj = mainCategories.find((c) => c.name === pSeoCategory);
    const subCatObj = categories.find((c) => c.parentId !== null && c.name === pSeoSubCategory);

    const nowStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const generatedBatch: Post[] = examNames.map((examName, idx) => {
      const fullTitle = `${examName} ${pSeoCategory} ${pSeoYear} — Apply Online & Notification`;
      const slugVal = fullTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      return {
        id: `${Date.now()}-${idx}`,
        title: fullTitle,
        slug: slugVal,
        category: pSeoCategory,
        categorySlug: mainCatObj?.slug || 'latest-jobs',
        subCategory: pSeoSubCategory || undefined,
        subCategorySlug: subCatObj?.slug || undefined,
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
        featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        shortDescription: `Official ${fullTitle}. Check eligibility, age limit, syllabus, and resize photo/signature using CareerSathi Form Tool.`,
        importantDates: [
          { label: 'Notification Released', date: `Nov ${pSeoYear}` },
          { label: 'Last Date to Apply', date: `Dec ${pSeoYear}` },
        ],
        classicContent: `<h2>${fullTitle}</h2><p>Candidates applying for <strong>${examName} ${pSeoYear}</strong> can verify official dates, vacancy breakdown (${pSeoVacancyNote}), and prepare their required documents (Photo, 6x2cm Signature, Left Thumb & PDF Certificates) using our free online tools below.</p>`,
        importantLinks: [
          { text: 'Official Portal Link', url: 'https://ssc.gov.in' },
          { text: '⚡ Resize Photo & Signature (All-in-One Form Tool)', url: '/tools/form-tool' },
          { text: '🪪 Passport Size Photo & A4 Sheet Maker', url: '/tools/passport-photo-maker' },
        ],
        faqs: [
          {
            question: `How to resize photo and signature for ${examName} ${pSeoYear}?`,
            answer: `Open CareerSathi Form Tool, select ${examName}, and upload your photo/signature for automatic KB & DPI formatting.`,
          },
          {
            question: `Where to download ${examName} ${pSeoCategory} ${pSeoYear}?`,
            answer: 'Use the direct official link in the Important Links table above.',
          },
        ],
        metaTitle: `${fullTitle} | CareerSathi`,
        metaDesc: `Apply online for ${fullTitle}. Check dates, ${pSeoVacancyNote} vacancies, and free form photo/signature resizer tool.`,
        focusKeyword: `${examName} ${pSeoYear}`,
        indexedPinged: true,
      };
    });

    savePostsToStorage([...generatedBatch, ...posts]);
    logAuditAction('Ran Programmatic SEO Batch', `${generatedBatch.length} Landing Posts Created`);
    setPingStatusMsg(
      `✅ Generated ${generatedBatch.length} SEO-Optimized Exam Pages & Pinged Google Sitemap Indexing API!`
    );
    setTimeout(() => setPingStatusMsg(''), 5000);
  };

  // ==========================================
  // 9. MOCK TESTS BUILDER (100% SYNCED KEYS)
  // ==========================================
  const handleAIAddSampleQuestions = () => {
    const sampleQs: Question[] = [
      {
        id: `q-${Date.now()}-1`,
        questionText: 'Which Article of the Indian Constitution deals with the Right to Equality?',
        options: ['Article 14 to 18', 'Article 19 to 22', 'Article 23 to 24', 'Article 32'],
        correctOptionIndex: 0,
      },
      {
        id: `q-${Date.now()}-2`,
        questionText: 'If the ratio of cost price to selling price is 4 : 5, what is the profit percentage?',
        options: ['20%', '25%', '15%', '30%'],
        correctOptionIndex: 1,
      },
      {
        id: `q-${Date.now()}-3`,
        questionText: 'Where is the headquarters of ISRO located?',
        options: ['New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad'],
        correctOptionIndex: 2,
      },
    ];
    setQuestionsList(sampleQs);
  };

  const handleMockTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle) {
      alert('Please enter Test Title!');
      return;
    }

    const generatedSlug = testTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mins = Number(testTimeMinutes) || 30;
    const marks = questionsList.length * 4;

    const newTest: MockTest = {
      id: Date.now().toString(),
      slug: generatedSlug,
      title: testTitle,
      testTitle: testTitle,
      category: testCategory,
      examCategory: testCategory,
      duration: mins,
      totalTimeMinutes: mins,
      totalMarks: marks,
      questions: questionsList,
      publishedAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    saveMockTestsToStorage([newTest, ...mockTests]);
    logAuditAction('Published CBT Mock Test', testTitle);
    alert('🎯 CBT Mock Test Published & Synced on Homepage!');
    setTestTitle('');
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
      posts,
      categories,
      revisions,
      pages,
      mockTests,
      toolsConfig,
      staffList,
      auditLogs,
      partnersList,
      partnerCourses,
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

  const wrapClassicTag = (openTag: string, closeTag: string, placeholder: string) => {
    const ta = classicTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const sel = val.substring(start, end) || placeholder;
    setClassicContent(val.substring(0, start) + `${openTag}${sel}${closeTag}` + val.substring(end));
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
      {/* ========================================== */}
      {/* ENTERPRISE SIDEBAR NAVIGATION (FIXED WIDTH)*/}
      {/* ========================================== */}
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
              v3.8 SEO
            </span>
          </div>

          {/* Active Staff Role Switcher */}
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

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>📊 Executive Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('posts');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>📝 All Posts &amp; Revisions</span>
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                {posts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('add-post');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                activeTab === 'add-post'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-amber-300'
              }`}
            >
              ➕ Create Post (Live SEO Score)
            </button>

            <button
              type="button"
              onClick={() => {
                resetCategoryForm();
                setActiveTab('categories');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-cyan-300'
              }`}
            >
              <span>🗂️ Categories &amp; Subcategories SEO</span>
              <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full text-[10px]">
                {categories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('programmatic-seo')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'programmatic-seo'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                  : 'hover:bg-slate-800 text-emerald-400'
              }`}
            >
              <span>🚀 Programmatic SEO Engine</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                PRO
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools-manager')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'tools-manager'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>🛠️ Student Tools &amp; SEO</span>
              <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                {toolsConfig.filter((t) => t.isActive).length}/{toolsConfig.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mock-tests')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'mock-tests' || activeTab === 'add-mock-test'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>🎯 CBT Mock Tests</span>
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                {mockTests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('partners-approval')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'partners-approval'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>🏛️ Partners &amp; Courses</span>
              {pendingPartnersCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {pendingPartnersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                activeTab === 'pages' || activeTab === 'add-page'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              📄 Static Pages ({pages.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rbac-staff')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                activeTab === 'rbac-staff'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>🛡️ Team RBAC &amp; Audit Logs</span>
              {!hasPermission('manage_rbac') && <span>🔒</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings-backup')}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                activeTab === 'settings-backup'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              💾 Backup &amp; Global Settings
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs rounded-xl text-white font-black transition shadow-lg"
          >
            🌐 View Live Website ↗
          </Link>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN WORKSPACE AREA (min-w-0 FIXED)        */}
      {/* ========================================== */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE DASHBOARD & TELEMETRY                    */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-white">👑 Executive Command Center</h1>
                <p className="text-xs text-slate-400">
                  Logged in as <strong className="text-amber-400">{currentStaff.name}</strong> • Role:{' '}
                  <strong className="uppercase text-emerald-400">{currentStaff.role}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('add-post');
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow"
                >
                  + New Exam Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetCategoryForm();
                    setActiveTab('categories');
                  }}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow"
                >
                  🗂️ Manage Categories &amp; Subcategories
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('programmatic-seo')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow"
                >
                  🚀 Bulk SEO Generator
                </button>
              </div>
            </div>

            {/* KPI Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Live Exam Posts</span>
                <div className="text-3xl font-black text-blue-400 mt-1">{posts.length}</div>
                <span className="text-[10px] text-emerald-400 font-bold">✓ JSON-LD Schema Active</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">SEO Categories &amp; Subs</span>
                <div className="text-3xl font-black text-cyan-400 mt-1">
                  {mainCategories.length} / {categories.length - mainCategories.length}
                </div>
                <span className="text-[10px] text-slate-400">Main / Subcategory Silos</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Active Student Tools</span>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  {toolsConfig.filter((t) => t.isActive).length} / {toolsConfig.length}
                </div>
                <span className="text-[10px] text-slate-400">2025–26 Form Presets Ready</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">CBT Mock Tests</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{mockTests.length}</div>
                <span className="text-[10px] text-slate-400">Synced with Homepage</span>
              </div>
            </div>

            {/* Recent Security Audit Logs & Revision Snapshots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white">🛡️ Recent Staff Activity Audit Logs</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rbac-staff')}
                    className="text-xs text-blue-400 hover:underline font-bold"
                  >
                    View All →
                  </button>
                </div>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No staff actions logged in this session yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                    {auditLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                      >
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
                  <h3 className="text-sm font-black text-white">
                    ⏪ Post Revision History (1-Click Rollback)
                  </h3>
                  <span className="text-[10px] text-slate-400">{revisions.length} Snapshots</span>
                </div>
                {revisions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Whenever any staff edits a post, a backup revision snapshot appears here for 1-click rollback.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                    {revisions.slice(0, 6).map((rev) => (
                      <div
                        key={rev.revisionId}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white truncate max-w-xs">
                            {rev.snapshot.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Saved by {rev.savedBy} at {rev.savedAt}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRollbackRevision(rev)}
                          className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-[11px] hover:bg-amber-500 hover:text-slate-950 transition"
                        >
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

        {/* ========================================================= */}
        {/* TAB 2: CATEGORIES & SUBCATEGORIES SEO SILO MANAGER        */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            {/* LEFT FORM: CREATE / EDIT CATEGORY OR SUBCATEGORY WITH FULL SEO */}
            <div className="lg:col-span-6 space-y-4">
              <form
                onSubmit={handleSaveCategory}
                className="bg-slate-900 p-5 rounded-2xl border border-cyan-500/40 space-y-4 shadow-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                      Google Silo SEO Architecture
                    </span>
                    <h2 className="text-lg font-black text-white mt-1">
                      {editingCatId ? '✏️ Edit Category / Subcategory SEO' : '➕ Create Category or Subcategory'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAICategorySeoFill}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-lg shadow text-[11px]"
                  >
                    ✨ 1-Click AI SEO Auto-Fill
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Hierarchy Type (Main vs Subcategory)
                    </label>
                    <select
                      value={catParentId}
                      onChange={(e) => setCatParentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold"
                    >
                      <option value="MAIN">📁 Main Primary Category (Top Level)</option>
                      {mainCategories.map((mc) => (
                        <option key={mc.id} value={mc.id}>
                          ↳ Subcategory under: {mc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Target Exam Tag (For Tools &amp; Courses)
                    </label>
                    <select
                      value={catTargetExam}
                      onChange={(e) => setCatTargetExam(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                    >
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
                    <label className="block font-bold text-slate-300 mb-1">
                      Category / Subcategory Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => {
                        setCatName(e.target.value);
                        setCatSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }}
                      placeholder="e.g. UP Sarkari Jobs or Defence Jobs"
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">SEO URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="e.g. up-sarkari-jobs"
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    SEO Page H1 Heading (Shown at Top of Category Page)
                  </label>
                  <input
                    type="text"
                    value={catH1}
                    onChange={(e) => setCatH1(e.target.value)}
                    placeholder="e.g. Bihar Sarkari Jobs 2026 — Apply Online & Notification"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-indigo-400 mb-1">
                      Google Meta Title (60 chars)
                    </label>
                    <input
                      type="text"
                      value={catMetaTitle}
                      onChange={(e) => setCatMetaTitle(e.target.value)}
                      placeholder="Meta Title for Google Search"
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-indigo-400 mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={catFocusKeyword}
                      onChange={(e) => setCatFocusKeyword(e.target.value)}
                      placeholder="e.g. Bihar Government Jobs 2026"
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-indigo-400 mb-1">
                    Google Meta Description (155 chars)
                  </label>
                  <textarea
                    rows={2}
                    value={catMetaDesc}
                    onChange={(e) => setCatMetaDesc(e.target.value)}
                    placeholder="High-CTR Meta Description..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Top Intro Summary (Below H1 on Landing Page)
                  </label>
                  <textarea
                    rows={2}
                    value={catShortIntro}
                    onChange={(e) => setCatShortIntro(e.target.value)}
                    placeholder="2-line intro text helping students understand this category..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    Bottom Long-Form SEO Content (HTML Supported for Google Ranking)
                  </label>
                  <textarea
                    rows={4}
                    value={catSeoBottom}
                    onChange={(e) => setCatSeoBottom(e.target.value)}
                    placeholder="<h2>Complete Guide...</h2><p>Rich SEO content at the bottom of the category page...</p>"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                {/* Category FAQs for Rich Snippet Schema */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">
                      ❓ Category FAQ Schema (Google Rich Snippets)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCatFaqs([...catFaqs, { question: '', answer: '' }])}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded-lg font-bold"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  {catFaqs.map((fq, idx) => (
                    <div key={idx} className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        placeholder="FAQ Question"
                        value={fq.question}
                        onChange={(e) => {
                          const up = [...catFaqs];
                          up[idx].question = e.target.value;
                          setCatFaqs(up);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="FAQ Answer"
                        value={fq.answer}
                        onChange={(e) => {
                          const up = [...catFaqs];
                          up[idx].answer = e.target.value;
                          setCatFaqs(up);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg"
                  >
                    {editingCatId ? '💾 Update Category SEO' : '🚀 Save Category / Subcategory'}
                  </button>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="px-4 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* RIGHT LIST: HIERARCHICAL TREE OF CATEGORIES & SUBCATEGORIES */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">
                      🌳 Live Category &amp; Subcategory SEO Tree
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Both Main Categories and Subcategories render via unified SEO component `/category/[...slug]`
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {mainCategories.map((mainCat) => {
                    const childSubs = categories.filter((c) => c.parentId === mainCat.id);
                    return (
                      <div
                        key={mainCat.id}
                        className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-amber-400">
                                📁 {mainCat.name}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">
                                {mainCat.count} Posts
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              /category/{mainCat.slug}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/category/${mainCat.slug}`}
                              target="_blank"
                              className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold"
                            >
                              View Page ↗
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEditCategoryClick(mainCat)}
                              className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded-lg font-bold"
                            >
                              Edit SEO
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetCategoryForm();
                                setCatParentId(mainCat.id);
                              }}
                              className="px-2.5 py-1 bg-cyan-600/30 text-cyan-300 rounded-lg font-bold"
                            >
                              + Add Sub
                            </button>
                          </div>
                        </div>

                        {/* Subcategories List */}
                        {childSubs.length > 0 && (
                          <div className="pl-4 border-l-2 border-slate-800 space-y-2 pt-1">
                            {childSubs.map((sub) => (
                              <div
                                key={sub.id}
                                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="font-bold text-cyan-300 flex items-center gap-2">
                                    <span>↳ {sub.name}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                                      {sub.count} Posts
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    /category/{mainCat.slug}/{sub.slug}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    href={`/category/${mainCat.slug}/${sub.slug}`}
                                    target="_blank"
                                    className="px-2 py-1 bg-slate-800 text-emerald-300 rounded font-bold text-[10px]"
                                  >
                                    View ↗
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleEditCategoryClick(sub)}
                                    className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded font-bold text-[10px]"
                                  >
                                    Edit SEO
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(sub)}
                                    className="px-2 py-1 bg-rose-950 text-rose-400 rounded font-bold text-[10px]"
                                  >
                                    ✕
                                  </button>
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

        {/* ========================================================= */}
        {/* TAB 3: PROGRAMMATIC SEO ENGINE (BULK GENERATOR)           */}
        {/* ========================================================= */}
        {activeTab === 'programmatic-seo' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                    Enterprise Growth Engine
                  </span>
                  <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                    🚀 Programmatic SEO Bulk Page Generator
                  </h1>
                  <p className="text-xs text-slate-400">
                    Comma-separated exams likho aur 1 click mein Category + Subcategory ke sath saare SEO notifications ready karo!
                  </p>
                </div>
              </div>

              {pingStatusMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs font-black">
                  {pingStatusMsg}
                </div>
              )}

              <form onSubmit={handleRunProgrammaticSeoBatch} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    1. Enter Target Exam Names (Comma Separated):
                  </label>
                  <textarea
                    rows={3}
                    value={pSeoExams}
                    onChange={(e) => setPSeoExams(e.target.value)}
                    placeholder="e.g. SSC CGL, SSC CHSL, RRB Group D, UP Police Constable, Bihar BPSC TRE 4.0"
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">2. Main Category:</label>
                    <select
                      value={pSeoCategory}
                      onChange={(e) => {
                        setPSeoCategory(e.target.value);
                        setPSeoSubCategory('');
                      }}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    >
                      {mainCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-cyan-300 mb-1">3. Subcategory (Optional):</label>
                    <select
                      value={pSeoSubCategory}
                      onChange={(e) => setPSeoSubCategory(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold"
                    >
                      <option value="">-- All / None --</option>
                      {getSubcategoriesByParentName(pSeoCategory).map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">4. Target Year:</label>
                    <input
                      type="text"
                      value={pSeoYear}
                      onChange={(e) => setPSeoYear(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      5. Vacancy / Badge Note:
                    </label>
                    <input
                      type="text"
                      value={pSeoVacancyNote}
                      onChange={(e) => setPSeoVacancyNote(e.target.value)}
                      placeholder="e.g. Bumper Posts"
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition"
                >
                  ⚡ Generate Bulk SEO Pages &amp; Ping Google Indexing API Now
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STUDENT TOOLS & SEO CONTROLLER                     */}
        {/* ========================================================= */}
        {activeTab === 'tools-manager' && (
          <div className="space-y-6 max-w-5xl">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-white">
                  🛠️ Student Utility Tools &amp; SEO Metadata Controller
                </h1>
                <p className="text-xs text-slate-400">
                  Control tool availability (Live / Maintenance), Target Exam Tags for coaching recommendations, and custom Google SEO Titles.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {toolsConfig.map((tool, idx) => (
                <div
                  key={tool.id}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                          tool.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {tool.isActive ? '🟢 LIVE' : '🔴 MAINTENANCE'}
                      </span>
                      <Link
                        href={tool.path}
                        target="_blank"
                        className="text-sm font-black text-white hover:text-amber-400 underline"
                      >
                        {tool.name} ↗
                      </Link>
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
                          logAuditAction(
                            updated[idx].isActive ? 'Enabled Tool' : 'Put Tool in Maintenance',
                            tool.name
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold ${
                          tool.isActive
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {tool.isActive ? 'Set Maintenance' : 'Turn Live'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        SEO Meta Title:
                      </label>
                      <input
                        type="text"
                        value={tool.metaTitle}
                        onChange={(e) => {
                          const updated = [...toolsConfig];
                          updated[idx].metaTitle = e.target.value;
                          saveToolsConfig(updated);
                        }}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        SEO Meta Description:
                      </label>
                      <input
                        type="text"
                        value={tool.metaDesc}
                        onChange={(e) => {
                          const updated = [...toolsConfig];
                          updated[idx].metaDesc = e.target.value;
                          saveToolsConfig(updated);
                        }}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ALL POSTS LIST                                     */}
        {/* ========================================================= */}
        {activeTab === 'posts' && (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-2xl font-black">📝 Manage Exam Posts ({posts.length})</h1>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('add-post');
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow"
              >
                + Add Advanced Post
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Search posts by title, category, or subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Title &amp; Slug</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">
                      Category &amp; Subcategory
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Publisher</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No posts found. Click &quot;+ Add Advanced Post&quot; to publish your first update!
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-bold text-blue-400 text-sm">{p.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">/posts/{p.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">
                            {p.category}
                          </span>
                          {p.subCategory && (
                            <span className="ml-1.5 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-bold text-[10px]">
                              ↳ {p.subCategory}
                            </span>
                          )}
                          {p.targetExamTag && (
                            <span className="ml-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px]">
                              {p.targetExamTag}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <div>{p.publisherName}</div>
                          <div className="text-[10px]">{p.publishedAt}</div>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Link
                            href={`/posts/${p.slug}`}
                            target="_blank"
                            className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded font-bold"
                          >
                            View ↗
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditClick(p)}
                            className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(p.id, p.title)}
                            className="px-2.5 py-1 bg-rose-950 text-rose-400 rounded font-bold"
                          >
                            Delete {!hasPermission('delete_content') && '🔒'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ADD / EDIT POST WITH CATEGORY + SUBCATEGORY        */}
        {/* ========================================================= */}
        {activeTab === 'add-post' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h1 className="text-xl font-black">
                  {editingId ? '✏️ Edit Post (Auto-Saves Revision)' : '➕ Create SEO-Optimized Post'}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black"
                >
                  {showPreview ? '← Back to Editor' : '👁️ Live Preview'}
                </button>
              </div>

              {!showPreview ? (
                <form onSubmit={handleSubmitPost} className="space-y-5 text-xs">
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          1. Main Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setSubCategory('');
                          }}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                        >
                          {mainCategories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-cyan-300">2. Subcategory</label>
                          <button
                            type="button"
                            onClick={() => setActiveTab('categories')}
                            className="text-[10px] text-amber-400 hover:underline font-bold"
                          >
                            + Manage
                          </button>
                        </div>
                        <select
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-bold"
                        >
                          <option value="">-- General / No Subcategory --</option>
                          {getSubcategoriesByParentName(category).map((sub) => (
                            <option key={sub.id} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          3. Target Exam Tag
                        </label>
                        <select
                          value={targetExamTag}
                          onChange={(e) => setTargetExamTag(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                        >
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
                        <label className="block font-bold text-slate-300 mb-1">
                          4. Vacancy Badge
                        </label>
                        <input
                          type="text"
                          value={vacancyOrSeats}
                          onChange={(e) => setVacancyOrSeats(e.target.value)}
                          placeholder="e.g. 39,481 Posts"
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                        <label className="font-bold text-slate-300">Post Title (H1)</label>
                        <button
                          type="button"
                          onClick={handleAIGenerate}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black rounded-lg shadow"
                        >
                          ✨ 1-Click AI Auto-Fill Post + Category + SEO
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '')
                          );
                        }}
                        placeholder="e.g. Bihar BPSC 72nd Combined Competitive Exam 2026 Online Form"
                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">URL Slug</label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Important Dates Editor */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-emerald-400">📅 Important Dates Table</span>
                      <button
                        type="button"
                        onClick={() => setImportantDates([...importantDates, { label: '', date: '' }])}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                      >
                        + Add Date Row
                      </button>
                    </div>
                    {importantDates.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="Event Label (e.g. Last Date)"
                          value={row.label}
                          onChange={(e) => {
                            const up = [...importantDates];
                            up[idx].label = e.target.value;
                            setImportantDates(up);
                          }}
                          className="sm:col-span-6 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Date (e.g. 30 Nov 2026)"
                          value={row.date}
                          onChange={(e) => {
                            const up = [...importantDates];
                            up[idx].date = e.target.value;
                            setImportantDates(up);
                          }}
                          className="sm:col-span-5 p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setImportantDates(importantDates.filter((_, i) => i !== idx))}
                          className="sm:col-span-1 bg-rose-950 text-rose-400 rounded-lg font-bold p-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dual Mode Content Editor */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-amber-400">
                        Post Content (HTML / Visual Mode)
                      </span>
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditorMode('code')}
                          className={`px-2.5 py-1 rounded font-bold ${
                            editorMode === 'code' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          💻 HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={`px-2.5 py-1 rounded font-bold ${
                            editorMode === 'visual' ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          👁️ Visual
                        </button>
                      </div>
                    </div>

                    {editorMode === 'code' && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => wrapClassicTag('<h2>', '</h2>', 'Heading')}
                          className="px-2.5 py-1 bg-slate-800 rounded font-bold"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapClassicTag('<h3>', '</h3>', 'Subheading')}
                          className="px-2.5 py-1 bg-slate-800 rounded font-bold"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapClassicTag('<strong>', '</strong>', 'Bold')}
                          className="px-2.5 py-1 bg-slate-800 rounded font-bold"
                        >
                          Bold
                        </button>
                      </div>
                    )}

                    {editorMode === 'code' ? (
                      <textarea
                        ref={classicTextareaRef}
                        rows={8}
                        value={classicContent}
                        onChange={(e) => setClassicContent(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    ) : (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setClassicContent(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: classicContent }}
                        className="w-full min-h-[180px] p-4 bg-white text-slate-900 rounded-xl prose max-w-none"
                      />
                    )}
                  </div>

                  {/* Important Links Editor */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-cyan-400">🔗 Important Links Table</span>
                      <button
                        type="button"
                        onClick={() => setImportantLinks([...importantLinks, { text: '', url: '' }])}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                      >
                        + Add Link Row
                      </button>
                    </div>
                    {importantLinks.map((lnk, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="Link Title (e.g. Apply Online)"
                          value={lnk.text}
                          onChange={(e) => {
                            const up = [...importantLinks];
                            up[idx].text = e.target.value;
                            setImportantLinks(up);
                          }}
                          className="sm:col-span-5 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="URL (e.g. https://ssc.gov.in or /tools/form-tool)"
                          value={lnk.url}
                          onChange={(e) => {
                            const up = [...importantLinks];
                            up[idx].url = e.target.value;
                            setImportantLinks(up);
                          }}
                          className="sm:col-span-6 p-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setImportantLinks(importantLinks.filter((_, i) => i !== idx))}
                          className="sm:col-span-1 bg-rose-950 text-rose-400 rounded-lg font-bold p-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* SEO Meta Fields */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <span className="font-black text-indigo-400 block">
                      🔍 Google Search Meta Tags
                    </span>
                    <input
                      type="text"
                      placeholder="SEO Meta Title (40-65 chars recommended)"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                    <textarea
                      rows={2}
                      placeholder="SEO Meta Description (100-160 chars recommended)"
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl"
                  >
                    {editingId ? '🔄 Save Changes & Snapshot Revision' : '🚀 Publish Post Live'}
                  </button>
                </form>
              ) : (
                <div className="bg-white text-slate-900 p-6 rounded-2xl space-y-4">
                  <h1 className="text-2xl font-black text-blue-900">{title}</h1>
                  <p className="text-xs text-slate-600">{shortDescription}</p>
                  <div
                    className="prose max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: classicContent }}
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: REAL-TIME SEO SCORE ANALYZER */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-white uppercase">
                    📈 Live Google SEO Score
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-black text-xs ${
                      seoHealth.score >= 80
                        ? 'bg-emerald-500 text-slate-950'
                        : seoHealth.score >= 50
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {seoHealth.score} / 100
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {seoHealth.checks.map((chk, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800"
                    >
                      <span className={chk.passed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {chk.passed ? '✓ ' : '○ '} {chk.label}
                      </span>
                      <span className="text-[10px] font-black text-slate-500">+{chk.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: CBT MOCK TESTS MANAGER & BUILDER                   */}
        {/* ========================================================= */}
        {activeTab === 'mock-tests' && (
          <div className="space-y-5 max-w-5xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black">🎯 CBT Mock Tests ({mockTests.length})</h1>
                <p className="text-xs text-slate-400">
                  Fully synced with Homepage &amp; Live Exam Timer Portal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('add-mock-test')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow"
              >
                + Create CBT Mock Test
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockTests.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                      {t.category || t.examCategory}
                    </span>
                    <h3 className="font-black text-sm text-white mt-1">
                      {t.testTitle || t.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ⏱️ {t.totalTimeMinutes || t.duration} Mins • ❓ {t.questions?.length || 0} Qs
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/mock-tests/${t.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                    >
                      Test ↗
                    </Link>
                    {hasPermission('delete_content') && (
                      <button
                        type="button"
                        onClick={() =>
                          saveMockTestsToStorage(mockTests.filter((x) => x.id !== t.id))
                        }
                        className="px-3 py-1.5 bg-rose-950 text-rose-400 text-xs font-bold rounded-lg"
                      >
                        ✕
                      </button>
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
              <button
                type="button"
                onClick={handleAIAddSampleQuestions}
                className="px-3 py-1.5 bg-purple-600 text-white font-black rounded-lg"
              >
                ✨ Auto-Load Sample Questions
              </button>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-300 mb-1">Mock Test Title</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. SSC GD Constable Full Mock Set 1"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={testTimeMinutes}
                  onChange={(e) => setTestTimeMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            {questionsList.map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="font-black text-amber-400">Question #{qIdx + 1}</div>
                <input
                  type="text"
                  required
                  value={q.questionText}
                  onChange={(e) => {
                    const up = [...questionsList];
                    up[qIdx].questionText = e.target.value;
                    setQuestionsList(up);
                  }}
                  placeholder="Enter question..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const up = [...questionsList];
                        up[qIdx].options[oIdx] = e.target.value;
                        setQuestionsList(up);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setQuestionsList([
                    ...questionsList,
                    {
                      id: Date.now().toString(),
                      questionText: '',
                      options: ['', '', '', ''],
                      correctOptionIndex: 0,
                    },
                  ])
                }
                className="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl"
              >
                + Add Question
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl"
              >
                🚀 Publish CBT Mock Test
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 8: PARTNERS & CONTEXTUAL COURSES APPROVAL             */}
        {/* ========================================================= */}
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
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500">
                          No partner requests yet.
                        </td>
                      </tr>
                    ) : (
                      partnersList.map((partner: any) => (
                        <tr key={partner.id}>
                          <td className="px-4 py-3 font-bold text-white">
                            {partner.instituteName} ({partner.ownerName})
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {partner.phone} • {partner.city}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                              {partner.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {partner.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const up = partnersList.map((p: any) =>
                                    p.id === partner.id ? { ...p, status: 'approved' } : p
                                  );
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

        {/* ========================================================= */}
        {/* TAB 9: TEAM RBAC & SECURITY AUDIT LOGS                    */}
        {/* ========================================================= */}
        {activeTab === 'rbac-staff' && (
          <div className="space-y-6 max-w-5xl text-xs">
            <h1 className="text-2xl font-black">🛡️ Team RBAC Management &amp; Security Audit Logs</h1>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-amber-400">➕ Add Staff / Team Member</h3>
                <input
                  type="text"
                  placeholder="Full Name (e.g. Amit Kumar)"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
                <input
                  type="email"
                  placeholder="Official Email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-bold"
                >
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
                    const ns: StaffUser = {
                      id: `st-${Date.now()}`,
                      name: newStaffName,
                      email: newStaffEmail,
                      role: newStaffRole,
                      active: true,
                    };
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
                    <div
                      key={st.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-black uppercase text-[10px]">
                        {st.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: STATIC PAGES & GLOBAL BACKUP                      */}
        {/* ========================================================= */}
        {(activeTab === 'pages' || activeTab === 'add-page') && (
          <div className="space-y-5 max-w-4xl text-xs">
            <h1 className="text-2xl font-black">📄 Static Pages ({pages.length})</h1>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="Page Title (e.g. Privacy Policy, Disclaimer, About Us)"
                value={pageTitle}
                onChange={(e) => {
                  setPageTitle(e.target.value);
                  setPageSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '')
                  );
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
              <textarea
                rows={5}
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (!pageTitle) {
                    alert('Please enter a Page Title!');
                    return;
                  }
                  const np: CustomPage = {
                    id: Date.now().toString(),
                    title: pageTitle,
                    slug: pageSlug,
                    content: pageContent,
                    publishedAt: new Date().toLocaleDateString('en-IN'),
                  };
                  savePagesToStorage([...pages, np]);
                  logAuditAction('Created Static Page', pageTitle);
                  setPageTitle('');
                  setPageSlug('');
                  alert('✅ Static Page Published!');
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl"
              >
                + Publish Static Page
              </button>
            </div>

            {pages.length > 0 && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                {pages.map((pg) => (
                  <div key={pg.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{pg.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/pages/{pg.slug}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/pages/${pg.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg font-bold"
                      >
                        View ↗
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          savePagesToStorage(pages.filter((x) => x.id !== pg.id))
                        }
                        className="px-3 py-1.5 bg-rose-950 text-rose-400 rounded-lg font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings-backup' && (
          <div className="max-w-4xl space-y-6 text-xs">
            <h1 className="text-2xl font-black">💾 Database Backup &amp; Global Portal Settings</h1>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-amber-400">
                📦 1-Click Full Database Snapshot (.JSON)
              </h3>
              <p className="text-slate-400">
                Download all your Posts, Categories, Subcategories, Revisions, Mock Tests, Partner Courses, Tools Config &amp; Staff Roles into a single backup file or restore anytime.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg"
                >
                  📥 Download Full Backup (.JSON)
                </button>
                <label className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg cursor-pointer">
                  📤 Restore from Backup (.JSON)
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}