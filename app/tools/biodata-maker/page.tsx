'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

// ==========================================
// 1. TEMPLATES, COMMUNITIES & BILINGUAL LABELS
// ==========================================

type LangMode = 'en' | 'hi' | 'bi';
type CommunityType = 'hindu' | 'muslim' | 'sikh' | 'christian' | 'jain' | 'buddhist';
type PhotoShape = 'arch' | 'circle' | 'rounded' | 'oval';

interface BiodataTemplate {
  id: string;
  name: string;
  badge: string;
  bgHex: string;
  cardBgHex: string;
  primaryHex: string;
  accentHex: string;
  textHex: string;
  mutedHex: string;
  headerBgHex: string;
  headerTextHex: string;
  borderStyle: 'royal-double' | 'arch-ornate' | 'modern-clean' | 'floral-gold';
}

const BIODATA_TEMPLATES: BiodataTemplate[] = [
  {
    id: 'rajwadi-maroon',
    name: '1. Royal Rajwadi Maroon',
    badge: '👑 Most Popular',
    bgHex: '#4A0E17',
    cardBgHex: '#FFFDF9',
    primaryHex: '#6B0F1A',
    accentHex: '#D4AF37',
    textHex: '#1E293B',
    mutedHex: '#475569',
    headerBgHex: '#6B0F1A',
    headerTextHex: '#FDE68A',
    borderStyle: 'royal-double',
  },
  {
    id: 'vedic-saffron',
    name: '2. Auspicious Sindoori',
    badge: '🕉️ Traditional',
    bgHex: '#FFF7ED',
    cardBgHex: '#FFFFFF',
    primaryHex: '#9A3412',
    accentHex: '#EA580C',
    textHex: '#1C1917',
    mutedHex: '#57534E',
    headerBgHex: '#9A3412',
    headerTextHex: '#FFEDD5',
    borderStyle: 'floral-gold',
  },
  {
    id: 'emerald-nikah',
    name: '3. Royal Emerald & Gold',
    badge: '🌙 Shahi Arch',
    bgHex: '#064E3B',
    cardBgHex: '#FAFDFB',
    primaryHex: '#065F46',
    accentHex: '#D97706',
    textHex: '#0F172A',
    mutedHex: '#334155',
    headerBgHex: '#064E3B',
    headerTextHex: '#FDE68A',
    borderStyle: 'arch-ornate',
  },
  {
    id: 'bridal-lotus',
    name: '4. Bridal Lotus Pink',
    badge: '🌸 Bride Special',
    bgHex: '#831843',
    cardBgHex: '#FFFBFD',
    primaryHex: '#9D174D',
    accentHex: '#DB2777',
    textHex: '#1F2937',
    mutedHex: '#4B5563',
    headerBgHex: '#9D174D',
    headerTextHex: '#FCE7F3',
    borderStyle: 'floral-gold',
  },
  {
    id: 'imperial-peacock',
    name: '5. Imperial Peacock Blue',
    badge: '🦚 Royal Blue',
    bgHex: '#0F172A',
    cardBgHex: '#F8FAFC',
    primaryHex: '#1E3A8A',
    accentHex: '#CA8A04',
    textHex: '#0F172A',
    mutedHex: '#475569',
    headerBgHex: '#1E3A8A',
    headerTextHex: '#FEF08A',
    borderStyle: 'royal-double',
  },
  {
    id: 'shahi-parchment',
    name: '6. Golden Shahi Scroll',
    badge: '📜 Vintage Gold',
    bgHex: '#FEF3C7',
    cardBgHex: '#FFFBEB',
    primaryHex: '#78350F',
    accentHex: '#B45309',
    textHex: '#292524',
    mutedHex: '#57534E',
    headerBgHex: '#78350F',
    headerTextHex: '#FDE68A',
    borderStyle: 'arch-ornate',
  },
  {
    id: 'modern-executive',
    name: '7. Modern Executive Navy',
    badge: '💼 Engineer / Doctor',
    bgHex: '#F1F5F9',
    cardBgHex: '#FFFFFF',
    primaryHex: '#0F172A',
    accentHex: '#2563EB',
    textHex: '#0F172A',
    mutedHex: '#475569',
    headerBgHex: '#0F172A',
    headerTextHex: '#FFFFFF',
    borderStyle: 'modern-clean',
  },
  {
    id: 'cyber-print-saver',
    name: '8. Cyber Cafe Print-Saver',
    badge: '🖨️ Zero Ink Waste',
    bgHex: '#FFFFFF',
    cardBgHex: '#FFFFFF',
    primaryHex: '#111827',
    accentHex: '#6B7280',
    textHex: '#000000',
    mutedHex: '#374151',
    headerBgHex: '#F3F4F6',
    headerTextHex: '#111827',
    borderStyle: 'modern-clean',
  },
];

const COMMUNITY_PRESETS: Record<
  CommunityType,
  {
    label: string;
    symbol: string;
    invocationEn: string;
    invocationHi: string;
    defaultTemplateId: string;
  }
