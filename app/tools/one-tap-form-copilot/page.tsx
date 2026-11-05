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
  // Personal Details
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  category: 'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS';
  isPwbd: 'No' | 'Yes';
  nationality: string;
  maritalStatus: 'Unmarried' | 'Married';
  identificationMark1: string;
  identificationMark2: string;

  // Contact & Domicile
  mobile: string;
  altMobile: string;
  email: string;
  domicileState: string;
  domicileDistrict: string;
  religion: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  villageOrCity: string;
  postOffice: string;
  policeStation: string;
  pincode: string;

  // Certificates & Permitted IDs
  photoIdType: 'PAN Card' | 'Voter ID' | 'Driving License' | 'Passport' | 'College ID';
  photoIdNumber: string;
  casteCertNumber: string;
  casteCertIssueDate: string;
  casteCertAuthority: string;
  domicileCertNumber: string;
  domicileCertIssueDate: string;

  // Academics
  academics: AcademicRow[];

  // Saved Photo & Signature DataURLs
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
  isPwbd: 'No',
  nationality: 'Indian',
  maritalStatus: 'Unmarried',
  identificationMark1: 'Mole on right cheek',
  identificationMark2: 'No visible mark',

  mobile: '',
  altMobile: '',
  email: '',
  domicileState: 'Bihar',
  domicileDistrict: 'Patna',
  religion: 'Hindu',

  addressLine1: '',
  addressLine2: '',
  villageOrCity: '',
  postOffice: '',
  policeStation: '',
  pincode: '',

  photoIdType: 'PAN Card',
  photoIdNumber: '',
  casteCertNumber: '',
  casteCertIssueDate: '',
  casteCertAuthority: 'Circle Officer (CO) / Tehsildar',
  domicileCertNumber: '',
  domicileCertIssueDate: '',

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
      boardOrUniv: 'Patna University / IGNOU',
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

type ActiveTab = 'vault-editor' | 'copilot-board' | 'magic-autofill' | 'otr-print';

