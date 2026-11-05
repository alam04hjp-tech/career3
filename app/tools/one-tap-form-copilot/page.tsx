'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface AcademicRow {
  level: string;
  boardOrUniv: string;
  passingYear: string;
  rollNumber: string;
  rollCode: string;
  totalMarks: string;
  obtainedMarks: string;
  percentageOrCgpa: string;
}

interface StudentProfile {
  aadhaarNo: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Transgender';
  category: 'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
  highestQualification: string;
  mobile: string;
  email: string;
  domicileState: string;
  domicileDistrict: string;
  addressLine1: string;
  pincode: string;
  casteCertNumber: string;
  domicileCertNumber: string;
  identificationMark: string;
  academics: AcademicRow[];
}

const DEFAULT_PROFILE: StudentProfile = {
  aadhaarNo: '',
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '2003-07-18',
  gender: 'Male',
  category: 'OBC-NCL',
  highestQualification: 'Graduation (Degree)',
  mobile: '',
  email: '',
  domicileState: 'Bihar',
  domicileDistrict: 'Patna',
  addressLine1: '',
  pincode: '',
  casteCertNumber: '',
  domicileCertNumber: '',
  identificationMark: 'Mole on right cheek',
  academics: [
    {
      level: '10th (Matriculation)',
      boardOrUniv: 'Bihar School Examination Board (BSEB)',
      passingYear: '2018',
      rollNumber: '',
      rollCode: '',
      totalMarks: '500',
      obtainedMarks: '395',
      percentageOrCgpa: '79.00',
    },
    {
      level: '12th (Intermediate)',
      boardOrUniv: 'Bihar School Examination Board (BSEB)',
      passingYear: '2020',
      rollNumber: '',
      rollCode: '',
      totalMarks: '500',
      obtainedMarks: '380',
      percentageOrCgpa: '76.00',
    },
    {
      level: 'Graduation',
      boardOrUniv: 'Patna University',
      passingYear: '2023',
      rollNumber: '',
      rollCode: '',
      totalMarks: '1500',
      obtainedMarks: '1110',
      percentageOrCgpa: '74.00',
    },
  ],
};