> = {
  hindu: {
    label: '🕉️ Hindu',
    symbol: 'ॐ',
    invocationEn: '|| Shree Ganeshaya Namah ||',
    invocationHi: '|| श्री गणेशाय नमः ||',
    defaultTemplateId: 'rajwadi-maroon',
  },
  muslim: {
    label: '🌙 Muslim',
    symbol: '﷽',
    invocationEn: 'Bismillah-ir-Rahman-ir-Rahim',
    invocationHi: 'बिस्मिल्लाहिर रहमानिर रहीम',
    defaultTemplateId: 'emerald-nikah',
  },
  sikh: {
    label: '☬ Sikh',
    symbol: 'ੴ',
    invocationEn: '|| Ik Onkar Satnam Waheguru ||',
    invocationHi: '|| ੴ सति नामु वाहिगुरु ||',
    defaultTemplateId: 'imperial-peacock',
  },
  christian: {
    label: '✝️ Christian',
    symbol: '✝',
    invocationEn: '|| God Is Love • Praise The Lord ||',
    invocationHi: '|| परमेश्वर प्रेम है ||',
    defaultTemplateId: 'modern-executive',
  },
  jain: {
    label: '☸️ Jain',
    symbol: '卐',
    invocationEn: '|| Shree Mahaveeraya Namah ||',
    invocationHi: '|| णमो अरिहंताणं • जय जिनेन्द्र ||',
    defaultTemplateId: 'vedic-saffron',
  },
  buddhist: {
    label: '☸️ Buddhist',
    symbol: '☸',
    invocationEn: '|| Namo Tassa Bhagavato Arahato ||',
    invocationHi: '|| नमो बुद्धाय • जय भीम ||',
    defaultTemplateId: 'imperial-peacock',
  },
};

interface BiodataField {
  id: string;
  labelEn: string;
  labelHi: string;
  value: string;
  enabled: boolean;
}