export default function OneTapFormCopilotPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault-editor');
  const [saveBanner, setSaveBanner] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [targetExamPreset, setTargetExamPreset] = useState<'SSC' | 'IBPS' | 'RAILWAY' | 'UPSC' | 'STATE'>('SSC');
  const [ageCutoffDate, setAgeCutoffDate] = useState<string>('2026-08-01');

  // Load Saved Profile from Browser LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('careersathi_student_otr_vault');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved OTR profile:', e);
      }
    }
  }, []);

  // Save Profile to LocalStorage
  const saveProfileToVault = (updated: StudentProfile = profile) => {
    setProfile(updated);
    localStorage.setItem('careersathi_student_otr_vault', JSON.stringify(updated));
    setSaveBanner('✅ Profile saved securely in your browser Device Vault!');
    setTimeout(() => setSaveBanner(''), 3500);
  };

  // Load Demo Student Profile for Instant Testing
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
      altMobile: '9123456789',
      email: 'rahul.sharma.aspirant@gmail.com',
      domicileState: 'Bihar',
      domicileDistrict: 'Patna',
      addressLine1: 'House No 42, Ward No 11, Boring Road',
      addressLine2: 'Near Patliputra Colony',
      villageOrCity: 'Patna',
      postOffice: 'GPO Patna',
      policeStation: 'Sri Krishnapuri',
      pincode: '800001',
      photoIdType: 'PAN Card',
      photoIdNumber: 'ABCDE1234F',
      casteCertNumber: 'BCCCO/2026/884120',
      casteCertIssueDate: '2026-04-12',
      domicileCertNumber: 'BRCCO/2026/552190',
      domicileCertIssueDate: '2026-04-10',
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
          boardOrUniv: 'Patliputra University, Patna',
          passingYear: '2023',
          rollNumber: '203044112',
          rollCode: 'PPU-04',
          certificateNo: 'DEG-2023-7712',
          gradingSystem: 'Percentage',
          totalMarks: '1500',
          obtainedMarks: '1125',
          percentageOrCgpa: '75.00',
        },
      ],
    };
    saveProfileToVault(demo);
  };

  // Copy Helper
  const copyText = (text: string, labelKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(labelKey);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  // Update Academic Row & Auto-Calculate Percentage
  const updateAcademicRow = (idx: number, field: keyof AcademicRow, value: string) => {
    const updatedAcad = [...profile.academics];
    updatedAcad[idx] = { ...updatedAcad[idx], [field]: value };

    if (field === 'totalMarks' || field === 'obtainedMarks') {
      const tot = parseFloat(updatedAcad[idx].totalMarks);
      const obt = parseFloat(updatedAcad[idx].obtainedMarks);
      if (tot > 0 && obt >= 0 && obt <= tot) {
        updatedAcad[idx].percentageOrCgpa = ((obt / tot) * 100).toFixed(2);
      }
    }
    setProfile({ ...profile, academics: updatedAcad });
  };

  // Handle Photo / Signature Upload into Local Vault
  const handleMediaUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photoDataUrl' | 'signatureDataUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const next = { ...profile, [field]: dataUrl };
      saveProfileToVault(next);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export & Import Encrypted/Portable JSON Vault
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careersathi-otr-vault-${(profile.fullName || 'student')
      .toLowerCase()
      .replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        saveProfileToVault({ ...DEFAULT_PROFILE, ...parsed });
      } catch {
        alert('Invalid CareerSathi OTR JSON file!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Split Full Name into First, Middle, Last (Needed for IBPS / SBI / Railway Forms)
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

  // Format DOB into DD/MM/YYYY, DD-MM-YYYY, and Day/Month/Year parts
  const formattedDob = useMemo(() => {
    if (!profile.dob) return { ddmmyyyySlash: '', ddmmyyyyDash: '', day: '', month: '', year: '' };
    const [y, m, d] = profile.dob.split('-');
    return {
      ddmmyyyySlash: `${d}/${m}/${y}`,
      ddmmyyyyDash: `${d}-${m}-${y}`,
      day: d || '',
      month: m || '',
      year: y || '',
    };
  }, [profile.dob]);

  // Exact Exam Age Calculator as on Cutoff Date
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

  // Generate 1-Click Auto-Fill Bookmarklet Script (Works on Govt Exam Forms!)
  const autofillBookmarkletCode = useMemo(() => {
    const payload = {
      fullName: profile.fullName.toUpperCase(),
      firstName: splitNameParts.first.toUpperCase(),
      middleName: splitNameParts.middle.toUpperCase(),
      lastName: splitNameParts.last.toUpperCase(),
      fatherName: profile.fatherName.toUpperCase(),
      motherName: profile.motherName.toUpperCase(),
      dobISO: profile.dob,
      dobSlash: formattedDob.ddmmyyyySlash,
      mobile: profile.mobile,
      email: profile.email,
      pincode: profile.pincode,
      address1: profile.addressLine1,
      address2: profile.addressLine2,
      city: profile.villageOrCity,
      district: profile.domicileDistrict,
      state: profile.domicileState,
      mark1: profile.identificationMark1,
      mark2: profile.identificationMark2,
      roll10: profile.academics[0]?.rollNumber || '',
      year10: profile.academics[0]?.passingYear || '',
      pct10: profile.academics[0]?.percentageOrCgpa || '',
      roll12: profile.academics[1]?.rollNumber || '',
      year12: profile.academics[1]?.passingYear || '',
      pct12: profile.academics[1]?.percentageOrCgpa || '',
      rollGrad: profile.academics[2]?.rollNumber || '',
      yearGrad: profile.academics[2]?.passingYear || '',
      pctGrad: profile.academics[2]?.percentageOrCgpa || '',
      casteCert: profile.casteCertNumber,
      domicileCert: profile.domicileCertNumber,
      idNumber: profile.photoIdNumber,
    };

    const scriptBody = `(function(){
      var d=${JSON.stringify(payload)};
      var inputs=document.querySelectorAll('input:not([type="hidden"]):not([disabled]),textarea:not([disabled])');
      var filled=0;
      function setVal(el,val){
        if(!val)return;
        var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
        if(setter){setter.call(el,val);}else{el.value=val;}
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
        el.style.backgroundColor='#dcfce7';
        el.style.border='2px solid #16a34a';
        filled++;
      }
      inputs.forEach(function(el){
        var attr=((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
        var lbl='';
        if(el.id){var l=document.querySelector('label[for="'+el.id+'"]');if(l)lbl=l.innerText.toLowerCase();}
        var key=attr+' '+lbl;
        if(key.includes('father'))setVal(el,d.fatherName);
        else if(key.includes('mother'))setVal(el,d.motherName);
        else if(key.includes('first')&&key.includes('name'))setVal(el,d.firstName);
        else if(key.includes('middle')&&key.includes('name'))setVal(el,d.middleName);
        else if(key.includes('last')&&key.includes('name'))setVal(el,d.lastName);
        else if(key.includes('candidate')||key.includes('full_name')||key.includes('fullname')||key.includes('applicant'))setVal(el,d.fullName);
        else if(el.type==='date')setVal(el,d.dobISO);
        else if(key.includes('dob')||key.includes('birth'))setVal(el,d.dobSlash);
        else if(key.includes('mobile')||key.includes('phone')||key.includes('contact'))setVal(el,d.mobile);
        else if(key.includes('email')||key.includes('mail'))setVal(el,d.email);
        else if(key.includes('pin')||key.includes('zip')||key.includes('postal'))setVal(el,d.pincode);
        else if(key.includes('mark')&&key.includes('1'))setVal(el,d.mark1);
        else if(key.includes('mark')&&key.includes('2'))setVal(el,d.mark2);
        else if(key.includes('address')&&key.includes('2'))setVal(el,d.address2);
        else if(key.includes('address')||key.includes('street')||key.includes('house'))setVal(el,d.address1);
        else if(key.includes('city')||key.includes('village')||key.includes('town'))setVal(el,d.city);
        else if(key.includes('district'))setVal(el,d.district);
        else if(key.includes('caste')&&key.includes('cert'))setVal(el,d.casteCert);
        else if(key.includes('domicile')&&key.includes('cert'))setVal(el,d.domicileCert);
        else if(key.includes('roll')&&(key.includes('10')||key.includes('matric')||key.includes('ssc')))setVal(el,d.roll10);
        else if(key.includes('roll')&&(key.includes('12')||key.includes('inter')||key.includes('hsc')))setVal(el,d.roll12);
      });
      alert('⚡ CareerSathi Auto-Fill Co-Pilot: '+filled+' form fields auto-filled! Please verify before final submit.');
    })();`;

    return `javascript:${encodeURIComponent(scriptBody.replace(/\s+/g, ' '))}`;
  }, [profile, splitNameParts, formattedDob]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Print-Only Styles for OTR Master Sheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #otr-printable-sheet,
          #otr-printable-sheet * {
            visibility: visible;
          }
          #otr-printable-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            box-shadow: none !important;
          }
        }
      `}</style>

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
                ⚡ 1-Tap Exam Form Co-Pilot &amp; Student OTR Vault{' '}
                <span className="text-[10px] bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black">
                  100% LEGAL &amp; LOCAL
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Save your OTR details once in your browser vault &amp; auto-fill SSC, IBPS, Railway, UPSC &amp; State forms in 1 click!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleLoadDemoProfile}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-xl transition"
            >
              ✨ Load Sample Profile
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold rounded-xl transition"
            >
              📥 Export Vault (.JSON)
            </button>
            <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer transition">
              📤 Import Vault
              <input
                type="file"
                accept="application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Legal Assurance Strip */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-200">
            <span className="text-base">🛡️</span>
            <span>
              <strong>Zero-Server Privacy Guarantee (DPDP Act Compliant):</strong> Aapka data kisi server par upload nahi hota, balki 100% aapke apne phone/laptop browser mein save rehta hai.
            </span>
          </div>
          {saveBanner && (
            <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black rounded-lg">
              {saveBanner}
            </span>
          )}
        </div>

        {/* 4 Mode Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {[
            {
              id: 'vault-editor',
              title: '1. 🪪 Student OTR Profile Vault',
              sub: 'Save Personal, 10th/12th/Grad & Docs',
            },
            {
              id: 'copilot-board',
              title: '2. 📋 1-Tap Copy Co-Pilot Board',
              sub: 'Split Name, Uppercase & Age Checker',
            },
            {
              id: 'magic-autofill',
              title: '3. ⚡ 1-Click Auto-Fill Bookmarklet',
              sub: 'Auto-Fill SSC, Banking & State Portals',
            },
            {
              id: 'otr-print',
              title: '4. 🖨️ Printable OTR Master Card',
              sub: 'A4 Cyber-Cafe Ready Reference Sheet',
            },
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
              <div
                className={`text-[10px] mt-0.5 ${
                  activeTab === tab.id ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {tab.sub}
              </div>
            </button>
          ))}
        </div>

        {/* =================================================================== */}
        {/* TAB 1: STUDENT OTR PROFILE VAULT EDITOR                             */}
        {/* =================================================================== */}
        {activeTab === 'vault-editor' && (
          <div className="space-y-6 text-xs">
            {/* Section A: Personal & Identity Details */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                  👤 Section 1: Candidate Personal Details (As Per 10th Marksheet)
                </h2>
                <button
                  type="button"
                  onClick={() => saveProfileToVault(profile)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  💾 Save Profile in Browser Vault
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Candidate Full Name (10th Cert)
                  </label>
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
                  <label className="block text-slate-400 font-bold mb-1">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={profile.motherName}
                    onChange={(e) => setProfile({ ...profile, motherName: e.target.value })}
                    placeholder="e.g. SUNITA DEVI"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) =>
                      setProfile({ ...profile, gender: e.target.value as StudentProfile['gender'] })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reservation Category</label>
                  <select
                    value={profile.category}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        category: e.target.value as StudentProfile['category'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-bold"
                  >
                    <option value="UR">UR / General</option>
                    <option value="OBC-NCL">OBC (Non-Creamy Layer)</option>
                    <option value="EWS">EWS (Economically Weaker)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    placeholder="10-digit Mobile"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Email ID</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="student@gmail.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">
                    Visible Identification Mark 1 (Required in SSC/Railway)
                  </label>
                  <input
                    type="text"
                    value={profile.identificationMark1}
                    onChange={(e) =>
                      setProfile({ ...profile, identificationMark1: e.target.value })
                    }
                    placeholder="e.g. A mole on right palm"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">
                    Visible Identification Mark 2
                  </label>
                  <input
                    type="text"
                    value={profile.identificationMark2}
                    onChange={(e) =>
                      setProfile({ ...profile, identificationMark2: e.target.value })
                    }
                    placeholder="e.g. Cut mark on forehead"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Address & Domicile Details */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                🏠 Section 2: Permanent Address, Domicile &amp; Certificate Numbers
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">
                    Address Line 1 (House No, Street, Village/Mohalla)
                  </label>
                  <input
                    type="text"
                    value={profile.addressLine1}
                    onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Post Office (PO)</label>
                  <input
                    type="text"
                    value={profile.postOffice}
                    onChange={(e) => setProfile({ ...profile, postOffice: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Police Station (PS)</label>
                  <input
                    type="text"
                    value={profile.policeStation}
                    onChange={(e) => setProfile({ ...profile, policeStation: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Domicile State</label>
                  <input
                    type="text"
                    value={profile.domicileState}
                    onChange={(e) => setProfile({ ...profile, domicileState: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Home District</label>
                  <input
                    type="text"
                    value={profile.domicileDistrict}
                    onChange={(e) => setProfile({ ...profile, domicileDistrict: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-black"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Photo ID Card Type</label>
                  <select
                    value={profile.photoIdType}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        photoIdType: e.target.value as StudentProfile['photoIdType'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="PAN Card">PAN Card</option>
                    <option value="Voter ID">Voter ID (EPIC)</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="College ID">Govt / College ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    {profile.photoIdType} Number
                  </label>
                  <input
                    type="text"
                    value={profile.photoIdNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, photoIdNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. ABCDE1234F"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Caste / EWS / NCL Certificate No.
                  </label>
                  <input
                    type="text"
                    value={profile.casteCertNumber}
                    onChange={(e) => setProfile({ ...profile, casteCertNumber: e.target.value })}
                    placeholder="e.g. BCCCO/2026/..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Caste Cert Issue Date
                  </label>
                  <input
                    type="date"
                    value={profile.casteCertIssueDate}
                    onChange={(e) =>
                      setProfile({ ...profile, casteCertIssueDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Domicile (Niwas) Certificate No.
                  </label>
                  <input
                    type="text"
                    value={profile.domicileCertNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, domicileCertNumber: e.target.value })
                    }
                    placeholder="e.g. BRCCO/2026/..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Academic Qualification Matrix (10th, 12th, Graduation) */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                🎓 Section 3: Academic Qualification Matrix (Auto-Calculates Exact Percentage)
              </h2>

              <div className="space-y-4">
                {profile.academics.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end"
                  >
                    <div className="lg:col-span-2">
                      <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">
                        {row.level} — Board / University
                      </span>
                      <input
                        type="text"
                        value={row.boardOrUniv}
                        onChange={(e) => updateAcademicRow(idx, 'boardOrUniv', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Passing Year</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={row.passingYear}
                        onChange={(e) => updateAcademicRow(idx, 'passingYear', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={row.rollNumber}
                        onChange={(e) => updateAcademicRow(idx, 'rollNumber', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Roll Code / Cert No
                      </label>
                      <input
                        type="text"
                        value={row.rollCode}
                        onChange={(e) => updateAcademicRow(idx, 'rollCode', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Obtained / Total
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={row.obtainedMarks}
                          onChange={(e) => updateAcademicRow(idx, 'obtainedMarks', e.target.value)}
                          placeholder="Obt"
                          className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                        />
                        <input
                          type="number"
                          value={row.totalMarks}
                          onChange={(e) => updateAcademicRow(idx, 'totalMarks', e.target.value)}
                          placeholder="Tot"
                          className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-emerald-400 font-bold mb-1">
                        Exact % / CGPA
                      </label>
                      <input
                        type="text"
                        value={row.percentageOrCgpa}
                        onChange={(e) =>
                          updateAcademicRow(idx, 'percentageOrCgpa', e.target.value)
                        }
                        className="w-full p-2 bg-emerald-950/50 border border-emerald-500/50 rounded-lg text-emerald-300 font-black text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: Photo & Signature Vault */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-black text-white text-sm">📸 Passport Photo Vault</div>
                  <p className="text-[11px] text-slate-400">
                    Keep your form-ready passport photo saved here for quick download.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMediaUpload(e, 'photoDataUrl')}
                        className="hidden"
                      />
                    </label>
                    <Link
                      href="/tools/form-tool"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg"
                    >
                      Resize in Form Tool ↗
                    </Link>
                  </div>
                </div>
                {profile.photoDataUrl ? (
                  <img
                    src={profile.photoDataUrl}
                    alt="Saved Passport"
                    className="w-20 h-24 object-cover bg-white rounded-lg border-2 border-emerald-500"
                  />
                ) : (
                  <div className="w-20 h-24 bg-slate-900 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-500 text-center p-1">
                    No Photo Saved
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-black text-white text-sm">✍️ Signature Vault (6x2 cm)</div>
                  <p className="text-[11px] text-slate-400">
                    Keep your 10–20 KB running signature saved here for instant access.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer">
                      Upload Signature
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMediaUpload(e, 'signatureDataUrl')}
                        className="hidden"
                      />
                    </label>
                    <Link
                      href="/tools/form-tool"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg"
                    >
                      Make 6x2cm Sign ↗
                    </Link>
                  </div>
                </div>
                {profile.signatureDataUrl ? (
                  <img
                    src={profile.signatureDataUrl}
                    alt="Saved Signature"
                    className="w-32 h-14 object-contain bg-white rounded-lg border-2 border-emerald-500 p-1"
                  />
                ) : (
                  <div className="w-32 h-14 bg-slate-900 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-500 text-center p-1">
                    No Sign Saved
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  saveProfileToVault(profile);
                  setActiveTab('copilot-board');
                }}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition"
              >
                💾 Save Vault &amp; Open 1-Tap Copy Co-Pilot →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: 1-TAP COPY CO-PILOT BOARD & EXAM AGE CALCULATOR              */}
        {/* =================================================================== */}
        {activeTab === 'copilot-board' && (
          <div className="space-y-6 text-xs">
            {/* Exam Cutoff Age Checker Bar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-black text-amber-400">
                  🎂 Official Exam Cutoff Age Verifier:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">As on Cutoff Date:</span>
                  <input
                    type="date"
                    value={ageCutoffDate}
                    onChange={(e) => setAgeCutoffDate(e.target.value)}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-500/15 border border-amber-400/50 rounded-xl font-black text-amber-300 text-sm">
                Your Exact Age: <span className="text-white">{exactAgeOnCutoff}</span>
              </div>
            </div>

            {/* 1-Tap Copy Grid (Formatted for SSC, IBPS, Railway & State Portals) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Name & Split Name (For IBPS/SBI) */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-black text-cyan-400 uppercase text-[11px] border-b border-slate-800 pb-1.5">
                  👤 Candidate Name Formats (1-Tap Copy)
                </div>

                {[
                  { label: 'Full Name (UPPERCASE)', val: profile.fullName.toUpperCase(), key: 'fn' },
                  { label: 'First Name (IBPS/SBI)', val: splitNameParts.first.toUpperCase(), key: 'f1' },
                  { label: 'Middle Name (IBPS/SBI)', val: splitNameParts.middle.toUpperCase(), key: 'f2' },
                  { label: 'Last Name / Surname', val: splitNameParts.last.toUpperCase(), key: 'f3' },
                  { label: 'Father Name', val: profile.fatherName.toUpperCase(), key: 'fa' },
                  { label: 'Mother Name', val: profile.motherName.toUpperCase(), key: 'mo' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] text-slate-400">{item.label}</div>
                      <div className="font-bold text-white truncate">{item.val || '—'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(item.val, item.key)}
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

              {/* Card 2: Contact, Address & Certificates */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-black text-emerald-400 uppercase text-[11px] border-b border-slate-800 pb-1.5">
                  📍 Contact, Address &amp; Certificates
                </div>

                {[
                  { label: 'DOB (DD/MM/YYYY)', val: formattedDob.ddmmyyyySlash, key: 'dob1' },
                  { label: 'Mobile Number', val: profile.mobile, key: 'mob' },
                  { label: 'Email Address', val: profile.email, key: 'eml' },
                  { label: 'Address Line 1', val: profile.addressLine1, key: 'ad1' },
                  { label: 'PIN Code', val: profile.pincode, key: 'pin' },
                  {
                    label: `Caste / EWS Cert (${profile.category})`,
                    val: profile.casteCertNumber,
                    key: 'cst',
                  },
                  {
                    label: 'Domicile Certificate No.',
                    val: profile.domicileCertNumber,
                    key: 'dom',
                  },
                  {
                    label: `${profile.photoIdType} Number`,
                    val: profile.photoIdNumber,
                    key: 'pid',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] text-slate-400">{item.label}</div>
                      <div className="font-bold text-white font-mono truncate">
                        {item.val || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(item.val, item.key)}
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

              {/* Card 3: Academic Roll Numbers & Percentages */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-black text-amber-400 uppercase text-[11px] border-b border-slate-800 pb-1.5">
                  🎓 10th, 12th &amp; Graduation Quick Copy
                </div>

                {profile.academics.map((ac, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-300">{ac.level}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        {ac.percentageOrCgpa}% ({ac.passingYear})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{ac.boardOrUniv}</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => copyText(ac.rollNumber, `r-${idx}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[10px] font-bold text-white"
                      >
                        {copiedKey === `r-${idx}`
                          ? '✓ Roll Copied'
                          : `Copy Roll: ${ac.rollNumber || 'N/A'}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(ac.percentageOrCgpa, `p-${idx}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[10px] font-bold text-emerald-300"
                      >
                        {copiedKey === `p-${idx}` ? '✓ % Copied' : `Copy %: ${ac.percentageOrCgpa}`}
                      </button>
                      {ac.rollCode && (
                        <button
                          type="button"
                          onClick={() => copyText(ac.rollCode, `c-${idx}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[10px] font-bold text-cyan-300"
                        >
                          {copiedKey === `c-${idx}` ? '✓ Copied' : `Code: ${ac.rollCode}`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: 1-CLICK MAGIC AUTO-FILL BOOKMARKLET & EXTENSION CO-PILOT     */}
        {/* =================================================================== */}
        {activeTab === 'magic-autofill' && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/40 space-y-6 text-xs">
            <div className="space-y-2">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase">
                Zero-API Legal Browser Co-Pilot
              </span>
              <h2 className="text-xl font-black text-white">
                ⚡ How to Auto-Fill Any Government Exam Form in 1 Click
              </h2>
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                Government portals (SSC, IBPS, RRB, BPSC, UPPSC) third-party servers ko form submit karne nahi dete, lekin aap apne browser mein **CareerSathi Smart Bookmarklet** use karke 1 click mein saare text boxes apne aap bhar sakte hain!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-black">Step 1: Drag Button to Bookmark Bar</div>
                <p className="text-slate-400 text-[11px]">
                  Apne Chrome/Edge browser mein `Ctrl + Shift + B` dabayein taaki upar Bookmark Bar dikhe. Ab neeche diye gaye green button ko mouse se pakad kar upar Bookmark Bar mein chhod dein (Drag &amp; Drop).
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-black">
                  Step 2: Open Any Exam Form (SSC / IBPS)
                </div>
                <p className="text-slate-400 text-[11px]">
                  Ab SSC, Railway, Banking ya kisi bhi state exam ka registration page kholein jahan Name, Father Name, DOB, Mobile, Address aur Roll No bharna hai.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-black">
                  Step 3: Click Bookmark to Auto-Fill!
                </div>
                <p className="text-slate-400 text-[11px]">
                  Upar Bookmark Bar mein **&quot;⚡ Auto-Fill with CareerSathi&quot;** par click karein—1 second mein saare matching boxes green hokar auto-fill ho jayenge!
                </p>
              </div>
            </div>

            {/* Draggable Bookmarklet & Copy Script Box */}
            <div className="p-6 bg-slate-950 rounded-2xl border-2 border-dashed border-emerald-500/60 text-center space-y-4">
              <div className="text-xs font-bold text-slate-300">
                👇 Drag this green button to your Browser Bookmark Bar (Or click right button to copy code):
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href={autofillBookmarkletCode}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      'Bhai, is button ko click karne ke bajaye mouse se pakad kar apne browser ke upar Bookmark Bar mein Drag & Drop karo! Ya niche "Test Auto-Fill Below" box mein test karo.'
                    );
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl cursor-grab active:cursor-grabbing inline-flex items-center gap-2"
                >
                  ⚡ Auto-Fill with CareerSathi ({profile.fullName || 'Student'})
                </a>

                <button
                  type="button"
                  onClick={() => copyText(autofillBookmarkletCode, 'bmk')}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black rounded-2xl border border-slate-700"
                >
                  {copiedKey === 'bmk'
                    ? '✓ Bookmarklet URL Copied!'
                    : '📋 Copy Bookmarklet Code (For Mobile Chrome)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PRINTABLE UNIVERSAL OTR MASTER CARD                          */}
        {/* =================================================================== */}
        {activeTab === 'otr-print' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
              <span className="font-bold text-amber-400">
                🖨️ Cyber-Cafe &amp; Self-Form Filling A4 OTR Master Reference Sheet
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
              >
                🖨️ Print / Save OTR Card as PDF
              </button>
            </div>

            <div
              id="otr-printable-sheet"
              className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 max-w-4xl mx-auto text-xs"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase text-blue-900">
                    CAREERSATHI — UNIVERSAL STUDENT OTR MASTER CARD
                  </h2>
                  <p className="text-[11px] text-slate-600 font-bold">
                    Verified One-Time Registration Reference Sheet for SSC, UPSC, IBPS, Railway &amp; State Exams
                  </p>
                </div>
                {profile.photoDataUrl && (
                  <img
                    src={profile.photoDataUrl}
                    alt="Candidate"
                    className="w-20 h-24 object-cover border-2 border-slate-900 rounded"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-300 pb-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Candidate Name
                  </span>
                  <strong className="text-sm">{profile.fullName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Father&apos;s Name
                  </span>
                  <strong className="text-sm">{profile.fatherName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Mother&apos;s Name
                  </span>
                  <strong className="text-sm">{profile.motherName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Date of Birth
                  </span>
                  <strong>{formattedDob.ddmmyyyySlash || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Gender &amp; Category
                  </span>
                  <strong>
                    {profile.gender} • {profile.category}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Mobile &amp; Email
                  </span>
                  <strong>
                    {profile.mobile} • {profile.email}
                  </strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Permanent Address
                  </span>
                  <strong>
                    {profile.addressLine1}, PO: {profile.postOffice}, PS: {profile.policeStation},{' '}
                    {profile.domicileDistrict}, {profile.domicileState} – {profile.pincode}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Caste / Domicile Cert No.
                  </span>
                  <strong>
                    {profile.casteCertNumber || '—'} / {profile.domicileCertNumber || '—'}
                  </strong>
                </div>
              </div>

              <div>
                <h3 className="font-black uppercase text-slate-800 mb-2">
                  Academic Qualification Summary
                </h3>
                <table className="w-full border-collapse border border-slate-400 text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-400 p-2">Exam Level</th>
                      <th className="border border-slate-400 p-2">Board / University</th>
                      <th className="border border-slate-400 p-2">Year</th>
                      <th className="border border-slate-400 p-2">Roll No &amp; Code</th>
                      <th className="border border-slate-400 p-2">Marks</th>
                      <th className="border border-slate-400 p-2">% / CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.academics.map((ac, i) => (
                      <tr key={i}>
                        <td className="border border-slate-400 p-2 font-bold">{ac.level}</td>
                        <td className="border border-slate-400 p-2">{ac.boardOrUniv}</td>
                        <td className="border border-slate-400 p-2">{ac.passingYear}</td>
                        <td className="border border-slate-400 p-2 font-mono">
                          {ac.rollNumber} {ac.rollCode ? `(${ac.rollCode})` : ''}
                        </td>
                        <td className="border border-slate-400 p-2">
                          {ac.obtainedMarks} / {ac.totalMarks}
                        </td>
                        <td className="border border-slate-400 p-2 font-black">
                          {ac.percentageOrCgpa}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}