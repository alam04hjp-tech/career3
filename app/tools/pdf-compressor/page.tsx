'use client';

import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

export default function PdfCompressorTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [compressionMode, setCompressionMode] = useState<'preset' | 'custom'>('custom');
  const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'low'>('recommended');
  
  // Custom Target Size in KB
  const [targetKb, setTargetKb] = useState<number>(100);

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [isPdfLibReady, setIsPdfLibReady] = useState<boolean>(false);
  
  // Results
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [newFileSizeStr, setNewFileSizeStr] = useState<string>('');
  const [savingsPercent, setSavingsPercent] = useState<number>(0);

  // Load PDF.js from CDN
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setIsPdfLibReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsPdfLibReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Kripya sirf valid PDF file select karein!');
        return;
      }
      setSelectedFile(file);
      setFileSizeStr(formatBytes(file.size));
      setCompressedBlobUrl(null);

      const approxCurrentKb = Math.round(file.size / 1024);
      setTargetKb(Math.max(20, Math.min(200, Math.round(approxCurrentKb / 2))));
    }
  };

  // Helper to render entire PDF at specific scale & JPEG quality
  const renderPdfWithSettings = async (
    pdfDocProxy: any,
    numPages: number,
    scale: number,
    quality: number
  ): Promise<Uint8Array> => {
    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocProxy.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }

      const embeddedImage = await newPdfDoc.embedJpg(bytes);
      const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return await newPdfDoc.save({ useObjectStreams: true });
  };

  const compressPdf = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setProgressText('Initializing PDF rendering engine... ⏳');

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocProxy = await loadingTask.promise;
      const numPages = pdfDocProxy.numPages;

      let compressedPdfBytes: Uint8Array;

      if (compressionMode === 'custom') {
        const targetBytes = targetKb * 1024;
        const targetLabel = targetKb >= 1024 ? (targetKb / 1024).toFixed(1) + ' MB' : targetKb + ' KB';
        
        // Agar original file pehle se target se choti ya barabar hai, toh maximum quality rakhein
        if (selectedFile.size <= targetBytes) {
          setProgressText(`File is already under ${targetLabel}. Optimizing with crystal clarity... ✨`);
          compressedPdfBytes = await renderPdfWithSettings(pdfDocProxy, numPages, 1.6, 0.92);
        } else {
          // Accurate Multi-Pass Convergence Algorithm for exact target size
          setProgressText(`Targeting exact size: ~${targetLabel}... 🎯`);

          let minScale = 0.45;
          let maxScale = 1.7;
          let minQual = 0.20;
          let maxQual = 0.92;

          let bestResult: Uint8Array | null = null;
          let closestDiff = Infinity;

          for (let pass = 1; pass <= 3; pass++) {
            const currentScale = (minScale + maxScale) / 2;
            const currentQual = (minQual + maxQual) / 2;

            setProgressText(`Matching target size (Pass ${pass}/3: ~${targetLabel})... 🗜️`);
            const trialBytes = await renderPdfWithSettings(pdfDocProxy, numPages, currentScale, currentQual);
            const trialSize = trialBytes.length;

            const diff = Math.abs(trialSize - targetBytes);
            if (diff < closestDiff) {
              closestDiff = diff;
              bestResult = trialBytes;
            }

            // Target ke kareeb pahuche toh loop break karo
            if (trialSize <= targetBytes && trialSize >= targetBytes * 0.88) {
              bestResult = trialBytes;
              break;
            }

            if (trialSize > targetBytes) {
              // Size bada hai, scale aur quality ghatao
              maxScale = currentScale;
              maxQual = currentQual;
            } else {
              // Size target se chota ho gaya, quality badhao taaki target ke paas pahuche
              minScale = currentScale;
              minQual = currentQual;
            }
          }

          compressedPdfBytes = bestResult!;
        }
      } else {
        let scale = 1.2;
        let jpegQuality = 0.70;

        if (compressionLevel === 'extreme') {
          scale = 0.85;
          jpegQuality = 0.40;
        } else if (compressionLevel === 'low') {
          scale = 1.55;
          jpegQuality = 0.88;
        }

        setProgressText(`Compressing ${numPages} page(s)... 🗜️`);
        compressedPdfBytes = await renderPdfWithSettings(pdfDocProxy, numPages, scale, jpegQuality);
      }

      const originalSize = selectedFile.size;
      const newSize = compressedPdfBytes.length;
      
      const saved = originalSize > newSize ? Math.round(((originalSize - newSize) / originalSize) * 100) : 0;
      setSavingsPercent(saved);
      setNewFileSizeStr(formatBytes(newSize));

      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setCompressedBlobUrl(url);

      alert(`PDF successfully optimized to ${formatBytes(newSize)}! 🎉`);
    } catch (error: any) {
      console.error('Compression Error:', error);
      alert(`Compression mein error aaya: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCompressing(false);
      setProgressText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full font-bold">
            🎯 Exact Custom KB / MB Compression
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            PDF Compressor <span className="text-emerald-400">- Target Exact Size</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Compress your PDF to exact limits (10 KB, 50 KB, 100 KB, 1 MB, 2 MB, etc.) for government job applications, university portals, and exams.
          </p>
        </div>

        {/* Main Box */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-12 cursor-pointer transition bg-slate-950/65">
              <span className="text-4xl mb-3">🗜️</span>
              <span className="text-base font-bold text-emerald-400">
                {isPdfLibReady ? 'Click to Select or Drag & Drop PDF Here' : 'Loading Compressor Engine... ⏳'}
              </span>
              <span className="text-xs text-slate-500 mt-2">Supports Custom Target KB/MB & Preset Reductions</span>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isPdfLibReady}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex flex-wrap justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">Original Size: <strong className="text-emerald-400">{fileSizeStr}</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setCompressedBlobUrl(null); }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-800/40"
                >
                  Change File ✕
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setCompressionMode('custom')}
                  className={`py-2.5 rounded-lg font-black transition ${
                    compressionMode === 'custom'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎯 Exact Target Size (KB / MB)
                </button>
                <button
                  onClick={() => setCompressionMode('preset')}
                  className={`py-2.5 rounded-lg font-black transition ${
                    compressionMode === 'preset'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Preset Quality Levels
                </button>
              </div>

              {/* Option A: Custom Target Size Input */}
              {compressionMode === 'custom' ? (
                <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Specify Desired File Size
                    </label>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {targetKb >= 1024 ? `(~${(targetKb / 1024).toFixed(1)} MB)` : `(~${targetKb} KB)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={5}
                        max={20000}
                        value={targetKb}
                        onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value)))}
                        className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-lg focus:border-emerald-500 outline-none pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        {targetKb >= 1024 ? 'MB (in KB)' : 'KB'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Select Preset Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Quick Select Sizes:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: '10 KB', val: 10 },
                        { label: '20 KB', val: 20 },
                        { label: '50 KB', val: 50 },
                        { label: '100 KB', val: 100 },
                        { label: '200 KB', val: 200 },
                        { label: '500 KB', val: 500 },
                        { label: '1 MB', val: 1024 },
                        { label: '2 MB', val: 2048 },
                        { label: '5 MB', val: 5120 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setTargetKb(item.val)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                            targetKb === item.val
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Option B: Standard Presets */
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Compression Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      onClick={() => setCompressionLevel('extreme')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition space-y-1 ${
                        compressionLevel === 'extreme'
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-black text-white flex items-center justify-between">
                        <span>🔥 Extreme</span>
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">Smallest</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Maximum size reduction.</p>
                    </div>

                    <div
                      onClick={() => setCompressionLevel('recommended')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition space-y-1 ${
                        compressionLevel === 'recommended'
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-black text-white flex items-center justify-between">
                        <span>⭐ Recommended</span>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded">Balanced</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Optimal size with sharp text.</p>
                    </div>

                    <div
                      onClick={() => setCompressionLevel('low')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition space-y-1 ${
                        compressionLevel === 'low'
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-black text-white flex items-center justify-between">
                        <span>💎 Low</span>
                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded">High Res</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Light optimization.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={compressPdf}
                  disabled={isCompressing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition"
                >
                  {isCompressing
                    ? (progressText || 'Compressing PDF... ⏳')
                    : compressionMode === 'custom'
                    ? `Compress to ~${targetKb >= 1024 ? (targetKb / 1024).toFixed(1) + ' MB' : targetKb + ' KB'} Now 🚀`
                    : 'Compress PDF Now 🚀'}
                </button>
              </div>

              {/* Success Result & Download */}
              {compressedBlobUrl && (
                <div className="p-6 bg-emerald-950/60 border border-emerald-500 rounded-2xl text-center space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <div className="text-emerald-400 font-black text-base">
                      🎉 PDF Compressed Successfully!
                    </div>
                    <div className="text-xs text-slate-300">
                      New Size: <strong className="text-white text-sm">{newFileSizeStr}</strong>{' '}
                      {compressionMode === 'custom' && (
                        <span>(Target was ~{targetKb >= 1024 ? (targetKb / 1024).toFixed(1) + ' MB' : targetKb + ' KB'})</span>
                      )}
                      {savingsPercent > 0 && (
                        <span> - Reduced by <strong className="text-emerald-400">{savingsPercent}%</strong></span>
                      )}
                    </div>
                  </div>

                  <a
                    href={compressedBlobUrl}
                    download={`${selectedFile.name.replace(/\.pdf$/i, '')}-compressed.pdf`}
                    className="inline-block px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                  >
                    Download Compressed PDF 📥
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