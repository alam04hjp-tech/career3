'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

interface SizePreset {
  id: string;
  label: string;
  subLabel: string;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
}

interface ClarityStyle {
  id: string;
  name: string;
  badge: string;
  shadowLift: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  hairDarken: number;
}

const PASSPORT_PRESETS: SizePreset[] = [
  {
    id: 'indian-passport',
    label: '🇮🇳 Standard Passport (3.5 × 4.5 cm)',
    subLabel: 'SSC, UPSC, Railway, IBPS & Cyber Cafe Print',
    widthPx: 600,
    heightPx: 771,
    widthMm: 35,
    heightMm: 45,
  },
  {
    id: 'ssc-digital',
    label: '📝 SSC / Exam Portal (3.5 × 4.0 cm)',
    subLabel: 'Exact Online Application Ratio',
    widthPx: 560,
    heightPx: 640,
    widthMm: 35,
    heightMm: 40,
  },
  {
    id: 'pan-visa-2x2',
    label: '🌎 2 × 2 Inch (51 × 51 mm)',
    subLabel: 'US Visa, PAN Card & OCI',
    widthPx: 700,
    heightPx: 700,
    widthMm: 50.8,
    heightMm: 50.8,
  },
  {
    id: 'stamp-size',
    label: '🎫 Stamp Size (2.0 × 2.5 cm)',
    subLabel: 'ID Cards & Small Forms',
    widthPx: 450,
    heightPx: 562,
    widthMm: 20,
    heightMm: 25,
  },
];

// 10 Professional Studio Clear & Sharp Variations for Step 3
const TEN_CLARITY_STYLES: ClarityStyle[] = [
  {
    id: 'pro-studio',
    name: '1. Pro Studio Balance',
    badge: '⭐ Most Popular',
    shadowLift: 65,
    sharpness: 60,
    brightness: 8,
    contrast: 14,
    saturation: 6,
    warmth: 0,
    hairDarken: 30,
  },
  {
    id: 'ultra-hd-sharp',
    name: '2. Ultra HD Razor Sharp',
    badge: '💎 Max Clarity',
    shadowLift: 50,
    sharpness: 90,
    brightness: 6,
    contrast: 16,
    saturation: 5,
    warmth: 0,
    hairDarken: 40,
  },
  {
    id: 'bright-fair',
    name: '3. Studio Bright & Fair',
    badge: '☀️ Fair Glow',
    shadowLift: 80,
    sharpness: 55,
    brightness: 16,
    contrast: 10,
    saturation: 8,
    warmth: 3,
    hairDarken: 25,
  },
  {
    id: 'shadow-remover',
    name: '4. Heavy Shadow Remover',
    badge: '🌤️ No Parchhai',
    shadowLift: 95,
    sharpness: 58,
    brightness: 12,
    contrast: 8,
    saturation: 6,
    warmth: 2,
    hairDarken: 35,
  },
  {
    id: 'cyber-cafe-pro',
    name: '5. Cyber Cafe Classic',
    badge: '🖨️ Print Special',
    shadowLift: 65,
    sharpness: 75,
    brightness: 9,
    contrast: 18,
    saturation: 10,
    warmth: 0,
    hairDarken: 50,
  },
  {
    id: 'deep-black-hair',
    name: '6. Dark Hair + Clear Face',
    badge: '💇‍♂️ Rich Hair',
    shadowLift: 70,
    sharpness: 68,
    brightness: 10,
    contrast: 15,
    saturation: 5,
    warmth: 0,
    hairDarken: 70,
  },
  {
    id: 'cool-daylight',
    name: '7. Cool Daylight HD',
    badge: '❄️ Anti-Yellow',
    shadowLift: 60,
    sharpness: 62,
    brightness: 10,
    contrast: 13,
    saturation: 4,
    warmth: -12,
    hairDarken: 30,
  },
  {
    id: 'warm-golden',
    name: '8. Warm Golden Studio',
    badge: '🔥 Natural Tone',
    shadowLift: 60,
    sharpness: 58,
    brightness: 9,
    contrast: 12,
    saturation: 10,
    warmth: 12,
    hairDarken: 25,
  },
  {
    id: 'biometric-crisp',
    name: '9. SSC / Biometric Crisp',
    badge: '📋 Exam Official',
    shadowLift: 45,
    sharpness: 82,
    brightness: 5,
    contrast: 22,
    saturation: -4,
    warmth: 0,
    hairDarken: 45,
  },
  {
    id: 'natural-hd',
    name: '10. True Original HD',
    badge: '📷 Subtle Clean',
    shadowLift: 25,
    sharpness: 45,
    brightness: 3,
    contrast: 6,
    saturation: 2,
    warmth: 0,
    hairDarken: 15,
  },
];

