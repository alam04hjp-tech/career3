'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TextBlock {
  id: string;
  originalText: string;
  translatedText: string;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1 (top-down)
  w: number; // Normalized 0..1
  h: number; // Normalized 0..1
  fontSizeRatio: number;
}

interface TranslatedPage {
  pageNumber: number;
  originalCanvasUrl: string;
  renderedTranslatedUrl: string;
  width: number;
  height: number;
  blocks: TextBlock[];
  fullOriginalText: string;
  fullTranslatedText: string;
}

type OutputLayoutMode = 'overlay' | 'bilingual' | 'clean-a4';

const LANGUAGES = [
  { code: 'auto', name: '🔍 Auto-Detect Language' },
  { code: 'hi', name: '🇮🇳 Hindi (हिन्दी)' },
  { code: 'en', name: '🇬🇧 English (अंग्रेज़ी)' },
  { code: 'bn', name: '🇮🇳 Bengali (বাংলা)' },
  { code: 'mr', name: '🇮🇳 Marathi (मराठी)' },
  { code: 'ta', name: '🇮🇳 Tamil (தமிழ்)' },
  { code: 'te', name: '🇮🇳 Telugu (తెలుగు)' },
  { code: 'gu', name: '🇮🇳 Gujarati (ગુજરાતી)' },
  { code: 'pa', name: '🇮🇳 Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'kn', name: '🇮🇳 Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: '🇮🇳 Malayalam (മലയാളം)' },
  { code: 'or', name: '🇮🇳 Odia (ଓଡ଼ିଆ)' },
  { code: 'as', name: '🇮🇳 Assamese (অসমীয়া)' },
  { code: 'ur', name: '🇮🇳 Urdu (اردو)' },
  { code: 'sa', name: '🇮🇳 Sanskrit (संस्कृतम्)' },
  { code: 'es', name: '🇪🇸 Spanish' },
  { code: 'fr', name: '🇫🇷 French' },
  { code: 'de', name: '🇩🇪 German' },
];

