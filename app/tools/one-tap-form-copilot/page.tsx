'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface StudentProfile {
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  pincode: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  roll10th: string;
  rollCode10th: string;
  customFields: CustomField[];
}

const DEFAULT_PROFILE: StudentProfile = {
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '2003-07-18',
  gender: 'Male',
  mobile: '',
  email: '',
  pincode: '',
  bankAccountNo: '',
  bankIfsc: '',
  bankName: 'State Bank of India',
  roll10th: '',
  rollCode10th: '',
  customFields: [
    { id: '1', label: 'Caste Certificate Number', value: '' },
    { id: '2', label: 'PAN Card Number', value: '' },
  ],
};

export default function OneTapFormCopilotPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'vault' | 'copilot'>('vault');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedField, setSelectedField] = useState<{ label: string; value: string } | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('careersathi_master_vault');
    if (saved) {
      try {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveVault = () => {
    localStorage.setItem('careersathi_master_vault', JSON.stringify(profile));
    setToast('✅ Master Vault Saved Successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  const allFieldsList = useMemo(() => {
    const sscRollCombined = profile.rollCode10th.trim()
      ? `${profile.rollCode10th.trim()} - ${profile.roll10th.trim()}`
      : profile.roll10th.trim();

    const list = [
      { label: 'Candidate Full Name', value: profile.fullName || '—' },
      { label: "Father's Name", value: profile.fatherName || '—' },
      { label: "Mother's Name", value: profile.motherName || '—' },
      { label: 'Date of Birth (DOB)', value: profile.dob || '—' },
      { label: '10th Roll Number (Roll Code - Roll No)', value: sscRollCombined || '—' },
      { label: 'Mobile Number', value: profile.mobile || '—' },
      { label: 'Email Address', value: profile.email || '—' },
      { label: 'PIN Code', value: profile.pincode || '—' },
      { label: 'Bank Account Number', value: profile.bankAccountNo || '—' },
      { label: 'Bank IFSC Code', value: profile.bankIfsc || '—' },
      { label: 'Bank Name', value: profile.bankName || '—' },
    ];

    profile.customFields.forEach((cf) => {
      if (cf.label) {
        list.push({ label: cf.label, value: cf.value || '—' });
      }
    });

    return list;
  }, [profile]);

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return allFieldsList;
    const q = searchQuery.toLowerCase();
    return allFieldsList.filter(
      (f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
    );
  }, [allFieldsList, searchQuery]);

  const startVoiceSearch = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.lang = 'en-US';

    rec.onstart = () => setIsListening(true);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setSearchQuery(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    rec.start();
    recognitionRef.current = rec;
  };

  const copyToClipboard = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setToast(`✓ Copied: ${text}`);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* TOP 30% FLOATING CO-PILOT OVERLAY BAR */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b-2 border-emerald-500 shadow-2xl p-4 transition-all">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase animate-pulse">
                ⚡ Top 30% Co-Pilot Bar
              </span>
              <span className="text-xs text-slate-300 font-bold">
                Search or Speak to Find Details Instantly
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'vault' ? 'copilot' : 'vault')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow"
              >
                {activeTab === 'vault' ? '🚀 Open Co-Pilot Bar' : '✏️ Edit Profile Vault'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type keyword (e.g. roll, name, bank, aadhar)..."
                className="w-full p-2.5 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-emerald-500 outline-none"
              />
              <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
            </div>

            <button
              type="button"
              onClick={startVoiceSearch}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition ${
                isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
              }`}
            >
              🎙️ {isListening ? 'Listening...' : 'Voice Search'}
            </button>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-3 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'copilot' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <h2 className="font-black text-amber-400 text-sm">🎯 Smart Field Matcher</h2>
                <p className="text-slate-400 text-[11px]">Click any field below to copy or view in large font.</p>
              </div>
              <span className="text-slate-500 font-bold">{filteredFields.length} Fields Found</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFields.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedField(f)}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer transition space-y-1"
                >
                  <div className="text-[10px] text-slate-400 font-bold uppercase truncate">{f.label}</div>
                  <div className="text-sm font-black text-emerald-300 font-mono truncate">{f.value || '—'}</div>
                </div>
              ))}
            </div>

            {selectedField && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border-2 border-emerald-500 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">{selectedField.label}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedField(null)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <div className="text-xl sm:text-3xl font-black text-emerald-300 font-mono break-all py-3">
                      {selectedField.value}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedField.value)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow"
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedField(null)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h1 className="text-base font-black text-white">🪪 CareerSathi Master Profile Vault</h1>
                <p className="text-[11px] text-slate-400">Save your details once &amp; add custom fields as needed.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveVault}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
              >
                💾 Save Vault
              </button>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-amber-400 uppercase border-b border-slate-800 pb-2">
                👤 Standard Form Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Candidate Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="RAHUL KUMAR"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={profile.fatherName}
                    onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                    placeholder="SURENDRA PRASAD"
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
                  <label className="block text-emerald-400 font-bold mb-1">10th Roll Number</label>
                  <input
                    type="text"
                    value={profile.roll10th}
                    onChange={(e) => setProfile({ ...profile, roll10th: e.target.value })}
                    placeholder="1800452"
                    className="w-full p-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-bold mb-1">10th Roll Code (If any)</label>
                  <input
                    type="text"
                    value={profile.rollCode10th}
                    onChange={(e) => setProfile({ ...profile, rollCode10th: e.target.value })}
                    placeholder="71024"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-fuchsia-400 font-bold mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={profile.bankAccountNo}
                    onChange={(e) => setProfile({ ...profile, bankAccountNo: e.target.value })}
                    placeholder="30987654321"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-cyan-400 uppercase border-b border-slate-800 pb-2">
                ➕ Custom Fields (Add Your Own Extra Form Data)
              </h2>

              <div className="space-y-2">
                {profile.customFields.map((cf) => (
                  <div key={cf.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="w-1/3 text-slate-400 font-bold">{cf.label}</span>
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
                      className="w-2/3 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      placeholder={`Enter ${cf.label}...`}
                    />
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const labelInput = (e.currentTarget.elements.namedItem('newLabel') as HTMLInputElement).value.trim();
                  const valueInput = (e.currentTarget.elements.namedItem('newValue') as HTMLInputElement).value.trim();
                  if (!labelInput) return;

                  const newCf: CustomField = {
                    id: Date.now().toString(),
                    label: labelInput,
                    value: valueInput,
                  };
                  setProfile({
                    ...profile,
                    customFields: [...profile.customFields, newCf],
                  });
                  (e.currentTarget as HTMLFormElement).reset();
                  setToast('➕ Custom field added!');
                  setTimeout(() => setToast(''), 2500);
                }}
                className="p-3.5 bg-slate-950 rounded-2xl border border-dashed border-slate-700 space-y-2"
              >
                <div className="font-bold text-slate-300">Add New Field:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    name="newLabel"
                    placeholder="Field Name (e.g. PAN Card No)"
                    className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    name="newValue"
                    placeholder="Field Value (e.g. ABCDE1234F)"
                    className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl">
                  + Add Custom Field
                </button>
              </form>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveVault}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-xl shadow-xl"
              >
                Save Vault &amp; Switch to Co-Pilot Bar →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}