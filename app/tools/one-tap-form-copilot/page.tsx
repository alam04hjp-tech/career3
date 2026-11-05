'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface AcademicRow {
  level: string;
  boardOrUniv: string;
  passingYear: string;
  rollNumber: string;
  rollCode: string;
  certificateNo: string;
  gradingSystem: 'Percentage' | 'CGPA';
  totalMarks: string;
  obtainedMarks: string;
  percentageOrCgpa: string;
}

interface StudentProfile {
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  category: 'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
  mobile: string;
  email: string;
  domicileState: string;
  domicileDistrict: string;
  addressLine1: string;
  postOffice: string;
  policeStation: string;
  pincode: string;
  photoIdType: 'PAN Card' | 'Voter ID' | 'Driving License' | 'Passport' | 'College ID';
  photoIdNumber: string;
  casteCertNumber: string;
  domicileCertNumber: string;
  academics: AcademicRow[];
  photoDataUrl: string;
  signatureDataUrl: string;
}

const DEFAULT_PROFILE: StudentProfile = {
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '2003-05-15',
  gender: 'Male',
  category: 'OBC-NCL',
  mobile: '',
  email: '',
  domicileState: 'Bihar',
  domicileDistrict: 'Patna',
  addressLine1: '',
  postOffice: '',
  policeStation: '',
  pincode: '',
  photoIdType: 'PAN Card',
  photoIdNumber: '',
  casteCertNumber: '',
  domicileCertNumber: '',
  academics: [
    {
      level: '10th / Matriculation',
      boardOrUniv: 'BSEB Patna / CBSE',
      passingYear: '2019',
      rollNumber: '',
      rollCode: '',
      certificateNo: '',
      gradingSystem: 'Percentage',
      totalMarks: '500',
      obtainedMarks: '385',
      percentageOrCgpa: '77.00',
    },
    {
      level: '12th / Intermediate',
      boardOrUniv: 'BSEB Patna / CBSE',
      passingYear: '2021',
      rollNumber: '',
      rollCode: '',
      certificateNo: '',
      gradingSystem: 'Percentage',
      totalMarks: '500',
      obtainedMarks: '390',
      percentageOrCgpa: '78.00',
    },
    {
      level: 'Graduation / Degree',
      boardOrUniv: 'Patna University',
      passingYear: '2024',
      rollNumber: '',
      rollCode: '',
      certificateNo: '',
      gradingSystem: 'Percentage',
      totalMarks: '1500',
      obtainedMarks: '1080',
      percentageOrCgpa: '72.00',
    },
  ],
  photoDataUrl: '',
  signatureDataUrl: '',
};

type ActiveTab = 'vault-editor' | 'cheat-sheet' | 'otr-print';