function cleanSscName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/^(SHRI|SMT|MR\.?|MRS\.?|MS\.?|DR\.?|PROF\.?|LATE|ER\.?|KUMARI|MD\.?)\s+/i, '')
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function OneTapFormCopilotPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'mobile-pip' | 'vault-editor' | 'otr-print'>('mobile-pip');
  const [pipSlideIndex, setPipSlideIndex] = useState<number>(0);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const [autoCyclePip, setAutoCyclePip] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string>('');

  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load saved profile
  useEffect(() => {
    const saved = localStorage.getItem('careersathi_student_otr_vault_v2');
    if (saved) {
      try {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Attach event listener for PiP leave safely
  useEffect(() => {
    const videoEl = pipVideoRef.current;
    if (!videoEl) return;

    const handleLeavePiP = () => setIsPipActive(false);
    videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);
    return () => {
      videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  const saveProfile = (nextProfile: StudentProfile = profile) => {
    setProfile(nextProfile);
    localStorage.setItem('careersathi_student_otr_vault_v2', JSON.stringify(nextProfile));
    setSaveToast('✅ Details Saved successfully!');
    setTimeout(() => setSaveToast(''), 3000);
  };

  const loadSampleData = () => {
    const sample: StudentProfile = {
      aadhaarNo: '5262 6262 7262',
      fullName: 'WASIM AKARAM',
      fatherName: 'MD SALIMUDDIN',
      motherName: 'SHABANA KHATOON',
      dob: '2002-07-18',
      gender: 'Male',
      category: 'OBC-NCL',
      highestQualification: 'Graduation (Degree)',
      mobile: '9876543210',
      email: 'wasim.akaram@gmail.com',
      domicileState: 'Bihar',
      domicileDistrict: 'Vaishali (Hajipur)',
      addressLine1: 'Ward No 08, Near Station Road, Hajipur',
      pincode: '844101',
      casteCertNumber: 'BCCCO/2026/884120',
      domicileCertNumber: 'BRCCO/2026/552190',
      identificationMark: 'A black mole on right palm',
      academics: [
        {
          level: '10th (Matriculation)',
          boardOrUniv: 'Bihar School Examination Board (BSEB)',
          passingYear: '2018',
          rollNumber: '1800452',
          rollCode: '71024',
          totalMarks: '500',
          obtainedMarks: '412',
          percentageOrCgpa: '82.40',
        },
        {
          level: '12th (Intermediate)',
          boardOrUniv: 'Bihar School Examination Board (BSEB)',
          passingYear: '2020',
          rollNumber: '2001189',
          rollCode: '71024',
          totalMarks: '500',
          obtainedMarks: '396',
          percentageOrCgpa: '79.20',
        },
        {
          level: 'Graduation',
          boardOrUniv: 'BRABU Muzaffarpur',
          passingYear: '2023',
          rollNumber: '203044112',
          rollCode: '',
          totalMarks: '1500',
          obtainedMarks: '1125',
          percentageOrCgpa: '75.00',
        },
      ],
    };
    saveProfile(sample);
  };

  const sscFormatted = useMemo(() => {
    const cleanCandidate = cleanSscName(profile.fullName) || 'YOUR NAME';
    const cleanFather = cleanSscName(profile.fatherName) || 'FATHER NAME';
    const cleanMother = cleanSscName(profile.motherName) || 'MOTHER NAME';

    let dobDash = 'DD-MM-YYYY';
    if (profile.dob && profile.dob.includes('-')) {
      const [y, m, d] = profile.dob.split('-');
      dobDash = `${d}-${m}-${y}`;
    }

    const matric = profile.academics[0] || DEFAULT_PROFILE.academics[0];
    const sscMatricRoll = matric.rollCode.trim()
      ? `${matric.rollCode.trim()}-${matric.rollNumber.trim()}`
      : matric.rollNumber.trim() || 'ROLL NO';

    return {
      cleanCandidate,
      cleanFather,
      cleanMother,
      dobDash,
      sscMatricRoll,
      matricBoard: matric.boardOrUniv,
      matricYear: matric.passingYear,
      matricPct: `${matric.percentageOrCgpa}% (${matric.obtainedMarks}/${matric.totalMarks})`,
    };
  }, [profile]);

  const pipSlides = useMemo(
    () => [
      {
        badge: 'STEP 1 OF 4 • SSC OTR POINT 1 TO 5',
        title: 'NAME, AADHAAR & DOB',
        rows: [
          { label: '1. Aadhaar No', value: profile.aadhaarNo || 'Not Set', color: '#38bdf8' },
          { label: '2. Candidate Name (10th)', value: sscFormatted.cleanCandidate, color: '#4ade80' },
          { label: '4. Gender', value: profile.gender.toUpperCase(), color: '#facc15' },
          { label: '5. DOB (DD-MM-YYYY)', value: sscFormatted.dobDash, color: '#fb7185' },
        ],
        footer: 'Tip: Name bina Mr/Shri ke double verify karein',
      },
      {
        badge: 'STEP 2 OF 4 • SSC OTR POINT 6 TO 7',
        title: 'PARENTS NAME (NO MR/SMT)',
        rows: [
          { label: "6. Father's Name", value: sscFormatted.cleanFather, color: '#4ade80' },
          { label: "6a. Verify Father's Name", value: sscFormatted.cleanFather, color: '#a7f3d0' },
          { label: "7. Mother's Name", value: sscFormatted.cleanMother, color: '#facc15' },
          { label: 'Category', value: profile.category, color: '#38bdf8' },
        ],
        footer: 'Tip: Spelling 10th marksheet se match karein',
      },
      {
        badge: 'STEP 3 OF 4 • SSC OTR POINT 8 TO 11',
        title: '10th ROLL CODE & ROLL NO',
        rows: [
          { label: '8. 10th Board', value: sscFormatted.matricBoard.slice(0, 28), color: '#38bdf8' },
          { label: '9. SSC Roll (Code-Roll)', value: sscFormatted.sscMatricRoll, color: '#4ade80' },
          { label: '10. Passing Year & %', value: `${sscFormatted.matricYear}  •  ${sscFormatted.matricPct}`, color: '#facc15' },
          { label: '11. Highest Qualification', value: profile.highestQualification, color: '#f472b6' },
        ],
        footer: 'SSC Rule 9: Roll Code - Roll No ek sath likhein!',
      },
      {
        badge: 'STEP 4 OF 4 • SSC OTR POINT 12 TO 13+',
        title: 'MOBILE, EMAIL & CERTIFICATES',
        rows: [
          { label: '12. Mobile Number', value: profile.mobile || 'Not Set', color: '#4ade80' },
          { label: '13. Email ID', value: profile.email || 'Not Set', color: '#38bdf8' },
          { label: 'Caste / EWS Cert No', value: profile.casteCertNumber || 'N/A', color: '#facc15' },
          { label: 'PIN Code & Mark', value: `${profile.pincode} • ${profile.identificationMark.slice(0, 18)}`, color: '#fb7185' },
        ],
        footer: 'Mobile/Email OTP verify karke Save & Next dabayein',
      },
    ],
    [profile, sscFormatted]
  );

  const renderSlideOnCanvas = useCallback(
    (slideIdx: number) => {
      const canvas = pipCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 720;
      const H = 480;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const slide = pipSlides[slideIdx] || pipSlides[0];

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, W, 68);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText(`⚡ CAREERSATHI FLOATING CO-PILOT`, 22, 30);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(slide.badge, 22, 54);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.fillText(`CARD ${slideIdx + 1}/4`, W - 115, 42);

      let y = 92;
      for (const row of slide.rows) {
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(18, y, W - 36, 76, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(row.label.toUpperCase(), 34, y + 24);

        ctx.fillStyle = row.color;
        ctx.font = '900 26px monospace, system-ui, sans-serif';
        ctx.fillText(row.value || '—', 34, y + 58);

        y += 86;
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, H - 38, W, 38);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`💡 ${slide.footer}`, 22, H - 14);
    },
    [pipSlides]
  );

  useEffect(() => {
    renderSlideOnCanvas(pipSlideIndex);
  }, [pipSlideIndex, renderSlideOnCanvas]);

  useEffect(() => {
    if (!autoCyclePip) return;
    const timer = setInterval(() => {
      setPipSlideIndex((prev) => (prev + 1) % pipSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoCyclePip, pipSlides.length]);

  const handleLaunchFloatingPip = async () => {
    try {
      const canvas = pipCanvasRef.current;
      const video = pipVideoRef.current;
      if (!canvas || !video) return;

      renderSlideOnCanvas(pipSlideIndex);

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        return;
      }

      const stream = (canvas as any).captureStream
        ? (canvas as any).captureStream(15)
        : (canvas as any).mozCaptureStream(15);

      video.srcObject = stream;
      await video.play();

      if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
        setIsPipActive(true);
      } else if ((video as any).webkitSetPresentationMode) {
        (video as any).webkitSetPresentationMode('picture-in-picture');
        setIsPipActive(true);
      } else {
        alert('Aapke browser mein Floating PiP supported nahi hai.');
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const toggleVoiceDictation = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Voice Reader उपलब्ध नहीं है।');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const spellOut = (str: string) => str.split('').join(' . ');

    const scriptToRead = [
      `CareerSathi Form Assistant shuru ho raha hai.`,
      `Candidate Name: ${sscFormatted.cleanCandidate}. Spelling: ${spellOut(sscFormatted.cleanCandidate)}.`,
      `Date of Birth: ${sscFormatted.dobDash}.`,
      `Father Name: ${sscFormatted.cleanFather}.`,
      `Matric Roll Number: ${spellOut(sscFormatted.sscMatricRoll)}.`,
    ].join(' ... ');

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(scriptToRead);
    utter.lang = 'en-IN';
    utter.rate = 0.78;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const copyText = (txt: string, key: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const preloadGboardClipboard = async () => {
    const items = [
      sscFormatted.cleanCandidate,
      sscFormatted.dobDash,
      sscFormatted.cleanFather,
      sscFormatted.cleanMother,
      sscFormatted.sscMatricRoll,
      profile.mobile,
      profile.email,
      profile.aadhaarNo,
    ].filter(Boolean);

    for (const item of items) {
      await navigator.clipboard.writeText(item);
      await new Promise((r) => setTimeout(r, 120));
    }
    setCopiedKey('gboard-all');
    setTimeout(() => setCopiedKey(''), 3000);
  };

  const sendToWhatsAppSelf = () => {
    const msg = [
      `⚡ *SSC OTR QUICK REFERENCE CARD*`,
      `Name: ${sscFormatted.cleanCandidate}`,
      `DOB: ${sscFormatted.dobDash}`,
      `Father: ${sscFormatted.cleanFather}`,
      `Mother: ${sscFormatted.cleanMother}`,
      `10th Roll: ${sscFormatted.sscMatricRoll}`,
      `Mobile: ${profile.mobile}`,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <video
        ref={pipVideoRef}
        muted
        playsInline
        className="w-1 h-1 opacity-0 pointer-events-none fixed -bottom-10"
      />

      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-blue-400"
            >
              ← Home
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                📱 Mobile Exam Form Floating Co-Pilot
              </h1>
              <p className="text-[11px] text-slate-400">
                Stays on top of SSC OTR, IBPS &amp; Railway websites on your mobile!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSampleData}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl"
          >
            ✨ Load Demo Student Data
          </button>
        </div>

        {saveToast && (
          <div className="p-3 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl text-center shadow-lg">
            {saveToast}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('mobile-pip')}
            className={`p-3 rounded-2xl border font-black text-left transition ${
              activeTab === 'mobile-pip'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div>1. 📱 Floating Screen Co-Pilot</div>
            <div className="text-[10px] opacity-80 font-normal">Stays on top of SSC Form</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault-editor')}
            className={`p-3 rounded-2xl border font-black text-left transition ${
              activeTab === 'vault-editor'
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div>2. ✏️ Fill / Edit Your Details</div>
            <div className="text-[10px] opacity-80 font-normal">Save Name &amp; Roll No</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('otr-print')}
            className={`p-3 rounded-2xl border font-black text-left transition ${
              activeTab === 'otr-print'
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div>3. 📋 Letter-by-Letter &amp; Print</div>
            <div className="text-[10px] opacity-80 font-normal">Zero-Typo Spelling</div>
          </button>
        </div>

        {activeTab === 'mobile-pip' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black uppercase">
                    Step-by-Step Floating Overlay
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    📱 Live Floating Mini-Window (PiP Mode)
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setPipSlideIndex((p) => (p - 1 + pipSlides.length) % pipSlides.length)
                    }
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg font-black"
                  >
                    ◀ Prev
                  </button>
                  <span className="px-2 font-black text-amber-400">Card {pipSlideIndex + 1}/4</span>
                  <button
                    type="button"
                    onClick={() => setPipSlideIndex((p) => (p + 1) % pipSlides.length)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg font-black"
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                <canvas ref={pipCanvasRef} className="w-full h-auto block" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={autoCyclePip}
                    onChange={(e) => setAutoCyclePip(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span>🔄 Auto-rotate cards every 6 sec</span>
                </label>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleLaunchFloatingPip}
                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition"
                  >
                    {isPipActive ? '❌ Close Floating Window' : '📱 Pop-Out Floating Card on Screen'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-amber-400 uppercase">
                  🚀 Mobile Par SSC OTR Kaise Bharein?
                </h3>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-black text-emerald-400 text-xs">1️⃣ Floating Mini-Window</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Upar green button dabayein, phir SSC portal kholein—floating card form ke upar dikhta rahega.
                  </p>
                  <a
                    href="https://ssc.gov.in/candidate-portal/one-time-registration/personal-details"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3.5 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 font-black rounded-xl text-[11px]"
                  >
                    🔗 Open SSC OTR Portal in New Tab ↗
                  </a>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-black text-cyan-400 text-xs">2️⃣ Voice Dictation</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Assistant dheere-dheere spelling aur roll number bolega.
                  </p>
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    className={`w-full py-2.5 rounded-xl font-black transition ${
                      isSpeaking
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                    }`}
                  >
                    {isSpeaking ? '⏹ Stop Voice' : '🔊 Start Slow Voice Dictation'}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="font-black text-purple-400 text-xs">3️⃣ Keyboard &amp; WhatsApp</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={preloadGboardClipboard}
                      className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl"
                    >
                      {copiedKey === 'gboard-all' ? '✓ Loaded!' : '⌨️ Load in Keyboard'}
                    </button>
                    <button
                      type="button"
                      onClick={sendToWhatsAppSelf}
                      className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl"
                    >
                      💬 Send to WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault-editor' && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-amber-400 uppercase">
                  🪪 Enter Your 10th Marksheet &amp; OTR Details Once
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  saveProfile(profile);
                  setActiveTab('mobile-pip');
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg"
              >
                💾 Save &amp; Go to Floating Card →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  value={profile.aadhaarNo}
                  onChange={(e) => setProfile({ ...profile, aadhaarNo: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Candidate Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-black uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Father&apos;s Name</label>
                <input
                  type="text"
                  value={profile.fatherName}
                  onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={profile.motherName}
                  onChange={(e) => setProfile({ ...profile, motherName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">10th Roll Code</label>
                <input
                  type="text"
                  value={profile.academics[0]?.rollCode || ''}
                  onChange={(e) => {
                    const nextAc = [...profile.academics];
                    nextAc[0] = { ...nextAc[0], rollCode: e.target.value };
                    setProfile({ ...profile, academics: nextAc });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-1">10th Roll Number</label>
                <input
                  type="text"
                  value={profile.academics[0]?.rollNumber || ''}
                  onChange={(e) => {
                    const nextAc = [...profile.academics];
                    nextAc[0] = { ...nextAc[0], rollNumber: e.target.value };
                    setProfile({ ...profile, academics: nextAc });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'otr-print' && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-amber-400 uppercase">
                  🔤 Zero-Mistake Character Verification Sheet
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white font-black rounded-xl"
              >
                🖨️ Print
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Candidate Name', val: sscFormatted.cleanCandidate, key: 'c1' },
                { label: 'Date of Birth', val: sscFormatted.dobDash, key: 'c2' },
                { label: "Father's Name", val: sscFormatted.cleanFather, key: 'c3' },
                { label: '10th Roll Number', val: sscFormatted.sscMatricRoll, key: 'c5' },
              ].map((item) => (
                <div key={item.key} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => copyText(item.val, item.key)}
                      className={`px-3 py-1 rounded-lg font-black ${
                        copiedKey === item.key ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {copiedKey === item.key ? '✓ Copied' : '1-Tap Copy'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(item.val || '—').split('').map((ch, idx) => (
                      <span
                        key={idx}
                        className="w-7 h-8 flex items-center justify-center rounded font-mono font-black text-sm border bg-slate-900 border-slate-700 text-emerald-300"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}