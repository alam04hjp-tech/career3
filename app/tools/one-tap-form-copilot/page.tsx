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

type ActiveTab = 'vault-editor' | 'copilot-board' | 'floating-injector' | 'otr-print';

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
    setSaveBanner('✅ Profile saved in Browser Vault!');
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

  // Floating Injector Widget Code (Copy & Run in Console on SSC Portal)
  const floatingInjectorSnippet = useMemo(() => {
    const payload = {
      fullName: profile.fullName.toUpperCase(),
      firstName: splitNameParts.first.toUpperCase(),
      middleName: splitNameParts.middle.toUpperCase(),
      lastName: splitNameParts.last.toUpperCase(),
      fatherName: profile.fatherName.toUpperCase(),
      motherName: profile.motherName.toUpperCase(),
      dobSlash: formattedDob.ddmmyyyySlash,
      mobile: profile.mobile,
      email: profile.email,
      pincode: profile.pincode,
      address1: profile.addressLine1,
      district: profile.domicileDistrict,
      roll10: profile.academics[0]?.rollNumber || '',
      year10: profile.academics[0]?.passingYear || '',
      casteCert: profile.casteCertNumber,
    };

    const code = `(function(){
      var d=${JSON.stringify(payload)};
      if(document.getElementById('cs-float-box'))return;
      var box=document.createElement('div');
      box.id='cs-float-box';
      box.style.cssText='position:fixed;bottom:20px;right:20px;z-index:999999;background:#0f172a;color:#fff;padding:16px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:2px solid #10b981;font-family:sans-serif;width:280px;font-size:12px;';
      box.innerHTML='<div style="font-weight:900;color:#34d399;margin-bottom:8px;display:flex;justify-content:space-between;"><span>⚡ CareerSathi Co-Pilot</span><span id="cs-close" style="cursor:pointer;color:#f43f5e;">✕</span></div>'+
      '<div style="margin-bottom:8px;color:#94a3b8;font-size:10px;">Click any field below to auto-fill active input:</div>'+
      '<button id="btn-name" style="width:100%;background:#2563eb;color:#fff;border:none;padding:6px;border-radius:6px;margin-bottom:4px;cursor:pointer;font-weight:bold;">Fill Name: '+d.fullName+'</button>'+
      '<button id="btn-father" style="width:100%;background:#2563eb;color:#fff;border:none;padding:6px;border-radius:6px;margin-bottom:4px;cursor:pointer;font-weight:bold;">Fill Father Name</button>'+
      '<button id="btn-dob" style="width:100%;background:#2563eb;color:#fff;border:none;padding:6px;border-radius:6px;margin-bottom:4px;cursor:pointer;font-weight:bold;">Fill DOB: '+d.dobSlash+'</button>'+
      '<button id="btn-roll10" style="width:100%;background:#2563eb;color:#fff;border:none;padding:6px;border-radius:6px;cursor:pointer;font-weight:bold;">Fill 10th Roll: '+d.roll10+'</button>';
      document.body.appendChild(box);
      document.getElementById('cs-close').onclick=function(){box.remove();};
      function inject(val){
        var el=document.activeElement;
        if(el && (el.tagName==='INPUT'||el.tagName==='TEXTAREA')){
          var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
          if(setter){setter.call(el,val);}else{el.value=val;}
          el.dispatchEvent(new Event('input',{bubbles:true}));
          el.dispatchEvent(new Event('change',{bubbles:true}));
          el.style.borderColor='#10b981';
        }else{alert('Pehle SSC form ke kisi box par click karein!');}
      }
      document.getElementById('btn-name').onclick=function(){inject(d.fullName);};
      document.getElementById('btn-father').onclick=function(){inject(d.fatherName);};
      document.getElementById('btn-dob').onclick=function(){inject(d.dobSlash);};
      document.getElementById('btn-roll10').onclick=function(){inject(d.roll10);};
    })();`;
    return code;
  }, [profile, splitNameParts, formattedDob]);

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
                ⚡ 1-Tap Exam Form Co-Pilot &amp; Student OTR Vault
              </h1>
              <p className="text-[11px] text-slate-400">
                Save your OTR details once &amp; fill SSC, IBPS, and Railway forms without typing errors!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleLoadDemoProfile}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-xl"
            >
              ✨ Load Sample Profile
            </button>
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {[
            { id: 'vault-editor', title: '1. 🪪 Student OTR Profile Vault' },
            { id: 'copilot-board', title: '2. 📋 1-Tap Copy Board' },
            { id: 'floating-injector', title: '3. 🪄 Floating Co-Pilot Widget (Best for SSC)' },
            { id: 'otr-print', title: '4. 🖨️ Printable OTR Master Card' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`p-3.5 rounded-2xl border text-left transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-black text-xs md:text-sm">{tab.title}</div>
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
                  setActiveTab('floating-injector');
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-xl shadow-xl"
              >
                Save &amp; Get Floating Co-Pilot →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: COPY BOARD */}
        {activeTab === 'copilot-board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-black text-cyan-400 uppercase text-[11px] border-b border-slate-800 pb-1">
                👤 Candidate Name &amp; DOB
              </div>
              {[
                { label: 'Full Name', val: profile.fullName.toUpperCase(), key: 'fn' },
                { label: 'First Name', val: splitNameParts.first.toUpperCase(), key: 'f1' },
                { label: 'Last Name', val: splitNameParts.last.toUpperCase(), key: 'f3' },
                { label: 'Father Name', val: profile.fatherName.toUpperCase(), key: 'fa' },
                { label: 'DOB (DD/MM/YYYY)', val: formattedDob.ddmmyyyySlash, key: 'dob1' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800"
                >
                  <div>
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    <div className="font-bold text-white">{item.val || '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.val, item.key)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-white rounded-lg font-bold"
                  >
                    {copiedKey === item.key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-black text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1">
                🎓 Academic Roll Numbers
              </div>
              {profile.academics.map((ac, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800"
                >
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold">{ac.level}</div>
                    <div className="font-mono text-white">Roll: {ac.rollNumber || 'N/A'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(ac.rollNumber, `r-${idx}`)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-white rounded-lg font-bold"
                  >
                    {copiedKey === `r-${idx}` ? '✓ Copied' : 'Copy Roll'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FLOATING CO-PILOT WIDGET (THE ULTIMATE SSC SOLUTION) */}
        {activeTab === 'floating-injector' && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/40 space-y-6 text-xs">
            <div className="space-y-2">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                🚀 Ultimate Cyber-Cafe Bypass Tool
              </span>
              <h2 className="text-xl font-black text-white">
                🪄 Floating Co-Pilot Widget (1-Click Fill on SSC Portal)
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                Kyunki SSC portal par paste block hota hai aur bookmarklet kabhi-kabhi fail ho jata hai, humne ek **Smart Floating Widget** banaya hai. Yeh widget SSC ke page par ek chhote floating box ki tarah dikhega aur bina keyboard type kiye 1 click mein box bhar dega!
              </p>
            </div>

            <div className="p-6 bg-slate-950 rounded-2xl border-2 border-dashed border-amber-500/60 space-y-4">
              <div className="font-bold text-amber-300">
                Step 1: Niche diye gaye code ko Copy karein:
              </div>
              <textarea
                readOnly
                rows={4}
                value={floatingInjectorSnippet}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-cyan-300 font-mono text-[11px]"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyText(floatingInjectorSnippet, 'snip')}
                  className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xl transition"
                >
                  {copiedKey === 'snip' ? '✓ Code Copied to Clipboard!' : '📋 Copy Co-Pilot Code'}
                </button>
                <p className="text-slate-400 text-[11px]">
                  <strong>Step 2:</strong> SSC ke OTR page par jaakar F12 dabayein, **Console** mein paste karke Enter dabayein. Screen ke corner mein aapka apna assistant floating box aa jayega!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRINTABLE MASTER CARD */}
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