export default function OneTapFormCopilotPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault-editor');
  const [saveBanner, setSaveBanner] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [ageCutoffDate, setAgeCutoffDate] = useState<string>('2026-08-01');

  useEffect(() => {
    const saved = localStorage.getItem('careersathi_student_otr_vault');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveProfileToVault = (updated: StudentProfile = profile) => {
    setProfile(updated);
    localStorage.setItem('careersathi_student_otr_vault', JSON.stringify(updated));
    setSaveBanner('✅ Profile saved securely!');
    setTimeout(() => setSaveBanner(''), 3000);
  };

  const handleLoadDemoProfile = () => {
    const demo: StudentProfile = {
      ...DEFAULT_PROFILE,
      fullName: 'RAHUL KUMAR SHARMA',
      fatherName: 'SURENDRA PRASAD SHARMA',
      motherName: 'SUNITA DEVI',
      dob: '2002-07-18',
      gender: 'Male',
      category: 'OBC-NCL',
      mobile: '9876543210',
      email: 'rahul.sharma.aspirant@gmail.com',
      domicileState: 'Bihar',
      domicileDistrict: 'Patna',
      addressLine1: 'House No 42, Boring Road',
      postOffice: 'GPO Patna',
      policeStation: 'Sri Krishnapuri',
      pincode: '800001',
      photoIdNumber: 'ABCDE1234F',
      casteCertNumber: 'BCCCO/2026/884120',
      domicileCertNumber: 'BRCCO/2026/552190',
      academics: [
        {
          level: '10th / Matriculation',
          boardOrUniv: 'BSEB Patna',
          passingYear: '2018',
          rollNumber: '1800452',
          rollCode: '71024',
          certificateNo: 'M-2018-99412',
          gradingSystem: 'Percentage',
          totalMarks: '500',
          obtainedMarks: '412',
          percentageOrCgpa: '82.40',
        },
        {
          level: '12th / Intermediate',
          boardOrUniv: 'BSEB Patna',
          passingYear: '2020',
          rollNumber: '2001189',
          rollCode: '71024',
          certificateNo: 'I-2020-44821',
          gradingSystem: 'Percentage',
          totalMarks: '500',
          obtainedMarks: '396',
          percentageOrCgpa: '79.20',
        },
        {
          level: 'Graduation / Degree',
          boardOrUniv: 'Patliputra University',
          passingYear: '2023',
          rollNumber: '203044112',
          rollCode: 'PPU-04',
          certificateNo: 'DEG-2023',
          gradingSystem: 'Percentage',
          totalMarks: '1500',
          obtainedMarks: '1125',
          percentageOrCgpa: '75.00',
        },
      ],
    };
    saveProfileToVault(demo);
  };

  const copyText = (text: string, labelKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(labelKey);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const splitNameParts = useMemo(() => {
    const parts = profile.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: '', middle: '', last: '' };
    if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
    if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
    return {
      first: parts[0],
      middle: parts.slice(1, -1).join(' '),
      last: parts[parts.length - 1],
    };
  }, [profile.fullName]);

  const formattedDob = useMemo(() => {
    if (!profile.dob) return { ddmmyyyySlash: '' };
    const [y, m, d] = profile.dob.split('-');
    return { ddmmyyyySlash: `${d}/${m}/${y}` };
  }, [profile.dob]);

  const exactAgeOnCutoff = useMemo(() => {
    if (!profile.dob || !ageCutoffDate) return 'N/A';
    const birth = new Date(profile.dob);
    const cutoff = new Date(ageCutoffDate);
    if (isNaN(birth.getTime()) || isNaN(cutoff.getTime())) return 'N/A';
    let years = cutoff.getFullYear() - birth.getFullYear();
    let months = cutoff.getMonth() - birth.getMonth();
    let days = cutoff.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(cutoff.getFullYear(), cutoff.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} Years, ${months} Months, ${days} Days`;
  }, [profile.dob, ageCutoffDate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-blue-400 transition"
            >
              ← CareerSathi Home
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                ⚡ Exam Form Co-Pilot &amp; Smart Cheat Sheet
              </h1>
              <p className="text-[11px] text-slate-400">
                Save your OTR details once &amp; use the Floating Cheat Sheet while filling SSC &amp; Banking forms!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoProfile}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl"
          >
            ✨ Load Sample Profile
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { id: 'vault-editor', title: '1. 🪪 OTR Profile Vault' },
            { id: 'cheat-sheet', title: '2. 📋 Floating Smart Cheat Sheet (For SSC)' },
            { id: 'otr-print', title: '3. 🖨️ Printable OTR Master Sheet' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`p-3.5 rounded-2xl border text-left font-black transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* TAB 1: VAULT EDITOR */}
        {activeTab === 'vault-editor' && (
          <div className="space-y-6 text-xs">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-sm font-black text-amber-400 uppercase">
                  👤 Candidate Personal Details (As Per 10th Marksheet)
                </h2>
                <button
                  type="button"
                  onClick={() => saveProfileToVault(profile)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  💾 Save Profile
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Candidate Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="e.g. RAHUL KUMAR SHARMA"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={profile.fatherName}
                    onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                    placeholder="e.g. SURENDRA PRASAD SHARMA"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
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
                  <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Academics */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-black text-emerald-400 uppercase border-b border-slate-800 pb-2">
                🎓 10th, 12th &amp; Graduation Roll Numbers
              </h2>
              <div className="space-y-3">
                {profile.academics.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                  >
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">
                        {row.level}
                      </span>
                      <input
                        type="text"
                        value={row.boardOrUniv}
                        onChange={(e) => {
                          const up = [...profile.academics];
                          up[idx].boardOrUniv = e.target.value;
                          setProfile({ ...profile, academics: up });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        placeholder="Board Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Passing Year</label>
                      <input
                        type="text"
                        value={row.passingYear}
                        onChange={(e) => {
                          const up = [...profile.academics];
                          up[idx].passingYear = e.target.value;
                          setProfile({ ...profile, academics: up });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={row.rollNumber}
                        onChange={(e) => {
                          const up = [...profile.academics];
                          up[idx].rollNumber = e.target.value;
                          setProfile({ ...profile, academics: up });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Percentage %</label>
                      <input
                        type="text"
                        value={row.percentageOrCgpa}
                        onChange={(e) => {
                          const up = [...profile.academics];
                          up[idx].percentageOrCgpa = e.target.value;
                          setProfile({ ...profile, academics: up });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-300 font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  saveProfileToVault(profile);
                  setActiveTab('cheat-sheet');
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-xl shadow-xl"
              >
                Save &amp; Open Floating Cheat Sheet →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SMART CHEAT SHEET (THE BEST SOLUTION FOR SSC FORMS) */}
        {activeTab === 'cheat-sheet' && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/50 space-y-6 text-xs">
            <div className="space-y-2">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                100% Secure &amp; Zero Friction
              </span>
              <h2 className="text-xl font-black text-white">
                📋 Smart Cheat Sheet &amp; Split-Screen Guide
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                Kyunki sarkari portals par paste karne ki permission nahi hoti, sabse asan tareeqa yeh hai ki aap apni screen ko split karein ya is card ko saamne rakhein. Har field ke samne **1-Tap Copy** button hai jisse aap turant clipboard par le sakte hain!
              </p>
            </div>

            {/* Interactive Cheat Sheet Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Candidate Full Name', val: profile.fullName.toUpperCase(), key: 'fn' },
                { label: 'First Name', val: splitNameParts.first.toUpperCase(), key: 'f1' },
                { label: 'Last Name', val: splitNameParts.last.toUpperCase(), key: 'f3' },
                { label: "Father's Name", val: profile.fatherName.toUpperCase(), key: 'fa' },
                { label: "Mother's Name", val: profile.motherName.toUpperCase(), key: 'mo' },
                { label: 'Date of Birth (DD/MM/YYYY)', val: formattedDob.ddmmyyyySlash, key: 'dob' },
                { label: 'Mobile Number', val: profile.mobile, key: 'mob' },
                { label: 'Email Address', val: profile.email, key: 'eml' },
                { label: 'PIN Code', val: profile.pincode, key: 'pin' },
                { label: '10th Board Name', val: profile.academics[0]?.boardOrUniv, key: 'b10' },
                { label: '10th Roll Number', val: profile.academics[0]?.rollNumber, key: 'r10' },
                { label: '10th Passing Year', val: profile.academics[0]?.passingYear, key: 'y10' },
                { label: '10th Percentage %', val: profile.academics[0]?.percentageOrCgpa, key: 'p10' },
                { label: 'Caste Certificate No.', val: profile.casteCertNumber, key: 'cst' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="truncate pr-2">
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    <div className="font-bold text-white font-mono truncate">{item.val || '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.val || '', item.key)}
                    className={`px-3 py-1.5 rounded-lg font-black shrink-0 transition ${
                      copiedKey === item.key
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-blue-600 text-slate-200'
                    }`}
                  >
                    {copiedKey === item.key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-200 text-xs">
              💡 <strong>Pro Tip:</strong> Apne browser window ko chhota karke aadhi screen par SSC ka form kholein aur aadhi screen par CareerSathi ka yeh Cheat Sheet rakhein. Saari details bina tab switch kiye ek hi nazar mein samne dikhengi!
            </div>
          </div>
        )}

        {/* TAB 3: PRINTABLE MASTER SHEET */}
        {activeTab === 'otr-print' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
              <span className="font-bold text-amber-400">🖨️ Printable A4 OTR Master Sheet</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow"
              >
                Print OTR Card
              </button>
            </div>

            <div
              id="otr-printable-sheet"
              className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 max-w-4xl mx-auto text-xs"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase text-blue-900">
                    CAREERSATHI — STUDENT OTR MASTER CARD
                  </h2>
                  <p className="text-[11px] text-slate-600 font-bold">
                    Reference Sheet for SSC, Railway &amp; Banking Forms
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Candidate Name</span>
                  <strong className="text-sm">{profile.fullName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Father&apos;s Name</span>
                  <strong className="text-sm">{profile.fatherName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Date of Birth</span>
                  <strong>{formattedDob.ddmmyyyySlash || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}