export default function TranslatePdfPage() {
  // File & Pages State
  const [pages, setPages] = useState<TranslatedPage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [baseFileName, setBaseFileName] = useState<string>('careersathi-translated');

  // Language & Layout Settings
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('hi');
  const [layoutMode, setLayoutMode] = useState<OutputLayoutMode>('overlay');
  const [fontScale, setFontScale] = useState<number>(100);
  const [preserveNumbersAndCodes, setPreserveNumbersAndCodes] = useState<boolean>(true);

  // Processing & Progress States
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'translated' | 'blocks'>('split');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activePage = pages[activeIndex] || null;

  // Stop Speech on Unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Safe CDN Loader for PDF.js (Prevents Webpack canvas.node error)
  const loadPdfJsLibrary = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Free Neural Translation API Helper (Chunked for speed & reliability)
  const translateTextChunk = async (
    text: string,
    src: string,
    tgt: string
  ): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed) return '';
    // Skip pure numbers, dates, or symbols if preserve option is enabled
    if (preserveNumbersAndCodes && /^[\d\s.,:/\-+()%₹$]+$/.test(trimmed)) {
      return text;
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(
        trimmed
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Primary translation endpoint busy');
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((part: any) => part[0] || '').join('');
      }
      return text;
    } catch {
      // Fallback to MyMemory API
      try {
        const pair = `${src === 'auto' ? 'en' : src}|${tgt}`;
        const fallbackRes = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            trimmed.slice(0, 480)
          )}&langpair=${pair}`
        );
        const fbData = await fallbackRes.json();
        return fbData?.responseData?.translatedText || text;
      } catch {
        return text;
      }
    }
  };

  // Batch Translate Array of Strings Fast by Combining with Delimiter
  const batchTranslateBlocks = async (
    texts: string[],
    src: string,
    tgt: string,
    onProgress?: (done: number, total: number) => void
  ): Promise<string[]> => {
    const results: string[] = new Array(texts.length).fill('');
    const DELIM = ' \n[[[CS_SPLIT]]]\n ';
    let currentBatchIndices: number[] = [];
    let currentBatchCharCount = 0;

    const flushBatch = async (indices: number[]) => {
      if (indices.length === 0) return;
      const combined = indices.map((i) => texts[i].replace(/\n+/g, ' ')).join(DELIM);
      const translatedCombined = await translateTextChunk(combined, src, tgt);
      const parts = translatedCombined.split(/\s*\[\[\[CS_SPLIT\]\]\]\s*/i);

      if (parts.length === indices.length) {
        indices.forEach((origIdx, pIdx) => {
          results[origIdx] = parts[pIdx].trim();
        });
      } else {
        // Fallback individual translation if delimiter got altered
        for (const origIdx of indices) {
          results[origIdx] = await translateTextChunk(texts[origIdx], src, tgt);
        }
      }
    };

    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      if (!t.trim()) {
        results[i] = '';
        continue;
      }
      if (currentBatchCharCount + t.length > 1400 || currentBatchIndices.length >= 12) {
        await flushBatch(currentBatchIndices);
        if (onProgress) onProgress(i, texts.length);
        currentBatchIndices = [];
        currentBatchCharCount = 0;
      }
      currentBatchIndices.push(i);
      currentBatchCharCount += t.length;
    }

    if (currentBatchIndices.length > 0) {
      await flushBatch(currentBatchIndices);
      if (onProgress) onProgress(texts.length, texts.length);
    }

    return results;
  };

  // Render Translated Page Visual Canvas (Supports Overlay, Bilingual & Clean A4 in ANY Script!)
  const renderVisualTranslatedPage = useCallback(
    async (
      page: TranslatedPage,
      mode: OutputLayoutMode,
      scalePercent: number
    ): Promise<string> => {
      return new Promise((resolve) => {
        const origImg = new Image();
        origImg.crossOrigin = 'anonymous';
        origImg.onload = () => {
          const canvas = document.createElement('canvas');
          const w = origImg.width;
          const h = origImg.height;

          // ------------------------------------------------------------------
          // MODE 1: EXACT LAYOUT OVERLAY (Erases original text & draws translation in-place)
          // ------------------------------------------------------------------
          if (mode === 'overlay') {
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(origImg, 0, 0);

            for (const blk of page.blocks) {
              const textToDraw = (blk.translatedText || blk.originalText).trim();
              if (!textToDraw) continue;

              const bx = Math.max(0, Math.round(blk.x * w) - 3);
              const by = Math.max(0, Math.round(blk.y * h) - 2);
              const bw = Math.min(w - bx, Math.round(blk.w * w) + 8);
              const bh = Math.min(h - by, Math.round(blk.h * h) + 6);

              if (bw <= 2 || bh <= 2) continue;

              // Sample surrounding background pixel color to cover original text cleanly
              const sampleX = Math.max(0, bx - 2);
              const sampleY = Math.max(0, by - 2);
              const pData = ctx.getImageData(sampleX, sampleY, 1, 1).data;
              const isDarkBg = (pData[0] + pData[1] + pData[2]) / 3 < 115;

              ctx.fillStyle = isDarkBg
                ? `rgb(${pData[0]}, ${pData[1]}, ${pData[2]})`
                : '#ffffff';
              ctx.fillRect(bx, by, bw, bh);

              // Auto-fit font size inside bounding box
              const baseFontPx = Math.max(
                11,
                Math.round(blk.fontSizeRatio * h * (scalePercent / 100))
              );
              ctx.fillStyle = isDarkBg ? '#ffffff' : '#0f172a';
              ctx.textBaseline = 'top';

              // Word-wrap inside block width
              let fontPx = baseFontPx;
              ctx.font = `600 ${fontPx}px system-ui, -apple-system, "Noto Sans Devanagari", sans-serif`;

              const words = textToDraw.split(/\s+/);
              const lines: string[] = [];
              let currentLine = '';

              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width > bw && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);

              // Scale down slightly if wrapped into multiple lines
              if (lines.length > 1 && lines.length * fontPx * 1.2 > bh * 1.35) {
                fontPx = Math.max(10, Math.floor((bh * 1.25) / lines.length));
                ctx.font = `600 ${fontPx}px system-ui, -apple-system, "Noto Sans Devanagari", sans-serif`;
              }

              lines.forEach((ln, idx) => {
                ctx.fillText(ln, bx + 2, by + idx * (fontPx * 1.22));
              });
            }

            resolve(canvas.toDataURL('image/jpeg', 0.94));
          }

          // ------------------------------------------------------------------
          // MODE 2 & 3: BILINGUAL STUDY SHEET OR CLEAN A4 DOCUMENT
          // ------------------------------------------------------------------
          else {
            const docW = 1240;
            const padding = 70;
            const contentW = docW - padding * 2;
            const tempCtx = document.createElement('canvas').getContext('2d')!;

            interface RenderLine {
              text: string;
              isOriginal: boolean;
              yOffset: number;
              fontSize: number;
            }

            const renderLines: RenderLine[] = [];
            let cursorY = padding + 60;

            const wrapParagraph = (
              str: string,
              fontPx: number,
              isOrig: boolean
            ) => {
              tempCtx.font = `${isOrig ? '500' : '700'} ${fontPx}px system-ui, -apple-system, "Noto Sans Devanagari", sans-serif`;
              const words = str.split(/\s+/);
              let line = '';
              for (const wWord of words) {
                const test = line ? `${line} ${wWord}` : wWord;
                if (tempCtx.measureText(test).width > contentW && line) {
                  renderLines.push({
                    text: line,
                    isOriginal: isOrig,
                    yOffset: cursorY,
                    fontSize: fontPx,
                  });
                  cursorY += fontPx * 1.45;
                  line = wWord;
                } else {
                  line = test;
                }
              }
              if (line) {
                renderLines.push({
                  text: line,
                  isOriginal: isOrig,
                  yOffset: cursorY,
                  fontSize: fontPx,
                });
                cursorY += fontPx * 1.45;
              }
            };

            const baseFont = Math.round(22 * (scalePercent / 100));

            for (const blk of page.blocks) {
              if (!blk.originalText.trim() && !blk.translatedText.trim()) continue;
              if (mode === 'bilingual') {
                wrapParagraph(blk.originalText, Math.max(15, baseFont - 3), true);
                cursorY += 4;
              }
              wrapParagraph(
                blk.translatedText || blk.originalText,
                baseFont,
                false
              );
              cursorY += 18;
            }

            canvas.width = docW;
            canvas.height = Math.max(1754, cursorY + padding);
            const ctx = canvas.getContext('2d')!;

            // White A4 Sheet Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Top Header Strip
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(0, 0, canvas.width, 14);
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px system-ui, sans-serif';
            ctx.fillText(
              `Page ${page.pageNumber} • CareerSathi AI PDF Translator (${
                mode === 'bilingual' ? 'Bilingual Study Mode' : 'Translated Document'
              })`,
              padding,
              48
            );

            // Draw All Wrapped Lines
            for (const rl of renderLines) {
              ctx.font = `${rl.isOriginal ? '500' : '700'} ${
                rl.fontSize
              }px system-ui, -apple-system, "Noto Sans Devanagari", sans-serif`;
              ctx.fillStyle = rl.isOriginal ? '#64748b' : '#0f172a';
              ctx.fillText(rl.text, padding, rl.yOffset);
            }

            resolve(canvas.toDataURL('image/jpeg', 0.94));
          }
        };
        origImg.src = page.originalCanvasUrl;
      });
    },
    []
  );

  // Re-render visual pages when layoutMode or fontScale changes
  useEffect(() => {
    if (pages.length === 0) return;
    let cancelled = false;
    (async () => {
      const updated: TranslatedPage[] = [];
      for (const pg of pages) {
        const url = await renderVisualTranslatedPage(pg, layoutMode, fontScale);
        updated.push({ ...pg, renderedTranslatedUrl: url });
      }
      if (!cancelled) setPages(updated);
    })();
    return () => {
      cancelled = true;
    };
  }, [layoutMode, fontScale, renderVisualTranslatedPage]);

  // Extract Text Lines + Coordinates from Uploaded PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPdf(true);
    setProgressPercent(10);
    setStatusMsg('Loading PDF & analyzing layout coordinates...');
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setBaseFileName(`${cleanName}-${targetLang}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await loadPdfJsLibrary();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const extractedPages: TranslatedPage[] = [];

      for (let p = 1; p <= numPages; p++) {
        setStatusMsg(`Scanning Page ${p} of ${numPages} layout & text blocks...`);
        setProgressPercent(Math.round((p / numPages) * 45));

        const page = await pdf.getPage(p);
        const scale = 1.8;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const origDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        // Extract text items and group nearby items on the same horizontal line
        const textContent = await page.getTextContent();
        const rawItems: {
          str: string;
          x: number;
          y: number;
          w: number;
          h: number;
        }[] = [];

        for (const item of textContent.items as any[]) {
          if (!item.str || !item.str.trim()) continue;
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontH = Math.hypot(tx[2], tx[3]);
          const x = tx[4];
          const y = tx[5] - fontH;
          const w = item.width * scale;
          const h = Math.max(fontH, 12);
          rawItems.push({ str: item.str, x, y, w, h });
        }

        // Sort top-to-bottom, then left-to-right
        rawItems.sort((a, b) => (Math.abs(a.y - b.y) > 8 ? a.y - b.y : a.x - b.x));

        // Group items into visual lines/blocks
        const groupedBlocks: TextBlock[] = [];
        for (const it of rawItems) {
          const last = groupedBlocks[groupedBlocks.length - 1];
          const sameLine =
            last &&
            Math.abs(it.y / viewport.height - last.y) < 0.014 &&
            it.x / viewport.width - (last.x + last.w) < 0.08;

          if (sameLine && last) {
            last.originalText += (last.originalText.endsWith(' ') ? '' : ' ') + it.str;
            const rightEdge = Math.max(
              last.x + last.w,
              (it.x + it.w) / viewport.width
            );
            last.w = rightEdge - last.x;
            last.h = Math.max(last.h, it.h / viewport.height);
          } else {
            groupedBlocks.push({
              id: `p${p}-b${groupedBlocks.length}`,
              originalText: it.str,
              translatedText: '',
              x: it.x / viewport.width,
              y: it.y / viewport.height,
              w: Math.max(0.05, it.w / viewport.width),
              h: Math.max(0.018, it.h / viewport.height),
              fontSizeRatio: Math.max(0.014, (it.h / viewport.height) * 0.85),
            });
          }
        }

        const fullOrig = groupedBlocks.map((b) => b.originalText).join('\n');

        extractedPages.push({
          pageNumber: p,
          originalCanvasUrl: origDataUrl,
          renderedTranslatedUrl: origDataUrl,
          width: canvas.width,
          height: canvas.height,
          blocks: groupedBlocks,
          fullOriginalText: fullOrig,
          fullTranslatedText: '',
        });
      }

      setPages(extractedPages);
      setActiveIndex(0);
      setIsLoadingPdf(false);

      // Automatically trigger translation after loading
      await translateLoadedPages(extractedPages, sourceLang, targetLang);
    } catch (err: unknown) {
      console.error('PDF load error:', err);
      alert('PDF file read karne mein dikkat aayi. Kripya valid PDF file upload karein.');
      setIsLoadingPdf(false);
      setStatusMsg('');
    }
    e.target.value = '';
  };

  // Run Neural Translation Across All Pages
  const translateLoadedPages = async (
    pagesToProcess: TranslatedPage[],
    src: string,
    tgt: string
  ) => {
    if (pagesToProcess.length === 0) return;
    setIsTranslating(true);
    setProgressPercent(50);

    try {
      const updatedPages: TranslatedPage[] = [];

      for (let pIdx = 0; pIdx < pagesToProcess.length; pIdx++) {
        const pg = pagesToProcess[pIdx];
        setStatusMsg(
          `Translating Page ${pg.pageNumber} of ${pagesToProcess.length} into ${tgt.toUpperCase()}...`
        );

        if (pg.blocks.length === 0) {
          // Fallback note if scanned image PDF has no selectable text
          const fallbackBlock: TextBlock = {
            id: `p${pg.pageNumber}-ocr-note`,
            originalText: '[Scanned Image Page Detected]',
            translatedText:
              'यह स्कैन किया गया इमेज पेज है। आप नीचे बॉक्स में कोई भी टेक्स्ट टाइप या एडिट करके अनुवाद कर सकते हैं।',
            x: 0.08,
            y: 0.05,
            w: 0.84,
            h: 0.08,
            fontSizeRatio: 0.022,
          };
          const renderedUrl = await renderVisualTranslatedPage(
            { ...pg, blocks: [fallbackBlock] },
            layoutMode,
            fontScale
          );
          updatedPages.push({
            ...pg,
            blocks: [fallbackBlock],
            renderedTranslatedUrl: renderedUrl,
          });
          continue;
        }

        const rawTexts = pg.blocks.map((b) => b.originalText);
        const translatedTexts = await batchTranslateBlocks(
          rawTexts,
          src,
          tgt,
          (done, total) => {
            const baseP = 50 + Math.round(((pIdx + done / total) / pagesToProcess.length) * 45);
            setProgressPercent(Math.min(98, baseP));
          }
        );

        const newBlocks = pg.blocks.map((b, idx) => ({
          ...b,
          translatedText: translatedTexts[idx] || b.originalText,
        }));

        const updatedPageObj: TranslatedPage = {
          ...pg,
          blocks: newBlocks,
          fullTranslatedText: newBlocks.map((b) => b.translatedText).join('\n'),
        };

        const visualUrl = await renderVisualTranslatedPage(
          updatedPageObj,
          layoutMode,
          fontScale
        );
        updatedPageObj.renderedTranslatedUrl = visualUrl;
        updatedPages.push(updatedPageObj);
      }

      setPages(updatedPages);
      setProgressPercent(100);
      setStatusMsg('');
    } finally {
      setIsTranslating(false);
    }
  };

  // Update a Single Block's Translated Text Live & Re-Render Canvas
  const handleBlockEdit = async (blockId: string, newText: string) => {
    if (!activePage) return;
    const updatedBlocks = activePage.blocks.map((b) =>
      b.id === blockId ? { ...b, translatedText: newText } : b
    );
    const updatedPage: TranslatedPage = {
      ...activePage,
      blocks: updatedBlocks,
      fullTranslatedText: updatedBlocks.map((b) => b.translatedText).join('\n'),
    };
    const visualUrl = await renderVisualTranslatedPage(updatedPage, layoutMode, fontScale);
    updatedPage.renderedTranslatedUrl = visualUrl;

    setPages((prev) => prev.map((p, idx) => (idx === activeIndex ? updatedPage : p)));
  };

  // Voice Read-Aloud (TTS) for Active Page
  const toggleSpeakPage = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !activePage) {
      alert('Aapke browser mein Voice Read-Aloud supported nahi hai.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = activePage.blocks
      .map((b) => b.translatedText || b.originalText)
      .join('. ');
    if (!textToRead.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = targetLang === 'hi' ? 'hi-IN' : targetLang === 'en' ? 'en-IN' : `${targetLang}-IN`;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // ============================================================================
  // EXPORT HANDLERS: Multi-Page Translated PDF, Editable Word (.DOC), & .TXT
  // ============================================================================
  const downloadTranslatedPdf = async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    setStatusMsg('Building High-Resolution Translated PDF...');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      for (const pg of pages) {
        const renderedUrl = await renderVisualTranslatedPage(pg, layoutMode, fontScale);
        const base64 = renderedUrl.split(',')[1];
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }

        const embeddedJpg = await pdfDoc.embedJpg(bytes);
        const pdfPage = pdfDoc.addPage([embeddedJpg.width, embeddedJpg.height]);
        pdfPage.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: embeddedJpg.width,
          height: embeddedJpg.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFileName}-${layoutMode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
      setStatusMsg('');
    }
  };

  const downloadWordDoc = () => {
    if (pages.length === 0) return;
    let htmlBody = '';
    for (const pg of pages) {
      htmlBody += `<h2>Page ${pg.pageNumber}</h2>`;
      for (const blk of pg.blocks) {
        if (layoutMode === 'bilingual') {
          htmlBody += `<p style="color:#64748b;margin-bottom:2px;font-size:11pt;">${blk.originalText}</p>`;
        }
        htmlBody += `<p style="color:#0f172a;font-weight:bold;margin-top:0;margin-bottom:12px;font-size:13pt;">${
          blk.translatedText || blk.originalText
        }</p>`;
      }
      htmlBody += `<hr/>`;
    }

    const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Translated PDF</title></head><body style="font-family:'Nirmala UI',Mangal,Arial,sans-serif;line-height:1.6;">${htmlBody}</body></html>`;
    const blob = new Blob(['\ufeff', fullHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFileName}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navbar */}
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
                🌐 AI Translate PDF Studio{' '}
                <span className="text-[11px] bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black">
                  LAYOUT PRESERVING
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Translate English Notifications, NCERTs &amp; Coaching PDFs into Hindi &amp; 15+ Indian Languages with Exact Layout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            📂 Upload PDF to Translate
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
        </div>

        {/* Language & Mode Bar */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-end text-xs">
          <div className="md:col-span-3">
            <label className="block font-bold text-slate-400 mb-1">From Language</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block font-bold text-emerald-400 mb-1">
              Translate Into (Target Language)
            </label>
            <select
              value={targetLang}
              onChange={(e) => {
                const nextLang = e.target.value;
                setTargetLang(nextLang);
                if (pages.length > 0) {
                  translateLoadedPages(pages, sourceLang, nextLang);
                }
              }}
              className="w-full p-2.5 bg-slate-950 border border-emerald-500/60 rounded-xl text-emerald-300 font-black"
            >
              {LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block font-bold text-amber-400 mb-1">
              PDF Output Layout Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'overlay', label: '🎯 Exact Layout' },
                { id: 'bilingual', label: '📖 Bilingual' },
                { id: 'clean-a4', label: '📄 Clean A4' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLayoutMode(m.id as OutputLayoutMode)}
                  className={`py-2.5 px-2 rounded-xl font-black border text-center transition ${
                    layoutMode === m.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              disabled={pages.length === 0 || isTranslating}
              onClick={() => translateLoadedPages(pages, sourceLang, targetLang)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-xl shadow transition"
            >
              {isTranslating ? '⏳ Translating...' : '🔄 Re-Translate'}
            </button>
          </div>
        </div>

        {/* Empty Hero State */}
        {pages.length === 0 && !isLoadingPdf && (
          <div className="bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-3xl p-8 md:p-14 text-center space-y-6 transition">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-4xl">
              🌐
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl font-black text-white">
                Upload Any PDF to Translate into Hindi, English &amp; 15+ Languages
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                100% Free Unlimited Pages • Preserves Original Tables &amp; Layout • Bilingual Exam Study Sheet Mode • Editable Live Proofreader &amp; Voice Reader
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition"
            >
              🚀 Select PDF File from Device
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left text-xs">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-black text-amber-400">🎯 1. Exact Layout Overlay</div>
                <p className="text-slate-400 text-[11px]">
                  Replaces English sentences in-place with Hindi/Regional text at the exact same coordinates while keeping images &amp; tables intact.
                </p>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-black text-emerald-400">📖 2. Bilingual Study Mode</div>
                <p className="text-slate-400 text-[11px]">
                  Prints Original English paragraph followed immediately by its Hindi translation—ideal for SSC, Banking &amp; UPSC aspirants!
                </p>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-black text-cyan-400">✏️ 3. Live Edit + Word Export</div>
                <p className="text-slate-400 text-[11px]">
                  Click any translated sentence to tweak words live, listen with Voice TTS, and export as PDF or MS Word (.DOC).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {(isLoadingPdf || isTranslating || isExporting) && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="animate-spin">⏳</span> {statusMsg}
              </span>
              <span className="text-white">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        {pages.length > 0 && !isLoadingPdf && (
          <div className="space-y-4">
            {/* Toolbar: View Switcher, Font Size, Audio TTS & Export Buttons */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-xl font-black transition ${
                    viewMode === 'split'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  ⚖️ Side-by-Side View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('translated')}
                  className={`px-3 py-1.5 rounded-xl font-black transition ${
                    viewMode === 'translated'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  📄 Translated PDF Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('blocks')}
                  className={`px-3 py-1.5 rounded-xl font-black transition ${
                    viewMode === 'blocks'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  ✏️ Edit Translated Sentences ({activePage?.blocks.length || 0})
                </button>

                <button
                  type="button"
                  onClick={toggleSpeakPage}
                  className={`px-3 py-1.5 rounded-xl font-black transition ${
                    isSpeaking
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                  }`}
                >
                  {isSpeaking ? '⏹ Stop Audio' : '🔊 Listen Page'}
                </button>
              </div>

              {/* Font Scale & Download Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Text Size:</span>
                  <button
                    type="button"
                    onClick={() => setFontScale((s) => Math.max(70, s - 10))}
                    className="px-1.5 font-black text-slate-200"
                  >
                    -
                  </button>
                  <span className="font-bold text-amber-400">{fontScale}%</span>
                  <button
                    type="button"
                    onClick={() => setFontScale((s) => Math.min(140, s + 10))}
                    className="px-1.5 font-black text-slate-200"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isExporting || isTranslating}
                  onClick={downloadTranslatedPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow transition"
                >
                  📥 Download Translated PDF ({pages.length} P)
                </button>
                <button
                  type="button"
                  onClick={downloadWordDoc}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow transition"
                >
                  📝 Word (.DOC)
                </button>
              </div>
            </div>

            {/* VIEW 1: SIDE-BY-SIDE ORIGINAL VS TRANSLATED CANVAS */}
            {viewMode === 'split' && activePage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>📄 Original PDF (Page {activePage.pageNumber})</span>
                    <span>Source</span>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2 flex justify-center max-h-[640px] overflow-auto">
                    <img
                      src={activePage.originalCanvasUrl}
                      alt="Original PDF Page"
                      className="max-h-[600px] w-auto object-contain rounded shadow bg-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                    <span>
                      ✨ Translated PDF Preview (Page {activePage.pageNumber})
                    </span>
                    <span className="uppercase">{layoutMode} Mode</span>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-2 flex justify-center max-h-[640px] overflow-auto">
                    <img
                      src={activePage.renderedTranslatedUrl}
                      alt="Translated PDF Page"
                      className="max-h-[600px] w-auto object-contain rounded shadow bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: FULL TRANSLATED PAGE PREVIEW */}
            {viewMode === 'translated' && activePage && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/40 flex justify-center max-h-[720px] overflow-auto">
                <img
                  src={activePage.renderedTranslatedUrl}
                  alt="Translated Full Preview"
                  className="max-h-[680px] w-auto object-contain rounded shadow-2xl bg-white"
                />
              </div>
            )}

            {/* VIEW 3: LIVE SENTENCE-BY-SENTENCE PROOFREADER & EDITOR */}
            {viewMode === 'blocks' && activePage && (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 max-h-[640px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                  <span className="font-black text-amber-400">
                    ✏️ Live Translation Proofreader — Edit any line below &amp; PDF updates automatically:
                  </span>
                  <span className="text-slate-400">Page {activePage.pageNumber}</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {activePage.blocks.map((blk, i) => (
                    <div
                      key={blk.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"
                    >
                      <div className="text-slate-400 leading-relaxed">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Original #{i + 1}
                        </span>
                        {blk.originalText}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">
                          Translated #{i + 1} (Editable)
                        </span>
                        <textarea
                          rows={2}
                          value={blk.translatedText}
                          onChange={(e) => handleBlockEdit(blk.id, e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg text-white font-bold outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Page Navigation Strip */}
            {pages.length > 1 && (
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center gap-3 overflow-x-auto">
                {pages.map((pg, idx) => (
                  <button
                    key={pg.pageNumber}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`min-w-[90px] p-2 rounded-xl border-2 text-center transition ${
                      idx === activeIndex
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={pg.renderedTranslatedUrl}
                      alt={`Page ${pg.pageNumber}`}
                      className="h-16 w-full object-contain bg-white rounded mb-1"
                    />
                    <span className="text-[10px] font-black text-slate-200">
                      Page {pg.pageNumber}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}