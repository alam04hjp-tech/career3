'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdvancedRegisterPage() {
  const [stream, setStream] = useState<'board' | 'competitive' | 'entrance'>('board');
  const [step, setStep] = useState<'form' | 'otp' | 'plans' | 'success'>('form');
  
  // Form Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState('');

  // States List & Search
  const [selectedState, setSelectedState] = useState('All India / Central Level');
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  const indianStates = [
    'All India / Central Level', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  const filteredStates = indianStates.filter(st => 
    st.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  // Board Specific
  const [boardName, setBoardName] = useState('CBSE Board');
  const [className, setClassName] = useState('Class 10th');

  // Entrance Specific
  const [entranceExam, setEntranceExam] = useState('JEE Main / Advanced');

  // Competitive Specific (Max 3 main exams, and sub-options)
  const [selectedCompExams, setSelectedCompExams] = useState<string[]>([]);
  const [subExams, setSubExams] = useState<{ [key: string]: string[] }>({});

  const compOptions = [
    { id: 'ssc', name: 'SSC Exams', subs: ['SSC CGL', 'SSC CHSL', 'SSC MTS', 'SSC CPO', 'SSC GD'] },
    { id: 'railway', name: 'Railway Exams', subs: ['RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE'] },
    { id: 'teacher', name: 'Teacher & TET', subs: ['CTET', 'State TET', 'B.Ed Entrance', 'KVS / NVS', 'Super TET'] },
    { id: 'banking', name: 'Banking Exams', subs: ['IBPS PO', 'IBPS Clerk', 'SBI PO', 'SBI Clerk', 'RBI Grade B'] },
    { id: 'police', name: 'Police & Defence', subs: ['State Police SI', 'Constable', 'CDS', 'NDA', 'Agniveer Army'] },
    { id: 'psc', name: 'State PSC / UPSC', subs: ['UPSC IAS', 'State PCS (BPSC/UPPCS)', 'RO/ARO', 'Lower PCS'] }
  ];

  const handleCompCheckbox = (examName: string) => {
    if (selectedCompExams.includes(examName)) {
      setSelectedCompExams(selectedCompExams.filter(e => e !== examName));
    } else {
      if (selectedCompExams.length >= 3) {
        alert('You can select a maximum of 3 competitive exams!');
        return;
      }
      setSelectedCompExams([...selectedCompExams, examName]);
    }
  };

  const handleSubSelect = (mainExam: string, sub: string) => {
    const currentSubs = subExams[mainExam] || [];
    if (currentSubs.includes(sub)) {
      setSubExams({ ...subExams, [mainExam]: currentSubs.filter(s => s !== sub) });
    } else {
      if (currentSubs.length >= 3) {
        alert('You can select maximum 3 sub-exams for ' + mainExam);
        return;
      }
      setSubExams({ ...subExams, [mainExam]: [...currentSubs, sub] });
    }
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !consent) {
      alert('Please fill required fields and accept Terms & Conditions!');
      return;
    }
    setStep('otp');
    alert('OTP sent to ' + phone + ' (Use 1234 for demo)');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '1234' || otp.length === 4) {
      setStep('plans');
    } else {
      alert('Invalid OTP! Please enter 1234');
    }
  };

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'monthly' | 'yearly'>('free');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-4 shadow-md text-center">
        <Link href="/" className="text-2xl font-black tracking-wide">CAREERSATHI.COM</Link>
        <p className="text-xs text-blue-100 mt-1">Student Portal Registration & WhatsApp Alerts</p>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto p-4 sm:p-6 my-6 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
          
          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' && (
            <form onSubmit={handleProceedToOtp} className="space-y-5">
              
              <div className="text-center">
                <h1 className="text-2xl font-black text-blue-900">Select Your Goal</h1>
                <p className="text-xs text-slate-500">Choose what updates you want to receive on WhatsApp</p>
              </div>

              {/* 3 Main Category Selector Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStream('board')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition text-center ${stream === 'board' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  🏫 Board Exam
                </button>
                <button
                  type="button"
                  onClick={() => setStream('competitive')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition text-center ${stream === 'competitive' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  🎯 Competitive
                </button>
                <button
                  type="button"
                  onClick={() => setStream('entrance')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition text-center ${stream === 'entrance' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  🎓 Entrance
                </button>
              </div>

              {/* Common Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* DYNAMIC FIELDS BASED ON STREAM */}
                
                {/* 1. BOARD EXAM FIELDS WITH STATE SEARCH */}
                {stream === 'board' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Board Exam Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Board Name <span className="text-red-500">*</span></label>
                        <select
                          value={boardName}
                          onChange={(e) => setBoardName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                        >
                          <option value="CBSE Board">CBSE Board</option>
                          <option value="State Board">State Board</option>
                          <option value="ICSE Board">ICSE Board</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Class <span className="text-red-500">*</span></label>
                        <select
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                        >
                          <option value="Class 8th">Class 8th</option>
                          <option value="Class 9th">Class 9th</option>
                          <option value="Class 10th">Class 10th</option>
                          <option value="Class 11th">Class 11th</option>
                          <option value="Class 12th">Class 12th</option>
                        </select>
                      </div>
                    </div>

                    {/* State Search & Select Box */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Select State <span className="text-red-500">*</span> (Selected: <strong className="text-blue-700">{selectedState}</strong>)
                      </label>
                      <input
                        type="text"
                        placeholder="🔍 Type to search state (e.g. Bihar, UP)..."
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                      <div className="max-h-32 overflow-y-auto bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                        {filteredStates.length === 0 ? (
                          <div className="p-2 text-slate-400 text-center">No state found</div>
                        ) : (
                          filteredStates.map(st => (
                            <div
                              key={st}
                              onClick={() => {
                                setSelectedState(st);
                                setStateSearchQuery('');
                              }}
                              className={`p-2 cursor-pointer font-medium hover:bg-blue-50 transition ${selectedState === st ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-700'}`}
                            >
                              {st} {selectedState === st && ' ✓'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. ENTRANCE EXAM FIELDS WITH STATE SEARCH */}
                {stream === 'entrance' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Entrance Exam & State Selection</h3>
                    
                    {/* State Search & Select Box for Entrance */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Target State / All India Level <span className="text-red-500">*</span> (Selected: <strong className="text-blue-700">{selectedState}</strong>)
                      </label>
                      <input
                        type="text"
                        placeholder="🔍 Type to search state (e.g. Maharashtra, Delhi)..."
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                      <div className="max-h-28 overflow-y-auto bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                        {filteredStates.length === 0 ? (
                          <div className="p-2 text-slate-400 text-center">No state found</div>
                        ) : (
                          filteredStates.map(st => (
                            <div
                              key={st}
                              onClick={() => {
                                setSelectedState(st);
                                setStateSearchQuery('');
                              }}
                              className={`p-2 cursor-pointer font-medium hover:bg-blue-50 transition ${selectedState === st ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-700'}`}
                            >
                              {st} {selectedState === st && ' ✓'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Target Entrance Exam <span className="text-red-500">*</span></label>
                      <select
                        value={entranceExam}
                        onChange={(e) => setEntranceExam(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      >
                        <option value="JEE Main / Advanced">JEE Main / Advanced (Engineering)</option>
                        <option value="NEET UG">NEET UG (Medical)</option>
                        <option value="CUET UG">CUET UG (Central Universities)</option>
                        <option value="State CET (Engineering/Medical)">State CET (Engineering / Medical)</option>
                        <option value="CAT / Management">CAT / MBA Entrance</option>
                        <option value="CLAT">CLAT (Law)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. COMPETITIVE EXAM FIELDS WITH STATE SEARCH */}
                {stream === 'competitive' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Competitive Exam & State Selection</h3>
                    
                    {/* State Search & Select Box for Competitive */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Target State / Central Level <span className="text-red-500">*</span> (Selected: <strong className="text-blue-700">{selectedState}</strong>)
                      </label>
                      <input
                        type="text"
                        placeholder="🔍 Type to search state or select All India..."
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                      <div className="max-h-28 overflow-y-auto bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                        {filteredStates.length === 0 ? (
                          <div className="p-2 text-slate-400 text-center">No state found</div>
                        ) : (
                          filteredStates.map(st => (
                            <div
                              key={st}
                              onClick={() => {
                                setSelectedState(st);
                                setStateSearchQuery('');
                              }}
                              className={`p-2 cursor-pointer font-medium hover:bg-blue-50 transition ${selectedState === st ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-700'}`}
                            >
                              {st} {selectedState === st && ' ✓'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <label className="block text-[11px] font-bold text-slate-600">Select Competitive Exams (Max 3) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {compOptions.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-2 p-2 border rounded cursor-pointer text-xs font-semibold ${selectedCompExams.includes(opt.name) ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-white border-slate-300 text-slate-700'}`}>
                          <input
                            type="checkbox"
                            checked={selectedCompExams.includes(opt.name)}
                            onChange={() => handleCompCheckbox(opt.name)}
                            className="rounded text-blue-600"
                          />
                          {opt.name}
                        </label>
                      ))}
                    </div>

                    {/* Sub-select boxes for chosen competitive exams */}
                    {selectedCompExams.map(mainExam => {
                      const foundOpt = compOptions.find(o => o.name === mainExam);
                      return (
                        <div key={mainExam} className="mt-2 p-2.5 bg-white border border-blue-200 rounded space-y-1.5">
                          <span className="text-[11px] font-bold text-blue-900">Sub-select for {mainExam} (Max 3):</span>
                          <div className="flex flex-wrap gap-2">
                            {foundOpt?.subs.map(sub => {
                              const isChecked = (subExams[mainExam] || []).includes(sub);
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => handleSubSelect(mainExam, sub)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded border transition ${isChecked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                                >
                                  {isChecked ? '✓ ' : '+ '} {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Consent Checkbox */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <label className="text-xs text-slate-600">
                    I agree to the <span className="text-blue-600 font-bold underline">Terms & Conditions</span> and consent to receive instant exam, result & admit card alerts on WhatsApp.
                  </label>
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition text-sm"
              >
                Send Verification OTP ➔
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 text-center">
                OTP sent to WhatsApp number: <strong>{phone}</strong>.<br/>(Demo OTP: Enter <span className="font-bold text-red-600">1234</span>)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter 4-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  className="w-full text-center tracking-widest text-lg font-bold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition text-sm"
              >
                Verify & Continue ✓
              </button>
            </form>
          )}

          {/* STEP 3: 3 SUBSCRIPTION BOXES (Free, Monthly, Yearly) */}
          {step === 'plans' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black text-blue-900">Choose Your Alert Plan</h2>
                <p className="text-xs text-slate-500">Select Free community channels or go Premium for 1-on-1 personal WhatsApp alerts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Box 1: Free */}
                <div 
                  onClick={() => setSelectedPlan('free')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${selectedPlan === 'free' ? 'border-blue-600 bg-blue-50/50 shadow' : 'border-slate-200 bg-white'}`}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Community</span>
                    <h3 className="font-bold text-slate-900">Free Alerts</h3>
                    <p className="text-[11px] text-slate-600">Join our official public channels for exam updates.</p>
                  </div>
                  <div className="pt-4 font-black text-blue-600 text-lg">₹0 <span className="text-[10px] text-slate-500 font-normal">/ forever</span></div>
                </div>

                {/* Box 2: Premium 1 Month */}
                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${selectedPlan === 'monthly' ? 'border-emerald-600 bg-emerald-50/50 shadow' : 'border-slate-200 bg-white'}`}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Most Popular</span>
                    <h3 className="font-bold text-slate-900">Premium 1 Month</h3>
                    <p className="text-[11px] text-slate-600">Personal WhatsApp alerts for selected exams.</p>
                  </div>
                  <div className="pt-4 font-black text-emerald-600 text-lg">₹49 <span className="text-[10px] text-slate-500 font-normal">/ month</span></div>
                </div>

                {/* Box 3: Premium 1 Year */}
                <div 
                  onClick={() => setSelectedPlan('yearly')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${selectedPlan === 'yearly' ? 'border-purple-600 bg-purple-50/50 shadow' : 'border-slate-200 bg-white'}`}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Best Value</span>
                    <h3 className="font-bold text-slate-900">Premium 1 Year</h3>
                    <p className="text-[11px] text-slate-600">Priority 1-on-1 WhatsApp alerts for 12 months.</p>
                  </div>
                  <div className="pt-4 font-black text-purple-600 text-lg">₹299 <span className="text-[10px] text-slate-500 font-normal">/ year</span></div>
                </div>

              </div>

              {/* Conditional Actions based on Plan Selection */}
              {selectedPlan === 'free' ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-center">
                  <p className="text-xs font-bold text-slate-700">You selected Free Plan. Join our channels or skip:</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold">
                      Join WhatsApp Channel ↗
                    </a>
                    <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-bold">
                      Join Telegram Channel ↗
                    </a>
                  </div>
                  <button
                    onClick={() => setStep('success')}
                    className="block w-full pt-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                  >
                    Skip & Complete Registration →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    alert('Redirecting to secure payment gateway for ' + (selectedPlan === 'monthly' ? '₹49 Plan' : '₹299 Plan'));
                    setStep('success');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition text-sm"
                >
                  Proceed to Secure Payment ({selectedPlan === 'monthly' ? '₹49' : '₹299'}) 💳
                </button>
              )}

            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-900">Registration Successful!</h3>
              <p className="text-xs text-slate-600">
                You are all set! You will now receive instant exam and result alerts directly on your WhatsApp number.
              </p>

              <Link href="/" className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow">
                ← Back to Homepage
              </Link>
            </div>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-xs">
        <p>© 2026 CareerSathi.com — All Rights Reserved.</p>
      </footer>
    </div>
  );
}