export default function MarriageBiodataStudio() {
  // Top Configuration States
  const [community, setCommunity] = useState<CommunityType>('hindu');
  const [langMode, setLangMode] = useState<LangMode>('en');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('rajwadi-maroon');
  const activeTemplate =
    BIODATA_TEMPLATES.find((t) => t.id === selectedTemplateId) || BIODATA_TEMPLATES[0];

  // Header & Title States
  const [topSymbol, setTopSymbol] = useState<string>('ॐ');
  const [invocationText, setInvocationText] = useState<string>('|| श्री गणेशाय नमः ||');
  const [mainHeading, setMainHeading] = useState<string>('MARRIAGE BIO-DATA');
  const [candidateFullName, setCandidateFullName] = useState<string>('Er. Rahul Kumar Sharma');
  const [candidateTagline, setCandidateTagline] = useState<string>(
    'B.Tech (Computer Science) • Software Engineer'
  );

  // Profile Photo Studio States
  const [showPhoto, setShowPhoto] = useState<boolean>(true);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoShape, setPhotoShape] = useState<PhotoShape>('arch');
  const [photoZoom, setPhotoZoom] = useState<number>(1.05);
  const [photoPanX, setPhotoPanX] = useState<number>(0);
  const [photoPanY, setPhotoPanY] = useState<number>(0);
  const [photoBrightness, setPhotoBrightness] = useState<number>(5);

  // Section Toggles
  const [showAstroSection, setShowAstroSection] = useState<boolean>(true);
  const [showExpectations, setShowExpectations] = useState<boolean>(true);
  const [activeEditorSection, setActiveEditorSection] = useState<
    'personal' | 'astro' | 'career' | 'family' | 'contact' | 'photo'
  >('personal');

  // 1. Personal Details Fields
  const [personalFields, setPersonalFields] = useState<BiodataField[]>([
    { id: 'p1', labelEn: 'Date of Birth', labelHi: 'जन्म तिथि', value: '15 August 1999', enabled: true },
    { id: 'p2', labelEn: 'Height', labelHi: 'लम्बाई (कद)', value: "5 ft 9 in (175 cm)", enabled: true },
    { id: 'p3', labelEn: 'Complexion', labelHi: 'रंग-रूप', value: 'Fair & Pleasant', enabled: true },
    { id: 'p4', labelEn: 'Blood Group', labelHi: 'ब्लड ग्रुप', value: 'O+ Positive', enabled: true },
    { id: 'p5', labelEn: 'Marital Status', labelHi: 'वैवाहिक स्थिति', value: 'Never Married (अविवाहित)', enabled: true },
    { id: 'p6', labelEn: 'Diet & Lifestyle', labelHi: 'खान-पान', value: 'Pure Vegetarian, Non-Smoker', enabled: true },
    { id: 'p7', labelEn: 'Hobbies', labelHi: 'रुचियां', value: 'Reading, Fitness & Traveling', enabled: true },
  ]);

  // 2. Horoscope / Religious Details Fields
  const [astroFields, setAstroFields] = useState<BiodataField[]>([
    { id: 'a1', labelEn: 'Religion & Caste', labelHi: 'धर्म एवं जाति', value: 'Hindu, Brahmin', enabled: true },
    { id: 'a2', labelEn: 'Gotra', labelHi: 'गोत्र (स्वयं / मामा)', value: 'Kashyap (Self) / Bharadwaj (Mama)', enabled: true },
    { id: 'a3', labelEn: 'Time of Birth', labelHi: 'जन्म समय', value: '06:45 AM (Morning)', enabled: true },
    { id: 'a4', labelEn: 'Place of Birth', labelHi: 'जन्म स्थान', value: 'Patna, Bihar', enabled: true },
    { id: 'a5', labelEn: 'Rashi & Nakshatra', labelHi: 'राशि एवं नक्षत्र', value: 'Simha (Leo) • Magha Nakshatra', enabled: true },
    { id: 'a6', labelEn: 'Manglik Status', labelHi: 'मांगलिक दोष', value: 'Non-Manglik (अमांगलिक)', enabled: true },
  ]);

  // 3. Education & Career Fields
  const [careerFields, setCareerFields] = useState<BiodataField[]>([
    { id: 'c1', labelEn: 'Highest Education', labelHi: 'उच्च शिक्षा', value: 'B.Tech in Computer Science (NIT Patna)', enabled: true },
    { id: 'c2', labelEn: 'Academic Record', labelHi: 'शैक्षणिक विवरण', value: '10th (92% CBSE) • 12th (89% CBSE)', enabled: true },
    { id: 'c3', labelEn: 'Occupation / Post', labelHi: 'पद एवं व्यवसाय', value: 'Senior Software Engineer', enabled: true },
    { id: 'c4', labelEn: 'Organization', labelHi: 'संस्थान / विभाग', value: 'TCS Digital (Posted in Bengaluru / Hybrid)', enabled: true },
    { id: 'c5', labelEn: 'Annual Income', labelHi: 'वार्षिक आय (पैकेज)', value: '₹ 16.50 Lakhs Per Annum', enabled: true },
  ]);

  // 4. Family Details Fields
  const [familyFields, setFamilyFields] = useState<BiodataField[]>([
    { id: 'f1', labelEn: "Father's Name", labelHi: 'पिता का नाम', value: 'Shri Rameshwar Sharma', enabled: true },
    { id: 'f2', labelEn: "Father's Occupation", labelHi: 'पिता का व्यवसाय', value: 'Gazetted Officer (State Govt.)', enabled: true },
    { id: 'f3', labelEn: "Mother's Name", labelHi: 'माता का नाम', value: 'Smt. Sunita Devi (Homemaker)', enabled: true },
    { id: 'f4', labelEn: 'Brothers', labelHi: 'भाई का विवरण', value: '1 Younger Brother (Preparing for UPSC)', enabled: true },
    { id: 'f5', labelEn: 'Sisters', labelHi: 'बहन का विवरण', value: '1 Elder Sister (Married, Bank PO)', enabled: true },
    { id: 'f6', labelEn: 'Maternal Uncle (Mama)', labelHi: 'मामा जी का विवरण', value: 'Shri विनोद पाण्डेय (Muzaffarpur)', enabled: true },
    { id: 'f7', labelEn: 'Family Type & Values', labelHi: 'पारिवारिक पृष्ठभूमि', value: 'Respectable Joint Family with Traditional Values', enabled: true },
  ]);

  // 5. Contact & Address Fields
  const [contactFields, setContactFields] = useState<BiodataField[]>([
    { id: 'ct1', labelEn: 'Father / Guardian Mobile', labelHi: 'संपर्क नंबर (पिता)', value: '+91 98765 43210, +91 91234 56789', enabled: true },
    { id: 'ct2', labelEn: 'Permanent Address', labelHi: 'स्थायी पता', value: 'H.No. 42, Anandpuri, Boring Road, Patna (Bihar) - 800001', enabled: true },
    { id: 'ct3', labelEn: 'Native Ancestral Place', labelHi: 'पैतृक निवास (ग्राम)', value: 'Vill & Post: Rampur, Dist: Vaishali (Bihar)', enabled: true },
  ]);

  // 6. Partner Expectations Text
  const [expectationText, setExpectationText] = useState<string>(
    'Looking for a well-educated, cultured, and family-oriented life partner who respects family values and mutual career growth.'
  );

  // Preview & Export States
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply Community Preset
  const handleSelectCommunity = (comm: CommunityType) => {
    setCommunity(comm);
    const meta = COMMUNITY_PRESETS[comm];
    setTopSymbol(meta.symbol);
    setInvocationText(langMode === 'en' ? meta.invocationEn : meta.invocationHi);
    setSelectedTemplateId(meta.defaultTemplateId);

    if (comm === 'muslim') {
      setAstroFields([
        { id: 'm1', labelEn: 'Religion & Sect', labelHi: 'मज़हब और मसलक', value: 'Islam • Sunni Hanafi', enabled: true },
        { id: 'm2', labelEn: 'Biradari / Caste', labelHi: 'बिरादरी', value: 'Shaikh / Syed', enabled: true },
        { id: 'm3', labelEn: 'Religious Practice', labelHi: 'दीनी तालीम', value: 'Namazi, Quran Reciter & Fasting', enabled: true },
        { id: 'm4', labelEn: 'Place of Birth', labelHi: 'पैदाइश का मुकाम', value: 'Patna, Bihar', enabled: true },
      ]);
    } else if (comm === 'christian') {
      setAstroFields([
        { id: 'ch1', labelEn: 'Religion & Denomination', labelHi: 'धर्म एवं चर्च', value: 'Christian (Roman Catholic)', enabled: true },
        { id: 'ch2', labelEn: 'Parish / Church', labelHi: 'चर्च का नाम', value: 'St. Joseph Cathedral', enabled: true },
        { id: 'ch3', labelEn: 'Place of Birth', labelHi: 'जन्म स्थान', value: 'New Delhi', enabled: true },
      ]);
    }
  };

  // Switch Language Mode (English / Hindi / Bilingual)
  const handleSwitchLanguage = (mode: LangMode) => {
    setLangMode(mode);
    const meta = COMMUNITY_PRESETS[community];
    if (mode === 'hi') {
      setInvocationText(meta.invocationHi);
      setMainHeading('विवाह हेतु बायोडाटा (परिचय-पत्र)');
    } else if (mode === 'bi') {
      setInvocationText(meta.invocationHi);
      setMainHeading('MARRIAGE BIO-DATA (परिचय-पत्र)');
    } else {
      setInvocationText(meta.invocationEn);
      setMainHeading('MARRIAGE BIO-DATA');
    }
  };

  // Load Groom (Boy) or Bride (Girl) Sample Profile in 1 Click
  const loadSampleProfile = (gender: 'boy' | 'girl') => {
    if (gender === 'girl') {
      setSelectedTemplateId('bridal-lotus');
      setCandidateFullName('Dr. Ananya Kumari Verma');
      setCandidateTagline('MBBS, MD (Pediatrics) • Medical Officer');
      setPersonalFields([
        { id: 'p1', labelEn: 'Date of Birth', labelHi: 'जन्म तिथि', value: '24 October 2000', enabled: true },
        { id: 'p2', labelEn: 'Height', labelHi: 'लम्बाई (कद)', value: "5 ft 4 in (163 cm)", enabled: true },
        { id: 'p3', labelEn: 'Complexion', labelHi: 'रंग-रूप', value: 'Very Fair & Graceful', enabled: true },
        { id: 'p4', labelEn: 'Blood Group', labelHi: 'ब्लड ग्रुप', value: 'B+ Positive', enabled: true },
        { id: 'p5', labelEn: 'Marital Status', labelHi: 'वैवाहिक स्थिति', value: 'Never Married (अविवाहित)', enabled: true },
        { id: 'p6', labelEn: 'Hobbies & Skills', labelHi: 'रुचियां एवं कला', value: 'Painting, Classical Music & Cooking', enabled: true },
      ]);
      setCareerFields([
        { id: 'c1', labelEn: 'Qualification', labelHi: 'उच्च शिक्षा', value: 'MBBS (PMCH Patna), Pursuing MD', enabled: true },
        { id: 'c2', labelEn: 'Profession', labelHi: 'पद एवं व्यवसाय', value: 'Resident Doctor (Govt. Hospital)', enabled: true },
        { id: 'c3', labelEn: 'Stipend / Income', labelHi: 'मासिक/वार्षिक आय', value: '₹ 1.15 Lakhs / Month', enabled: true },
      ]);
    } else {
      setSelectedTemplateId('rajwadi-maroon');
      setCandidateFullName('Er. Rahul Kumar Sharma');
      setCandidateTagline('B.Tech (Computer Science) • Senior Software Engineer');
    }
  };

  // Upload Candidate Photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setPhotoImg(img);
        setShowPhoto(true);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper to get active field label based on selected language
  const getFieldLabel = (f: BiodataField) => {
    if (langMode === 'hi') return f.labelHi || f.labelEn;
    if (langMode === 'bi') return `${f.labelEn} (${f.labelHi})`;
    return f.labelEn;
  };

  const getSectionTitle = (en: string, hi: string) => {
    if (langMode === 'hi') return hi;
    if (langMode === 'bi') return `${en} • ${hi}`;
    return en;
  };

  // Update / Add / Remove Field Helpers
  const updateFieldInList = (
    setter: React.Dispatch<React.SetStateAction<BiodataField[]>>,
    id: string,
    patch: Partial<BiodataField>
  ) => {
    setter((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addCustomFieldToList = (setter: React.Dispatch<React.SetStateAction<BiodataField[]>>) => {
    setter((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        labelEn: 'Custom Detail',
        labelHi: 'अन्य विवरण',
        value: 'Enter value here',
        enabled: true,
      },
    ]);
  };

  const removeFieldFromList = (
    setter: React.Dispatch<React.SetStateAction<BiodataField[]>>,
    id: string
  ) => {
    setter((prev) => prev.filter((f) => f.id !== id));
  };

  // ==========================================
  // 2. HIGH-RESOLUTION A4 CANVAS RENDER ENGINE (1240 x 1754 px)
  // ==========================================
  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  useEffect(() => {
    const W = 1240;
    const H = 1754;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const tpl = activeTemplate;

    // 1. Outer Royal Background & Inner Card Sheet
    ctx.fillStyle = tpl.bgHex;
    ctx.fillRect(0, 0, W, H);

    const margin = 38;
    ctx.fillStyle = tpl.cardBgHex;
    ctx.fillRect(margin, margin, W - margin * 2, H - margin * 2);

    // 2. Ornate Royal Frames & Corner Motifs
    ctx.strokeStyle = tpl.accentHex;
    ctx.lineWidth = 5;
    ctx.strokeRect(margin + 12, margin + 12, W - (margin + 12) * 2, H - (margin + 12) * 2);

    ctx.strokeStyle = tpl.primaryHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(margin + 22, margin + 22, W - (margin + 22) * 2, H - (margin + 22) * 2);

    // Draw 4 Ornate Royal Corner Medallions
    const drawCornerOrnament = (cx: number, cy: number, dx: number, dy: number) => {
      ctx.save();
      ctx.strokeStyle = tpl.accentHex;
      ctx.fillStyle = tpl.primaryHex;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(cx + dx * 28, cy + dy * 28, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * 65);
      ctx.quadraticCurveTo(cx + dx * 45, cy + dy * 45, cx + dx * 65, cy);
      ctx.stroke();
      ctx.restore();
    };

    const mIn = margin + 12;
    drawCornerOrnament(mIn, mIn, 1, 1);
    drawCornerOrnament(W - mIn, mIn, -1, 1);
    drawCornerOrnament(mIn, H - mIn, 1, -1);
    drawCornerOrnament(W - mIn, H - mIn, -1, -1);

    // 3. Top Spiritual Emblem & Invocation Mantra
    let curY = margin + 62;

    if (topSymbol.trim()) {
      ctx.fillStyle = tpl.primaryHex;
      ctx.beginPath();
      ctx.arc(W / 2, curY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tpl.accentHex;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = tpl.headerTextHex;
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(topSymbol.trim(), W / 2, curY + 1);
      curY += 42;
    }

    if (invocationText.trim()) {
      ctx.fillStyle = tpl.primaryHex;
      ctx.font = 'bold 21px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(invocationText.trim(), W / 2, curY);
      curY += 32;
    }

    // Main Biodata Ribbon Banner
    if (mainHeading.trim()) {
      const bw = 380;
      const bh = 40;
      ctx.fillStyle = tpl.headerBgHex;
      ctx.beginPath();
      ctx.roundRect(W / 2 - bw / 2, curY - 22, bw, bh, 20);
      ctx.fill();
      ctx.strokeStyle = tpl.accentHex;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = tpl.headerTextHex;
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mainHeading.toUpperCase(), W / 2, curY - 1);
      curY += 38;
    }

    // 4. Candidate Name & Tagline Header
    const contentLeft = margin + 52;
    const contentRight = W - margin - 52;
    const hasPhotoBox = showPhoto;
    const photoBoxW = 245;
    const photoBoxH = 305;
    const photoBoxX = contentRight - photoBoxW;
    const photoBoxY = curY + 10;

    ctx.textAlign = 'left';
    ctx.fillStyle = tpl.primaryHex;
    ctx.font = 'bold 34px Georgia, Arial, serif';
    ctx.fillText(candidateFullName || 'Candidate Name', contentLeft, curY + 24);

    if (candidateTagline.trim()) {
      ctx.fillStyle = tpl.accentHex === '#6B7280' ? '#374151' : tpl.primaryHex;
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText(candidateTagline, contentLeft, curY + 56);
    }

    // Decorative divider under name
    ctx.strokeStyle = tpl.accentHex;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(contentLeft, curY + 72);
    ctx.lineTo(hasPhotoBox ? photoBoxX - 28 : contentRight, curY + 72);
    ctx.stroke();

    curY += 92;

    // 5. Draw Candidate Portrait Photo Frame (Right Side)
    if (hasPhotoBox) {
      ctx.save();
      ctx.beginPath();
      if (photoShape === 'circle') {
        const r = photoBoxW / 2;
        ctx.arc(photoBoxX + r, photoBoxY + r + 15, r, 0, Math.PI * 2);
      } else if (photoShape === 'oval') {
        ctx.ellipse(
          photoBoxX + photoBoxW / 2,
          photoBoxY + photoBoxH / 2,
          photoBoxW / 2,
          photoBoxH / 2,
          0,
          0,
          Math.PI * 2
        );
      } else if (photoShape === 'arch') {
        const r = photoBoxW / 2;
        ctx.moveTo(photoBoxX, photoBoxY + photoBoxH);
        ctx.lineTo(photoBoxX, photoBoxY + r);
        ctx.arc(photoBoxX + r, photoBoxY + r, r, Math.PI, 0, false);
        ctx.lineTo(photoBoxX + photoBoxW, photoBoxY + photoBoxH);
        ctx.closePath();
      } else {
        ctx.roundRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 18);
      }

      ctx.fillStyle = '#F1F5F9';
      ctx.fill();
      ctx.clip();

      if (photoImg) {
        const scale =
          Math.max(photoBoxW / photoImg.width, photoBoxH / photoImg.height) * photoZoom;
        const dw = photoImg.width * scale;
        const dh = photoImg.height * scale;
        const dx = photoBoxX + (photoBoxW - dw) / 2 + photoPanX;
        const dy = photoBoxY + (photoBoxH - dh) / 2 + photoPanY;

        ctx.filter = `brightness(${100 + photoBrightness}%) contrast(105%)`;
        ctx.drawImage(photoImg, dx, dy, dw, dh);
        ctx.filter = 'none';
      } else {
        // Stylish Placeholder Avatar
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH);
        ctx.fillStyle = tpl.primaryHex;
        ctx.font = 'bold 17px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📸 Upload Photo', photoBoxX + photoBoxW / 2, photoBoxY + photoBoxH / 2 - 8);
        ctx.font = '13px Arial, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('(Or Hide Photo Box)', photoBoxX + photoBoxW / 2, photoBoxY + photoBoxH / 2 + 16);
      }
      ctx.restore();

      // Gold Frame Border around Photo
      ctx.save();
      ctx.strokeStyle = tpl.accentHex;
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (photoShape === 'circle') {
        const r = photoBoxW / 2;
        ctx.arc(photoBoxX + r, photoBoxY + r + 15, r, 0, Math.PI * 2);
      } else if (photoShape === 'oval') {
        ctx.ellipse(
          photoBoxX + photoBoxW / 2,
          photoBoxY + photoBoxH / 2,
          photoBoxW / 2,
          photoBoxH / 2,
          0,
          0,
          Math.PI * 2
        );
      } else if (photoShape === 'arch') {
        const r = photoBoxW / 2;
        ctx.moveTo(photoBoxX, photoBoxY + photoBoxH);
        ctx.lineTo(photoBoxX, photoBoxY + r);
        ctx.arc(photoBoxX + r, photoBoxY + r, r, Math.PI, 0, false);
        ctx.lineTo(photoBoxX + photoBoxW, photoBoxY + photoBoxH);
        ctx.closePath();
      } else {
        ctx.roundRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 18);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 6. Helper to Render Structured Biodata Sections
    const drawBiodataSection = (
      secTitle: string,
      fields: BiodataField[],
      avoidPhotoRight: boolean
    ) => {
      const activeRows = fields.filter((f) => f.enabled && f.value.trim());
      if (activeRows.length === 0) return;

      const secRightEdge =
        avoidPhotoRight && hasPhotoBox && curY < photoBoxY + photoBoxH + 15
          ? photoBoxX - 32
          : contentRight;
      const secWidth = secRightEdge - contentLeft;

      // Section Header Bar
      ctx.fillStyle = tpl.headerBgHex;
      ctx.beginPath();
      ctx.roundRect(contentLeft, curY, secWidth, 36, 8);
      ctx.fill();

      ctx.fillStyle = tpl.accentHex;
      ctx.fillRect(contentLeft, curY, 8, 36);

      ctx.fillStyle = tpl.headerTextHex;
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`  ✦  ${secTitle.toUpperCase()}`, contentLeft + 10, curY + 19);

      curY += 50;

      // Render Key-Value Rows
      const labelColWidth = langMode === 'bi' ? 310 : 255;

      for (const row of activeRows) {
        const rowRightLimit =
          hasPhotoBox && curY < photoBoxY + photoBoxH + 10 ? photoBoxX - 32 : contentRight;
        const valMaxWidth = rowRightLimit - (contentLeft + labelColWidth + 25);

        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillStyle = tpl.mutedHex;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(getFieldLabel(row), contentLeft + 10, curY);

        ctx.fillStyle = tpl.primaryHex;
        ctx.fillText(':', contentLeft + labelColWidth, curY);

        ctx.font = 'bold 18.5px Arial, sans-serif';
        ctx.fillStyle = tpl.textHex;
        const wrappedLines = wrapCanvasText(ctx, row.value, valMaxWidth);

        wrappedLines.forEach((ln, idx) => {
          ctx.fillText(ln, contentLeft + labelColWidth + 20, curY + idx * 25);
        });

        curY += Math.max(1, wrappedLines.length) * 27 + 6;
      }

      curY += 12;
    };

    // Render All Active Sections
    drawBiodataSection(
      getSectionTitle('Personal Details', 'व्यक्तिगत विवरण'),
      personalFields,
      true
    );

    if (showAstroSection) {
      drawBiodataSection(
        getSectionTitle('Horoscope & Religious Details', 'कुंडली एवं धार्मिक विवरण'),
        astroFields,
        false
      );
    }

    drawBiodataSection(
      getSectionTitle('Education & Career', 'शिक्षा एवं व्यवसाय'),
      careerFields,
      false
    );

    drawBiodataSection(
      getSectionTitle('Family Background', 'पारिवारिक विवरण'),
      familyFields,
      false
    );

    drawBiodataSection(
      getSectionTitle('Contact & Address Details', 'संपर्क सूत्र एवं पता'),
      contactFields,
      false
    );

    if (showExpectations && expectationText.trim() && curY < H - 140) {
      drawBiodataSection(
        getSectionTitle('Partner Expectations', 'जीवनसाथी से अपेक्षाएं'),
        [
          {
            id: 'exp',
            labelEn: 'Preferences',
            labelHi: 'अपेक्षा',
            value: expectationText,
            enabled: true,
          },
        ],
        false
      );
    }

    masterCanvasRef.current = canvas;
    setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.92));
  }, [
    activeTemplate,
    community,
    langMode,
    topSymbol,
    invocationText,
    mainHeading,
    candidateFullName,
    candidateTagline,
    showPhoto,
    photoImg,
    photoShape,
    photoZoom,
    photoPanX,
    photoPanY,
    photoBrightness,
    showAstroSection,
    showExpectations,
    personalFields,
    astroFields,
    careerFields,
    familyFields,
    contactFields,
    expectationText,
  ]);

  // ==========================================
  // 3. EXPORT FUNCTIONS (A4 PDF, WHATSAPP JPG, DIRECT PRINT, TEXT SHARE)
  // ==========================================
  const downloadBiodataPdf = async () => {
    if (!masterCanvasRef.current) return;
    setIsExportingPdf(true);
    try {
      const jpgUrl = masterCanvasRef.current.toDataURL('image/jpeg', 0.96);
      const b64 = jpgUrl.split(',')[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const embeddedJpg = await pdfDoc.embedJpg(bytes);
      page.drawImage(embeddedJpg, { x: 0, y: 0, width: 595.28, height: 841.89 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (candidateFullName || 'Marriage-Biodata')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      a.download = `${safeName}-Biodata.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF Export Error: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const downloadBiodataImage = () => {
    if (!masterCanvasRef.current) return;
    const url = masterCanvasRef.current.toDataURL('image/jpeg', 0.96);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (candidateFullName || 'Marriage-Biodata')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-');
    a.download = `${safeName}-Biodata-HD.jpg`;
    a.click();
  };

  const printBiodataDirectly = () => {
    if (!masterCanvasRef.current) return;
    const dataUrl = masterCanvasRef.current.toDataURL('image/jpeg', 0.96);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups to print A4 Biodata.');
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>${candidateFullName} - Marriage Biodata</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; }
            img { width: 210mm; height: 297mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    win.document.close();
  };

  const shareFormattedTextOnWhatsApp = () => {
    const formatSec = (title: string, list: BiodataField[]) => {
      const rows = list
        .filter((f) => f.enabled && f.value.trim())
        .map((f) => `• *${getFieldLabel(f)}:* ${f.value}`)
        .join('\n');
      return rows ? `\n*${title}*\n${rows}` : '';
    };

    const msg = `${invocationText}\n*${mainHeading}*\n👤 *${candidateFullName}*\n_${candidateTagline}_\n${formatSec(
      '📋 Personal Details',
      personalFields
    )}${showAstroSection ? formatSec('🕉️ Horoscope Details', astroFields) : ''}${formatSec(
      '🎓 Education & Career',
      careerFields
    )}${formatSec('👨‍👩‍👧‍👦 Family Details', familyFields)}${formatSec(
      '📞 Contact Details',
      contactFields
    )}`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Reusable Field Editor List Component
  const renderFieldEditorList = (
    fields: BiodataField[],
    setter: React.Dispatch<React.SetStateAction<BiodataField[]>>
  ) => (
    <div className="space-y-2.5">
      {fields.map((f) => (
        <div
          key={f.id}
          className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center gap-2 ${
            f.enabled
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-950/40 border-slate-900 opacity-50'
          }`}
        >
          <div className="flex items-center gap-2 w-full sm:w-48 shrink-0">
            <input
              type="checkbox"
              checked={f.enabled}
              onChange={(e) => updateFieldInList(setter, f.id, { enabled: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500"
              title="Show or hide this row on Biodata"
            />
            <input
              type="text"
              value={langMode === 'hi' ? f.labelHi : f.labelEn}
              onChange={(e) =>
                updateFieldInList(
                  setter,
                  f.id,
                  langMode === 'hi' ? { labelHi: e.target.value } : { labelEn: e.target.value }
                )
              }
              className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-amber-300 font-bold text-xs outline-none"
            />
          </div>

          <input
            type="text"
            value={f.value}
            onChange={(e) => updateFieldInList(setter, f.id, { value: e.target.value })}
            placeholder="Enter detail..."
            className="flex-1 w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold text-xs outline-none focus:border-amber-400"
          />

          <button
            onClick={() => removeFieldFromList(setter, f.id)}
            className="text-rose-400 hover:text-rose-300 text-xs font-bold px-2 py-1"
            title="Delete Field"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        onClick={() => addCustomFieldToList(setter)}
        className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-dashed border-amber-500/50 rounded-xl text-amber-300 font-black text-xs transition"
      >
        + Add New Custom Field Row
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-black">
              💍 #1 Royal Marriage Biodata Maker (PDF &amp; WhatsApp HD)
            </span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
              ✓ 100% Free • No Watermark • English &amp; हिंदी
            </span>
          </div>
        </div>

        {/* HERO & QUICK CONTROLS BAR */}
        <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Royal <span className="text-amber-400">Marriage Biodata Studio</span> (English &amp; हिंदी)
              </h1>
              <p className="text-xs text-slate-400">
                Choose from 8 Royal Templates, switch between English &amp; Hindi in 1 click, customize every field, and download A4 PDF or WhatsApp HD Image free!
              </p>
            </div>

            {/* 1-Click Sample Fill Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => loadSampleProfile('boy')}
                className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 font-black rounded-xl"
              >
                🤵 Fill Groom (Boy) Sample
              </button>
              <button
                onClick={() => loadSampleProfile('girl')}
                className="px-3.5 py-2 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 font-black rounded-xl"
              >
                👰 Fill Bride (Girl) Sample
              </button>
            </div>
          </div>

          {/* Community Presets + Language Switcher Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800 text-xs">
            {/* 6 Community Buttons */}
            <div className="md:col-span-8 flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold mr-1">Community:</span>
              {(Object.keys(COMMUNITY_PRESETS) as CommunityType[]).map((cKey) => (
                <button
                  key={cKey}
                  onClick={() => handleSelectCommunity(cKey)}
                  className={`px-3 py-1.5 rounded-xl font-black border transition ${
                    community === cKey
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {COMMUNITY_PRESETS[cKey].label}
                </button>
              ))}
            </div>

            {/* 3 Language Switch Buttons */}
            <div className="md:col-span-4 flex items-center justify-end gap-1.5">
              <span className="text-slate-400 font-bold mr-1">Language:</span>
              {[
                { id: 'en', label: '🇬🇧 English' },
                { id: 'hi', label: '🇮🇳 हिंदी' },
                { id: 'bi', label: '⚡ Bilingual' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleSwitchLanguage(l.id as LangMode)}
                  className={`px-3 py-1.5 rounded-xl font-black border transition ${
                    langMode === l.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Designer Template Selector Cards */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-black text-amber-400 uppercase block">
              🎨 Select Royal Biodata Template (8 Designs):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {BIODATA_TEMPLATES.map((t) => {
                const active = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                      active
                        ? 'border-amber-400 bg-amber-500/20 text-white scale-[1.03] shadow-lg'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: t.primaryHex }}
                      />
                      <span className="text-[9px] text-amber-300 font-bold truncate">
                        {t.badge}
                      </span>
                    </div>
                    <div className="text-[11px] font-black mt-1.5 leading-tight">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN WORKSPACE: LEFT FORM EDITOR + RIGHT LIVE A4 PREVIEW     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: GUIDED SECTION EDITOR (7 COLS) */}
          <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 text-xs">
            {/* Top Invocation, Symbol & Candidate Name Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-black text-amber-400 uppercase block">
                🕉️ Header Mantra, Emblem &amp; Candidate Name
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Top Symbol</label>
                  <input
                    type="text"
                    value={topSymbol}
                    onChange={(e) => setTopSymbol(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-black text-center text-sm"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Auspicious Invocation / Mantra
                  </label>
                  <input
                    type="text"
                    value={invocationText}
                    onChange={(e) => setInvocationText(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-1">Document Heading</label>
                  <input
                    type="text"
                    value={mainHeading}
                    onChange={(e) => setMainHeading(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Candidate Full Name (Bold Header)
                  </label>
                  <input
                    type="text"
                    value={candidateFullName}
                    onChange={(e) => setCandidateFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-amber-500/60 rounded-lg text-white font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Subtitle / Qualification Tagline
                  </label>
                  <input
                    type="text"
                    value={candidateTagline}
                    onChange={(e) => setCandidateTagline(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 6 Section Switcher Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {[
                { id: 'personal', label: '👤 1. Personal' },
                { id: 'astro', label: '🕉️ 2. Horoscope' },
                { id: 'career', label: '🎓 3. Education/Job' },
                { id: 'family', label: '👨‍👩‍👧‍👦 4. Family' },
                { id: 'contact', label: '📞 5. Contact' },
                { id: 'photo', label: '📸 6. Photo Studio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorSection(tab.id as any)}
                  className={`px-3 py-2 rounded-lg font-black transition flex-1 min-w-[105px] text-center ${
                    activeEditorSection === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Section Fields Editor */}
            {activeEditorSection === 'personal' &&
              renderFieldEditorList(personalFields, setPersonalFields)}

            {activeEditorSection === 'astro' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-black text-amber-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={showAstroSection}
                    onChange={(e) => setShowAstroSection(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Show Horoscope / Religious Details Section on Biodata
                </label>
                {showAstroSection && renderFieldEditorList(astroFields, setAstroFields)}
              </div>
            )}

            {activeEditorSection === 'career' &&
              renderFieldEditorList(careerFields, setCareerFields)}

            {activeEditorSection === 'family' &&
              renderFieldEditorList(familyFields, setFamilyFields)}

            {activeEditorSection === 'contact' && (
              <div className="space-y-4">
                {renderFieldEditorList(contactFields, setContactFields)}

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-emerald-400">
                    <input
                      type="checkbox"
                      checked={showExpectations}
                      onChange={(e) => setShowExpectations(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    Include Partner Expectations Section at Bottom
                  </label>
                  {showExpectations && (
                    <textarea
                      rows={2}
                      value={expectationText}
                      onChange={(e) => setExpectationText(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  )}
                </div>
              </div>
            )}

            {activeEditorSection === 'photo' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-emerald-400">
                    <input
                      type="checkbox"
                      checked={showPhoto}
                      onChange={(e) => setShowPhoto(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    📸 Show Candidate Photo on Biodata
                  </label>

                  <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer shadow">
                    📂 Upload Portrait Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {showPhoto && (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-bold block">Photo Frame Shape:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          [
                            { id: 'arch', label: '🕌 Royal Arch' },
                            { id: 'circle', label: '⭕ Gold Circle' },
                            { id: 'oval', label: '🥚 Classic Oval' },
                            { id: 'rounded', label: '🖼️ Portrait Box' },
                          ] as const
                        ).map((sh) => (
                          <button
                            key={sh.id}
                            onClick={() => setPhotoShape(sh.id)}
                            className={`py-2 rounded-lg font-bold border ${
                              photoShape === sh.id
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block mb-1">
                          Zoom ({Math.round(photoZoom * 100)}%)
                        </span>
                        <input
                          type="range"
                          min={0.7}
                          max={2.4}
                          step={0.05}
                          value={photoZoom}
                          onChange={(e) => setPhotoZoom(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Left/Right ({photoPanX})</span>
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          value={photoPanX}
                          onChange={(e) => setPhotoPanX(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Up/Down ({photoPanY})</span>
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          value={photoPanY}
                          onChange={(e) => setPhotoPanY(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">
                          Brightness ({photoBrightness})
                        </span>
                        <input
                          type="range"
                          min={-20}
                          max={30}
                          value={photoBrightness}
                          onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE A4 BIODATA PREVIEW & 4 INSTANT EXPORTS (5 COLS) */}
          <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                <span className="font-black text-emerald-400">
                  ✨ Live A4 Print-Ready Biodata Preview
                </span>
                <label className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg cursor-pointer">
                  📸 Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-center">
                {previewDataUrl && (
                  <img
                    src={previewDataUrl}
                    alt="Marriage Biodata Preview"
                    className="max-h-[540px] w-auto object-contain rounded shadow-2xl border border-slate-800"
                  />
                )}
              </div>
            </div>

            {/* 4 Instant Free Export Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={downloadBiodataPdf}
                  disabled={isExportingPdf}
                  className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-xl transition flex items-center justify-center gap-1.5"
                >
                  📄 {isExportingPdf ? 'Generating PDF...' : 'Download A4 PDF (HD)'}
                </button>

                <button
                  onClick={downloadBiodataImage}
                  className="py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xl transition flex items-center justify-center gap-1.5"
                >
                  🖼️ Download WhatsApp Image
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={printBiodataDirectly}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  🖨️ Direct A4 Print (Cyber Cafe)
                </button>

                <button
                  onClick={shareFormattedTextOnWhatsApp}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-black rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {copiedWhatsApp ? '✓ Copied & Opening WhatsApp!' : '📲 Share Text on WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}