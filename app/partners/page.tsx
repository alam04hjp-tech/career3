'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CoachingPartnerRegister() {
  const [instituteName, setInstituteName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [city, setCity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteName || !ownerName || !phone) {
      alert('Please fill all required fields!');
      return;
    }

    const newPartner = {
      id: Date.now().toString(),
      instituteName,
      ownerName,
      phone,
      email,
      websiteUrl,
      city,
      status: 'pending', // Admin approval required to add courses
      registeredAt: new Date().toLocaleDateString()
    };

    const existing = JSON.parse(localStorage.getItem('careersathi_partners') || '[]');
    localStorage.setItem('careersathi_partners', JSON.stringify([newPartner, ...existing]));
    
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
        <p className="text-xs text-blue-100 mt-1">Coaching & Institute Partner Registration Portal</p>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto p-4 sm:p-6 my-8 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-blue-900">🏛️ Institute Partner Registration</h1>
            <p className="text-xs text-slate-500">Register your coaching institute with CareerSathi. After admin approval, you will get access to publish courses on our marketplace!</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
              <h3 className="text-lg font-bold text-slate-900">Registration Submitted Successfully!</h3>
              <p className="text-xs text-slate-600">
                Your institute profile is under review. Once our admin team verifies your details, your partner account will be approved, and you can start listing courses.
              </p>
              <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold shadow">
                ← Back to Homepage
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institute / Coaching Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Physics Wallah / Adda247 / Local Coaching"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Director / Owner Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@institute.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Patna / Delhi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Website / App Link</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourcoachingwebsite.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition text-sm"
              >
                Submit Institute Registration for Approval 🚀
              </button>
            </form>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs">
        <p>© 2026 CareerSathi.com — All Rights Reserved.</p>
      </footer>
    </div>
  );
}