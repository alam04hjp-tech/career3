'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface AcademicRow {
  level: string;
  boardOrUniv: string;
  passingYear: string;
  rollNumber: string;
  rollCode: string;
  percentageOrCgpa: string;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
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
  customFields: CustomField[];
}

const DEFAULT_PROFILE: StudentProfile = {
  idNumber: '',
  idType: 'Photo ID / PAN Card',
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
  customFields: [
    { id: '1', label: 'CASTE CERTIFICATE NO', value: 'CC/2026/8921' },
    { id: '2', label: 'PAN CARD NUMBER', value: 'ABCDE1234F' },
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
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('Ready! Click Mic or Touch Buttons below...');
  const [highlightField, setHighlightField] = useState<string>('ALL');

  // Custom Field states
  const [newLabel, setNewLabel] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  // AI Scanner states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>('');

  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('careersathi_student_voice_vault_v4');
    if (saved) {
      try {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
    const savedKey = localStorage.getItem('careersathi_gemini_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const saveProfile = (nextProfile: StudentProfile = profile) => {
    setProfile(nextProfile);
    localStorage.setItem('careersathi_student_voice_vault_v4', JSON.stringify(nextProfile));
    alert('✅ Profile & Custom Fields Saved in Browser Storage!');
  };

  // AI Document Upload & Extraction Handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanStatus('⏳ AI Document padh raha hai (Extracting Name, DOB, Roll No)...');

    try {
      if (userApiKey.trim()) {
        localStorage.setItem('careersathi_gemini_key', userApiKey.trim());
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch('/api/extract-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type,
            customApiKey: userApiKey.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.extracted) {
          setScanStatus(`❌ Error: ${data.error || 'Could not extract data'}`);
          setIsScanning(false);
          return;
        }

        const ext = data.extracted;
        const updatedAcademics = [...profile.academics];
        updatedAcademics[0] = {
          ...updatedAcademics[0],
          rollNumber: ext.rollNumber || updatedAcademics[0].rollNumber,
          rollCode: ext.rollCode || updatedAcademics[0].rollCode,
          passingYear: ext.passingYear || updatedAcademics[0].passingYear,
          boardOrUniv: ext.boardOrUniv || updatedAcademics[0].boardOrUniv,
          percentageOrCgpa: ext.percentageOrCgpa || updatedAcademics[0].percentageOrCgpa,
        };

        const updatedProfile: StudentProfile = {
          ...profile,
          fullName: cleanSscName(ext.fullName || profile.fullName),
          fatherName: cleanSscName(ext.fatherName || profile.fatherName),
          motherName: cleanSscName(ext.motherName || profile.motherName),
          dob: ext.dob || profile.dob,
          academics: updatedAcademics,
        };

        setProfile(updatedProfile);
        localStorage.setItem('careersathi_student_voice_vault_v4', JSON.stringify(updatedProfile));
        setScanStatus('✅ AI ne Marksheet se saara data Vault mein auto-fill kar diya!');
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanStatus(`❌ Failed: ${err.message}`);
      setIsScanning(false);
    }
  };

  // Copy Profile JSON for Chrome Extension
  const copyExtensionPayload = () => {
    const payload = JSON.stringify(profile);
    navigator.clipboard.writeText(payload);
    alert('🧩 Profile Data Copied! Ab Chrome Extension khol kar "Paste & Auto-Fill" dabayein.');
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const item: CustomField = {
      id: Date.now().toString(),
      label: newLabel.trim().toUpperCase(),
      value: newValue.trim(),
    };
    const updated = {
      ...profile,
      customFields: [...profile.customFields, item],
    };
    setProfile(updated);
    localStorage.setItem('careersathi_student_voice_vault_v4', JSON.stringify(updated));
    setNewLabel('');
    setNewValue('');
  };

  const handleDeleteCustomField = (id: string) => {
    const updated = {
      ...profile,
      customFields: profile.customFields.filter((f) => f.id !== id),
    };
    setProfile(updated);
    localStorage.setItem('careersathi_student_voice_vault_v4', JSON.stringify(updated));
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

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, W, 70);
      ctx.fillStyle = isVoiceListening ? '#10b981' : '#f59e0b';
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('🎙️ CAREERSATHI AI VOICE & TOUCH CO-PILOT', 20, 30);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`HEARD: "${lastVoiceCommand}"`, 20, 54);

      if (targetField === 'NAME') {
        drawBigCard(ctx, 'CANDIDATE NAME (10TH)', formattedData.cleanCandidate, '#4ade80', 'Verify spelling without Mr/Shri');
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
      } else if (targetField === 'ID') {
        drawBigCard(ctx, profile.idType.toUpperCase(), profile.idNumber || 'NOT SET', '#38bdf8', 'Verify Photo ID Number');
      } else if (targetField === 'MOBILE') {
        drawBigCard(ctx, 'MOBILE NUMBER', profile.mobile || 'NOT SET', '#4ade80', `Email: ${profile.email}`);
      } else {
        const matchedCustom = profile.customFields.find((cf) => cf.id === targetField);
        if (matchedCustom) {
          drawBigCard(ctx, matchedCustom.label, matchedCustom.value || 'NOT SET', '#06b6d4', 'Custom Vault Field');
        } else {
          drawDefaultRows(ctx, W);
        }
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
    ctx.font = '900 38px monospace, system-ui, sans-serif';
    ctx.fillText(value, 50, 240);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px system-ui, sans-serif';
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

  const startVoiceListener = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition not supported in this browser. Use Chrome.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsVoiceListening(true);
      setLastVoiceCommand('Listening... Say Name, Father, DOB, Roll, Bank');
    };

    rec.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1];
      const transcript = latest[0].transcript.toLowerCase().trim();
      setLastVoiceCommand(transcript);

      if (transcript.includes('name') || transcript.includes('naam') || transcript.includes('candidate')) {
        setHighlightField('NAME');
      } else if (transcript.includes('father') || transcript.includes('papa') || transcript.includes('pita')) {
        setHighlightField('FATHER');
      } else if (transcript.includes('mother') || transcript.includes('mummy')) {
        setHighlightField('MOTHER');
      } else if (transcript.includes('dob') || transcript.includes('birth') || transcript.includes('date')) {
        setHighlightField('DOB');
      } else if (transcript.includes('roll') || transcript.includes('10th') || transcript.includes('matric')) {
        setHighlightField('ROLL');
      } else if (transcript.includes('bank') || transcript.includes('account')) {
        setHighlightField('BANK');
      } else if (transcript.includes('id') || transcript.includes('card') || transcript.includes('pan')) {
        setHighlightField('ID');
      } else if (transcript.includes('mobile') || transcript.includes('phone')) {
        setHighlightField('MOBILE');
      } else {
        const foundCustom = profile.customFields.find((cf) => transcript.includes(cf.label.toLowerCase()));
        if (foundCustom) {
          setHighlightField(foundCustom.id);
        } else if (transcript.includes('all') || transcript.includes('home')) {
          setHighlightField('ALL');
        }
      }
    };

    rec.onerror = () => {};
    rec.onend = () => {
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

      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : (canvas as any).mozCaptureStream(15);
      video.srcObject = stream;
      await video.play();

      if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
        setIsPipActive(true);
        startVoiceListener();
      } else {
        alert('Picture-in-Picture not supported.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <video ref={pipVideoRef} muted playsInline className="w-1 h-1 opacity-0 pointer-events-none fixed -bottom-10" />

      {/* Hidden container so Chrome Extension can also read profile directly from DOM */}
      <div id="careersathi-vault-json" className="hidden" data-vault={JSON.stringify(profile)} />

      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              🤖 CareerSathi AI Form Co-Pilot &amp; Extension Hub
            </h1>
            <p className="text-[11px] text-slate-400">
              Upload Marksheet ➔ AI Auto-Builds Vault ➔ Fill Forms via Chrome Extension or Floating PiP!
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyExtensionPayload}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow"
            >
              🧩 Copy Vault for Chrome Extension
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'mobile-pip' ? 'vault-editor' : 'mobile-pip')}
              className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
            >
              {activeTab === 'mobile-pip' ? '✏️ Edit Profile & Custom Fields' : '📱 Open Co-Pilot'}
            </button>
          </div>
        </div>

        {/* AI DOCUMENT SCANNER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-4 sm:p-5 rounded-3xl border border-indigo-500/40 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] bg-indigo-500 text-white px-2.5 py-0.5 rounded-full font-black uppercase">
                ✨ Step 1: AI Marksheet &amp; ID Scanner
              </span>
              <h2 className="text-sm font-black text-white mt-1">
                Apni 10th Marksheet ya ID Upload karein — AI khud Profile bana dega!
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="Optional: Gemini API Key"
                className="p-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] text-white w-44"
              />
              <label className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow inline-flex items-center gap-2">
                <span>{isScanning ? '⏳ Scanning...' : '📄 Upload Marksheet Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocumentUpload}
                  disabled={isScanning}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {scanStatus && (
            <div className="p-2.5 bg-slate-950/90 border border-indigo-500/30 rounded-xl text-indigo-300 font-bold">
              {scanStatus}
            </div>
          )}
        </div>

        {activeTab === 'mobile-pip' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-black uppercase">
                  Live Preview Canvas
                </span>
                <span className={`text-[11px] font-bold ${isVoiceListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                  {isVoiceListening ? '🎙️ Mic Listening...' : '🔇 Mic Off'}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                <canvas ref={pipCanvasRef} className="w-full h-auto block" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleLaunchFloatingPip}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl text-sm"
                >
                  {isPipActive ? '❌ Close Floating Screen' : '📱 Launch Floating Screen & Mic'}
                </button>
                <button
                  type="button"
                  onClick={() => (isVoiceListening ? stopVoiceListener() : startVoiceListener())}
                  className={`py-3.5 px-5 rounded-2xl font-black text-xs ${
                    isVoiceListening ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {isVoiceListening ? 'Stop Mic' : '🎙️ Start Mic'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-amber-400 uppercase">
                  👆 Instant Touch Buttons (1-Tap Zoom):
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '👤 Name', key: 'NAME', bg: 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' },
                    { label: "👨‍👦 Father's Name", key: 'FATHER', bg: 'bg-blue-600/20 border-blue-500/50 text-blue-300' },
                    { label: "👩‍👦 Mother's Name", key: 'MOTHER', bg: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300' },
                    { label: '📅 Date of Birth', key: 'DOB', bg: 'bg-rose-600/20 border-rose-500/50 text-rose-300' },
                    { label: '🎓 10th Roll No', key: 'ROLL', bg: 'bg-amber-600/20 border-amber-500/50 text-amber-300' },
                    { label: '💳 Photo ID / PAN', key: 'ID', bg: 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300' },
                    { label: '🏦 Bank A/C & IFSC', key: 'BANK', bg: 'bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-300' },
                    { label: '📱 Mobile Number', key: 'MOBILE', bg: 'bg-teal-600/20 border-teal-500/50 text-teal-300' },
                    { label: '🔄 Show All Overview', key: 'ALL', bg: 'bg-slate-800 border-slate-700 text-white col-span-2' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setHighlightField(btn.key)}
                      className={`p-3 rounded-xl border font-black text-center transition hover:scale-105 ${btn.bg}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {profile.customFields.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-cyan-400 block uppercase">➕ Your Custom Vault Fields:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {profile.customFields.map((cf) => (
                        <button
                          key={cf.id}
                          type="button"
                          onClick={() => setHighlightField(cf.id)}
                          className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-200 rounded-xl font-bold truncate transition"
                        >
                          📌 {cf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault-editor' && (
          <div className="space-y-6 text-xs">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-black text-amber-400 uppercase border-b border-slate-800 pb-2">
                ✏️ Profile Details Editor
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Full Name (As per 10th)</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={profile.fatherName}
                    onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={profile.motherName}
                    onChange={(e) => setProfile({ ...profile, motherName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
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
                  <label className="block text-amber-400 mb-1 font-bold">10th Roll Number</label>
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
                  <label className="block text-amber-400 mb-1 font-bold">10th Roll Code (Optional)</label>
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
                  <label className="block text-emerald-400 mb-1 font-bold">10th Passing Year</label>
                  <input
                    type="text"
                    value={profile.academics[0]?.passingYear || ''}
                    onChange={(e) => {
                      const up = [...profile.academics];
                      up[0].passingYear = e.target.value;
                      setProfile({ ...profile, academics: up });
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-fuchsia-400 mb-1 font-bold">Bank Account Number</label>
                  <input
                    type="text"
                    value={profile.bankAccountNo}
                    onChange={(e) => setProfile({ ...profile, bankAccountNo: e.target.value })}
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

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Email ID</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PIN Code</label>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-black text-cyan-400 uppercase border-b border-slate-800 pb-2">
                ➕ Custom Fields Manager (Add Any Extra Form Field)
              </h2>

              <div className="space-y-2">
                {profile.customFields.map((cf) => (
                  <div key={cf.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="w-1/3 text-slate-400 font-bold uppercase truncate">{cf.label}</span>
                    <input
                      type="text"
                      value={cf.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile({
                          ...profile,
                          customFields: profile.customFields.map((f) => (f.id === cf.id ? { ...f, value: val } : f)),
                        });
                      }}
                      className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(cf.id)}
                      className="px-3 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCustomField} className="p-4 bg-slate-950 rounded-2xl border border-dashed border-slate-700 space-y-3">
                <div className="font-bold text-slate-300">Add New Custom Field:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Field Name (e.g. DRIVING LICENSE NO)"
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase font-bold"
                  />
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Field Value (e.g. DL-142026...)"
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl">
                  + Add Custom Field to Vault
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  saveProfile(profile);
                  setActiveTab('mobile-pip');
                }}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black rounded-2xl shadow-xl text-sm"
              >
                💾 Save Vault &amp; Launch Co-Pilot →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}