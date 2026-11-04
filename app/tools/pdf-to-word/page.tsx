'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Link from 'next/link';

interface PageExtract {
  pageNumber: number;
  lines: {
    text: string;
    isHeading: boolean;
    fontSize: number;
  }[];
  rawText: string;
}

export default function PdfToWordConverter() {
  // File & Engine States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isPdfReady, setIsPdfReady] = useState<boolean>(false);
  const [isOcrReady, setIsOcrReady] = useState<boolean>(false);

  // Mode & Settings States
  const [mode, setMode] = useState<'no-ocr' | 'ocr'>('no-ocr');
  const [ocrLang, setOcrLang] = useState<'eng' | 'hin' | 'eng+hin'>('eng+hin');
  const [scanDetectionMsg, setScanDetectionMsg] = useState<string>('');
  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number>(1);
  const [preservePageBreaks, setPreservePageBreaks] = useState<boolean>(true);

  // Conversion & Output States
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedPages, setExtractedPages] = useState<PageExtract[]>([]);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Load PDF.js and Tesseract.js OCR from CDN (Zero SSR Build Errors)
  useEffect(() => {
    // Load PDF.js
    if ((window as any).pdfjsLib) {
      setIsPdfReady(true);
    } else {
      const pdfScript = document.createElement('script');
      pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      pdfScript.async = true;
      pdfScript.onload = () => {
        if ((window as any).pdfjsLib) {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setIsPdfReady(true);
        }
      };
      document.body.appendChild(pdfScript);
    }

    // Load Tesseract.js v5 for Client-Side AI OCR
    if ((window as any).Tesseract) {
      setIsOcrReady(true);
    } else {
      const ocrScript = document.createElement('script');
      ocrScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      ocrScript.async = true;
      ocrScript.onload = () => setIsOcrReady(true);
      document.body.appendChild(ocrScript);
    }
  }, []);

  // 2. Handle PDF Upload + Smart Auto-Detect (Digital vs Scanned PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Kripya sirf valid PDF file select karein!');
        return;
      }

      setSelectedFile(file);
      setExtractedPages([]);
      setScanDetectionMsg('Analyzing PDF structure... 🔍');

      try {
        const pdfjsLib = (window as any).pdfjsLib;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        setNumPages(pdf.numPages);
        setFromPage(1);
        setToPage(pdf.numPages);

        // Check first page for digital text vs scanned image
        const firstPage = await pdf.getPage(1);
        const textContent = await firstPage.getTextContent();
        const totalChars = textContent.items
          .map((item: any) => item.str || '')
          .join('')
          .trim().length;

        if (totalChars < 15) {
          setMode('ocr');
          setScanDetectionMsg(
            '🔍 Scanned / Image PDF Detected! Humne automatically "OCR Mode" select kar diya hai taaki photo se text nikal sake.'
          );
        } else {
          setMode('no-ocr');
          setScanDetectionMsg(
            '⚡ Digital PDF Detected! "No-OCR Mode" selected hai — 1 second mein original formatting ke sath convert hoga.'
          );
        }
      } catch (err) {
        console.error('Analysis error:', err);
        setScanDetectionMsg('');
      }
    }
  };

  // 3. Spatial Layout Reconstruction for Non-OCR Mode
  const extractDigitalPageLayout = async (page: any, pageNum: number): Promise<PageExtract> => {
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const pdfjsLib = (window as any).pdfjsLib;

    interface PositionedItem {
      str: string;
      x: number;
      y: number;
      fontSize: number;
      width: number;
    }

    const items: PositionedItem[] = [];

    for (const raw of textContent.items) {
      if (!raw.str || !raw.str.trim()) continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, raw.transform);
      const fontHeight = Math.round(Math.hypot(tx[2], tx[3]));
      items.push({
        str: raw.str,
        x: tx[4],
        y: tx[5],
        fontSize: fontHeight || 11,
        width: raw.width || raw.str.length * 5,
      });
    }

    // Sort top-to-bottom (Y), then left-to-right (X)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
      return a.x - b.x;
    });

    // Group items into visual lines
    const groupedLines: { items: PositionedItem[]; y: number; maxFont: number }[] = [];

    for (const item of items) {
      const lastLine = groupedLines[groupedLines.length - 1];
      if (!lastLine || Math.abs(lastLine.y - item.y) > Math.max(lastLine.maxFont * 0.55, 5)) {
        groupedLines.push({ items: [item], y: item.y, maxFont: item.fontSize });
      } else {
        lastLine.items.push(item);
        if (item.fontSize > lastLine.maxFont) lastLine.maxFont = item.fontSize;
      }
    }

    // Build structured lines preserving column/table gaps via tabs
    const structuredLines = groupedLines.map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      let lineText = '';
      let prevEndX = -1;

      for (const it of line.items) {
        if (prevEndX !== -1) {
          const gap = it.x - prevEndX;
          if (gap > 35) {
            lineText += '\t\t'; // Table / Column spacing
          } else if (gap > 3) {
            lineText += ' ';
          }
        }
        lineText += it.str;
        prevEndX = it.x + it.width;
      }

      return {
        text: lineText.trim(),
        isHeading: line.maxFont >= 14,
        fontSize: line.maxFont,
      };
    });

    return {
      pageNumber: pageNum,
      lines: structuredLines,
      rawText: structuredLines.map((l) => l.text).join('\n'),
    };
  };

  // 4. Main Conversion Handler (Both No-OCR & AI OCR)
  const convertPdfToWord = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setProgress(5);
    setExtractedPages([]);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      const start = Math.max(1, Math.min(fromPage, pdf.numPages));
      const end = Math.max(start, Math.min(toPage, pdf.numPages));
      const totalToProcess = end - start + 1;
      const results: PageExtract[] = [];

      if (mode === 'no-ocr') {
        // --- MODE 1: FAST DIGITAL NON-OCR ---
        for (let p = start; p <= end; p++) {
          setStatusText(`Extracting layout & formatting from Page ${p} of ${end}... ⚡`);
          const page = await pdf.getPage(p);
          const pageData = await extractDigitalPageLayout(page, p);
          results.push(pageData);
          setProgress(Math.round(((p - start + 1) / totalToProcess) * 100));
        }
      } else {
        // --- MODE 2: AI SMART OCR (Tesseract.js) ---
        const Tesseract = (window as any).Tesseract;
        if (!Tesseract) {
          alert('OCR Engine abhi load ho raha hai, 2 second baad try karein.');
          setIsConverting(false);
          return;
        }

        setStatusText(`Initializing AI OCR Engine (${ocrLang.toUpperCase()})... 🧠`);
        const worker = await Tesseract.createWorker(ocrLang);

        for (let p = start; p <= end; p++) {
          setStatusText(`Scanning Page ${p} of ${end} with Optical Character Recognition (OCR)... 🔍`);
          const page = await pdf.getPage(p);

          // Render at 2.2x scale for crisp OCR accuracy
          const viewport = page.getViewport({ scale: 2.2 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgDataUrl = canvas.toDataURL('image/png');

          const { data } = await worker.recognize(imgDataUrl);
          const rawLines = (data.text || '')
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);

          results.push({
            pageNumber: p,
            lines: rawLines.map((lineText: string, idx: number) => ({
              text: lineText,
              isHeading: idx === 0 && lineText.length < 60,
              fontSize: 12,
            })),
            rawText: rawLines.join('\n'),
          });

          setProgress(Math.round(((p - start + 1) / totalToProcess) * 100));
        }

        await worker.terminate();
      }

      setExtractedPages(results);
      setActivePreviewPage(start);
      setStatusText('Conversion Complete! 🎉');
    } catch (error: any) {
      console.error('PDF to Word Error:', error);
      alert(`Conversion mein error aaya: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Allow user to edit extracted text directly before downloading
  const handleEditPageText = (pageNumber: number, newText: string) => {
    setExtractedPages((prev) =>
      prev.map((pg) => {
        if (pg.pageNumber !== pageNumber) return pg;
        const updatedLines = newText.split('\n').map((t) => ({
          text: t,
          isHeading: false,
          fontSize: 12,
        }));
        return { ...pg, rawText: newText, lines: updatedLines };
      })
    );
  };

  // Helper: Escape XML characters for genuine .DOCX creation
  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  // 5. Generate Genuine OpenXML Microsoft Word (.DOCX) using JSZip
  const downloadTrueDocx = async () => {
    if (extractedPages.length === 0) return;

    const zip = new JSZip();

    // 1. [Content_Types].xml
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    // 2. _rels/.rels
    zip.folder('_rels')?.file(
      '.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    // 3. Build word/document.xml paragraphs
    let bodyXml = '';

    extractedPages.forEach((pg, pageIdx) => {
      const lines = pg.rawText.split('\n');
      lines.forEach((lineText, lineIdx) => {
        const metaLine = pg.lines[lineIdx];
        const isHeading = metaLine?.isHeading || false;
        const fontSizeHalfPts = isHeading ? 28 : 22; // 14pt for headings, 11pt for body

        const parts = lineText.split('\t');
        let runsXml = '';

        parts.forEach((part, partIdx) => {
          runsXml += `<w:r>
            <w:rPr>
              ${isHeading ? '<w:b/>' : ''}
              <w:sz w:val="${fontSizeHalfPts}"/>
              <w:szCs w:val="${fontSizeHalfPts}"/>
            </w:rPr>
            ${partIdx > 0 ? '<w:tab/>' : ''}
            <w:t xml:space="preserve">${escapeXml(part)}</w:t>
          </w:r>`;
        });

        bodyXml += `<w:p>
          <w:pPr><w:spacing w:after="120"/></w:pPr>
          ${runsXml}
        </w:p>`;
      });

      // Add Page Break between PDF pages if enabled
      if (preservePageBreaks && pageIdx < extractedPages.length - 1) {
        bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
      }
    });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    zip.folder('word')?.file('document.xml', documentXml);

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.pdf$/i, '') || 'document'}-careersathi.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 6. Download Rich Layout .DOC (Compatible with older MS Word & WPS)
  const downloadRichDoc = () => {
    if (extractedPages.length === 0) return;

    const htmlPages = extractedPages
      .map((pg) => {
        const paragraphs = pg.rawText
          .split('\n')
          .map((line, i) => {
            const isH = pg.lines[i]?.isHeading;
            const formatted = escapeXml(line).replace(/\t+/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            return isH
              ? `<p style="font-size:14pt;font-weight:bold;margin:8pt 0;">${formatted}</p>`
              : `<p style="font-size:11pt;margin:4pt 0;line-height:1.4;">${formatted}</p>`;
          })
          .join('');
        return `<div style="page-break-after:${preservePageBreaks ? 'always' : 'auto'};">${paragraphs}</div>`;
      })
      .join('');

    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>CareerSathi Word Export</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;">${htmlPages}</body>
    </html>`;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.pdf$/i, '') || 'document'}-careersathi.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy All Text
  const copyAllToClipboard = () => {
    const allText = extractedPages.map((p) => `--- Page ${p.pageNumber} ---\n${p.rawText}`).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPreviewObj =
    extractedPages.find((p) => p.pageNumber === activePreviewPage) || extractedPages[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <span className="text-[11px] bg-blue-950 text-blue-300 border border-blue-700/50 px-3 py-1 rounded-full font-bold">
            100% Free Unlimited OCR + No-OCR
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            PDF to Word Converter <span className="text-blue-400">(With AI OCR)</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Convert both digital and scanned PDFs into 100% editable Microsoft Word (<strong>.DOCX</strong>) documents. Supports Hindi &amp; English OCR with live pre-download editing.
          </p>
        </div>

        {/* Main Workspace Card */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {/* Upload Dropzone */}
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-12 cursor-pointer transition bg-slate-950/60">
              <span className="text-4xl mb-3">📘</span>
              <span className="text-base font-bold text-blue-400">
                {isPdfReady ? 'Click to Select or Drag & Drop PDF Here' : 'Loading PDF Engine... ⏳'}
              </span>
              <span className="text-xs text-slate-500 mt-2">
                Supports Digital PDFs &amp; Scanned Marksheets / Notifications (100% Private)
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
              {/* File Info Bar */}
              <div className="flex flex-wrap justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">
                      Total Pages: <strong>{numPages}</strong> • {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setExtractedPages([]);
                    setScanDetectionMsg('');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-800/40"
                >
                  Change File ✕
                </button>
              </div>

              {/* Smart Detection Alert Banner */}
              {scanDetectionMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    mode === 'ocr'
                      ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                      : 'bg-blue-950/40 border-blue-600/50 text-blue-200'
                  }`}
                >
                  <span>{scanDetectionMsg}</span>
                </div>
              )}

              {/* iLovePDF-Style Mode Selector (NO-OCR vs OCR) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: NO OCR */}
                <div
                  onClick={() => setMode('no-ocr')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    mode === 'no-ocr'
                      ? 'border-blue-500 bg-blue-950/30 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white flex items-center gap-2">
                        ⚡ NO OCR (Digital PDF)
                      </span>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Super Fast
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Convert PDFs with selectable text into editable Word files while keeping headings, columns, and line spacing intact.
                    </p>
                  </div>
                </div>

                {/* Option 2: AI OCR */}
                <div
                  onClick={() => setMode('ocr')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    mode === 'ocr'
                      ? 'border-emerald-500 bg-emerald-950/30 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white flex items-center gap-2">
                        🔍 OCR (Scanned / Photo PDF)
                      </span>
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">
                        FREE PRO FEATURE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Extract editable text from scanned certificates, camera photos, and non-selectable Hindi/English Sarkari PDFs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Options Bar (Language, Page Range, Page Breaks) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* OCR Language Selector */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Document Language {mode === 'no-ocr' && '(Auto)'}
                  </label>
                  <select
                    value={ocrLang}
                    disabled={mode === 'no-ocr'}
                    onChange={(e) => setOcrLang(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium disabled:opacity-50"
                  >
                    <option value="eng+hin">🇮🇳 Bilingual (English + Hindi)</option>
                    <option value="eng">🇬🇧 English Only (Faster)</option>
                    <option value="hin">🇮🇳 Hindi Only (हिंदी)</option>
                  </select>
                </div>

                {/* Page Range Filter */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Page Range (1 to {numPages})</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={numPages}
                      value={fromPage}
                      onChange={(e) => setFromPage(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-center font-bold"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="number"
                      min={fromPage}
                      max={numPages}
                      value={toPage}
                      onChange={(e) => setToPage(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-center font-bold"
                    />
                  </div>
                </div>

                {/* Page Break Option */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Word Formatting</label>
                  <label className="flex items-center gap-2 h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer text-slate-200 font-medium">
                    <input
                      type="checkbox"
                      checked={preservePageBreaks}
                      onChange={(e) => setPreservePageBreaks(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    Keep Page Breaks in Word
                  </label>
                </div>
              </div>

              {/* Convert Button & Progress Bar */}
              <div className="space-y-3">
                <button
                  onClick={convertPdfToWord}
                  disabled={isConverting}
                  className={`w-full py-4 rounded-xl font-black text-sm shadow-xl transition ${
                    isConverting
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : mode === 'ocr'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isConverting
                    ? `${statusText} (${progress}%)`
                    : mode === 'ocr'
                    ? 'Convert Scanned PDF with AI OCR 🚀'
                    : 'Convert PDF to Editable Word (.DOCX) 🚀'}
                </button>

                {isConverting && (
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Editable Word Output & Download Bar */}
          {extractedPages.length > 0 && !isConverting && (
            <div className="pt-6 border-t border-slate-800 space-y-6 animate-fade-in">
              {/* Download Buttons Panel */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="text-emerald-400 font-black text-base">
                    ✅ Word Document Ready! ({extractedPages.length} Pages Converted)
                  </div>
                  <p className="text-xs text-slate-400">
                    Aap niche live preview mein text edit bhi kar sakte hain download karne se pehle!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={downloadTrueDocx}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    📥 Download .DOCX (MS Word)
                  </button>

                  <button
                    onClick={downloadRichDoc}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    📘 Download .DOC
                  </button>

                  <button
                    onClick={copyAllToClipboard}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy All Text'}
                  </button>
                </div>
              </div>

              {/* Live Editable Word Document Preview (Better than iLovePDF/Smallpdf) */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>📝 Live Word Preview &amp; Pre-Download Editor</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                      Editable
                    </span>
                  </div>

                  {/* Page Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {extractedPages.map((pg) => (
                      <button
                        key={pg.pageNumber}
                        onClick={() => setActivePreviewPage(pg.pageNumber)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          activePreviewPage === pg.pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Page {pg.pageNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {currentPreviewObj && (
                  <div className="p-4 md:p-6 bg-slate-950">
                    <textarea
                      value={currentPreviewObj.rawText}
                      onChange={(e) => handleEditPageText(currentPreviewObj.pageNumber, e.target.value)}
                      rows={14}
                      className="w-full p-6 bg-white text-slate-900 rounded-xl shadow-inner font-sans text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="No text found on this page..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comparison Table for SEO & User Trust */}
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-black text-white">
            Why CareerSathi PDF to Word is Better than iLovePDF &amp; Smallpdf?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-emerald-400 font-black">CareerSathi</th>
                  <th className="py-3 px-4">iLovePDF / Smallpdf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 px-4 font-medium">Scanned PDF OCR (Hindi + English)</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">✓ 100% Free Unlimited</td>
                  <td className="py-3 px-4 text-red-400">✗ Paid Pro Only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Edit Text Before Downloading Word File</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">✓ Live In-Browser Editor</td>
                  <td className="py-3 px-4 text-red-400">✗ Not Available</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Document Privacy</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">✓ 100% Browser Processing (No Upload)</td>
                  <td className="py-3 px-4 text-amber-400">Uploaded to External Servers</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Custom Page Range Selection</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">✓ Convert Specific Pages</td>
                  <td className="py-3 px-4 text-red-400">✗ Converts Whole File Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}