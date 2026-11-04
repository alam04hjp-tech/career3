'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import Link from 'next/link';

type FilterType = 'magic' | 'bw' | 'lighten' | 'grayscale' | 'original';
type PageLayoutType = 'a4-fit' | 'original-size' | 'id-card-2in1';

interface ScannedPage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  filter: FilterType;
  rotation: number; // 0, 90, 180, 270
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  cropMargin: number; // 0 to 20 (% edge trim)
  width: number;
  height: number;
}

export default function ScanToPdfStudio() {
  // Pages & Selection State
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Live Camera States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // PDF Export Settings
  const [pageLayout, setPageLayout] = useState<PageLayoutType>('a4-fit');
  const [pageMargin, setPageMargin] = useState<'none' | 'small' | 'normal'>('small');
  const [qualityKbMode, setQualityKbMode] = useState<'high' | 'medium' | 'custom'>('high');
  const [targetKb, setTargetKb] = useState<number>(200);
  const [fileName, setFileName] = useState<string>('careersathi-scanned-doc');

  // Processing & Download States
  const [isProcessingFilter, setIsProcessingFilter] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [finalPdfSize, setFinalPdfSize] = useState<string>('');

  const activePage = pages[activeIndex] || null;

  // Format Bytes Helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Stop Camera Stream on Unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Live Camera (Mobile Back Camera or Webcam)
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    stopCamera();
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Camera permission allow nahi hai ya device mein camera nahi mila. Aap niche "Upload Photos" button se bhi scan kar sakte hain.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Core Image Processing Engine (CamScanner Magic Color, B&W Xerox, Shadow Removal, Rotation & Trim)
  const processDocumentImage = (
    srcUrl: string,
    filter: FilterType,
    rotation: number,
    brightness: number,
    contrast: number,
    cropMargin: number,
    maxDimension: number = 1800,
    jpegQuality: number = 0.85
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 1. Calculate Crop / Edge Trim
        const trimRatio = Math.max(0, Math.min(25, cropMargin)) / 100;
        const sx = img.width * trimRatio;
        const sy = img.height * trimRatio;
        const sw = img.width * (1 - trimRatio * 2);
        const sh = img.height * (1 - trimRatio * 2);

        // 2. Scale down safely for fast browser processing while keeping HD text
        const scale = Math.min(1, maxDimension / Math.max(sw, sh));
        const drawW = Math.round(sw * scale);
        const drawH = Math.round(sh * scale);

        const canvas = document.createElement('canvas');
        const isRotatedSides = rotation === 90 || rotation === 270;
        canvas.width = isRotatedSides ? drawH : drawW;
        canvas.height = isRotatedSides ? drawW : drawH;

        const ctx = canvas.getContext('2d')!;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 3. Pixel-Level Document Scanner Filters
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Apply user Brightness & Contrast first
          if (brightness !== 0) {
            r += brightness * 1.8;
            g += brightness * 1.8;
            b += brightness * 1.8;
          }
          if (contrast !== 0) {
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
          }

          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filter === 'magic') {
            // CamScanner "Magic Color": Whitens paper shadows (>155 luminance) & sharpens ink/stamps
            if (lum > 165) {
              r = Math.min(255, r * 1.25 + 35);
              g = Math.min(255, g * 1.25 + 35);
              b = Math.min(255, b * 1.25 + 35);
            } else if (lum < 105) {
              // Deepen dark ink & colored stamps
              r = Math.max(0, r * 0.72);
              g = Math.max(0, g * 0.72);
              b = Math.max(0, b * 0.72);
            } else {
              // Mid-tone boost
              r = Math.min(255, Math.max(0, (r - 128) * 1.35 + 138));
              g = Math.min(255, Math.max(0, (g - 128) * 1.35 + 138));
              b = Math.min(255, Math.max(0, (b - 128) * 1.35 + 138));
            }
          } else if (filter === 'bw') {
            // Crisp Black & White Document Xerox (Removes all shadows)
            const val = lum > 142 ? 255 : lum < 95 ? 0 : Math.round(((lum - 95) / 47) * 255);
            r = g = b = val;
          } else if (filter === 'lighten') {
            // Shadow Remover (Keeps natural colors but removes grey phone shadow)
            const boost = lum > 130 ? 45 : 20;
            r = Math.min(255, r + boost);
            g = Math.min(255, g + boost);
            b = Math.min(255, b + boost);
          } else if (filter === 'grayscale') {
            // Clean Official Grayscale
            const cleanGray = lum > 175 ? Math.min(255, lum + 30) : Math.max(0, (lum - 128) * 1.25 + 128);
            r = g = b = cleanGray;
          }

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', jpegQuality),
          width: canvas.width,
          height: canvas.height,
        });
      };
      img.src = srcUrl;
    });
  };

  // Add New Raw Image URL as a Scanned Page (Default to 'magic' filter)
  const addRawImageToPages = async (rawUrl: string) => {
    setIsProcessingFilter(true);
    try {
      const processed = await processDocumentImage(rawUrl, 'magic', 0, 0, 0, 0);
      const newPage: ScannedPage = {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        originalUrl: rawUrl,
        processedUrl: processed.dataUrl,
        filter: 'magic',
        rotation: 0,
        brightness: 0,
        contrast: 0,
        cropMargin: 0,
        width: processed.width,
        height: processed.height,
      };
      setPages((prev) => {
        const next = [...prev, newPage];
        setActiveIndex(next.length - 1);
        return next;
      });
      setPdfDownloadUrl(null);
    } finally {
      setIsProcessingFilter(false);
    }
  };

  // Capture Photo from Live Camera
  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawUrl = canvas.toDataURL('image/jpeg', 0.92);
    await addRawImageToPages(rawUrl);
  };

  // Handle Multi-Photo Upload from Gallery / PC
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const rawUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      await addRawImageToPages(rawUrl);
    }
    e.target.value = '';
  };

  // Update Current Page Filter / Rotation / Adjustments
  const updateActivePageSettings = async (
    patch: Partial<Pick<ScannedPage, 'filter' | 'rotation' | 'brightness' | 'contrast' | 'cropMargin'>>
  ) => {
    if (!activePage) return;
    setIsProcessingFilter(true);

    const updatedFilter = patch.filter ?? activePage.filter;
    const updatedRot = patch.rotation !== undefined ? patch.rotation : activePage.rotation;
    const updatedBright = patch.brightness !== undefined ? patch.brightness : activePage.brightness;
    const updatedContrast = patch.contrast !== undefined ? patch.contrast : activePage.contrast;
    const updatedCrop = patch.cropMargin !== undefined ? patch.cropMargin : activePage.cropMargin;

    const processed = await processDocumentImage(
      activePage.originalUrl,
      updatedFilter,
      updatedRot,
      updatedBright,
      updatedContrast,
      updatedCrop
    );

    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activeIndex
          ? {
              ...p,
              filter: updatedFilter,
              rotation: updatedRot,
              brightness: updatedBright,
              contrast: updatedContrast,
              cropMargin: updatedCrop,
              processedUrl: processed.dataUrl,
              width: processed.width,
              height: processed.height,
            }
          : p
      )
    );
    setPdfDownloadUrl(null);
    setIsProcessingFilter(false);
  };

  // Apply Current Filter to All Pages at Once
  const applyFilterToAllPages = async (filterToApply: FilterType) => {
    if (pages.length === 0) return;
    setIsProcessingFilter(true);
    const updatedList: ScannedPage[] = [];

    for (const pg of pages) {
      const proc = await processDocumentImage(
        pg.originalUrl,
        filterToApply,
        pg.rotation,
        pg.brightness,
        pg.contrast,
        pg.cropMargin
      );
      updatedList.push({
        ...pg,
        filter: filterToApply,
        processedUrl: proc.dataUrl,
        width: proc.width,
        height: proc.height,
      });
    }
    setPages(updatedList);
    setPdfDownloadUrl(null);
    setIsProcessingFilter(false);
  };

  // Reorder & Delete Pages
  const movePage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pages.length) return;
    const copy = [...pages];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setPages(copy);
    setActiveIndex(newIndex);
    setPdfDownloadUrl(null);
  };

  const deletePage = (index: number) => {
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activeIndex >= next.length) {
        setActiveIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
    setPdfDownloadUrl(null);
  };

  // Convert DataURL to Uint8Array
  const dataUrlToBytes = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  };

  // Build PDF with Given Scale & JPEG Quality (Supports A4, Original, and ID Card 2-in-1 Layout)
  const buildScannedPdfBytes = async (maxDim: number, jpegQual: number): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const marginPts = pageMargin === 'none' ? 0 : pageMargin === 'small' ? 18 : 36;

    // Re-encode pages at requested resolution & quality for exact KB control
    const encodedPages: { bytes: Uint8Array; width: number; height: number }[] = [];
    for (const pg of pages) {
      const rendered = await processDocumentImage(
        pg.originalUrl,
        pg.filter,
        pg.rotation,
        pg.brightness,
        pg.contrast,
        pg.cropMargin,
        maxDim,
        jpegQual
      );
      encodedPages.push({
        bytes: dataUrlToBytes(rendered.dataUrl),
        width: rendered.width,
        height: rendered.height,
      });
    }

    if (pageLayout === 'id-card-2in1') {
      // Put 2 scans (Front & Back of Aadhaar/PAN/ID) on 1 single A4 Page (595 x 842)
      const a4W = 595.28;
      const a4H = 841.89;
      for (let i = 0; i < encodedPages.length; i += 2) {
        const page = pdfDoc.addPage([a4W, a4H]);
        const slotH = (a4H - marginPts * 3) / 2;
        const slotW = a4W - marginPts * 2;

        // Top Slot (Front Side)
        const topItem = encodedPages[i];
        const topImg = await pdfDoc.embedJpg(topItem.bytes);
        const topScale = Math.min(slotW / topItem.width, slotH / topItem.height);
        const topDrawW = topItem.width * topScale;
        const topDrawH = topItem.height * topScale;

        page.drawImage(topImg, {
          x: (a4W - topDrawW) / 2,
          y: a4H - marginPts - slotH + (slotH - topDrawH) / 2,
          width: topDrawW,
          height: topDrawH,
        });

        // Subtle dashed cut line in middle
        page.drawLine({
          start: { x: 40, y: a4H / 2 },
          end: { x: a4W - 40, y: a4H / 2 },
          thickness: 0.5,
          color: rgb(0.75, 0.75, 0.75),
        });

        // Bottom Slot (Back Side, if exists)
        if (i + 1 < encodedPages.length) {
          const botItem = encodedPages[i + 1];
          const botImg = await pdfDoc.embedJpg(botItem.bytes);
          const botScale = Math.min(slotW / botItem.width, slotH / botItem.height);
          const botDrawW = botItem.width * botScale;
          const botDrawH = botItem.height * botScale;

          page.drawImage(botImg, {
            x: (a4W - botDrawW) / 2,
            y: marginPts + (slotH - botDrawH) / 2,
            width: botDrawW,
            height: botDrawH,
          });
        }
      }
    } else if (pageLayout === 'a4-fit') {
      // Standard A4 Document (Auto Portrait/Landscape orientation based on scan)
      for (const item of encodedPages) {
        const isLandscape = item.width > item.height;
        const pW = isLandscape ? 841.89 : 595.28;
        const pH = isLandscape ? 595.28 : 841.89;
        const page = pdfDoc.addPage([pW, pH]);

        const availW = pW - marginPts * 2;
        const availH = pH - marginPts * 2;
        const scale = Math.min(availW / item.width, availH / item.height);
        const dW = item.width * scale;
        const dH = item.height * scale;

        const jpgImg = await pdfDoc.embedJpg(item.bytes);
        page.drawImage(jpgImg, {
          x: (pW - dW) / 2,
          y: (pH - dH) / 2,
          width: dW,
          height: dH,
        });
      }
    } else {
      // Original Image Dimensions
      for (const item of encodedPages) {
        const page = pdfDoc.addPage([item.width, item.height]);
        const jpgImg = await pdfDoc.embedJpg(item.bytes);
        page.drawImage(jpgImg, {
          x: 0,
          y: 0,
          width: item.width,
          height: item.height,
        });
      }
    }

    return await pdfDoc.save({ useObjectStreams: true });
  };

  // Export Final Scanned PDF (With Smart Target KB Loop)
  const generateScannedPdf = async () => {
    if (pages.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      let finalBytes: Uint8Array;

      if (qualityKbMode === 'high') {
        finalBytes = await buildScannedPdfBytes(2000, 0.88);
      } else if (qualityKbMode === 'medium') {
        finalBytes = await buildScannedPdfBytes(1400, 0.72);
      } else {
        // Custom Exact Target KB Binary Search
        const targetBytes = Math.max(15, targetKb) * 1024;
        let minDim = 600;
        let maxDim = 1900;
        let minQ = 0.22;
        let maxQ = 0.88;
        let bestBytes: Uint8Array | null = null;
        let closestDiff = Infinity;

        for (let pass = 1; pass <= 3; pass++) {
          const curDim = Math.round((minDim + maxDim) / 2);
          const curQ = (minQ + maxQ) / 2;
          const trial = await buildScannedPdfBytes(curDim, curQ);
          const diff = Math.abs(trial.length - targetBytes);

          if (diff < closestDiff) {
            closestDiff = diff;
            bestBytes = trial;
          }
          if (trial.length <= targetBytes && trial.length >= targetBytes * 0.85) {
            bestBytes = trial;
            break;
          }
          if (trial.length > targetBytes) {
            maxDim = curDim;
            maxQ = curQ;
          } else {
            minDim = curDim;
            minQ = curQ;
          }
        }
        finalBytes = bestBytes!;
      }

      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfDownloadUrl(url);
      setFinalPdfSize(formatBytes(finalBytes.length));

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'careersathi-scan'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`PDF banane mein error aaya: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-3 py-1 rounded-full font-bold">
              📸 CamScanner Pro Alternative • 100% Free &amp; No Watermark
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Scan to PDF <span className="text-cyan-400">Document Studio</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
            Scan marksheets, ID cards, admit cards, and handwritten notes using your camera or gallery. Automatically removes shadows, whitens paper, and exports to exact KB limits.
          </p>
        </div>

        {/* Action Bar: Open Camera or Upload Photos */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-center gap-4">
          {!isCameraOpen ? (
            <button
              onClick={() => startCamera('environment')}
              className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2"
            >
              📷 Open Live Camera Scanner
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2"
            >
              ✕ Close Camera
            </button>
          )}

          <label className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2">
            🖼️ Upload Photos from Gallery / PC
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Live Camera Viewfinder Modal / Section */}
        {isCameraOpen && (
          <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border-2 border-cyan-500/60 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Live Document Camera ({facingMode === 'environment' ? 'Back Camera' : 'Front Camera'})
              </span>
              <button
                onClick={switchCamera}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-slate-200 border border-slate-700"
              >
                🔄 Switch Front / Back Camera
              </button>
            </div>

            {cameraError ? (
              <div className="p-6 bg-red-950/50 border border-red-700 rounded-xl text-center text-xs text-red-200">
                {cameraError}
              </div>
            ) : (
              <div className="relative max-w-2xl mx-auto bg-black rounded-xl overflow-hidden border border-slate-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[60vh] object-contain mx-auto"
                />
                {/* Document Alignment Guide Overlay */}
                <div className="absolute inset-6 border-2 border-dashed border-cyan-400/70 rounded-xl pointer-events-none flex items-end justify-center pb-3">
                  <span className="text-[11px] bg-black/70 text-cyan-300 px-3 py-1 rounded-full font-bold">
                    Place Marksheet / ID Card inside frame
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={captureFromCamera}
                className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-full shadow-xl transition transform active:scale-95"
              >
                📸 Capture Page ({pages.length} Scanned)
              </button>
            </div>
          </div>
        )}

        {/* Main Scanner Studio Workspace (When at least 1 page is scanned) */}
        {pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT / CENTER: Live Page Preview & CamScanner Filters (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="text-xs font-bold text-slate-300">
                  Editing Page <strong className="text-cyan-400">{activeIndex + 1}</strong> of{' '}
                  <strong>{pages.length}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateActivePageSettings({ rotation: (activePage.rotation + 90) % 360 })
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700"
                  >
                    ↻ Rotate 90°
                  </button>
                  <button
                    onClick={() => deletePage(activeIndex)}
                    className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-lg border border-red-800/50"
                  >
                    🗑️ Delete Page
                  </button>
                </div>
              </div>

              {/* Preview Canvas Container */}
              {activePage && (
                <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-center justify-center min-h-[360px] max-h-[480px] overflow-hidden">
                  {isProcessingFilter && (
                    <div className="absolute inset-0 bg-slate-950/75 z-10 flex items-center justify-center text-xs font-bold text-cyan-400">
                      ✨ Enhancing Document Quality...
                    </div>
                  )}
                  <img
                    src={activePage.processedUrl}
                    alt="Scanned Preview"
                    className="max-h-[440px] w-auto object-contain rounded shadow-2xl bg-white"
                  />
                </div>
              )}

              {/* 5 CamScanner-Style Filter Buttons */}
              {activePage && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      🎨 Document Enhancement Filters:
                    </span>
                    <button
                      onClick={() => applyFilterToAllPages(activePage.filter)}
                      className="text-[11px] text-cyan-400 hover:underline font-bold"
                    >
                      ✓ Apply "{activePage.filter.toUpperCase()}" to All {pages.length} Pages
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { id: 'magic', label: '✨ Magic Color', desc: 'Best for Marksheets' },
                      { id: 'bw', label: '📄 B&W Xerox', desc: 'Pure White Paper' },
                      { id: 'lighten', label: '☀️ Remove Shadow', desc: 'Clears Dark Photos' },
                      { id: 'grayscale', label: '🌑 Grayscale', desc: 'Official Mono' },
                      { id: 'original', label: '🖼️ Original', desc: 'Raw Photo' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => updateActivePageSettings({ filter: f.id as FilterType })}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          activePage.filter === f.id
                            ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-black text-[11px]">{f.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{f.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Fine-Tune Sliders: Brightness, Contrast & Edge Trim */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 font-medium">☀️ Brightness</span>
                        <span className="font-bold text-cyan-400">{activePage.brightness}</span>
                      </div>
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        step={5}
                        value={activePage.brightness}
                        onChange={(e) =>
                          updateActivePageSettings({ brightness: Number(e.target.value) })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 font-medium">🌗 Contrast</span>
                        <span className="font-bold text-cyan-400">{activePage.contrast}</span>
                      </div>
                      <input
                        type="range"
                        min={-40}
                        max={50}
                        step={5}
                        value={activePage.contrast}
                        onChange={(e) =>
                          updateActivePageSettings({ contrast: Number(e.target.value) })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 font-medium">✂️ Border Trim</span>
                        <span className="font-bold text-cyan-400">{activePage.cropMargin}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={2}
                        value={activePage.cropMargin}
                        onChange={(e) =>
                          updateActivePageSettings({ cropMargin: Number(e.target.value) })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Page Thumbnails Strip (Reorder & Select) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400">
                  📑 Scanned Pages ({pages.length}) — Click to edit or use arrows to reorder:
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`min-w-[95px] p-2 rounded-xl border-2 cursor-pointer transition flex flex-col items-center ${
                        idx === activeIndex
                          ? 'border-cyan-500 bg-cyan-950/30'
                          : 'border-slate-800 bg-slate-950/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.processedUrl}
                        alt={`Scan ${idx + 1}`}
                        className="h-20 w-full object-contain bg-white rounded mb-1.5"
                      />
                      <div className="flex items-center justify-between w-full text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(idx, -1);
                          }}
                          disabled={idx === 0}
                          className="px-1 bg-slate-800 rounded disabled:opacity-30"
                        >
                          ◀
                        </button>
                        <span className="font-bold">P.{idx + 1}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(idx, 1);
                          }}
                          disabled={idx === pages.length - 1}
                          className="px-1 bg-slate-800 rounded disabled:opacity-30"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: PDF Layout, ID Card Mode & Target KB Export (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                  ⚙️ PDF Output &amp; Sarkari Form Settings
                </h3>

                {/* 1. Page Layout Mode (Including ID Card Front+Back on 1 Page) */}
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-300">Page Layout Format</label>
                  <div className="grid grid-cols-1 gap-2">
                    <div
                      onClick={() => setPageLayout('a4-fit')}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        pageLayout === 'a4-fit'
                          ? 'border-cyan-500 bg-cyan-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">📄 Standard A4 Page (1 Scan per Page)</div>
                      <div className="text-[11px] text-slate-400">
                        Best for Marksheets, Certificates &amp; Notes
                      </div>
                    </div>

                    <div
                      onClick={() => setPageLayout('id-card-2in1')}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        pageLayout === 'id-card-2in1'
                          ? 'border-cyan-500 bg-cyan-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>🪪 ID Card Mode (Front + Back on 1 A4 Page)</span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                          SARKARI SPECIAL
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Combines Page 1 &amp; Page 2 vertically on a single A4 sheet (Aadhaar / PAN / College ID)
                      </div>
                    </div>

                    <div
                      onClick={() => setPageLayout('original-size')}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        pageLayout === 'original-size'
                          ? 'border-cyan-500 bg-cyan-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold">📐 Exact Photo Size (No A4 Borders)</div>
                      <div className="text-[11px] text-slate-400">
                        PDF page matches exact cropped photo dimensions
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Margin Selection */}
                {pageLayout !== 'original-size' && (
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-300">Page White Margin</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['none', 'small', 'normal'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPageMargin(m)}
                          className={`py-2 rounded-lg font-bold capitalize border ${
                            pageMargin === m
                              ? 'bg-cyan-600 text-white border-cyan-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. File Size / Target KB Selector */}
                <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block font-bold text-slate-300">
                    🎯 Output PDF Size Control
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setQualityKbMode('high')}
                      className={`py-2 rounded-lg font-bold border ${
                        qualityKbMode === 'high'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      💎 HD Print
                    </button>
                    <button
                      onClick={() => setQualityKbMode('medium')}
                      className={`py-2 rounded-lg font-bold border ${
                        qualityKbMode === 'medium'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      ⚡ Standard
                    </button>
                    <button
                      onClick={() => setQualityKbMode('custom')}
                      className={`py-2 rounded-lg font-bold border ${
                        qualityKbMode === 'custom'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      🎯 Target KB
                    </button>
                  </div>

                  {qualityKbMode === 'custom' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={20}
                          max={5000}
                          value={targetKb}
                          onChange={(e) => setTargetKb(Math.max(20, Number(e.target.value)))}
                          className="w-28 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-black text-center"
                        />
                        <span className="text-slate-400 font-bold">KB Max Target</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[50, 100, 150, 200, 300, 500].map((kb) => (
                          <button
                            key={kb}
                            onClick={() => setTargetKb(kb)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                              targetKb === kb
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {kb} KB
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. File Name */}
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-300">Document Name</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Export & Download Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <button
                  onClick={generateScannedPdf}
                  disabled={isGeneratingPdf || isProcessingFilter}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black text-sm rounded-xl shadow-xl transition"
                >
                  {isGeneratingPdf
                    ? 'Building Scanned PDF... ⏳'
                    : `Create & Download Scanned PDF (${pages.length} Page${pages.length > 1 ? 's' : ''}) 📥`}
                </button>

                {pdfDownloadUrl && (
                  <div className="p-4 bg-emerald-950/50 border border-emerald-500/60 rounded-xl text-center space-y-2">
                    <div className="text-xs font-black text-emerald-300">
                      ✅ Scanned PDF Ready! • Size: <span className="text-white">{finalPdfSize}</span>
                    </div>
                    <a
                      href={pdfDownloadUrl}
                      download={`${fileName || 'careersathi-scan'}.pdf`}
                      className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow"
                    >
                      Download PDF Again 📥
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}