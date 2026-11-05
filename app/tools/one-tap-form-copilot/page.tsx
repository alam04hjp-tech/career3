'use client';

import React, { useState, useEffect } from 'react';
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

export default function ProfileVaultPage() {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  const [toast, setToast] = useState<string>('');

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

  const handleSave = () => {
    localStorage.setItem('careersathi_master_vault', JSON.stringify(profile));
    setToast('✅ Profile saved successfully in Browser Vault!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    const newItem: CustomField = {
      id: Date.now().toString(),
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
    };
    const updated = {
      ...profile,
      customFields: [...profile.customFields, newItem],
    };
    setProfile(updated);
    localStorage.setItem('careersathi_master_vault', JSON.stringify(updated));
    setNewFieldLabel('');
    setNewFieldValue('');
    setToast('➕ New custom field added successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDeleteCustomField = (id: string) => {
    const updated = {
      ...profile,
      customFields: profile.customFields.filter((f) => f.id !== id),
    };
    setProfile(updated);
    localStorage.setItem('careersathi_master_vault', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-blue-400"
            >
              ← CareerSathi Home
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                🪪 CareerSathi Master Profile Vault
              </h1>
              <p className="text-[11px] text-slate-400">
                Save your form details once. Securely stored locally in your browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition"
          >
            💾 Save Profile Vault
          </button>
        </div>

        {toast && (
          <div className="p-3 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl text-center shadow-lg">
            {toast}
          </div>
        )}

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 text-xs">
          <h2 className="text-sm font-black text-amber-400 uppercase border-b border-slate-800 pb-2">
            👤 Personal &amp; Academic Standard Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Candidate Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="e.g. RAHUL KUMAR"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Father&apos;s Name</label>
              <input
                type="text"
                value={profile.fatherName}
                onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
                placeholder="e.g. SURENDRA PRASAD"
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
                placeholder="e.g. 1800452"
                className="w-full p-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-amber-400 font-bold mb-1">10th Roll Code (If any)</label>
              <input
                type="text"
                value={profile.rollCode10th}
                onChange={(e) => setProfile({ ...profile, rollCode10th: e.target.value })}
                placeholder="e.g. 71024"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                placeholder="9876543210"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
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

            <div>
              <label className="block text-slate-400 font-bold mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                placeholder="800001"
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

            <div>
              <label className="block text-fuchsia-400 font-bold mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={profile.bankIfsc}
                onChange={(e) => setProfile({ ...profile, bankIfsc: e.target.value.toUpperCase() })}
                placeholder="SBIN0001234"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 text-xs">
          <h2 className="text-sm font-black text-cyan-400 uppercase border-b border-slate-800 pb-2">
            ➕ Custom Fields (Add Your Own Extra Form Details)
          </h2>

          <div className="space-y-3">
            {profile.customFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"
              >
                <div className="w-1/3">
                  <span className="text-[11px] font-bold text-slate-400 block truncate">
                    {field.label}
                  </span>
                </div>
                <div className="w-2/3 flex items-center gap-2">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfile({
                        ...profile,
                        customFields: profile.customFields.map((f) =>
                          f.id === field.id ? { ...f, value: val } : f
                        ),
                      });
                    }}
                    placeholder={`Enter ${field.label}...`}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomField(field.id)}
                    className="px-2.5 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg font-bold transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddCustomField}
            className="p-4 bg-slate-950 rounded-2xl border border-dashed border-slate-700 space-y-3 pt-4"
          >
            <div className="font-bold text-slate-300">Add a New Custom Field:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Field Name (e.g. Driving License No)"
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="Field Value (e.g. DL-142026...)"
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow transition"
            >
              + Add Field to Vault
            </button>
          </form>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black rounded-xl shadow-xl"
          >
            Save &amp; Update Profile Vault →
          </button>
        </div>
      </div>
    </div>
  );
}