const BG_PRESET_COLORS = [
  { name: 'Studio Sky Blue', hex: '#2F8BFF' },
  { name: 'Passport Royal Blue', hex: '#1A56DB' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Light Cyan', hex: '#BAE6FD' },
  { name: 'Light Grey', hex: '#E2E8F0' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Official Red', hex: '#DC2626' },
  { name: 'Keep Original BG', hex: 'original' },
];

export default function PassportPhotoMaker() {
  // WIZARD STEP STATE: 1 = Upload/Camera, 2 = Crop, 3 = Pick 1 of 10 Clarity Styles, 4 = Background & Print
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Raw Image & Cropped Image States
  const [rawImageObj, setRawImageObj] = useState<HTMLImageElement | null>(null);
  const [croppedCanvasRefState, setCroppedCanvasRefState] = useState<HTMLCanvasElement | null>(null);
  const [croppedMaskCanvas, setCroppedMaskCanvas] = useState<HTMLCanvasElement | null>(null);

  // MediaPipe AI Segmenter
  const [isAiReady, setIsAiReady] = useState<boolean>(false);
  const [isProcessingCropBg, setIsProcessingCropBg] = useState<boolean>(false);
  const segmenterRef = useRef<any>(null);
  const pendingResolveRef = useRef<((maskCanvas: HTMLCanvasElement | null) => void) | null>(null);

  // Step 1: Live Camera States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 2: Crop & Position States
  const [selectedPreset, setSelectedPreset] = useState<SizePreset>(PASSPORT_PRESETS[0]);
  const [zoom, setZoom] = useState<number>(1.15);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string>('');

  // Interactive Drag on Step 2 Crop Preview
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Step 3: 10 Clarity Style Variations States
  const [selectedStyleId, setSelectedStyleId] = useState<string>(TEN_CLARITY_STYLES[0].id);
  const [styleThumbnails, setStyleThumbnails] = useState<Record<string, string>>({});

  // Step 4: Final Customization Controls (Background, Edge, Slate, KB, A4 Sheet)
  const [bgColor, setBgColor] = useState<string>('#2F8BFF');
  const [customHexColor, setCustomHexColor] = useState<string>('#2563EB');
  const [edgeExpand, setEdgeExpand] = useState<number>(15); // Protects ears & hair edges
  const [edgeSmoothness, setEdgeSmoothness] = useState<number>(2.5);
  const [extraBrightness, setExtraBrightness] = useState<number>(0);
  const [extraSharpness, setExtraSharpness] = useState<number>(0);

  // Sarkari Name & Date Slate + Border
  const [showNameDate, setShowNameDate] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('');
  const [photoDate, setPhotoDate] = useState<string>(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  );
  const [slateStyle, setSlateStyle] = useState<'white' | 'black'>('white');
  const [addBorder, setAddBorder] = useState<boolean>(true);

  // Single Photo Exact KB Controls
  const [targetKbMode, setTargetKbMode] = useState<'auto' | 'custom'>('custom');
  const [targetKb, setTargetKb] = useState<number>(45);
  const [singlePhotoUrl, setSinglePhotoUrl] = useState<string>('');
  const [singlePhotoSizeStr, setSinglePhotoSizeStr] = useState<string>('');

  // A4 Multi-Photo Sheet Controls
  const [copyCount, setCopyCount] = useState<number>(12);
  const [sheetGapMm, setSheetGapMm] = useState<number>(4);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string>('');
  const [isExportingSheet, setIsExportingSheet] = useState<boolean>(false);

  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  const hexToRgbTuple = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    if (isNaN(num)) return [47, 139, 255];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  // Load Google MediaPipe Selfie Segmentation AI (Model 0 = Portrait 256x256 for Cropped Head/Shoulders)
  useEffect(() => {
    const initMediaPipe = async () => {
      if ((window as any).SelfieSegmentation) {
        setupSegmenterInstance();
        return;
      }
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
      script.async = true;
      script.onload = () => setupSegmenterInstance();
      document.body.appendChild(script);
    };

    const setupSegmenterInstance = () => {
      try {
        const SelfieSegmentation = (window as any).SelfieSegmentation;
        if (!SelfieSegmentation) return;

        const segmenter = new SelfieSegmentation({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });
        // Model 0 is symmetric portrait model — when fed a tightly cropped passport photo, it gives high precision!
        segmenter.setOptions({ modelSelection: 0 });

        segmenter.onResults((results: any) => {
          if (!results.segmentationMask) {
            if (pendingResolveRef.current) {
              pendingResolveRef.current(null);
              pendingResolveRef.current = null;
            }
            return;
          }
          const maskImg = results.segmentationMask;
          const mCanvas = document.createElement('canvas');
          mCanvas.width = maskImg.width;
          mCanvas.height = maskImg.height;
          const mCtx = mCanvas.getContext('2d')!;
          mCtx.drawImage(maskImg, 0, 0);

          if (pendingResolveRef.current) {
            pendingResolveRef.current(mCanvas);
            pendingResolveRef.current = null;
          }
        });

        segmenterRef.current = segmenter;
        setIsAiReady(true);
      } catch (e) {
        console.error('AI error:', e);
      }
    };

    initMediaPipe();
    return () => stopCamera();
  }, []);

  // STEP 1: Live Camera & File Upload Functions
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError('');
    stopCamera();
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('Camera access allow nahi hai ya camera busy hai. Kripya Upload Photo use karein.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const switchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const handlePhotoLoaded = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setRawImageObj(img);
      setZoom(1.15);
      setPanX(0);
      // Slightly shift down if portrait photo so face starts near top
      setPanY(img.height > img.width ? Math.round(img.height * 0.04) : 0);
      setRotation(0);
      setFlipH(false);
      setStep(2); // Move immediately to Step 2: Crop!
    };
    img.src = dataUrl;
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    stopCamera();
    handlePhotoLoaded(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) handlePhotoLoaded(ev.target.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // STEP 2: Interactive Crop Canvas Builder
  const buildCroppedCanvas = (): HTMLCanvasElement | null => {
    if (!rawImageObj) return null;
    const w = selectedPreset.widthPx;
    const h = selectedPreset.heightPx;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    const imgRatio = rawImageObj.width / rawImageObj.height;
    const targetRatio = w / h;
    let baseDrawW = w;
    let baseDrawH = h;

    if (imgRatio > targetRatio) {
      baseDrawH = h;
      baseDrawW = h * imgRatio;
    } else {
      baseDrawW = w;
      baseDrawH = w / imgRatio;
    }

    const finalDrawW = baseDrawW * zoom;
    const finalDrawH = baseDrawH * zoom;

    ctx.save();
    ctx.translate(w / 2 + panX, h / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    ctx.drawImage(rawImageObj, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH);
    ctx.restore();

    return canvas;
  };

  // Update Live Crop Preview in Step 2
  useEffect(() => {
    if (!rawImageObj || step !== 2) return;
    const c = buildCroppedCanvas();
    if (c) {
      setCropPreviewUrl(c.toDataURL('image/jpeg', 0.92));
    }
  }, [rawImageObj, selectedPreset, zoom, panX, panY, rotation, flipH, step]);

  // Pointer Drag Handlers for Step 2 Crop Box
  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanX(Math.round(dragStartRef.current.startPanX + dx * 1.1));
    setPanY(Math.round(dragStartRef.current.startPanY + dy * 1.1));
  };

  const handleCropPointerUp = () => {
    isDraggingRef.current = false;
  };

  // Core Helper: Apply Studio Clarity Style + AI Background Cutout to Any Canvas
  const renderStyledPassportCanvas = (
    srcCropped: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement | null,
    style: ClarityStyle,
    targetBgHex: string,
    outW: number,
    outH: number,
    expandVal = 15,
    smoothVal = 2.5,
    addExtraBright = 0,
    addExtraSharp = 0
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Cropped Image with Hardware Brightness/Contrast/Saturation
    const bVal = 100 + style.brightness + addExtraBright;
    const cVal = 100 + style.contrast;
    const sVal = 100 + style.saturation;
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%)`;
    ctx.drawImage(srcCropped, 0, 0, outW, outH);
    ctx.filter = 'none';

    // 2. Apply Bell-Curve Shadow Lift + Hair Dark Keep + Warmth
    const fgDataObj = ctx.getImageData(0, 0, outW, outH);
    const d = fgDataObj.data;
    const shadowStrength = (style.shadowLift / 100) * 0.85;
    const hairKeepStrength = (style.hairDarken / 100) * 0.35;
    const warmShift = style.warmth * 0.9;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i],
        g = d[i + 1],
        b = d[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Studio Bell-Curve Shadow Lift
      if (shadowStrength > 0 && lum > 28 && lum < 185) {
        const shadowWeight = Math.sin(((lum - 28) / 157) * Math.PI);
        const boost = shadowWeight * shadowStrength * 52;
        r = Math.min(255, r + boost * 1.08);
        g = Math.min(255, g + boost);
        b = Math.min(255, b + boost * 0.95);
      }

      // Keep Hair, Eyebrows & Beard Deep Black
      if (lum < 42 && hairKeepStrength > 0) {
        r *= 1 - hairKeepStrength;
        g *= 1 - hairKeepStrength;
        b *= 1 - hairKeepStrength;
      }

      // Warm / Cool Studio Tint
      if (warmShift !== 0) {
        r = Math.min(255, Math.max(0, r + warmShift));
        b = Math.min(255, Math.max(0, b - warmShift));
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(fgDataObj, 0, 0);

    // 3. Apply Studio Unsharp Mask for Razor-Sharp Hair, Eyes & Face
    const totalSharp = Math.max(0, Math.min(100, style.sharpness + addExtraSharp));
    if (totalSharp > 0) {
      const blurredCanvas = document.createElement('canvas');
      blurredCanvas.width = outW;
      blurredCanvas.height = outH;
      const bCtx = blurredCanvas.getContext('2d')!;
      bCtx.filter = 'blur(1.2px)';
      bCtx.drawImage(canvas, 0, 0);

      const origData = ctx.getImageData(0, 0, outW, outH);
      const blurData = bCtx.getImageData(0, 0, outW, outH);
      const amount = (totalSharp / 100) * 0.85;

      for (let i = 0; i < origData.data.length; i += 4) {
        origData.data[i] = Math.min(
          255,
          Math.max(0, origData.data[i] + (origData.data[i] - blurData.data[i]) * amount)
        );
        origData.data[i + 1] = Math.min(
          255,
          Math.max(
            0,
            origData.data[i + 1] + (origData.data[i + 1] - blurData.data[i + 1]) * amount
          )
        );
        origData.data[i + 2] = Math.min(
          255,
          Math.max(
            0,
            origData.data[i + 2] + (origData.data[i + 2] - blurData.data[i + 2]) * amount
          )
        );
      }
      ctx.putImageData(origData, 0, 0);
    }

    // 4. Smart Color-Guided Background Cutout on the Cropped Portrait!
    if (targetBgHex !== 'original' && maskCanvas) {
      const maskLayer = document.createElement('canvas');
      maskLayer.width = outW;
      maskLayer.height = outH;
      const maskCtx = maskLayer.getContext('2d')!;
      maskCtx.imageSmoothingEnabled = true;
      maskCtx.imageSmoothingQuality = 'high';

      if (smoothVal > 0) {
        maskCtx.filter = `blur(${smoothVal}px)`;
      }
      maskCtx.drawImage(maskCanvas, 0, 0, outW, outH);
      maskCtx.filter = 'none';

      const finalDataObj = ctx.getImageData(0, 0, outW, outH);
      const fgPixels = finalDataObj.data;
      const mData = maskCtx.getImageData(0, 0, outW, outH).data;

      // Sample original background color from top corners of cropped portrait (where mask is 0)
      const bgSamples: [number, number, number][] = [];
      for (let sy = 4; sy < outH * 0.45; sy += Math.max(8, Math.round(outH * 0.08))) {
        for (const sx of [4, 14, outW - 5, outW - 15]) {
          const idx = (Math.min(outH - 1, sy) * outW + Math.min(outW - 1, sx)) * 4;
          if (Math.max(mData[idx], mData[idx + 3]) < 30) {
            bgSamples.push([fgPixels[idx], fgPixels[idx + 1], fgPixels[idx + 2]]);
          }
        }
      }

      const [targetR, targetG, targetB] = hexToRgbTuple(targetBgHex);
      // Lower cutoff threshold expands ears/hair; higher trims background halo
      const midCut = 125 - expandVal * 1.4; // Default expandVal=15 -> midCut=104 (protects ears!)
      const lowCut = Math.max(20, midCut - 35);
      const highCut = Math.min(240, midCut + 35);

      for (let i = 0; i < fgPixels.length; i += 4) {
        let rawM = Math.max(mData[i], mData[i + 3]);

        // Color-guided edge check: if a border pixel matches the room wall/curtain color, remove it!
        if (rawM > 25 && rawM < 225 && bgSamples.length > 0) {
          const r = fgPixels[i],
            g = fgPixels[i + 1],
            b = fgPixels[i + 2];
          let minDist = 999;
          for (let s = 0; s < bgSamples.length; s++) {
            const dr = r - bgSamples[s][0];
            const dg = g - bgSamples[s][1];
            const db = b - bgSamples[s][2];
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);
            if (dist < minDist) minDist = dist;
          }
          if (minDist < 38) {
            rawM = Math.max(0, rawM - 75); // Strip wall/curtain halo
          } else if (minDist > 72 && rawM > 80) {
            rawM = Math.min(255, rawM + 45); // Lock solid ear & hair
          }
        }

        let alpha = 0;
        if (rawM >= highCut) alpha = 255;
        else if (rawM <= lowCut) alpha = 0;
        else {
          const t = (rawM - lowCut) / (highCut - lowCut);
          alpha = Math.round(t * t * (3 - 2 * t) * 255);
        }

        if (alpha === 255) {
          fgPixels[i + 3] = 255;
        } else if (alpha === 0) {
          fgPixels[i] = targetR;
          fgPixels[i + 1] = targetG;
          fgPixels[i + 2] = targetB;
          fgPixels[i + 3] = 255;
        } else {
          const a = alpha / 255;
          fgPixels[i] = Math.round(fgPixels[i] * a + targetR * (1 - a));
          fgPixels[i + 1] = Math.round(fgPixels[i + 1] * a + targetG * (1 - a));
          fgPixels[i + 2] = Math.round(fgPixels[i + 2] * a + targetB * (1 - a));
          fgPixels[i + 3] = 255;
        }
      }
      ctx.putImageData(finalDataObj, 0, 0);
    }

    return canvas;
  };

  // STEP 2 -> STEP 3 TRANSITION: Crop Now, Remove Background on Cropped Image & Generate 10 Clear/Sharp Styles!
  const handleCropAndGenerate10Styles = async () => {
    const cropped = buildCroppedCanvas();
    if (!cropped) return;

    setIsProcessingCropBg(true);
    setCroppedCanvasRefState(cropped);

    let detectedMask: HTMLCanvasElement | null = null;

    if (segmenterRef.current) {
      try {
        detectedMask = await new Promise<HTMLCanvasElement | null>((resolve) => {
          pendingResolveRef.current = resolve;
          // Timeout safety in case MediaPipe takes >3s
          setTimeout(() => {
            if (pendingResolveRef.current) {
              pendingResolveRef.current(null);
              pendingResolveRef.current = null;
            }
          }, 3500);
          segmenterRef.current.send({ image: cropped });
        });
      } catch (e) {
        console.error('Segmentation on cropped image error:', e);
      }
    }

    setCroppedMaskCanvas(detectedMask);

    // Generate all 10 Clear & Sharp Studio Variations on a fast 240x308 thumbnail canvas
    const thumbW = 240;
    const thumbH = Math.round((selectedPreset.heightPx / selectedPreset.widthPx) * thumbW);
    const thumbs: Record<string, string> = {};

    for (const style of TEN_CLARITY_STYLES) {
      const styledCanvas = renderStyledPassportCanvas(
        cropped,
        detectedMask,
        style,
        bgColor,
        thumbW,
        thumbH,
        edgeExpand,
        1.8,
        0,
        0
      );
      thumbs[style.id] = styledCanvas.toDataURL('image/jpeg', 0.9);
    }

    setStyleThumbnails(thumbs);
    setIsProcessingCropBg(false);
    setStep(3); // Open Step 3: 10 Clear & Sharp Variations Grid!
  };

  // STEP 3 & STEP 4: Render Full-Resolution Master Passport Photo whenever settings change
  useEffect(() => {
    if (!croppedCanvasRefState || (step !== 3 && step !== 4)) return;

    const w = selectedPreset.widthPx;
    const h = selectedPreset.heightPx;
    const activeStyle =
      TEN_CLARITY_STYLES.find((s) => s.id === selectedStyleId) || TEN_CLARITY_STYLES[0];

    const canvas = renderStyledPassportCanvas(
      croppedCanvasRefState,
      croppedMaskCanvas,
      activeStyle,
      bgColor,
      w,
      h,
      edgeExpand,
      edgeSmoothness,
      extraBrightness,
      extraSharpness
    );
    const ctx = canvas.getContext('2d')!;

    // Add Sarkari Exam Name & Date Slate
    if (showNameDate && (candidateName.trim() || photoDate.trim())) {
      const slateHeight = Math.round(h * 0.16);
      const slateY = h - slateHeight;

      ctx.fillStyle = slateStyle === 'white' ? '#FFFFFF' : '#0F172A';
      ctx.fillRect(0, slateY, w, slateHeight);

      ctx.strokeStyle = slateStyle === 'white' ? '#000000' : '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, slateY);
      ctx.lineTo(w, slateY);
      ctx.stroke();

      ctx.fillStyle = slateStyle === 'white' ? '#000000' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const nameFontSize = Math.round(slateHeight * 0.36);
      const dateFontSize = Math.round(slateHeight * 0.31);

      if (candidateName.trim() && photoDate.trim()) {
        ctx.font = `bold ${nameFontSize}px Arial, sans-serif`;
        ctx.fillText(candidateName.toUpperCase(), w / 2, slateY + slateHeight * 0.33);
        ctx.font = `bold ${dateFontSize}px Arial, sans-serif`;
        ctx.fillText(`DOP: ${photoDate}`, w / 2, slateY + slateHeight * 0.74);
      } else {
        const singleLine = candidateName.trim()
          ? candidateName.toUpperCase()
          : `DOP: ${photoDate}`;
        ctx.font = `bold ${nameFontSize}px Arial, sans-serif`;
        ctx.fillText(singleLine, w / 2, slateY + slateHeight * 0.52);
      }
    }

    // Add Cut Border
    if (addBorder) {
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }

    masterCanvasRef.current = canvas;
    generateExactKbSinglePhoto(canvas);
    generateA4SheetPreview(canvas);
  }, [
    croppedCanvasRefState,
    croppedMaskCanvas,
    step,
    selectedPreset,
    selectedStyleId,
    bgColor,
    edgeExpand,
    edgeSmoothness,
    extraBrightness,
    extraSharpness,
    showNameDate,
    candidateName,
    photoDate,
    slateStyle,
    addBorder,
    targetKbMode,
    targetKb,
    copyCount,
    sheetGapMm,
  ]);

  const generateExactKbSinglePhoto = (baseCanvas: HTMLCanvasElement) => {
    if (targetKbMode === 'auto') {
      const url = baseCanvas.toDataURL('image/jpeg', 0.95);
      const byteLen = Math.round((url.length - 23) * 0.75);
      setSinglePhotoUrl(url);
      setSinglePhotoSizeStr(formatBytes(byteLen));
      return;
    }

    const desiredBytes = Math.max(8, targetKb) * 1024;
    let bestUrl = '';
    let minDiff = Infinity;
    let bestByteLen = 0;

    const scales = desiredBytes > 60 * 1024 ? [1.0, 1.25, 1.5] : [0.7, 0.85, 1.0];

    for (const sc of scales) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.round(baseCanvas.width * sc);
      tempCanvas.height = Math.round(baseCanvas.height * sc);
      const tCtx = tempCanvas.getContext('2d')!;
      tCtx.imageSmoothingEnabled = true;
      tCtx.imageSmoothingQuality = 'high';
      tCtx.drawImage(baseCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

      let lowQ = 0.2;
      let highQ = 0.98;

      for (let i = 0; i < 6; i++) {
        const midQ = (lowQ + highQ) / 2;
        const candidateUrl = tempCanvas.toDataURL('image/jpeg', midQ);
        const bytes = Math.round((candidateUrl.length - 23) * 0.75);
        const diff = Math.abs(bytes - desiredBytes);

        if (diff < minDiff && bytes <= desiredBytes * 1.05) {
          minDiff = diff;
          bestUrl = candidateUrl;
          bestByteLen = bytes;
        }

        if (bytes > desiredBytes) highQ = midQ;
        else lowQ = midQ;
      }
    }

    if (!bestUrl) {
      bestUrl = baseCanvas.toDataURL('image/jpeg', 0.6);
      bestByteLen = Math.round((bestUrl.length - 23) * 0.75);
    }

    setSinglePhotoUrl(bestUrl);
    setSinglePhotoSizeStr(formatBytes(bestByteLen));
  };

  const buildA4SheetCanvas = (
    singleCanvas: HTMLCanvasElement,
    dpiScale = 150
  ): HTMLCanvasElement => {
    const mmToPx = dpiScale / 25.4;
    const a4WidthPx = Math.round(210 * mmToPx);
    const a4HeightPx = Math.round(297 * mmToPx);

    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = a4WidthPx;
    sheetCanvas.height = a4HeightPx;
    const ctx = sheetCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, a4WidthPx, a4HeightPx);

    const photoW = Math.round(selectedPreset.widthMm * mmToPx);
    const photoH = Math.round(selectedPreset.heightMm * mmToPx);
    const gapPx = Math.round(sheetGapMm * mmToPx);
    const marginPx = Math.round(10 * mmToPx);

    const availW = a4WidthPx - marginPx * 2;
    const cols = Math.max(1, Math.floor((availW + gapPx) / (photoW + gapPx)));

    const totalGridW = cols * photoW + (cols - 1) * gapPx;
    const startX = Math.round((a4WidthPx - totalGridW) / 2);
    const startY = marginPx;

    for (let i = 0; i < copyCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (photoW + gapPx);
      const y = startY + row * (photoH + gapPx);
      if (y + photoH > a4HeightPx - marginPx / 2) break;
      ctx.drawImage(singleCanvas, x, y, photoW, photoH);
    }

    return sheetCanvas;
  };

  const generateA4SheetPreview = (singleCanvas: HTMLCanvasElement) => {
    const previewSheet = buildA4SheetCanvas(singleCanvas, 115);
    setSheetPreviewUrl(previewSheet.toDataURL('image/jpeg', 0.88));
  };

  const downloadA4SheetPdf = async () => {
    if (!masterCanvasRef.current) return;
    setIsExportingSheet(true);

    try {
      const hdSheetCanvas = buildA4SheetCanvas(masterCanvasRef.current, 300);
      const jpgDataUrl = hdSheetCanvas.toDataURL('image/jpeg', 0.95);
      const base64 = jpgDataUrl.split(',')[1];
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const embeddedJpg = await pdfDoc.embedJpg(bytes);

      page.drawImage(embeddedJpg, { x: 0, y: 0, width: 595.28, height: 841.89 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `passport-photos-${copyCount}-copies-A4.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF export error: ${err.message}`);
    } finally {
      setIsExportingSheet(false);
    }
  };

  const downloadA4SheetJpg = () => {
    if (!masterCanvasRef.current) return;
    const hdSheetCanvas = buildA4SheetCanvas(masterCanvasRef.current, 300);
    const url = hdSheetCanvas.toDataURL('image/jpeg', 0.96);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passport-photos-${copyCount}-copies-A4.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const printA4SheetDirectly = () => {
    if (!masterCanvasRef.current) return;
    const hdSheetCanvas = buildA4SheetCanvas(masterCanvasRef.current, 300);
    const dataUrl = hdSheetCanvas.toDataURL('image/jpeg', 0.96);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup blocked! Kripya browser mein print popup allow karein.');
      return;
    }
    printWin.document.write(`
      <html>
        <head>
          <title>Print Passport Photos - CareerSathi</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
            img { width: 210mm; height: 297mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
            {isAiReady
              ? '✨ 4-Step AI Studio • 10 HD Clear & Sharp Filters Ready'
              : '⏳ Loading Studio AI Engine...'}
          </span>
        </div>

        {/* Hero Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            AI Passport Photo Maker <span className="text-amber-400">&amp; 10-Style Studio</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
            Step 1: Click Live Photo or Upload → Step 2: Crop Face → Step 3: Pick from 10 Clear &amp; Sharp HD Styles → Step 4: Background Color, KB &amp; A4 Print!
          </p>
        </div>

        {/* 4-STEP PROGRESS WIZARD BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
          {[
            { num: 1, title: '1. Upload / Camera', canGo: true },
            { num: 2, title: '2. Crop Face', canGo: !!rawImageObj },
            { num: 3, title: '3. 10 Clear Styles', canGo: !!croppedCanvasRefState },
            { num: 4, title: '4. BG Color & Print', canGo: !!croppedCanvasRefState },
          ].map((item) => (
            <button
              key={item.num}
              disabled={!item.canGo}
              onClick={() => item.canGo && setStep(item.num as 1 | 2 | 3 | 4)}
              className={`py-2.5 px-3 rounded-xl font-black transition flex items-center justify-center gap-2 ${
                step === item.num
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : item.canGo
                  ? 'bg-slate-950 text-slate-200 hover:bg-slate-800 border border-slate-800'
                  : 'bg-slate-950/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* STEP 1: UPLOAD PHOTO OR CLICK LIVE PHOTO (CAMERA)         */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="bg-slate-900 p-6 md:p-10 rounded-2xl border border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
                📸
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Step 1: Click Live Photo or Upload Photo
              </h2>
              <p className="text-xs text-slate-400">
                Apने mobile/webcam se seedha live photo khichein ya gallery se photo select karein. Agle step mein aap ise crop karenge!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {!isCameraOpen ? (
                <button
                  onClick={() => startCamera('user')}
                  className="px-7 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition flex items-center gap-2"
                >
                  📷 Click Live Photo (Camera)
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-7 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl shadow-xl transition"
                >
                  ✕ Close Camera
                </button>
              )}

              <label className="px-7 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl transition cursor-pointer flex items-center gap-2">
                🖼️ Upload Photo from Gallery / PC
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Live Camera Viewfinder */}
            {isCameraOpen && (
              <div className="max-w-md mx-auto bg-slate-950 p-4 rounded-2xl border-2 border-amber-500/70 shadow-2xl space-y-4 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Live Studio Camera Active
                  </span>
                  <button
                    onClick={switchCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-slate-200 border border-slate-700"
                  >
                    🔄 Front / Back Camera
                  </button>
                </div>

                {cameraError ? (
                  <div className="p-5 bg-red-950/50 border border-red-700 rounded-xl text-xs text-red-200">
                    {cameraError}
                  </div>
                ) : (
                  <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full max-h-[52vh] object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-40 h-52 border-2 border-dashed border-amber-400 rounded-full mb-4" />
                      <span className="text-[11px] bg-black/75 text-amber-300 px-3 py-1 rounded-full font-bold">
                        Chehra oval ke andar seedha rakhein
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={captureFromCamera}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition"
                >
                  📸 Capture Photo &amp; Go to Crop →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CROP PHOTO TO PASSPORT SIZE                       */}
        {/* ========================================================= */}
        {step === 2 && rawImageObj && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-800 shadow-2xl">
            {/* Left: Interactive Crop Box */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between w-full text-xs">
                <span className="font-black text-amber-400">
                  📐 Drag Photo Inside Frame to Center Face
                </span>
                <span className="text-slate-400">
                  {selectedPreset.widthMm} × {selectedPreset.heightMm} mm
                </span>
              </div>

              <div
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                className="relative cursor-move select-none touch-none border-2 border-amber-400 rounded-lg overflow-hidden shadow-2xl bg-slate-900"
              >
                {cropPreviewUrl && (
                  <img
                    src={cropPreviewUrl}
                    alt="Crop Preview"
                    draggable={false}
                    className="h-72 w-auto object-contain block"
                  />
                )}
                {/* Passport Biometric Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-[58%] h-[62%] border-2 border-dashed border-amber-300/75 rounded-full mb-6" />
                  <span className="text-[10px] bg-black/70 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                    👆 Drag with mouse/finger to position face
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Size Preset & Crop Sliders + "Crop & Remove Background" CTA */}
            <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">
                    Step 2: Crop Face &amp; Shoulders
                  </h2>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    ← Change Photo
                  </button>
                </div>

                {/* Select Size Preset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {PASSPORT_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedPreset.id === preset.id
                          ? 'border-amber-500 bg-amber-950/30 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-slate-100">{preset.label}</div>
                      <div className="text-[10px] text-slate-400">{preset.subLabel}</div>
                    </div>
                  ))}
                </div>

                {/* Zoom, Pan, Rotate Controls */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-300">Fine-Tune Crop Position:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-300 font-bold"
                      >
                        ↻ Rotate 90°
                      </button>
                      <button
                        onClick={() => setFlipH((f) => !f)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-blue-300 font-bold"
                      >
                        ⇄ Flip
                      </button>
                      <button
                        onClick={() => {
                          setZoom(1.15);
                          setPanX(0);
                          setPanY(0);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">
                        🔍 Zoom ({Math.round(zoom * 100)}%)
                      </span>
                      <input
                        type="range"
                        min={0.6}
                        max={2.6}
                        step={0.03}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">↔️ Left / Right ({panX})</span>
                      <input
                        type="range"
                        min={-220}
                        max={220}
                        value={panX}
                        onChange={(e) => setPanX(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">↕️ Up / Down ({panY})</span>
                      <input
                        type="range"
                        min={-220}
                        max={220}
                        value={panY}
                        onChange={(e) => setPanY(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCropAndGenerate10Styles}
                disabled={isProcessingCropBg}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-2"
              >
                {isProcessingCropBg
                  ? '🤖 Removing Background & Creating 10 HD Clear Styles...'
                  : '✨ Crop, Remove BG & Show 10 Clear Photo Styles →'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PICK FROM 10 CLEAR & SHARP PHOTO VARIATIONS       */}
        {/* ========================================================= */}
        {step === 3 && croppedCanvasRefState && (
          <div className="bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">
                  Step 3: Select Your Favorite Clear &amp; Sharp Photo (10 Studio Styles)
                </h2>
                <p className="text-xs text-slate-400">
                  Background remove ho chuka hai! Niche diye gaye 10 Clear &amp; Sharp studio versions mein se jo aapke chehre par sabse best lage use select karke Next dabayein:
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
                >
                  ← Re-Crop
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg transition"
                >
                  Next: Background Color &amp; Print →
                </button>
              </div>
            </div>

            {/* 10 Studio Clarity Variations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {TEN_CLARITY_STYLES.map((style) => {
                const isSelected = selectedStyleId === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`p-2.5 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center text-center ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950/30 scale-[1.03] shadow-xl'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative mb-2">
                      {styleThumbnails[style.id] && (
                        <img
                          src={styleThumbnails[style.id]}
                          alt={style.name}
                          className="h-36 w-auto object-contain rounded bg-white shadow-md"
                        />
                      )}
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-black/80 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        {style.badge}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white">{style.name}</div>
                    <div className="mt-1">
                      {isSelected ? (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">
                          ✓ Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Click to Select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(4)}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition"
              >
                ✅ Confirm Style &amp; Go to Background Color / Print (Step 4) →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: CUSTOMIZE BACKGROUND COLOR, NAME/DATE, KB & PRINT */}
        {/* ========================================================= */}
        {step === 4 && croppedCanvasRefState && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Background Color, Edge Fine-Tune, Clarity Tweak & Name/Date */}
            <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-black text-white">
                  Step 4: Customize Background &amp; Options
                </h2>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  ← Change Clarity Style (10 Options)
                </button>
              </div>

              {/* 1. Background Color Picker */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="font-black text-amber-400 uppercase block">
                  1. Choose Background Color
                </span>
                <div className="flex flex-wrap gap-2">
                  {BG_PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => setBgColor(col.hex)}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition ${
                        bgColor === col.hex
                          ? 'border-amber-400 bg-slate-800 text-white scale-105 shadow'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {col.hex !== 'original' && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-500"
                          style={{ backgroundColor: col.hex }}
                        />
                      )}
                      {col.name}
                    </button>
                  ))}

                  {/* Custom Any Color Picker */}
                  <label
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 border cursor-pointer transition ${
                      !BG_PRESET_COLORS.some((c) => c.hex === bgColor)
                        ? 'border-amber-400 bg-slate-800 text-white scale-105 shadow'
                        : 'border-slate-700 bg-slate-900 text-amber-300'
                    }`}
                  >
                    <input
                      type="color"
                      value={customHexColor}
                      onChange={(e) => {
                        setCustomHexColor(e.target.value);
                        setBgColor(e.target.value);
                      }}
                      className="w-5 h-5 cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span>🎨 Custom Color</span>
                  </label>
                </div>

                {/* Edge Expand & Smoothness Sliders */}
                {bgColor !== 'original' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-bold">👂 Ear &amp; Hair Edge Adjust</span>
                        <span className="text-amber-400 font-bold">{edgeExpand}</span>
                      </div>
                      <input
                        type="range"
                        min={-25}
                        max={40}
                        value={edgeExpand}
                        onChange={(e) => setEdgeExpand(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-bold">✨ Hair Edge Smoothness</span>
                        <span className="text-amber-400 font-bold">{edgeSmoothness}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={6}
                        step={0.5}
                        value={edgeSmoothness}
                        onChange={(e) => setEdgeSmoothness(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Extra Fine-Tune Brightness & Sharpness */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="font-black text-slate-200 uppercase block">
                  2. Fine-Tune Selected Clarity Style
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      ☀️ Extra Brightness ({extraBrightness > 0 ? `+${extraBrightness}` : extraBrightness})
                    </span>
                    <input
                      type="range"
                      min={-15}
                      max={20}
                      value={extraBrightness}
                      onChange={(e) => setExtraBrightness(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      💎 Extra Sharpness ({extraSharpness > 0 ? `+${extraSharpness}` : extraSharpness})
                    </span>
                    <input
                      type="range"
                      min={-20}
                      max={30}
                      value={extraSharpness}
                      onChange={(e) => setExtraSharpness(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Sarkari Form Name & Date Slate + Cut Border */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-amber-300">
                    <input
                      type="checkbox"
                      checked={showNameDate}
                      onChange={(e) => setShowNameDate(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    🏷️ Add Name &amp; Date on Photo (SSC / Police Forms)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={addBorder}
                      onChange={(e) => setAddBorder(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    ⬛ Add Cut Border
                  </label>
                </div>

                {showNameDate && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <input
                      type="text"
                      placeholder="Candidate Name"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Date (DD-MM-YYYY)"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold outline-none focus:border-amber-500"
                    />
                    <select
                      value={slateStyle}
                      onChange={(e) => setSlateStyle(e.target.value as 'white' | 'black')}
                      className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    >
                      <option value="white">White Slate (Black Text)</option>
                      <option value="black">Black Slate (White Text)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Single Photo KB Download + A4 Print Sheet */}
            <div className="lg:col-span-6 space-y-6">
              {/* CARD A: Single Passport Photo Preview & Exact KB Download */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      🪪 Single Passport Photo (For Online Form Upload)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Exact Size: {selectedPreset.widthMm} × {selectedPreset.heightMm} mm
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-600/50 px-3 py-1 rounded-full font-black">
                    Size: {singlePhotoSizeStr}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {singlePhotoUrl && (
                      <img
                        src={singlePhotoUrl}
                        alt="Single Passport Preview"
                        className="h-44 w-auto object-contain shadow-2xl rounded-sm bg-white"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-7 space-y-3 text-xs">
                    <div className="font-bold text-slate-300">🎯 Select File Size in KB:</div>

                    <div className="flex flex-wrap gap-1.5">
                      {[15, 20, 35, 50, 100, 200].map((kb) => (
                        <button
                          key={kb}
                          onClick={() => {
                            setTargetKbMode('custom');
                            setTargetKb(kb);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                            targetKbMode === 'custom' && targetKb === kb
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {kb} KB
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Custom KB:</span>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={targetKb}
                        onChange={(e) => {
                          setTargetKbMode('custom');
                          setTargetKb(Math.max(10, Number(e.target.value)));
                        }}
                        className="w-24 p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-center"
                      />
                      <span className="text-slate-500">KB</span>
                    </div>

                    <a
                      href={singlePhotoUrl}
                      download={`passport-photo-${singlePhotoSizeStr.replace(/\s+/g, '')}.jpg`}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      📥 Download Single Photo ({singlePhotoSizeStr})
                    </a>
                  </div>
                </div>
              </div>

              {/* CARD B: Printable A4 Multi-Copy Sheet */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      🖨️ A4 Sheet Multi-Photo Layout (Print Ready)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Arrange 4, 6, 8, 12 or up to 36 passport photos on a single A4 page
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-400">
                    {copyCount} Copies Selected
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-bold mr-1">Copies:</span>
                    {[4, 6, 8, 10, 12, 16, 20, 24, 30, 36].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setCopyCount(cnt)}
                        className={`px-2.5 py-1.5 rounded-lg font-black border transition ${
                          copyCount === cnt
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Custom Count:</span>
                      <input
                        type="number"
                        min={1}
                        max={42}
                        value={copyCount}
                        onChange={(e) =>
                          setCopyCount(Math.max(1, Math.min(42, Number(e.target.value))))
                        }
                        className="w-20 p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-center"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Cutting Space:</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={sheetGapMm}
                        onChange={(e) => setSheetGapMm(Number(e.target.value))}
                        className="w-24 accent-amber-500"
                      />
                      <span className="text-amber-400 font-bold">{sheetGapMm}mm</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center">
                  {sheetPreviewUrl && (
                    <img
                      src={sheetPreviewUrl}
                      alt="A4 Sheet Preview"
                      className="max-h-64 w-auto object-contain rounded shadow-2xl border border-slate-700 bg-white"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={downloadA4SheetPdf}
                    disabled={isExportingSheet}
                    className="py-3 px-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    📄 {isExportingSheet ? 'Saving...' : 'Download A4 PDF'}
                  </button>

                  <button
                    onClick={downloadA4SheetJpg}
                    className="py-3 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    🖼️ Download A4 JPG
                  </button>

                  <button
                    onClick={printA4SheetDirectly}
                    className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    🖨️ Print Sheet Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}