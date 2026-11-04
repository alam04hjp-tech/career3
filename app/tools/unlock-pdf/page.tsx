'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

export default function UnlockPdfTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  
  // Password Input State
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Processing & Output States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [unlockedFileName, setUnlockedFileName] = useState<string>('');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Kripya sirf valid PDF file select karein!');
        return;
      }
      const buffer = await file.arrayBuffer();
      setSelectedFile(file);
      setPdfBuffer(buffer.slice(0));
      setFileSizeStr(formatBytes(file.size));
      setDownloadUrl(null);
      setPassword('');
    }
  };

  const handleUnlockPdf = async () => {
    if (!pdfBuffer || !selectedFile) {
      alert('Pehle ek PDF file select karo bhai!');
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);

    try {
      // Load PDF using pdf-lib (If the PDF requires a password, we attempt to load it with password if supported, or clean stream)
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(pdfBuffer.slice(0), { password: password || undefined });
      } catch (loadErr: any) {
        throw new Error('Galat password ya corrupted PDF file! Kripya sahi password dalein.');
      }

      // Save without encryption
      const unlockedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([unlockedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const outName = `${selectedFile.name.replace(/\.pdf$/i, '')}-unlocked.pdf`;
      setUnlockedFileName(outName);

      alert('PDF successfully unlocked and password removed! 🔓');
    } catch (err: any) {
      console.error('Unlock error:', err);
      alert(`PDF unlock karne mein error aaya: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full font-bold">
            🔓 Remove PDF Password Securely
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Unlock PDF <span className="text-emerald-400">- Remove Password Online</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Remove password security and restrictions from your official PDF files instantly inside your browser.
          </p>
        </div>

        {/* Main Box */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-12 cursor-pointer transition bg-slate-950/60">
              <span className="text-4xl mb-3">🔓</span>
              <span className="text-base font-bold text-emerald-400">Click to Select or Drag &amp; Drop Locked PDF Here</span>
              <span className="text-xs text-slate-500 mt-2">Remove password restrictions easily</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex flex-wrap justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">Size: <strong className="text-emerald-400">{fileSizeStr}</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setPdfBuffer(null); setDownloadUrl(null); }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-800/40"
                >
                  Change File ✕
                </button>
              </div>

              {/* Password Input */}
              <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300">Enter Document Password (if required)</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password (leave blank if unprotected)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    Show Password
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleUnlockPdf}
                  disabled={isProcessing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black text-sm rounded-xl shadow-xl transition"
                >
                  {isProcessing ? 'Removing Password... ⏳' : 'Unlock PDF Now 🔓'}
                </button>
              </div>

              {/* Success Download Card */}
              {downloadUrl && (
                <div className="p-6 bg-emerald-950/60 border border-emerald-500 rounded-2xl text-center space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <div className="text-emerald-300 font-black text-base">
                      🎉 PDF Successfully Unlocked!
                    </div>
                    <div className="text-xs text-slate-300">
                      Password has been removed and your unencrypted file is ready.
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    download={unlockedFileName}
                    className="inline-block px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                  >
                    Download Unlocked PDF 📥
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}