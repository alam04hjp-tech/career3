'use client';

import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Link from 'next/link';

type SplitTab = 'extract' | 'range' | 'scissors' | 'size';
type RangeSubMode = 'custom' | 'fixed';

interface PageThumb {
  pageNumber: number;
  dataUrl: string;
}

interface CustomRange {
  id: string;
  from: number;
  to: number;
}

interface GeneratedPdfFile {
  name: string;
  url: string;
  sizeStr: string;
  pageLabel: string;
  bytes: Uint8Array;
}

export default function SplitPdfStudio() {
  // File & Engine States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isPdfReady, setIsPdfReady] = useState<boolean>(false);
  const [thumbs, setThumbs] = useState<PageThumb[]>([]);
  const [isRenderingThumbs, setIsRenderingThumbs] = useState<boolean>(false);

  // Active Mode
  const [activeTab, setActiveTab] = useState<SplitTab>('extract');

  // 1. Extract Mode States
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [extractInput, setExtractInput] = useState<string>('');
  const [mergeExtracted, setMergeExtracted] = useState<boolean>(false);

  // 2. Range Mode States
  const [rangeMode, setRangeMode] = useState<RangeSubMode>('custom');
  const [customRanges, setCustomRanges] = useState<CustomRange[]>([
    { id: 'r-1', from: 1, to: 1 },
  ]);
  const [fixedStep, setFixedStep] = useState<number>(2);
  const [mergeRanges, setMergeRanges] = useState<boolean>(false);

  // 3. Visual Scissors Mode States (Stores page numbers AFTER which a split occurs)
  const [splitPoints, setSplitPoints] = useState<number[]>([]);

  // 4. Split by Max Size Mode States (iLovePDF Premium Feature for Free)
  const [maxSizeKb, setMaxSizeKb] = useState<number>(200);

  // Output States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [outputFiles, setOutputFiles] = useState<GeneratedPdfFile[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [filePrefix, setFilePrefix] = useState<string>('careersathi-split');

  // Load PDF.js from CDN
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setIsPdfReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsPdfReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle PDF Upload & Generate Visual Page Thumbnails
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
      setFilePrefix(file.name.replace(/\.pdf$/i, '') || 'careersathi-split');
      setOutputFiles([]);
      setZipUrl(null);
      setSplitPoints([]);

      try {
        setIsRenderingThumbs(true);
        const pdfjsLib = (window as any).pdfjsLib;
        const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const total = pdf.numPages;
        setNumPages(total);

        // Select all pages by default in Extract mode
        const allPages = Array.from({ length: total }, (_, i) => i + 1);
        setSelectedPages(allPages);
        setExtractInput(`1-${total}`);
        setCustomRanges([{ id: `r-${Date.now()}`, from: 1, to: total }]);

        // Render visual thumbnails (up to 60 pages for fast browser performance)
        const renderedThumbs: PageThumb[] = [];
        const maxThumbs = Math.min(total, 60);

        for (let p = 1; p <= maxThumbs; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 0.45 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          renderedThumbs.push({
            pageNumber: p,
            dataUrl: canvas.toDataURL('image/jpeg', 0.75),
          });
        }
        setThumbs(renderedThumbs);
      } catch (err) {
        console.error('Thumbnail render error:', err);
      } finally {
        setIsRenderingThumbs(false);
      }
    }
  };

  // Parse pattern string like "1, 3, 5-8" into sorted array of page numbers
  const applyExtractPattern = (pattern: string) => {
    setExtractInput(pattern);
    const pagesSet = new Set<number>();
    const parts = pattern.split(',');

    for (const raw of parts) {
      const part = raw.trim();
      if (!part) continue;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const s = Math.max(1, Math.min(start, end));
          const e = Math.min(numPages, Math.max(start, end));
          for (let i = s; i <= e; i++) pagesSet.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= numPages) {
          pagesSet.add(num);
        }
      }
    }

    setSelectedPages(Array.from(pagesSet).sort((a, b) => a - b));
  };

  // Toggle single page in Extract Mode
  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) => {
      const exists = prev.includes(pageNum);
      const updated = exists
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b);
      setExtractInput(updated.join(', '));
      return updated;
    });
  };

  // Quick Select Helpers (All / Odd / Even / Clear)
  const selectQuickFilter = (type: 'all' | 'odd' | 'even' | 'none') => {
    let list: number[] = [];
    if (type === 'all') {
      list = Array.from({ length: numPages }, (_, i) => i + 1);
    } else if (type === 'odd') {
      list = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 1);
    } else if (type === 'even') {
      list = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    }
    setSelectedPages(list);
    setExtractInput(type === 'all' ? `1-${numPages}` : list.join(', '));
  };

  // Toggle Scissor Split Point after pageNum
  const toggleScissorPoint = (pageNum: number) => {
    setSplitPoints((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  // Add / Update / Remove Custom Range
  const addCustomRange = () => {
    const lastRange = customRanges[customRanges.length - 1];
    const nextStart = lastRange ? Math.min(numPages, lastRange.to + 1) : 1;
    setCustomRanges((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, from: nextStart, to: numPages },
    ]);
  };

  const updateCustomRange = (id: string, field: 'from' | 'to', val: number) => {
    const cleanVal = Math.max(1, Math.min(numPages, val));
    setCustomRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: cleanVal } : r))
    );
  };

  const removeCustomRange = (id: string) => {
    if (customRanges.length <= 1) return;
    setCustomRanges((prev) => prev.filter((r) => r.id !== id));
  };

  // Helper: Create a new PDF from 1-based page indices array
  const buildSubPdf = async (
    srcDoc: PDFDocument,
    pageNumbers: number[]
  ): Promise<Uint8Array> => {
    const newDoc = await PDFDocument.create();
    const zeroBasedIndices = pageNumbers.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);
    copiedPages.forEach((cp) => newDoc.addPage(cp));
    return await newDoc.save({ useObjectStreams: true });
  };

  // Main Split Execution Handler
  const handleSplitPdf = async () => {
    if (!pdfBuffer) return;

    setIsProcessing(true);
    setStatusText('Loading source PDF... ⏳');
    setOutputFiles([]);
    setZipUrl(null);

    try {
      const srcDoc = await PDFDocument.load(pdfBuffer.slice(0));
      const generated: GeneratedPdfFile[] = [];

      // --- MODE 1: EXTRACT PAGES ---
      if (activeTab === 'extract') {
        if (selectedPages.length === 0) {
          alert('Kripya kam se kam 1 page select karein!');
          setIsProcessing(false);
          return;
        }

        if (mergeExtracted) {
          setStatusText('Merging selected pages into 1 PDF... ⚡');
          const bytes = await buildSubPdf(srcDoc, selectedPages);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          generated.push({
            name: `${filePrefix}-extracted-merged.pdf`,
            url: URL.createObjectURL(blob),
            sizeStr: formatBytes(bytes.length),
            pageLabel: `Pages: ${selectedPages.join(', ')}`,
            bytes,
          });
        } else {
          for (let i = 0; i < selectedPages.length; i++) {
            const pNum = selectedPages[i];
            setStatusText(`Extracting Page ${pNum} (${i + 1}/${selectedPages.length})... 📄`);
            const bytes = await buildSubPdf(srcDoc, [pNum]);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            generated.push({
              name: `${filePrefix}-page-${pNum}.pdf`,
              url: URL.createObjectURL(blob),
              sizeStr: formatBytes(bytes.length),
              pageLabel: `Page ${pNum}`,
              bytes,
            });
          }
        }
      }

      // --- MODE 2: SPLIT BY RANGES (CUSTOM OR FIXED) ---
      else if (activeTab === 'range') {
        let groups: { pages: number[]; label: string }[] = [];

        if (rangeMode === 'custom') {
          customRanges.forEach((r, idx) => {
            const s = Math.min(r.from, r.to);
            const e = Math.max(r.from, r.to);
            const pgs = Array.from({ length: e - s + 1 }, (_, i) => s + i);
            groups.push({ pages: pgs, label: `Range ${idx + 1} (Pages ${s}-${e})` });
          });
        } else {
          const step = Math.max(1, fixedStep);
          for (let s = 1; s <= numPages; s += step) {
            const e = Math.min(numPages, s + step - 1);
            const pgs = Array.from({ length: e - s + 1 }, (_, i) => s + i);
            groups.push({ pages: pgs, label: `Pages ${s}-${e}` });
          }
        }

        if (mergeRanges) {
          setStatusText('Merging all ranges into a single PDF... ⚡');
          const allPagesFlat = groups.flatMap((g) => g.pages);
          const bytes = await buildSubPdf(srcDoc, allPagesFlat);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          generated.push({
            name: `${filePrefix}-merged-ranges.pdf`,
            url: URL.createObjectURL(blob),
            sizeStr: formatBytes(bytes.length),
            pageLabel: `${groups.length} Ranges Combined (${allPagesFlat.length} Pages)`,
            bytes,
          });
        } else {
          for (let i = 0; i < groups.length; i++) {
            const grp = groups[i];
            setStatusText(`Creating ${grp.label}... ✂️`);
            const bytes = await buildSubPdf(srcDoc, grp.pages);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const firstP = grp.pages[0];
            const lastP = grp.pages[grp.pages.length - 1];
            generated.push({
              name: `${filePrefix}-pages-${firstP}-to-${lastP}.pdf`,
              url: URL.createObjectURL(blob),
              sizeStr: formatBytes(bytes.length),
              pageLabel: grp.label,
              bytes,
            });
          }
        }
      }

      // --- MODE 3: VISUAL SCISSOR SPLIT ---
      else if (activeTab === 'scissors') {
        const sortedCuts = [...splitPoints].sort((a, b) => a - b);
        const boundaries = [0, ...sortedCuts, numPages];

        for (let i = 0; i < boundaries.length - 1; i++) {
          const startPage = boundaries[i] + 1;
          const endPage = boundaries[i + 1];
          if (startPage > endPage) continue;

          const pgs = Array.from({ length: endPage - startPage + 1 }, (_, k) => startPage + k);
          setStatusText(`Cutting Part ${i + 1} (Pages ${startPage}-${endPage})... ✂️`);
          const bytes = await buildSubPdf(srcDoc, pgs);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          generated.push({
            name: `${filePrefix}-part-${i + 1}-pages-${startPage}-${endPage}.pdf`,
            url: URL.createObjectURL(blob),
            sizeStr: formatBytes(bytes.length),
            pageLabel: `Part ${i + 1} (Pages ${startPage}–${endPage})`,
            bytes,
          });
        }
      }

      // --- MODE 4: SPLIT BY MAX FILE SIZE (FREE PREMIUM FEATURE) ---
      else if (activeTab === 'size') {
        const maxBytes = Math.max(15, maxSizeKb) * 1024;
        let currentBatch: number[] = [];
        let partCounter = 1;

        for (let p = 1; p <= numPages; p++) {
          setStatusText(`Measuring & grouping Page ${p} of ${numPages} for ~${maxSizeKb} KB limit... ⚖️`);
          const candidateBatch = [...currentBatch, p];
          const testBytes = await buildSubPdf(srcDoc, candidateBatch);

          if (testBytes.length > maxBytes && currentBatch.length > 0) {
            // Save previous batch before adding page p
            const prevBytes = await buildSubPdf(srcDoc, currentBatch);
            const blob = new Blob([prevBytes], { type: 'application/pdf' });
            generated.push({
              name: `${filePrefix}-part-${partCounter}.pdf`,
              url: URL.createObjectURL(blob),
              sizeStr: formatBytes(prevBytes.length),
              pageLabel: `Part ${partCounter} (Pages ${currentBatch[0]}–${currentBatch[currentBatch.length - 1]})`,
              bytes: prevBytes,
            });
            partCounter++;
            currentBatch = [p];
          } else {
            currentBatch = candidateBatch;
          }
        }

        if (currentBatch.length > 0) {
          const finalBytes = await buildSubPdf(srcDoc, currentBatch);
          const blob = new Blob([finalBytes], { type: 'application/pdf' });
          generated.push({
            name: `${filePrefix}-part-${partCounter}.pdf`,
            url: URL.createObjectURL(blob),
            sizeStr: formatBytes(finalBytes.length),
            pageLabel: `Part ${partCounter} (Pages ${currentBatch[0]}–${currentBatch[currentBatch.length - 1]})`,
            bytes: finalBytes,
          });
        }
      }

      // Create Master ZIP Package if multiple files generated
      if (generated.length > 1) {
        setStatusText('Packaging all split PDFs into ZIP archive... 📦');
        const zip = new JSZip();
        generated.forEach((f) => {
          zip.file(f.name, f.bytes);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setZipUrl(URL.createObjectURL(zipBlob));
      }

      setOutputFiles(generated);
    } catch (err: any) {
      console.error('Split PDF error:', err);
      alert(`Split karne mein error aaya: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <span className="text-[11px] bg-rose-950 text-rose-300 border border-rose-700/50 px-3 py-1 rounded-full font-bold">
            ✂️ 4-in-1 Pro PDF Splitter (100% Free &amp; Private)
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Split PDF &amp; Extract Pages <span className="text-rose-500">Studio</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Extract specific pages visually, split by custom/fixed ranges, cut with interactive scissors, or split by maximum KB/MB file size.
          </p>
        </div>

        {/* Main Workspace Card */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-12 cursor-pointer transition bg-slate-950/60">
              <span className="text-4xl mb-3">✂️</span>
              <span className="text-base font-bold text-rose-400">
                {isPdfReady ? 'Click to Select or Drag & Drop PDF Here' : 'Loading PDF Engine... ⏳'}
              </span>
              <span className="text-xs text-slate-500 mt-2">
                Instant Visual Page Previews • Zero Server Uploads
              </span>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isPdfReady}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-6">
              {/* Loaded File Bar */}
              <div className="flex flex-wrap justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">
                      Total Pages: <strong className="text-rose-400">{numPages}</strong> • Size:{' '}
                      <strong>{fileSizeStr}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Output Name:</span>
                    <input
                      type="text"
                      value={filePrefix}
                      onChange={(e) => setFilePrefix(e.target.value)}
                      className="bg-transparent text-white font-bold outline-none w-36"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setThumbs([]);
                      setOutputFiles([]);
                      setZipUrl(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-800/40"
                  >
                    Change PDF ✕
                  </button>
                </div>
              </div>

              {/* 4 Split Modes Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('extract')}
                  className={`py-3 px-3 rounded-lg font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'extract'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  📑 Extract Pages
                </button>
                <button
                  onClick={() => setActiveTab('range')}
                  className={`py-3 px-3 rounded-lg font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'range'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  🔢 Split by Range
                </button>
                <button
                  onClick={() => setActiveTab('scissors')}
                  className={`py-3 px-3 rounded-lg font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'scissors'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  ✂️ Visual Scissors
                </button>
                <button
                  onClick={() => setActiveTab('size')}
                  className={`py-3 px-3 rounded-lg font-black transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'size'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  ⚖️ Split by Size
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    PRO FREE
                  </span>
                </button>
              </div>

              {/* ==================== MODE 1: EXTRACT PAGES ==================== */}
              {activeTab === 'extract' && (
                <div className="space-y-5 bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-[240px]">
                      <label className="block text-xs font-bold text-slate-300">
                        Pages to Extract (e.g. <code className="text-rose-400">1, 3, 5-8</code>)
                      </label>
                      <input
                        type="text"
                        value={extractInput}
                        onChange={(e) => applyExtractPattern(e.target.value)}
                        placeholder="e.g. 1, 3, 5-8"
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:border-rose-500 outline-none"
                      />
                    </div>

                    {/* Quick Filters: All / Odd / Even / Clear */}
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-400">Quick Select:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => selectQuickFilter('all')}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white"
                        >
                          All Pages
                        </button>
                        <button
                          onClick={() => selectQuickFilter('odd')}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-amber-300"
                        >
                          Odd (1,3,5..)
                        </button>
                        <button
                          onClick={() => selectQuickFilter('even')}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-blue-300"
                        >
                          Even (2,4,6..)
                        </button>
                        <button
                          onClick={() => selectQuickFilter('none')}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-red-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Merge Checkbox */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 font-bold">
                      <input
                        type="checkbox"
                        checked={mergeExtracted}
                        onChange={(e) => setMergeExtracted(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600"
                      />
                      Merge extracted pages into ONE single PDF file ({selectedPages.length} pages selected)
                    </label>
                  </div>

                  {/* Interactive Visual Page Grid */}
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400 font-medium">
                      💡 Click on any page thumbnail below to select or unselect it:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-3 bg-slate-900 rounded-xl border border-slate-800">
                      {thumbs.map((t) => {
                        const isSelected = selectedPages.includes(t.pageNumber);
                        return (
                          <div
                            key={t.pageNumber}
                            onClick={() => togglePageSelection(t.pageNumber)}
                            className={`relative p-2 rounded-xl border-2 cursor-pointer transition flex flex-col items-center ${
                              isSelected
                                ? 'border-rose-500 bg-rose-950/30 shadow-md scale-[1.02]'
                                : 'border-slate-800 bg-slate-950/50 opacity-50 hover:opacity-80'
                            }`}
                          >
                            <div
                              className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                isSelected ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </div>
                            <img
                              src={t.dataUrl}
                              alt={`Page ${t.pageNumber}`}
                              className="h-28 w-full object-contain bg-white rounded mb-2"
                            />
                            <span className="text-[11px] font-bold text-slate-200">
                              Page {t.pageNumber}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== MODE 2: SPLIT BY RANGES ==================== */}
              {activeTab === 'range' && (
                <div className="space-y-5 bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs">
                  {/* Range Sub-Mode Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRangeMode('custom')}
                      className={`px-4 py-2 rounded-lg font-bold transition border ${
                        rangeMode === 'custom'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      🎯 Custom Ranges
                    </button>
                    <button
                      onClick={() => setRangeMode('fixed')}
                      className={`px-4 py-2 rounded-lg font-bold transition border ${
                        rangeMode === 'fixed'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      📏 Fixed Page Range (Every N Pages)
                    </button>
                  </div>

                  {rangeMode === 'custom' ? (
                    <div className="space-y-3">
                      {customRanges.map((rng, idx) => (
                        <div
                          key={rng.id}
                          className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800"
                        >
                          <span className="font-black text-rose-400 w-20">Range {idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">From Page</span>
                            <input
                              type="number"
                              min={1}
                              max={numPages}
                              value={rng.from}
                              onChange={(e) =>
                                updateCustomRange(rng.id, 'from', Number(e.target.value))
                              }
                              className="w-20 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-center"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">to</span>
                            <input
                              type="number"
                              min={rng.from}
                              max={numPages}
                              value={rng.to}
                              onChange={(e) =>
                                updateCustomRange(rng.id, 'to', Number(e.target.value))
                              }
                              className="w-20 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-center"
                            />
                          </div>
                          {customRanges.length > 1 && (
                            <button
                              onClick={() => removeCustomRange(rng.id)}
                              className="ml-auto text-red-400 hover:text-red-300 font-bold px-2.5 py-1 bg-red-950/40 rounded"
                            >
                              Remove ✕
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={addCustomRange}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/40 rounded-xl font-bold transition"
                      >
                        + Add Another Range
                      </button>

                      <div className="pt-3 border-t border-slate-800">
                        <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 font-bold">
                          <input
                            type="checkbox"
                            checked={mergeRanges}
                            onChange={(e) => setMergeRanges(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600"
                          />
                          Merge all ranges into one single PDF file
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="block font-bold text-slate-200">
                        Split into page ranges of:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={numPages}
                          value={fixedStep}
                          onChange={(e) => setFixedStep(Math.max(1, Number(e.target.value)))}
                          className="w-24 p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-center text-sm"
                        />
                        <span className="text-slate-400">
                          pages per PDF file (Will create{' '}
                          <strong className="text-rose-400">
                            {Math.ceil(numPages / Math.max(1, fixedStep))}
                          </strong>{' '}
                          separate PDFs)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== MODE 3: VISUAL SCISSORS ==================== */}
              {activeTab === 'scissors' && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300 font-bold">
                      ✂️ Click the scissor icon between any two pages to cut the PDF there ({splitPoints.length + 1} parts will be created):
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSplitPoints(
                            Array.from({ length: Math.max(0, numPages - 1) }, (_, i) => i + 1)
                          )
                        }
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-rose-400 font-bold"
                      >
                        Cut After Every Page
                      </button>
                      <button
                        onClick={() => setSplitPoints([])}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-bold"
                      >
                        Reset Cuts
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto p-4 bg-slate-900 rounded-xl border border-slate-800">
                    {thumbs.map((t, idx) => {
                      const hasCutAfter = splitPoints.includes(t.pageNumber);
                      return (
                        <React.Fragment key={t.pageNumber}>
                          <div className="min-w-[115px] p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center">
                            <img
                              src={t.dataUrl}
                              alt={`Page ${t.pageNumber}`}
                              className="h-28 w-full object-contain bg-white rounded mb-1.5"
                            />
                            <span className="text-[11px] font-bold text-slate-300">
                              Page {t.pageNumber}
                            </span>
                          </div>

                          {idx < thumbs.length - 1 && (
                            <button
                              onClick={() => toggleScissorPoint(t.pageNumber)}
                              title={`Click to split after Page ${t.pageNumber}`}
                              className={`flex flex-col items-center justify-center px-2 py-8 rounded-xl border-2 border-dashed transition ${
                                hasCutAfter
                                  ? 'border-rose-500 bg-rose-600/20 text-rose-400 scale-105'
                                  : 'border-slate-700 hover:border-rose-400 text-slate-500 hover:text-rose-300'
                              }`}
                            >
                              <span className="text-lg">✂️</span>
                              <span className="text-[9px] font-black uppercase mt-1">
                                {hasCutAfter ? 'CUT' : 'Split'}
                              </span>
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================== MODE 4: SPLIT BY MAX FILE SIZE ==================== */}
              {activeTab === 'size' && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      ⚖️ Maximum Size Per Split PDF File (KB)
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Paid on iLovePDF • 100% Free on CareerSathi
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={20}
                      max={10240}
                      value={maxSizeKb}
                      onChange={(e) => setMaxSizeKb(Math.max(20, Number(e.target.value)))}
                      className="w-36 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-base text-center"
                    />
                    <span className="text-slate-400">
                      KB ({maxSizeKb >= 1024 ? `~${(maxSizeKb / 1024).toFixed(1)} MB` : `${maxSizeKb} KB`} max per part)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[50, 100, 200, 500, 1024, 2048].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => setMaxSizeKb(kb)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                          maxSizeKb === kb
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Split Action Button */}
              <button
                onClick={handleSplitPdf}
                disabled={isProcessing || isRenderingThumbs}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-black text-sm rounded-xl shadow-xl transition"
              >
                {isProcessing
                  ? statusText || 'Splitting PDF... ⏳'
                  : 'Split PDF & Generate Files Now ✂️'}
              </button>

              {/* Generated Split Files Results */}
              {outputFiles.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-4 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-xl">
                    <div>
                      <div className="text-emerald-400 font-black text-sm">
                        🎉 Successfully Created {outputFiles.length} PDF File(s)!
                      </div>
                      <div className="text-xs text-slate-400">
                        Download individual parts below or grab everything in 1 ZIP package.
                      </div>
                    </div>

                    {zipUrl && (
                      <a
                        href={zipUrl}
                        download={`${filePrefix}-all-parts.zip`}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                      >
                        📦 Download All as ZIP ({outputFiles.length} Files)
                      </a>
                    )}
                  </div>

                  {/* Individual File Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                    {outputFiles.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800 gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {item.pageLabel} • <strong className="text-emerald-400">{item.sizeStr}</strong>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          download={item.name}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shrink-0 transition"
                        >
                          Download 📥
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}