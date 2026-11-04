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

interface Category {
  id: string;
  name: string;
  slug: string;
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
  | 'programmatic-seo'
  | 'tools-manager'
  | 'mock-tests'
  | 'add-mock-test'
  | 'partners-approval'
  | 'pages'
  | 'add-page'
  | 'categories'
  | 'rbac-staff'
  | 'settings-backup';

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

  // Post Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Latest Jobs');
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

  // Categories State
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Latest Jobs', slug: 'latest-jobs', count: 0 },
    { id: '2', name: 'Admit Card', slug: 'admit-card', count: 0 },
    { id: '3', name: 'Results', slug: 'results', count: 0 },
    { id: '4', name: 'Answer Key', slug: 'answer-key', count: 0 },
    { id: '5', name: 'Admission', slug: 'admission', count: 0 },
    { id: '6', name: 'Sarkari Yojana', slug: 'sarkari-yojana', count: 0 },
  ]);

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
    const savedPosts = localStorage.getItem('careersathi_posts');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        setPosts(parsed);
        updateCategoryCounts(parsed);
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

  const savePostsToStorage = (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem('careersathi_posts', JSON.stringify(updatedPosts));
    updateCategoryCounts(updatedPosts);
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

  const updateCategoryCounts = (currentPosts: Post[]) => {
    setCategories((prevCats) =>
      prevCats.map((cat) => ({
        ...cat,
        count: currentPosts.filter((p) => p.category === cat.name).length,
      }))
    );
  };

  // ==========================================
  // 5. LIVE SEO HEALTH SCORE ANALYZER (0 - 100%)
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
  // 6. AI AUTO-GENERATOR & POST HANDLERS
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
    if (lowerTitle.includes('ibps') || lowerTitle.includes('sbi') || lowerTitle.includes('rbi') || lowerTitle.includes('bank'))
      detectedExam = 'BANKING';
    else if (lowerTitle.includes('rrb') || lowerTitle.includes('railway') || lowerTitle.includes('ntpc'))
      detectedExam = 'RAILWAY';
    else if (lowerTitle.includes('upsc') || lowerTitle.includes('ias') || lowerTitle.includes('nda'))
      detectedExam = 'UPSC';
    else if (lowerTitle.includes('neet')) detectedExam = 'NEET';
    else if (lowerTitle.includes('jee') || lowerTitle.includes('cuet')) detectedExam = 'JEE';
    else if (lowerTitle.includes('police') || lowerTitle.includes('bpsc') || lowerTitle.includes('uppsc'))
      detectedExam = 'STATE';

    setCategory(detectedCategory);
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
  // 7. ENTERPRISE PROGRAMMATIC SEO BULK ENGINE
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
  // 8. MOCK TESTS BUILDER (100% SYNCED KEYS)
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
  // 9. FULL DATABASE JSON BACKUP & RESTORE
  // ==========================================
  const handleExportFullBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'CareerSathi Enterprise CMS',
      posts,
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
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
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
              v3.6 Pro
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
                <h1 className="text-2xl font-black text-white">
                  👑 Executive Command Center
                </h1>
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
                  onClick={() => setActiveTab('programmatic-seo')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow"
                >
                  🚀 Bulk SEO Generator
                </button>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                >
                  💾 Export Backup (.JSON)
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

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Partner Courses</span>
                <div className="text-3xl font-black text-purple-400 mt-1">{partnerCourses.length}</div>
                <span className="text-[10px] text-amber-300 font-bold">
                  {pendingPartnersCount} Pending Approvals
                </span>
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
        {/* TAB 2: PROGRAMMATIC SEO ENGINE (BULK GENERATOR)           */}
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
                    Comma-separated exams likho aur 1 click mein saare SEO-optimized notifications, FAQs, internal tool links aur Schema ready karo!
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">2. Target Category:</label>
                    <select
                      value={pSeoCategory}
                      onChange={(e) => setPSeoCategory(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">3. Target Year:</label>
                    <input
                      type="text"
                      value={pSeoYear}
                      onChange={(e) => setPSeoYear(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      4. Vacancy / Badge Note:
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
        {/* TAB 3: STUDENT TOOLS & SEO CONTROLLER                     */}
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
        {/* TAB 4: ALL POSTS LIST                                     */}
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
              placeholder="🔍 Search posts by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Title &amp; Slug</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400">Category &amp; Target</th>
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
        {/* TAB 5: ADD / EDIT POST WITH LIVE 100-PT SEO SCORECARD     */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">
                          Target Exam Tag (For Course Match)
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
                          Vacancy / Seats Badge
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
                          ✨ 1-Click AI Auto-Fill Post + SEO + Tool Links
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
                        placeholder="e.g. SSC CGL 2026 Online Form"
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
        {/* TAB 6: CBT MOCK TESTS MANAGER & BUILDER                   */}
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
        {/* TAB 7: PARTNERS & CONTEXTUAL COURSES APPROVAL             */}
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
        {/* TAB 8: TEAM RBAC & SECURITY AUDIT LOGS                    */}
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
        {/* TAB 9: STATIC PAGES & GLOBAL BACKUP                       */}
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
                Download all your Posts, Revisions, Mock Tests, Partner Courses, Tools Config &amp; Staff Roles into a single backup file or restore anytime.
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