'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ==========================================
// 1. STUDIO PRESETS (COLORS, GRADIENTS & MODES)
// ==========================================

type AiCutoutMode = 'portrait' | 'signature' | 'auto-color';
type BgTabType = 'transparent' | 'color' | 'gradient' | 'image';
type WorkspaceTool = 'compare' | 'brush-erase' | 'brush-restore';

const SOLID_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Passport Sky Blue', hex: '#2F8BFF' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Studio Grey', hex: '#E2E8F0' },
  { name: 'Official Red', hex: '#DC2626' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Pitch Black', hex: '#0F172A' },
];

const STUDIO_GRADIENTS = [
  { name: 'Cyber Blue', c1: '#0F172A', c2: '#1D4ED8' },
  { name: 'Sunset Glow', c1: '#F97316', c2: '#DB2777' },
  { name: 'Emerald Mint', c1: '#064E3B', c2: '#10B981' },
  { name: 'Royal Purple', c1: '#311042', c2: '#9333EA' },
  { name: 'Soft Daylight', c1: '#F8FAFC', c2: '#BAE6FD' },
  { name: 'Golden Studio', c1: '#78350F', c2: '#F59E0B' },
];

export default function BestAiBackgroundRemover() {
  // Source & Mask Canvases
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string>('');
  const [imgDims, setImgDims] = useState<{ w: number; h: number }>({ w: 600, h: 600 });

  // AI Engine States
  const [aiMode, setAiMode] = useState<AiCutoutMode>('portrait');
  const [isAiLoaded, setIsAiLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Interactive Workspace Mode (Compare Slider vs Magic Erase/Restore Brush)
  const [activeTool, setActiveTool] = useState<WorkspaceTool>('compare');
  const [comparePos, setComparePos] = useState<number>(50); // 0 to 100%
  const [showCompareSplit, setShowCompareSplit] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(28);

  // Edge Matting & Refinement Controls
  const [edgeShift, setEdgeShift] = useState<number>(8); // -25 to +30 (De-fringe / Ear keep)
  const [edgeFeather, setEdgeFeather] = useState<number>(2); // 0 to 8px
  const [defringePower, setDefringePower] = useState<number>(65); // Removes background color spill on hair
  const [sigThreshold, setSigThreshold] = useState<number>(205); // For signature transparent mode

  // Background Replacement Controls
  const [bgTab, setBgTab] = useState<BgTabType>('transparent');
  const [selectedColor, setSelectedColor] = useState<string>('#2F8BFF');
  const [selectedGradient, setSelectedGradient] = useState<{ c1: string; c2: string }>(
    STUDIO_GRADIENTS[0]
  );
  const [customBgImg, setCustomBgImg] = useState<HTMLImageElement | null>(null);
  const [bgBlurPx, setBgBlurPx] = useState<number>(0);

  // Studio Effects (Sticker Outline, Drop Shadow, Face Relight)
  const [outlineSize, setOutlineSize] = useState<number>(0); // 0 to 16px white sticker border
  const [outlineColor, setOutlineColor] = useState<string>('#FFFFFF');
  const [dropShadow, setDropShadow] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(6);
  const [contrast, setContrast] = useState<number>(10);

  // Export & Exact KB Controls
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [targetKbMode, setTargetKbMode] = useState<'max' | 'custom'>('max');
  const [targetKb, setTargetKb] = useState<number>(45);
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [outputBytes, setOutputBytes] = useState<number>(0);

  // Refs for High-Speed Mask Editing & AI
  const segmenterRef = useRef<any>(null);
  const pendingMaskResolveRef = useRef<((mask: HTMLCanvasElement | null) => void) | null>(null);
  const editableMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isBrushingRef = useRef<boolean>(false);

  const formatKb = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  // ==========================================
  // 2. LOAD MEDIAPIPE AI SEGMENTER FROM CDN
  // ==========================================
  useEffect(() => {
    const loadSegmenter = () => {
      if ((window as any).SelfieSegmentation) {
        initSegmenter();
        return;
      }
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
      script.async = true;
      script.onload = () => initSegmenter();
      document.body.appendChild(script);
    };

    const initSegmenter = () => {
      try {
        const SelfieSegmentation = (window as any).SelfieSegmentation;
        if (!SelfieSegmentation) return;
        const seg = new SelfieSegmentation({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });
        seg.setOptions({ modelSelection: 1 });

        seg.onResults((results: any) => {
          if (!results.segmentationMask) {
            if (pendingMaskResolveRef.current) {
              pendingMaskResolveRef.current(null);
              pendingMaskResolveRef.current = null;
            }
            return;
          }
          const m = results.segmentationMask;
          const c = document.createElement('canvas');
          c.width = m.width;
          c.height = m.height;
          const ctx = c.getContext('2d')!;
          ctx.drawImage(m, 0, 0);

          if (pendingMaskResolveRef.current) {
            pendingMaskResolveRef.current(c);
            pendingMaskResolveRef.current = null;
          }
        });

        segmenterRef.current = seg;
        setIsAiLoaded(true);
      } catch (e) {
        console.error('AI load error:', e);
      }
    };

    loadSegmenter();
  }, []);

  // ==========================================
  // 3. UPLOAD IMAGE & GENERATE PRECISION ALPHA MASK
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Scale down safely to max 1200px for instant 60fps interactive brush & alpha matting
        const maxDim = 1100;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        setImgDims({ w, h });
        setSourceImg(img);
        setSourceDataUrl(dataUrl);
        runAiSegmentation(img, w, h, aiMode);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Run AI Segmentation + Color-Guided Edge Matting
  const runAiSegmentation = async (
    img: HTMLImageElement,
    w: number,
    h: number,
    modeToUse: AiCutoutMode
  ) => {
    setIsProcessing(true);
    setStatusMsg('🤖 AI Analyzing Subject, Hair Strands & Edges...');

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = w;
    srcCanvas.height = h;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(img, 0, 0, w, h);
    const srcPixels = srcCtx.getImageData(0, 0, w, h).data;

    // Create Editable Alpha Mask Canvas (White = Keep Subject, Black = Transparent BG)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d')!;
    const maskImgData = maskCtx.createImageData(w, h);
    const mOut = maskImgData.data;

    if (modeToUse === 'signature') {
      // MODE C: Signature / Stamp Transparent Extractor (Local Illumination Normalization)
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = w;
      blurCanvas.height = h;
      const bCtx = blurCanvas.getContext('2d')!;
      bCtx.filter = 'blur(18px)';
      bCtx.drawImage(srcCanvas, 0, 0);
      bCtx.filter = 'none';
      const bgPixels = bCtx.getImageData(0, 0, w, h).data;

      for (let i = 0; i < srcPixels.length; i += 4) {
        const lum = 0.299 * srcPixels[i] + 0.587 * srcPixels[i + 1] + 0.114 * srcPixels[i + 2];
        const bgLum = Math.max(
          65,
          0.299 * bgPixels[i] + 0.587 * bgPixels[i + 1] + 0.114 * bgPixels[i + 2]
        );
        const rel = Math.min(255, (lum / bgLum) * 255);

        const alpha = rel >= sigThreshold ? 0 : Math.min(255, Math.round((sigThreshold - rel) * 3.2));
        mOut[i] = alpha;
        mOut[i + 1] = alpha;
        mOut[i + 2] = alpha;
        mOut[i + 3] = 255;
      }
      maskCtx.putImageData(maskImgData, 0, 0);
    } else if (modeToUse === 'portrait' && segmenterRef.current) {
      // MODE A: Portrait Neural Segmentation + Color-Guided Boundary Matting
      let rawAiMask: HTMLCanvasElement | null = null;
      try {
        rawAiMask = await new Promise<HTMLCanvasElement | null>((resolve) => {
          pendingMaskResolveRef.current = resolve;
          setTimeout(() => {
            if (pendingMaskResolveRef.current) {
              pendingMaskResolveRef.current(null);
              pendingMaskResolveRef.current = null;
            }
          }, 3500);
          segmenterRef.current.send({ image: srcCanvas });
        });
      } catch {}

      if (rawAiMask) {
        const tempM = document.createElement('canvas');
        tempM.width = w;
        tempM.height = h;
        const tCtx = tempM.getContext('2d')!;
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(rawAiMask, 0, 0, w, h);
        const rawMaskData = tCtx.getImageData(0, 0, w, h).data;

        // Sample background wall/curtain colors from border regions where AI mask < 25
        const bgSamples: [number, number, number][] = [];
        for (let y = 4; y < h * 0.65; y += Math.max(10, Math.round(h * 0.07))) {
          for (const x of [4, 14, w - 5, w - 15]) {
            const idx = (y * w + x) * 4;
            if (Math.max(rawMaskData[idx], rawMaskData[idx + 3]) < 28) {
              bgSamples.push([srcPixels[idx], srcPixels[idx + 1], srcPixels[idx + 2]]);
            }
          }
        }

        for (let i = 0; i < srcPixels.length; i += 4) {
          let mVal = Math.max(rawMaskData[i], rawMaskData[i + 3]);

          // Color-Guided Hair & Ear Matting in transition zone (20..235)
          if (mVal > 18 && mVal < 238 && bgSamples.length > 0) {
            const r = srcPixels[i],
              g = srcPixels[i + 1],
              b = srcPixels[i + 2];
            let minDist = 999;
            for (let s = 0; s < bgSamples.length; s++) {
              const dr = r - bgSamples[s][0];
              const dg = g - bgSamples[s][1];
              const db = b - bgSamples[s][2];
              const dist = Math.sqrt(dr * dr + dg * dg + db * db);
              if (dist < minDist) minDist = dist;
            }
            if (minDist < 36) {
              // Matches background wall color -> strip halo between hair strands!
              mVal = Math.max(0, mVal - 85);
            } else if (minDist > 70 && mVal > 75) {
              // Distinct subject color -> lock solid ear & hair edge!
              mVal = Math.min(255, mVal + 50);
            }
          }

          mOut[i] = mVal;
          mOut[i + 1] = mVal;
          mOut[i + 2] = mVal;
          mOut[i + 3] = 255;
        }
        maskCtx.putImageData(maskImgData, 0, 0);
      }
    } else {
      // MODE B: Universal Object / Product Border Flood-Color Matting
      const cornerSamples: [number, number, number][] = [];
      const coords = [
        [3, 3],
        [w - 4, 3],
        [3, h - 4],
        [w - 4, h - 4],
        [Math.round(w / 2), 3],
        [3, Math.round(h / 2)],
        [w - 4, Math.round(h / 2)],
      ];
      coords.forEach(([cx, cy]) => {
        const idx = (cy * w + cx) * 4;
        cornerSamples.push([srcPixels[idx], srcPixels[idx + 1], srcPixels[idx + 2]]);
      });

      for (let i = 0; i < srcPixels.length; i += 4) {
        const r = srcPixels[i],
          g = srcPixels[i + 1],
          b = srcPixels[i + 2];
        let minDist = 999;
        for (let s = 0; s < cornerSamples.length; s++) {
          const dr = r - cornerSamples[s][0];
          const dg = g - cornerSamples[s][1];
          const db = b - cornerSamples[s][2];
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist < minDist) minDist = dist;
        }
        const alpha = minDist < 34 ? 0 : minDist > 68 ? 255 : Math.round(((minDist - 34) / 34) * 255);
        mOut[i] = alpha;
        mOut[i + 1] = alpha;
        mOut[i + 2] = alpha;
        mOut[i + 3] = 255;
      }
      maskCtx.putImageData(maskImgData, 0, 0);
    }

    editableMaskCanvasRef.current = maskCanvas;
    setIsProcessing(false);
    setStatusMsg('');
    renderFinalComposite();
  };

  // Re-run AI if mode changes
  const handleSwitchAiMode = (newMode: AiCutoutMode) => {
    setAiMode(newMode);
    if (newMode === 'signature') {
      setBgTab('transparent');
      setExportFormat('png');
    }
    if (sourceImg) {
      runAiSegmentation(sourceImg, imgDims.w, imgDims.h, newMode);
    }
  };

  // ==========================================
  // 4. INTERACTIVE MAGIC BRUSH (ERASE / RESTORE)
  // ==========================================
  const applyBrushAtPoint = (clientX: number, clientY: number) => {
    if (!editableMaskCanvasRef.current || !displayCanvasRef.current) return;
    if (activeTool !== 'brush-erase' && activeTool !== 'brush-restore') return;

    const rect = displayCanvasRef.current.getBoundingClientRect();
    const scaleX = editableMaskCanvasRef.current.width / rect.width;
    const scaleY = editableMaskCanvasRef.current.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = (brushSize / 2) * scaleX;

    const mCtx = editableMaskCanvasRef.current.getContext('2d')!;
    mCtx.save();
    mCtx.beginPath();
    mCtx.arc(x, y, radius, 0, Math.PI * 2);
    // Black = Erase (0), White = Restore (255)
    mCtx.fillStyle = activeTool === 'brush-erase' ? '#000000' : '#FFFFFF';
    mCtx.shadowColor = activeTool === 'brush-erase' ? '#000000' : '#FFFFFF';
    mCtx.shadowBlur = 4;
    mCtx.fill();
    mCtx.restore();

    renderFinalComposite();
  };

  // ==========================================
  // 5. MASTER COMPOSITE RENDERER (BG, OUTLINE, SHADOW, DEFRINGE)
  // ==========================================
  const renderFinalComposite = () => {
    if (!sourceImg || !editableMaskCanvasRef.current) return;
    const { w, h } = imgDims;

    // 1. Prepare Feathered Mask
    const featheredMask = document.createElement('canvas');
    featheredMask.width = w;
    featheredMask.height = h;
    const fmCtx = featheredMask.getContext('2d')!;
    if (edgeFeather > 0 && aiMode !== 'signature') {
      fmCtx.filter = `blur(${edgeFeather}px)`;
    }
    fmCtx.drawImage(editableMaskCanvasRef.current, 0, 0);
    fmCtx.filter = 'none';
    const mData = fmCtx.getImageData(0, 0, w, h).data;

    // 2. Prepare Enhanced Subject Foreground Layer
    const fgCanvas = document.createElement('canvas');
    fgCanvas.width = w;
    fgCanvas.height = h;
    const fgCtx = fgCanvas.getContext('2d')!;
    fgCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
    fgCtx.drawImage(sourceImg, 0, 0, w, h);
    fgCtx.filter = 'none';

    const fgImgData = fgCtx.getImageData(0, 0, w, h);
    const fg = fgImgData.data;

    const midCut = 128 - edgeShift * 1.6;
    const lowCut = Math.max(12, midCut - 32);
    const highCut = Math.min(245, midCut + 32);
    const defringeStrength = (defringePower / 100) * 0.55;

    for (let i = 0; i < fg.length; i += 4) {
      const rawM = mData[i];
      let alpha = 0;

      if (aiMode === 'signature') {
        alpha = rawM > 35 ? Math.min(255, Math.round(rawM * 1.35)) : 0;
        if (alpha > 0) {
          // Make signature ink crisp dark
          fg[i] = Math.round(fg[i] * 0.25);
          fg[i + 1] = Math.round(fg[i + 1] * 0.25);
          fg[i + 2] = Math.round(fg[i + 2] * 0.35);
        }
      } else {
        if (rawM >= highCut) alpha = 255;
        else if (rawM <= lowCut) alpha = 0;
        else {
          const t = (rawM - lowCut) / Math.max(1, highCut - lowCut);
          alpha = Math.round(t * t * (3 - 2 * t) * 255);
        }

        // Edge De-Fringe: Decontaminate semi-transparent hair border pixels so bright wall color doesn't glow
        if (alpha > 15 && alpha < 235 && defringeStrength > 0) {
          const lum = 0.299 * fg[i] + 0.587 * fg[i + 1] + 0.114 * fg[i + 2];
          if (lum > 150) {
            const pull = (1 - alpha / 255) * defringeStrength;
            fg[i] = Math.round(fg[i] * (1 - pull));
            fg[i + 1] = Math.round(fg[i + 1] * (1 - pull));
            fg[i + 2] = Math.round(fg[i + 2] * (1 - pull));
          }
        }
      }

      fg[i + 3] = alpha;
    }
    fgCtx.putImageData(fgImgData, 0, 0);

    // 3. Assemble Final Canvas (Background + Optional White Sticker Outline + Drop Shadow + Subject)
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d')!;
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    // 3A. Draw Selected Background
    if (bgTab === 'color') {
      outCtx.fillStyle = selectedColor;
      outCtx.fillRect(0, 0, w, h);
    } else if (bgTab === 'gradient') {
      const grad = outCtx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, selectedGradient.c1);
      grad.addColorStop(1, selectedGradient.c2);
      outCtx.fillStyle = grad;
      outCtx.fillRect(0, 0, w, h);
    } else if (bgTab === 'image' && customBgImg) {
      outCtx.save();
      if (bgBlurPx > 0) outCtx.filter = `blur(${bgBlurPx}px)`;
      const sc = Math.max(w / customBgImg.width, h / customBgImg.height);
      const dw = customBgImg.width * sc;
      const dh = customBgImg.height * sc;
      outCtx.drawImage(customBgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      outCtx.restore();
    } else if (exportFormat === 'jpg') {
      // JPG doesn't support transparency, fill white
      outCtx.fillStyle = '#FFFFFF';
      outCtx.fillRect(0, 0, w, h);
    }

    // 3B. Optional YouTube Thumbnail / Sticker Outline Effect
    if (outlineSize > 0) {
      const silCanvas = document.createElement('canvas');
      silCanvas.width = w;
      silCanvas.height = h;
      const sCtx = silCanvas.getContext('2d')!;
      sCtx.drawImage(fgCanvas, 0, 0);
      sCtx.globalCompositeOperation = 'source-in';
      sCtx.fillStyle = outlineColor;
      sCtx.fillRect(0, 0, w, h);

      // Draw silhouette around in 16 angles
      const steps = 16;
      for (let a = 0; a < steps; a++) {
        const angle = (a / steps) * Math.PI * 2;
        const ox = Math.cos(angle) * outlineSize;
        const oy = Math.sin(angle) * outlineSize;
        outCtx.drawImage(silCanvas, ox, oy);
      }
    }

    // 3C. Draw Subject with Optional 3D Studio Drop Shadow
    outCtx.save();
    if (dropShadow) {
      outCtx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      outCtx.shadowBlur = 22;
      outCtx.shadowOffsetX = 0;
      outCtx.shadowOffsetY = 10;
    }
    outCtx.drawImage(fgCanvas, 0, 0);
    outCtx.restore();

    // Update Interactive Display Canvas
    if (displayCanvasRef.current) {
      displayCanvasRef.current.width = w;
      displayCanvasRef.current.height = h;
      const dCtx = displayCanvasRef.current.getContext('2d')!;
      dCtx.clearRect(0, 0, w, h);
      dCtx.drawImage(outCanvas, 0, 0);
    }

    // 4. Encode Output File (PNG, WebP, or Exact-KB JPG)
    if (exportFormat === 'png' && bgTab === 'transparent') {
      const pngUrl = outCanvas.toDataURL('image/png');
      const bytes = Math.round((pngUrl.length - 22) * 0.75);
      setOutputDataUrl(pngUrl);
      setOutputBytes(bytes);
    } else {
      const mime = exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      if (targetKbMode === 'max') {
        const url = outCanvas.toDataURL(mime, 0.95);
        const bytes = Math.round((url.length - 23) * 0.75);
        setOutputDataUrl(url);
        setOutputBytes(bytes);
      } else {
        const desiredBytes = Math.max(8, targetKb) * 1024;
        let lowQ = 0.12;
        let highQ = 0.98;
        let bestUrl = outCanvas.toDataURL(mime, 0.85);
        let minDiff = Infinity;

        for (let i = 0; i < 7; i++) {
          const midQ = (lowQ + highQ) / 2;
          const u = outCanvas.toDataURL(mime, midQ);
          const b = Math.round((u.length - 23) * 0.75);
          const diff = Math.abs(b - desiredBytes);
          if (b <= desiredBytes * 1.03 && diff < minDiff) {
            minDiff = diff;
            bestUrl = u;
          }
          if (b > desiredBytes) highQ = midQ;
          else lowQ = midQ;
        }
        setOutputDataUrl(bestUrl);
        setOutputBytes(Math.round((bestUrl.length - 23) * 0.75));
      }
    }
  };

  useEffect(() => {
    if (sourceImg && editableMaskCanvasRef.current) {
      renderFinalComposite();
    }
  }, [
    edgeShift,
    edgeFeather,
    defringePower,
    sigThreshold,
    bgTab,
    selectedColor,
    selectedGradient,
    customBgImg,
    bgBlurPx,
    outlineSize,
    outlineColor,
    dropShadow,
    brightness,
    contrast,
    exportFormat,
    targetKbMode,
    targetKb,
  ]);

  // Upload Custom Background Image
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const im = new Image();
      im.onload = () => {
        setCustomBgImg(im);
        setBgTab('image');
      };
      im.src = ev.target?.result as string;
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-black">
              ✨ Pro AI Background Remover + Magic Touch-Up Brush
            </span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
              {isAiLoaded ? '🟢 Neural Engine Ready' : '⏳ Loading AI Engine...'}
            </span>
          </div>
        </div>

        {/* HERO TITLE & 3 AI CUTOUT MODES */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl md:text-4xl font-black text-white">
            AI Background Remover <span className="text-amber-400">&amp; Studio Cutout Pro</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
            Remove backgrounds from Portraits, Passport Photos, Products, or Signatures in 1 click. Includes Magic Erase/Restore Brush, White Sticker Outline &amp; Exact KB Export!
          </p>

          {/* 3 AI Mode Pills */}
          <div className="inline-flex flex-wrap justify-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
            {[
              {
                id: 'portrait',
                label: '👤 Human & Passport AI (Hair/Ear Precision)',
              },
              {
                id: 'auto-color',
                label: '📦 Product / Object Cutout AI',
              },
              {
                id: 'signature',
                label: '✍️ Signature / Stamp Transparent Maker',
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleSwitchAiMode(m.id as AiCutoutMode)}
                className={`px-4 py-2.5 rounded-xl font-black transition ${
                  aiMode === m.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* UPLOAD ZONE OR INTERACTIVE STUDIO WORKSPACE                  */}
        {/* ============================================================ */}
        {!sourceImg ? (
          <label className="block max-w-3xl mx-auto border-2 border-dashed border-amber-500/60 hover:border-amber-400 bg-slate-900/90 rounded-3xl p-10 md:p-14 text-center cursor-pointer transition shadow-2xl space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl">
              🪄
            </div>
            <div className="space-y-1">
              <div className="text-lg md:text-2xl font-black text-white">
                Click to Upload Photo or Drop Image Here
              </div>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WebP • 100% Free Unlimited HD Cutouts • Zero Watermark
              </p>
            </div>
            <div>
              <span className="inline-block px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition">
                📂 Select Image from Device
              </span>
            </div>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ============================================================ */}
            {/* LEFT: INTERACTIVE CANVAS + MAGIC BRUSH + BEFORE/AFTER SLIDER */}
            {/* ============================================================ */}
            <div className="lg:col-span-7 bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              {/* Top Canvas Toolbar: View Mode, Magic Erase/Restore Brush, Compare Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveTool('compare')}
                    className={`px-3 py-1.5 rounded-lg font-black transition ${
                      activeTool === 'compare'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    👁️ View Result
                  </button>

                  <button
                    onClick={() => {
                      setActiveTool('brush-erase');
                      setShowCompareSplit(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black transition ${
                      activeTool === 'brush-erase'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-900 text-rose-300 hover:bg-slate-800'
                    }`}
                  >
                    🧹 Erase Brush
                  </button>

                  <button
                    onClick={() => {
                      setActiveTool('brush-restore');
                      setShowCompareSplit(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black transition ${
                      activeTool === 'brush-restore'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-900 text-emerald-300 hover:bg-slate-800'
                    }`}
                  >
                    🖌️ Restore Brush
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-300">
                    <input
                      type="checkbox"
                      checked={showCompareSplit}
                      onChange={(e) => {
                        setShowCompareSplit(e.target.checked);
                        setActiveTool('compare');
                      }}
                      className="rounded"
                    />
                    ⚖️ Before / After Slider
                  </label>

                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg cursor-pointer">
                    🔄 New Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Brush Size Slider (When Magic Brush is Active) */}
              {(activeTool === 'brush-erase' || activeTool === 'brush-restore') && (
                <div className="flex items-center justify-between gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-amber-500/40 text-xs">
                  <span className="font-bold text-amber-300">
                    {activeTool === 'brush-erase'
                      ? '🧹 Erase Mode: Drag on photo to remove unwanted parts'
                      : '🖌️ Restore Mode: Drag on photo to bring back erased parts'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Brush Size: {brushSize}px</span>
                    <input
                      type="range"
                      min={6}
                      max={80}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-28 accent-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Checkerboard Transparent Canvas Stage */}
              <div
                className="relative rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center min-h-[360px] max-h-[520px] select-none"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  backgroundColor: '#0f172a',
                }}
              >
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/80 z-30 flex flex-col items-center justify-center gap-2 text-sm font-black text-amber-400">
                    <div className="text-3xl animate-spin">⏳</div>
                    <div>{statusMsg || 'Removing Background...'}</div>
                  </div>
                )}

                <div className="relative inline-block">
                  <canvas
                    ref={displayCanvasRef}
                    onPointerDown={(e) => {
                      if (activeTool === 'brush-erase' || activeTool === 'brush-restore') {
                        isBrushingRef.current = true;
                        applyBrushAtPoint(e.clientX, e.clientY);
                      }
                    }}
                    onPointerMove={(e) => {
                      if (isBrushingRef.current) {
                        applyBrushAtPoint(e.clientX, e.clientY);
                      }
                    }}
                    onPointerUp={() => {
                      isBrushingRef.current = false;
                    }}
                    onPointerLeave={() => {
                      isBrushingRef.current = false;
                    }}
                    className={`max-h-[470px] w-auto object-contain block rounded shadow-2xl ${
                      activeTool === 'brush-erase' || activeTool === 'brush-restore'
                        ? 'cursor-crosshair touch-none'
                        : 'cursor-default'
                    }`}
                  />

                  {/* Before / After Comparison Split Overlay */}
                  {showCompareSplit && sourceDataUrl && (
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                      style={{ width: `${comparePos}%` }}
                    >
                      <img
                        src={sourceDataUrl}
                        alt="Original Before"
                        className="max-h-[470px] w-auto max-w-none object-contain block"
                      />
                      <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-black px-2 py-0.5 rounded">
                        BEFORE
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Before / After Slider Control */}
              {showCompareSplit && (
                <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-slate-400">Before</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={comparePos}
                    onChange={(e) => setComparePos(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="font-bold text-emerald-400">After Cutout</span>
                </div>
              )}

              {/* Bottom File Stats & Big Download Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <div className="font-black text-white">
                    Output: {imgDims.w} × {imgDims.h} px •{' '}
                    <span className="text-emerald-400">{formatKb(outputBytes)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Format: {exportFormat.toUpperCase()} •{' '}
                    {bgTab === 'transparent' ? '100% Transparent Background' : 'Custom Studio Background'}
                  </div>
                </div>

                <a
                  href={outputDataUrl}
                  download={`careersathi-cutout-${Date.now()}.${exportFormat}`}
                  className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl transition flex items-center gap-2"
                >
                  📥 Download HD Cutout ({formatKb(outputBytes)})
                </a>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT: BACKGROUND STUDIO, STICKER OUTLINE & EDGE REFINEMENT  */}
            {/* ============================================================ */}
            <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 text-xs">
              {/* 1. Background Switcher (Transparent / Solid / Gradient / Custom Image) */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="font-black text-amber-400 uppercase block">
                  🎨 1. Choose Background Style
                </span>

                <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(
                    [
                      { id: 'transparent', label: '🏁 Transparent' },
                      { id: 'color', label: '🎨 Solid Color' },
                      { id: 'gradient', label: '🌈 Gradient' },
                      { id: 'image', label: '🖼️ Photo BG' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setBgTab(t.id);
                        if (t.id === 'transparent') setExportFormat('png');
                      }}
                      className={`py-2 rounded-lg font-black text-[11px] transition ${
                        bgTab === t.id
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Solid Color Swatches */}
                {bgTab === 'color' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {SOLID_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.name}
                        className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 ${
                          selectedColor === c.hex
                            ? 'border-amber-400 bg-slate-800 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-600"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[11px]">{c.name}</span>
                      </button>
                    ))}
                    <label className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                      />
                      <span>Custom</span>
                    </label>
                  </div>
                )}

                {/* Studio Gradients */}
                {bgTab === 'gradient' && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {STUDIO_GRADIENTS.map((g) => (
                      <button
                        key={g.name}
                        onClick={() => setSelectedGradient(g)}
                        style={{
                          background: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                        }}
                        className="p-2.5 rounded-xl border border-white/20 text-white font-black text-[11px] shadow"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Background Image + DSLR Blur */}
                {bgTab === 'image' && (
                  <div className="space-y-3 pt-2">
                    <label className="block p-3 bg-slate-900 border border-dashed border-slate-700 hover:border-amber-400 rounded-xl text-center cursor-pointer font-bold text-blue-400">
                      📂 Upload Custom Background Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomBgUpload}
                        className="hidden"
                      />
                    </label>
                    {customBgImg && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">📸 DSLR Background Blur (Bokeh)</span>
                          <span className="text-amber-400 font-bold">{bgBlurPx}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          value={bgBlurPx}
                          onChange={(e) => setBgBlurPx(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Edge Precision, Hair Halo Killer & Signature Threshold */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="font-black text-emerald-400 uppercase block">
                  ✂️ 2. Edge Precision &amp; Hair De-Fringe
                </span>

                {aiMode === 'signature' ? (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-bold">
                        ✍️ Signature Paper Removal Power
                      </span>
                      <span className="text-amber-400 font-bold">{sigThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={245}
                      value={sigThreshold}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSigThreshold(val);
                        if (sourceImg) runAiSegmentation(sourceImg, imgDims.w, imgDims.h, 'signature');
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">👂 Ear / Edge Expand</span>
                          <span className="text-amber-400 font-bold">{edgeShift}</span>
                        </div>
                        <input
                          type="range"
                          min={-25}
                          max={25}
                          value={edgeShift}
                          onChange={(e) => setEdgeShift(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">✨ Edge Smoothness</span>
                          <span className="text-amber-400 font-bold">{edgeFeather}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={6}
                          step={0.5}
                          value={edgeFeather}
                          onChange={(e) => setEdgeFeather(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">💇‍♂️ Hair Halo Killer (De-Fringe)</span>
                        <span className="text-amber-400 font-bold">{defringePower}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={defringePower}
                        onChange={(e) => setDefringePower(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Studio Sticker Outline, 3D Shadow & Face Relight */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="font-black text-purple-400 uppercase block">
                  ✨ 3. Sticker Outline, 3D Shadow &amp; Relight
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">⭕ Sticker Outline</span>
                      <span className="text-amber-400 font-bold">{outlineSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={14}
                      value={outlineSize}
                      onChange={(e) => setOutlineSize(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">☀️ Face Brightness</span>
                      <span className="text-amber-400 font-bold">{brightness}</span>
                    </div>
                    <input
                      type="range"
                      min={-20}
                      max={30}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={dropShadow}
                      onChange={(e) => setDropShadow(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    🌑 Add 3D Studio Drop Shadow
                  </label>

                  {outlineSize > 0 && (
                    <label className="flex items-center gap-1.5 text-slate-300 font-bold">
                      <span>Outline Color:</span>
                      <input
                        type="color"
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 4. Export Format & Target KB Control */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-400 uppercase">
                    📥 4. Output Format &amp; File Size
                  </span>
                  <div className="flex gap-1.5">
                    {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`px-2.5 py-1 rounded font-black uppercase text-[10px] border ${
                          exportFormat === fmt
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {exportFormat !== 'png' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-400 font-bold mr-1">Target KB:</span>
                    <button
                      onClick={() => setTargetKbMode('max')}
                      className={`px-2.5 py-1 rounded font-bold border ${
                        targetKbMode === 'max'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Max HD
                    </button>
                    {[20, 35, 50, 100].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => {
                          setTargetKbMode('custom');
                          setTargetKb(kb);
                        }}
                        className={`px-2.5 py-1 rounded font-bold border ${
                          targetKbMode === 'custom' && targetKb === kb
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
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