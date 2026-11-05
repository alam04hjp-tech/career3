'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface AcademicRow {
  level: string;
  boardOrUniv: string;
  passingYear: string;
  rollNumber: string;
  rollCode: string;
  percentageOrCgpa: string;
}

interface StudentProfile {
  idNumber: string;
  idType: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  mobile: string;
  email: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  pincode: string;
  addressLine1: string;
  identificationMark: string;
  academics: AcademicRow[];
}

const DEFAULT_PROFILE: StudentProfile = {
  idNumber: '',
  idType: 'Aadhaar / Photo ID',
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '2003-07-18',
  gender: 'Male',
  category: 'OBC-NCL',
  mobile: '',
  email: '',
  bankAccountNo: '',
  bankIfsc: '',
  bankName: 'State Bank of India',
  pincode: '',
  addressLine1: '',
  identificationMark: 'Mole on right cheek',
  academics: [
    {
      level: '10th (Matriculation)',
      boardOrUniv: 'BSEB Patna / State Board',
      passingYear: '2018',
      rollNumber: '',
      rollCode: '',
      percentageOrCgpa: '79.20',
    },
    {
      level: '12th (Intermediate)',
      boardOrUniv: 'BSEB Patna / State Board',
      passingYear: '2020',
      rollNumber: '',
      rollCode: '',
      percentageOrCgpa: '76.00',
    },
    {
      level: 'Graduation',
      boardOrUniv: 'Patna University',
      passingYear: '2023',
      rollNumber: '',
      rollCode: '',
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
  const [activeTab, setActiveTab] = useState<'mobile-pip' | 'vault-editor'>('mobile-pip');
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('Ready! Say "Name", "Father", "Roll", "Bank"...');
  const [highlightField, setHighlightField] = useState<string>('ALL');

  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load Saved Profile
  useEffect(() => {
    const saved = localStorage.getItem('careersathi_student_voice_vault_v3');
    if (saved) {
      try {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveProfile = (nextProfile: StudentProfile = profile) => {
    setProfile(nextProfile);
    localStorage.setItem('careersathi_student_voice_vault_v3', JSON.stringify(nextProfile));
    alert('✅ Profile Saved in Browser Storage!');
  };

  const loadSampleData = () => {
    const sample: StudentProfile = {
      idNumber: 'XXXX-XXXX-7262',
      idType: 'Aadhaar / Photo ID',
      fullName: 'WASIM AKARAM',
      fatherName: 'MD SALIMUDDIN',
      motherName: 'SHABANA KHATOON',
      dob: '2002-07-18',
      gender: 'Male',
      category: 'OBC-NCL',
      mobile: '9876543210',
      email: 'wasim.akaram@gmail.com',
      bankAccountNo: '30987654321',
      bankIfsc: 'SBIN0001234',
      bankName: 'State Bank of India',
      pincode: '844101',
      addressLine1: 'Station Road, Hajipur',
      identificationMark: 'Black mole on right palm',
      academics: [
        {
          level: '10th (Matriculation)',
          boardOrUniv: 'BSEB Patna',
          passingYear: '2018',
          rollNumber: '1800452',
          rollCode: '71024',
          percentageOrCgpa: '82.40',
        },
        {
          level: '12th (Intermediate)',
          boardOrUniv: 'BSEB Patna',
          passingYear: '2020',
          rollNumber: '2001189',
          rollCode: '71024',
          percentageOrCgpa: '79.20',
        },
        {
          level: 'Graduation',
          boardOrUniv: 'BRABU Muzaffarpur',
          passingYear: '2023',
          rollNumber: '203044112',
          rollCode: '',
          percentageOrCgpa: '75.00',
        },
      ],
    };
    saveProfile(sample);
  };

  const formattedData = useMemo(() => {
    const cleanCandidate = cleanSscName(profile.fullName) || 'CANDIDATE NAME';
    const cleanFather = cleanSscName(profile.fatherName) || 'FATHER NAME';
    const cleanMother = cleanSscName(profile.motherName) || 'MOTHER NAME';

    let dobDash = 'DD-MM-YYYY';
    if (profile.dob && profile.dob.includes('-')) {
      const [y, m, d] = profile.dob.split('-');
      dobDash = `${d}-${m}-${y}`;
    }

    const matric = profile.academics[0] || DEFAULT_PROFILE.academics[0];
    const sscMatricRoll = matric.rollCode.trim()
      ? `${matric.rollCode.trim()} - ${matric.rollNumber.trim()}`
      : matric.rollNumber.trim() || 'ROLL NO';

    return {
      cleanCandidate,
      cleanFather,
      cleanMother,
      dobDash,
      sscMatricRoll,
      matricYear: matric.passingYear,
      matricBoard: matric.boardOrUniv,
      matricPct: `${matric.percentageOrCgpa}%`,
    };
  }, [profile]);

  // Render on Floating Canvas (Picture-in-Picture window)
  const renderCanvas = useCallback(
    (targetField: string) => {
      const canvas = pipCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 720;
      const H = 480;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      // Dark Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      // Top Status Bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, W, 70);
      ctx.fillStyle = isVoiceListening ? '#10b981' : '#f59e0b';
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('🎙️ CAREERSATHI VOICE-CONTROLLED CO-PILOT', 20, 30);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`HEARD: "${lastVoiceCommand}"`, 20, 54);

      // Single Focused View or Multi-card Overview
      if (targetField === 'NAME') {
        drawBigCard(ctx, 'CANDIDATE NAME (AS PER 10TH)', formattedData.cleanCandidate, '#4ade80', 'Verify spelling without Mr/Shri');
      } else if (targetField === 'FATHER') {
        drawBigCard(ctx, "FATHER'S NAME", formattedData.cleanFather, '#38bdf8', 'No Shri/Late prefix');
      } else if (targetField === 'MOTHER') {
        drawBigCard(ctx, "MOTHER'S NAME", formattedData.cleanMother, '#facc15', 'No Smt/Late prefix');
      } else if (targetField === 'DOB') {
        drawBigCard(ctx, 'DATE OF BIRTH (DD-MM-YYYY)', formattedData.dobDash, '#fb7185', 'SSC DD-MM-YYYY format');
      } else if (targetField === 'ROLL') {
        drawBigCard(ctx, '10TH ROLL (CODE - ROLL NO)', formattedData.sscMatricRoll, '#a7f3d0', `Passing Year: ${formattedData.matricYear}`);
      } else if (targetField === 'BANK') {
        drawBigCard(ctx, `BANK: ${profile.bankName.toUpperCase()}`, `A/C: ${profile.bankAccountNo || 'NOT SET'}`, '#facc15', `IFSC: ${profile.bankIfsc || 'NOT SET'}`);
      } else if (targetField === 'ID' || targetField === 'AADHAAR') {
        drawBigCard(ctx, profile.idType.toUpperCase(), profile.idNumber || 'NOT SET', '#38bdf8', 'Double-check 12 digits');
      } else if (targetField === 'MOBILE' || targetField === 'PHONE') {
        drawBigCard(ctx, 'MOBILE NUMBER', profile.mobile || 'NOT SET', '#4ade80', `Email: ${profile.email}`);
      } else {
        // Default Overview (4 key rows)
        drawDefaultRows(ctx, W);
      }
    },
    [formattedData, profile, lastVoiceCommand, isVoiceListening]
  );

  function drawBigCard(ctx: CanvasRenderingContext2D, title: string, value: string, color: string, sub: string) {
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(24, 100, 672, 300, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(title, 50, 160);

    ctx.fillStyle = color;
    ctx.font = '900 42px monospace, system-ui, sans-serif';
    ctx.fillText(value, 50, 240);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`💡 ${sub}`, 50, 330);
  }

  function drawDefaultRows(ctx: CanvasRenderingContext2D, W: number) {
    const rows = [
      { label: 'NAME', val: formattedData.cleanCandidate, color: '#4ade80' },
      { label: 'DOB', val: formattedData.dobDash, color: '#fb7185' },
      { label: 'FATHER', val: formattedData.cleanFather, color: '#38bdf8' },
      { label: '10th ROLL', val: formattedData.sscMatricRoll, color: '#facc15' },
    ];
    let y = 90;
    for (const r of rows) {
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(20, y, W - 40, 78, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(r.label, 36, y + 26);

      ctx.fillStyle = r.color;
      ctx.font = '900 24px monospace, system-ui, sans-serif';
      ctx.fillText(r.val, 36, y + 60);

      y += 88;
    }
  }

  useEffect(() => {
    renderCanvas(highlightField);
  }, [highlightField, renderCanvas]);

  // Speech Recognition Listener (Works continuously in background)
  const startVoiceListener = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Aapke browser mein Speech Recognition supported nahi hai. Chrome browser use karein.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'hi-IN'; // Recognizes Hindi + English words ("Name", "Aadhaar", "Roll Number")

    rec.onstart = () => {
      setIsVoiceListening(true);
      setLastVoiceCommand('Mic is ON! Say "Name", "Father", "Roll", "Bank"...');
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setLastVoiceCommand(transcript);

      // Smart Intent Detection
      if (transcript.includes('name') || transcript.includes('naam') || transcript.includes('candidate')) {
        setHighlightField('NAME');
      } else if (transcript.includes('father') || transcript.includes('papa') || transcript.includes('pita')) {
        setHighlightField('FATHER');
      } else if (transcript.includes('mother') || transcript.includes('mummy') || transcript.includes('mata')) {
        setHighlightField('MOTHER');
      } else if (transcript.includes('dob') || transcript.includes('birth') || transcript.includes('janam')) {
        setHighlightField('DOB');
      } else if (transcript.includes('roll') || transcript.includes('10th') || transcript.includes('matric')) {
        setHighlightField('ROLL');
      } else if (transcript.includes('bank') || transcript.includes('account') || transcript.includes('khata') || transcript.includes('ifsc')) {
        setHighlightField('BANK');
      } else if (transcript.includes('aadhar') || transcript.includes('aadhaar') || transcript.includes('id') || transcript.includes('pan')) {
        setHighlightField('ID');
      } else if (transcript.includes('mobile') || transcript.includes('phone') || transcript.includes('email')) {
        setHighlightField('MOBILE');
      } else if (transcript.includes('all') || transcript.includes('full') || transcript.includes('back')) {
        setHighlightField('ALL');
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Speech error:', e);
    };

    rec.onend = () => {
      // Auto-restart if user still wants it active
      if (isVoiceListening) {
        try {
          rec.start();
        } catch {}
      }
    };

    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoiceListener = () => {
    setIsVoiceListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Launch Picture-in-Picture Floating Mini-Window
  const handleLaunchFloatingPip = async () => {
    try {
      const canvas = pipCanvasRef.current;
      const video = pipVideoRef.current;
      if (!canvas || !video) return;

      renderCanvas(highlightField);

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        stopVoiceListener();
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
        startVoiceListener(); // Auto-start mic when floating card pops out!
      } else {
        alert('Picture-in-Picture is not supported on this browser.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <video ref={pipVideoRef} muted playsInline className="w-1 h-1 opacity-0 pointer-events-none fixed -bottom-10" />

      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              🎙️ Voice-Controlled Floating Form Co-Pilot
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                VOICE AI READY
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Form khol kar bas bolo: <strong>&quot;Name&quot;</strong>, <strong>&quot;Aadhaar&quot;</strong>, <strong>&quot;Roll Number&quot;</strong>, ya <strong>&quot;Bank Account&quot;</strong> — Floating Card turant wahi dikhayega!
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-3 py-1.5 bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl"
            >
              ✨ Load Sample Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'mobile-pip' ? 'vault-editor' : 'mobile-pip')}
              className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl"
            >
              {activeTab === 'mobile-pip' ? '✏️ Edit Profile' : '📱 Open Floating Card'}
            </button>
          </div>
        </div>

        {/* TAB 1: FLOATING VOICE VIEW */}
        {activeTab === 'mobile-pip' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Canvas Preview Box */}
            <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-black uppercase">
                  Live Voice Canvas (Pops Out on Screen)
                </span>
                <span className={`text-[11px] font-bold ${isVoiceListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                  {isVoiceListening ? '🎙️ Mic Active &amp; Listening' : '🔇 Mic Inactive'}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                <canvas ref={pipCanvasRef} className="w-full h-auto block" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleLaunchFloatingPip}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl text-sm"
                >
                  {isPipActive ? '❌ Close Floating Screen' : '📱 Launch Voice Floating Screen'}
                </button>
                <button
                  type="button"
                  onClick={() => (isVoiceListening ? stopVoiceListener() : startVoiceListener())}
                  className={`py-3.5 px-5 rounded-2xl font-black text-xs ${
                    isVoiceListening ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {isVoiceListening ? 'Turn Mic OFF' : '🎙️ Test Mic Here'}
                </button>
              </div>
            </div>

            {/* Quick Voice Command Cheat Sheet */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-amber-400 uppercase">
                  🗣️ Bolo Aur Screen Par Turant Dekho:
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Floating Card khol kar aap kisi bhi form par ja sakte hain. Bas mic par yeh bolna hai:
                </p>

                <div className="space-y-2">
                  {[
                    { cmd: 'Bolo: "Name" ya "Mera Naam"', desc: 'Candidate Name aur 10th spelling dikhegi', key: 'NAME' },
                    { cmd: 'Bolo: "Father" ya "Papa"', desc: "Father's name bina Shri/Late ke aayega", key: 'FATHER' },
                    { cmd: 'Bolo: "DOB" ya "Date of Birth"', desc: 'Exact DD-MM-YYYY format me aayega', key: 'DOB' },
                    { cmd: 'Bolo: "Roll Number" ya "10th"', desc: 'Roll Code - Roll No dikhayega', key: 'ROLL' },
                    { cmd: 'Bolo: "Aadhaar" ya "ID"', desc: 'Aadhaar / ID Card number aayega', key: 'ID' },
                    { cmd: 'Bolo: "Bank" ya "Khata"', desc: 'Account Number aur IFSC Code dikhayega', key: 'BANK' },
                    { cmd: 'Bolo: "All" ya "Wapas"', desc: 'Poora overview card wapas aa jayega', key: 'ALL' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setHighlightField(c.key)}
                      className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl transition flex justify-between items-center"
                    >
                      <div>
                        <div className="font-black text-emerald-300">{c.cmd}</div>
                        <div className="text-[10px] text-slate-400">{c.desc}</div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                        Try ↗
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE EDITOR (Include Bank Details) */}
        {activeTab === 'vault-editor' && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <h2 className="text-sm font-black text-amber-400 uppercase border-b border-slate-800 pb-2">
              ✏️ Profile Details (Jo Voice Se Dikhana Hai)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Father&apos;s Name</label>
                <input
                  type="text"
                  value={profile.fatherName}
                  onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1 font-bold">10th Roll Code</label>
                <input
                  type="text"
                  value={profile.academics[0]?.rollCode || ''}
                  onChange={(e) => {
                    const up = [...profile.academics];
                    up[0].rollCode = e.target.value;
                    setProfile({ ...profile, academics: up });
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1 font-bold">10th Roll Number</label>
                <input
                  type="text"
                  value={profile.academics[0]?.rollNumber || ''}
                  onChange={(e) => {
                    const up = [...profile.academics];
                    up[0].rollNumber = e.target.value;
                    setProfile({ ...profile, academics: up });
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 font-bold">Aadhaar / ID Card Number</label>
                <input
                  type="text"
                  value={profile.idNumber}
                  onChange={(e) => setProfile({ ...profile, idNumber: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-fuchsia-400 mb-1 font-bold">Bank Account Number</label>
                <input
                  type="text"
                  value={profile.bankAccountNo}
                  onChange={(e) => setProfile({ ...profile, bankAccountNo: e.target.value })}
                  placeholder="e.g. 30987654321"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-fuchsia-400 mb-1 font-bold">Bank IFSC Code</label>
                <input
                  type="text"
                  value={profile.bankIfsc}
                  onChange={(e) => setProfile({ ...profile, bankIfsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Mobile Number</label>
                <input
                  type="tel"
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  saveProfile(profile);
                  setActiveTab('mobile-pip');
                }}
                className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl"
              >
                💾 Save Details &amp; Return to Voice Card →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}