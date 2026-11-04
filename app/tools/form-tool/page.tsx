'use client';

import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

// ==========================================
// 1. 2025-26 EXAM PRESETS (CLEAN & ACCURATE)
// ==========================================

type DocCategory = 'photo' | 'signature' | 'thumb' | 'declaration' | 'postcard';

interface ExamDocSpec {
  id: string;
  category: DocCategory;
  name: string;
  info: string;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
  minKb: number;
  maxKb: number;
  targetKb: number;
  dpi: number;
  needsNameDate?: boolean;
  isInkDoc?: boolean;
}

interface ExamGroup {
  id: string;
  shortName: string;
  fullName: string;
  note: string;
  docs: ExamDocSpec[];
}

const EXAM_LIST: ExamGroup[] = [
  {
    id: 'ssc',
    shortName: '🔥 SSC Exams',
    fullName: 'SSC (CGL, CHSL, GD, MTS, CPO)',
    note: 'SSC mein Photo live capture hoti hai. Form mein sirf Signature (6×2 cm, 10–20 KB) upload hota hai.',
    docs: [
      {
        id: 'ssc-sign',
        category: 'signature',
        name: '✍️ SSC Signature',
        info: '6.0 × 2.0 cm • 10–20 KB',
        widthPx: 472,
        heightPx: 157,
        widthCm: 6.0,
        heightCm: 2.0,
        minKb: 10,
        maxKb: 20,
        targetKb: 15,
        dpi: 200,
        isInkDoc: true,
      },
      {
        id: 'ssc-photo',
        category: 'photo',
        name: '🪪 SSC Passport Photo',
        info: '3.5 × 4.5 cm • 20–50 KB',
        widthPx: 275,
        heightPx: 354,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 20,
        maxKb: 50,
        targetKb: 35,
        dpi: 200,
      },
    ],
  },
  {
    id: 'ibps',
    shortName: '🏦 Banking (IBPS/SBI)',
    fullName: 'IBPS, SBI, RBI (PO / Clerk / SO)',
    note: 'Banking forms mein Photo, Signature, Left Thumb aur Handwritten Declaration charon lagte hain.',
    docs: [
      {
        id: 'ibps-photo',
        category: 'photo',
        name: '🪪 Passport Photo',
        info: '200 × 230 px • 20–50 KB',
        widthPx: 200,
        heightPx: 230,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 20,
        maxKb: 50,
        targetKb: 35,
        dpi: 200,
      },
      {
        id: 'ibps-sign',
        category: 'signature',
        name: '✍️ Signature (Black Ink)',
        info: '140 × 60 px • 10–20 KB',
        widthPx: 140,
        heightPx: 60,
        widthCm: 3.5,
        heightCm: 1.5,
        minKb: 10,
        maxKb: 20,
        targetKb: 15,
        dpi: 200,
        isInkDoc: true,
      },
      {
        id: 'ibps-thumb',
        category: 'thumb',
        name: '👍 Left Thumb Impression',
        info: '240 × 240 px • 20–50 KB',
        widthPx: 240,
        heightPx: 240,
        widthCm: 3.0,
        heightCm: 3.0,
        minKb: 20,
        maxKb: 50,
        targetKb: 35,
        dpi: 200,
        isInkDoc: true,
      },
      {
        id: 'ibps-decl',
        category: 'declaration',
        name: '📝 Handwritten Declaration',
        info: '800 × 400 px • 50–100 KB',
        widthPx: 800,
        heightPx: 400,
        widthCm: 10.0,
        heightCm: 5.0,
        minKb: 50,
        maxKb: 100,
        targetKb: 75,
        dpi: 200,
        isInkDoc: true,
      },
    ],
  },
  {
    id: 'rrb',
    shortName: '🚆 Railway RRB',
    fullName: 'Railway RRB (NTPC, Group D, ALP, JE)',
    note: 'Railway RRB mein Photo aur Signature dono 30 KB se 70 KB ke beech maange jate hain.',
    docs: [
      {
        id: 'rrb-photo',
        category: 'photo',
        name: '🪪 RRB Passport Photo',
        info: '3.5 × 4.5 cm • 30–70 KB',
        widthPx: 275,
        heightPx: 354,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 30,
        maxKb: 70,
        targetKb: 48,
        dpi: 200,
      },
      {
        id: 'rrb-sign',
        category: 'signature',
        name: '✍️ RRB Signature',
        info: '5.0 × 2.0 cm • 30–70 KB',
        widthPx: 394,
        heightPx: 157,
        widthCm: 5.0,
        heightCm: 2.0,
        minKb: 30,
        maxKb: 70,
        targetKb: 45,
        dpi: 200,
        isInkDoc: true,
      },
    ],
  },
  {
    id: 'upsc',
    shortName: '🏛️ UPSC',
    fullName: 'UPSC (IAS, NDA, CDS, CAPF, EPFO)',
    note: 'UPSC mein Photo par Name & Date hona zaroori hai aur size 350px se 1000px ke beech hona chahiye.',
    docs: [
      {
        id: 'upsc-photo',
        category: 'photo',
        name: '🪪 Photo (With Name & Date)',
        info: '550 × 550 px • 20–300 KB',
        widthPx: 550,
        heightPx: 550,
        widthCm: 4.5,
        heightCm: 4.5,
        minKb: 20,
        maxKb: 300,
        targetKb: 85,
        dpi: 300,
        needsNameDate: true,
      },
      {
        id: 'upsc-sign',
        category: 'signature',
        name: '✍️ UPSC Signature',
        info: '550 × 350 px • 20–300 KB',
        widthPx: 550,
        heightPx: 350,
        widthCm: 4.5,
        heightCm: 2.9,
        minKb: 20,
        maxKb: 300,
        targetKb: 55,
        dpi: 300,
        isInkDoc: true,
      },
    ],
  },
  {
    id: 'neet',
    shortName: '🩺 NEET UG',
    fullName: 'NEET UG / Medical (NTA)',
    note: 'NEET mein Passport Photo, Postcard Photo (4×6 inch), Signature aur 10-Fingers lagte hain.',
    docs: [
      {
        id: 'neet-photo',
        category: 'photo',
        name: '🪪 Passport Photo (Name/Date)',
        info: '3.5 × 4.5 cm • 10–200 KB',
        widthPx: 413,
        heightPx: 531,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 10,
        maxKb: 200,
        targetKb: 65,
        dpi: 300,
        needsNameDate: true,
      },
      {
        id: 'neet-postcard',
        category: 'postcard',
        name: '🖼️ Postcard Photo (4×6 Inch)',
        info: '4 × 6 Inch • 10–200 KB',
        widthPx: 800,
        heightPx: 1200,
        widthCm: 10.16,
        heightCm: 15.24,
        minKb: 10,
        maxKb: 200,
        targetKb: 110,
        dpi: 300,
        needsNameDate: true,
      },
      {
        id: 'neet-sign',
        category: 'signature',
        name: '✍️ NEET Signature',
        info: '3.5 × 1.5 cm • 4–30 KB',
        widthPx: 275,
        heightPx: 118,
        widthCm: 3.5,
        heightCm: 1.5,
        minKb: 10,
        maxKb: 30,
        targetKb: 18,
        dpi: 200,
        isInkDoc: true,
      },
      {
        id: 'neet-fingers',
        category: 'thumb',
        name: '🖐️ 10-Fingers & Thumb',
        info: '6.0 × 3.0 cm • 10–200 KB',
        widthPx: 600,
        heightPx: 300,
        widthCm: 6.0,
        heightCm: 3.0,
        minKb: 10,
        maxKb: 200,
        targetKb: 75,
        dpi: 200,
        isInkDoc: true,
      },
    ],
  },
  {
    id: 'jee',
    shortName: '🎓 JEE / CUET',
    fullName: 'JEE Main & CUET UG/PG (NTA)',
    note: 'NTA JEE aur CUET ke liye Photo (10–200 KB) aur Signature (4–30 KB) auto-set hain.',
    docs: [
      {
        id: 'jee-photo',
        category: 'photo',
        name: '🪪 Passport Photo',
        info: '3.5 × 4.5 cm • 10–200 KB',
        widthPx: 413,
        heightPx: 531,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 10,
        maxKb: 200,
        targetKb: 60,
        dpi: 300,
      },
      {
        id: 'jee-sign',
        category: 'signature',
        name: '✍️ Signature',
        info: '3.5 × 1.5 cm • 4–30 KB',
        widthPx: 275,
        heightPx: 118,
        widthCm: 3.5,
        heightCm: 1.5,
        minKb: 10,
        maxKb: 30,
        targetKb: 18,
        dpi: 200,
        isInkDoc: true,
      },
    ],
  },
  {
    id: 'state',
    shortName: '🚓 Bihar / UP / Police',
    fullName: 'BPSC, Bihar Police, UPPSC, UP Police, GDS',
    note: 'State exams mein Photo (20–50 KB) aur Hindi/English Signature (10–20 KB) lagte hain.',
    docs: [
      {
        id: 'state-photo',
        category: 'photo',
        name: '🪪 Passport Photo',
        info: '3.5 × 4.5 cm • 20–50 KB',
        widthPx: 275,
        heightPx: 354,
        widthCm: 3.5,
        heightCm: 4.5,
        minKb: 20,
        maxKb: 50,
        targetKb: 35,
        dpi: 200,
      },
      {
        id: 'state-sign-en',
        category: 'signature',
        name: '✍️ English Signature',
        info: '3.5 × 1.5 cm • 10–20 KB',
        widthPx: 275,
        heightPx: 118,
        widthCm: 3.5,
        heightCm: 1.5,
        minKb: 10,
        maxKb: 20,
        targetKb: 15,
        dpi: 200,
        isInkDoc: true,
      },
      {
        id: 'state-sign-hi',
        category: 'signature',
        name: '✍️ Hindi Signature',
        info: '3.5 × 1.5 cm • 10–20 KB',
        widthPx: 275,
        heightPx: 118,
        widthCm: 3.5,
        heightCm: 1.5,
        minKb: 10,
        maxKb: 20,
        targetKb: 15,
        dpi: 200,
        isInkDoc: true,
      },
    ],
  },
];

// ==========================================
// 2. BINARY JPEG DPI & EXACT KB HELPER
// ==========================================

function buildExactDpiAndKbJpeg(
  base64DataUrl: string,
  dpi: number,
  minBytes: number,
  targetBytes: number
): { dataUrl: string; byteSize: number } {
  const parts = base64DataUrl.split(',');
  if (parts.length < 2) return { dataUrl: base64DataUrl, byteSize: 0 };

  const binaryStr = atob(parts[1]);
  const rawLen = binaryStr.length;
  const bytes = new Uint8Array(rawLen);
  for (let i = 0; i < rawLen; i++) bytes[i] = binaryStr.charCodeAt(i);

  if (
    bytes.length > 20 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[3] === 0xe0
  ) {
    bytes[13] = 1;
    bytes[14] = (dpi >> 8) & 0xff;
    bytes[15] = dpi & 0xff;
    bytes[16] = (dpi >> 8) & 0xff;
    bytes[17] = dpi & 0xff;
  }

  let finalBytes = bytes;
  const desiredFloor = Math.max(minBytes, Math.round(targetBytes * 0.94));

  if (bytes.length < desiredFloor && bytes.length >= 4) {
    const needed = desiredFloor - bytes.length;
    const padded = new Uint8Array(bytes.length + needed);
    padded.set(bytes.subarray(0, bytes.length - 2), 0);
    let offset = bytes.length - 2;
    let rem = needed;
    while (rem > 0) {
      if (rem >= 4) {
        const segSize = Math.min(rem - 2, 30000);
        padded[offset] = 0xff;
        padded[offset + 1] = 0xfe;
        padded[offset + 2] = (segSize >> 8) & 0xff;
        padded[offset + 3] = segSize & 0xff;
        for (let k = 4; k < segSize + 2; k++) padded[offset + k] = 0x20;
        offset += segSize + 2;
        rem -= segSize + 2;
      } else {
        padded[offset++] = 0x00;
        rem--;
      }
    }
    padded[padded.length - 2] = 0xff;
    padded[padded.length - 1] = 0xd9;
    finalBytes = padded;
  }

  let outBin = '';
  const chunkSize = 8192;
  for (let i = 0; i < finalBytes.length; i += chunkSize) {
    const chunk = finalBytes.subarray(i, i + chunkSize);
    outBin += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return {
    dataUrl: `data:image/jpeg;base64,${btoa(outBin)}`,
    byteSize: finalBytes.length,
  };
}

export default function EasyFormTool() {
  // Top Tool Switcher
  type ToolMode = 'exam-resizer' | 'pdf-maker' | 'id-combiner' | 'photo-sign-join' | 'checker' | 'calc';
  const [mode, setMode] = useState<ToolMode>('exam-resizer');

  // Exam & Document State
  const [selectedExamId, setSelectedExamId] = useState<string>('ssc');
  const currentExam = EXAM_LIST.find((e) => e.id === selectedExamId) || EXAM_LIST[0];
  const [selectedDoc, setSelectedDoc] = useState<ExamDocSpec>(EXAM_LIST[0].docs[0]);

  // Image & Simple Controls
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [widthPx, setWidthPx] = useState<number>(472);
  const [heightPx, setHeightPx] = useState<number>(157);
  const [dpi, setDpi] = useState<number>(200);
  const [minKb, setMinKb] = useState<number>(10);
  const [maxKb, setMaxKb] = useState<number>(20);
  const [targetKb, setTargetKb] = useState<number>(15);

  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showCustomBox, setShowCustomBox] = useState<boolean>(false);

  // Signature / Thumb Clean White Paper Mode
  const [cleanInkPaper, setCleanInkPaper] = useState<boolean>(true);
  const [shadowPower, setShadowPower] = useState<number>(218);
  const [inkTone, setInkTone] = useState<'black' | 'blue' | 'original'>('black');

  // Photo Name & Date Slate
  const [showNameDate, setShowNameDate] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('');
  const [photoDate, setPhotoDate] = useState<string>(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  );

  // Processed Output
  const [outputUrl, setOutputUrl] = useState<string>('');
  const [outputBytes, setOutputBytes] = useState<number>(0);
  const [copiedDecl, setCopiedDecl] = useState<boolean>(false);

  // Extra Tool States (PDF, ID Card, Photo+Sign, Checker, Calc)
  const [pdfImages, setPdfImages] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [pdfTargetKb, setPdfTargetKb] = useState<number>(150);
  const [pdfOutUrl, setPdfOutUrl] = useState<string>('');
  const [pdfOutBytes, setPdfOutBytes] = useState<number>(0);

  const [idFront, setIdFront] = useState<HTMLImageElement | null>(null);
  const [idBack, setIdBack] = useState<HTMLImageElement | null>(null);
  const [idOutUrl, setIdOutUrl] = useState<string>('');
  const [idOutBytes, setIdOutBytes] = useState<number>(0);

  const [joinPhoto, setJoinPhoto] = useState<HTMLImageElement | null>(null);
  const [joinSign, setJoinSign] = useState<HTMLImageElement | null>(null);
  const [joinOutUrl, setJoinOutUrl] = useState<string>('');
  const [joinOutBytes, setJoinOutBytes] = useState<number>(0);

  const [checkResult, setCheckResult] = useState<{
    w: number;
    h: number;
    kb: string;
    dpi: number;
    url: string;
  } | null>(null);

  const [dob, setDob] = useState<string>('2003-05-15');
  const [asOn, setAsOn] = useState<string>('2026-08-01');
  const [cgpa, setCgpa] = useState<string>('8.2');

  const formatKb = (b: number) => `${(b / 1024).toFixed(1)} KB`;

  // Apply Document Preset
  const selectDocumentPreset = (doc: ExamDocSpec) => {
    setSelectedDoc(doc);
    setWidthPx(doc.widthPx);
    setHeightPx(doc.heightPx);
    setDpi(doc.dpi);
    setMinKb(doc.minKb);
    setMaxKb(doc.maxKb);
    setTargetKb(doc.targetKb);
    setCleanInkPaper(!!doc.isInkDoc);
    setShowNameDate(!!doc.needsNameDate);
    setFitMode(doc.category === 'photo' || doc.category === 'postcard' ? 'cover' : 'contain');
    setZoom(1.0);
    setRotation(0);
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    const grp = EXAM_LIST.find((e) => e.id === examId);
    if (grp && grp.docs.length > 0) {
      selectDocumentPreset(grp.docs[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) {
        const img = new Image();
        img.onload = () => {
          setSourceImg(img);
          setZoom(1.0);
          setRotation(0);
        };
        img.src = ev.target.result as string;
      }
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  // Master Render Pipeline
  useEffect(() => {
    if (!sourceImg) return;

    const w = Math.max(20, Math.min(2400, Math.round(widthPx)));
    const h = Math.max(20, Math.min(2400, Math.round(heightPx)));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    const imgRatio = sourceImg.width / sourceImg.height;
    const targetRatio = w / h;
    let dw = w;
    let dh = h;

    if (fitMode === 'cover') {
      if (imgRatio > targetRatio) {
        dh = h;
        dw = h * imgRatio;
      } else {
        dw = w;
        dh = w / imgRatio;
      }
    } else {
      if (imgRatio > targetRatio) {
        dw = w;
        dh = w / imgRatio;
      } else {
        dh = h;
        dw = h * imgRatio;
      }
    }

    dw *= zoom;
    dh *= zoom;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(sourceImg, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    // Anti-Shadow Paper Whitener for Signature / Thumb / Declaration
    if (cleanInkPaper) {
      const illum = document.createElement('canvas');
      illum.width = w;
      illum.height = h;
      const iCtx = illum.getContext('2d')!;
      iCtx.fillStyle = '#FFFFFF';
      iCtx.fillRect(0, 0, w, h);
      const blurPx = Math.max(12, Math.round(Math.max(w, h) * 0.06));
      iCtx.filter = `blur(${blurPx}px)`;
      iCtx.drawImage(canvas, 0, 0);
      iCtx.filter = 'none';

      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const bg = iCtx.getImageData(0, 0, w, h).data;

      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const bgLum = Math.max(65, 0.299 * bg[i] + 0.587 * bg[i + 1] + 0.114 * bg[i + 2]);
        const rel = Math.min(255, (lum / bgLum) * 255);

        if (rel >= shadowPower) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else {
          const ratio = Math.max(0, (rel - 95) / Math.max(1, shadowPower - 95));
          const curve = Math.pow(ratio, 2.1);
          if (inkTone === 'black') {
            const v = Math.round(curve * 38);
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
          } else if (inkTone === 'blue') {
            d[i] = Math.round(curve * 18);
            d[i + 1] = Math.round(curve * 42);
            d[i + 2] = Math.min(255, Math.round(145 + curve * 65));
          } else {
            d[i] = Math.round(d[i] * curve);
            d[i + 1] = Math.round(d[i + 1] * curve);
            d[i + 2] = Math.round(d[i + 2] * curve);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Name & Date Slate on Photo
    if (showNameDate && (candidateName.trim() || photoDate.trim())) {
      const sh = Math.round(h * 0.16);
      const sy = h - sh;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, sy, w, sh);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nf = Math.max(9, Math.round(sh * 0.36));
      const df = Math.max(8, Math.round(sh * 0.32));

      if (candidateName.trim() && photoDate.trim()) {
        ctx.font = `bold ${nf}px Arial`;
        ctx.fillText(candidateName.toUpperCase(), w / 2, sy + sh * 0.33);
        ctx.font = `bold ${df}px Arial`;
        ctx.fillText(`DOP: ${photoDate}`, w / 2, sy + sh * 0.74);
      } else {
        ctx.font = `bold ${nf}px Arial`;
        ctx.fillText(
          candidateName.trim() ? candidateName.toUpperCase() : `DOP: ${photoDate}`,
          w / 2,
          sy + sh * 0.52
        );
      }
    }

    // Compress to Target KB
    const tBytes = Math.max(4, targetKb) * 1024;
    const minB = Math.max(2, minKb) * 1024;
    const maxB = Math.max(tBytes, maxKb * 1024);

    let lowQ = 0.12;
    let highQ = 0.98;
    let bestUrl = canvas.toDataURL('image/jpeg', 0.9);
    let minDiff = Infinity;

    for (let i = 0; i < 7; i++) {
      const midQ = (lowQ + highQ) / 2;
      const u = canvas.toDataURL('image/jpeg', midQ);
      const b = Math.round((u.length - 23) * 0.75);
      const diff = Math.abs(b - tBytes);
      if (b <= maxB * 0.98 && diff < minDiff) {
        minDiff = diff;
        bestUrl = u;
      }
      if (b > tBytes) highQ = midQ;
      else lowQ = midQ;
    }

    const res = buildExactDpiAndKbJpeg(bestUrl, dpi, minB, tBytes);
    setOutputUrl(res.dataUrl);
    setOutputBytes(res.byteSize);
  }, [
    sourceImg,
    widthPx,
    heightPx,
    dpi,
    minKb,
    maxKb,
    targetKb,
    fitMode,
    rotation,
    zoom,
    cleanInkPaper,
    shadowPower,
    inkTone,
    showNameDate,
    candidateName,
    photoDate,
  ]);

  // Helper for ID Card & Photo+Sign Joint uploads
  const loadSimpleImg = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const im = new Image();
      im.onload = () => setter(im);
      im.src = ev.target?.result as string;
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  // ID Card Combiner Effect
  useEffect(() => {
    if (!idFront && !idBack) return;
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 1000;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    const drawSide = (im: HTMLImageElement, y: number, title: string) => {
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(40, y, 720, 440);
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, 400, y + 22);
      const sc = Math.min(680 / im.width, 390 / im.height);
      const dw = im.width * sc;
      const dh = im.height * sc;
      ctx.drawImage(im, 40 + (720 - dw) / 2, y + 32 + (395 - dh) / 2, dw, dh);
    };

    if (idFront) drawSide(idFront, 30, 'ID CARD — FRONT SIDE');
    if (idBack) drawSide(idBack, 520, 'ID CARD — BACK SIDE');

    const res = buildExactDpiAndKbJpeg(c.toDataURL('image/jpeg', 0.85), 200, 20 * 1024, 120 * 1024);
    setIdOutUrl(res.dataUrl);
    setIdOutBytes(res.byteSize);
  }, [idFront, idBack]);

  // Photo + Signature Joint Maker Effect
  useEffect(() => {
    if (!joinPhoto && !joinSign) return;
    const c = document.createElement('canvas');
    c.width = 275;
    c.height = 472;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 275, 472);

    if (joinPhoto) {
      const sc = Math.max(275 / joinPhoto.width, 354 / joinPhoto.height);
      const dw = joinPhoto.width * sc;
      const dh = joinPhoto.height * sc;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 275, 354);
      ctx.clip();
      ctx.drawImage(joinPhoto, (275 - dw) / 2, (354 - dh) / 2, dw, dh);
      ctx.restore();
    }

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 354);
    ctx.lineTo(275, 354);
    ctx.stroke();

    if (joinSign) {
      const sc = Math.min(255 / joinSign.width, 100 / joinSign.height);
      const dw = joinSign.width * sc;
      const dh = joinSign.height * sc;
      ctx.drawImage(joinSign, (275 - dw) / 2, 354 + (118 - dh) / 2, dw, dh);
    }
    ctx.strokeRect(1, 1, 273, 470);

    const res = buildExactDpiAndKbJpeg(c.toDataURL('image/jpeg', 0.9), 200, 15 * 1024, 38 * 1024);
    setJoinOutUrl(res.dataUrl);
    setJoinOutBytes(res.byteSize);
  }, [joinPhoto, joinSign]);

  // Certificate PDF Builder
  const handleAddPdfPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const list: Array<{ id: string; name: string; url: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) continue;
      const u = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(f);
      });
      list.push({ id: `${Date.now()}-${i}`, name: f.name, url: u });
    }
    setPdfImages((prev) => [...prev, ...list]);
    e.target.value = '';
  };

  const buildCertificatePdf = async () => {
    if (pdfImages.length === 0) return;
    const budgetPerPage = Math.floor((pdfTargetKb * 1024 * 0.9) / pdfImages.length);
    const pdfDoc = await PDFDocument.create();

    for (const item of pdfImages) {
      const im = await new Promise<HTMLImageElement>((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.src = item.url;
      });
      const c = document.createElement('canvas');
      c.width = Math.min(1000, im.width);
      c.height = Math.round((im.height / im.width) * c.width);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);

      let chosenBin = '';
      for (let q = 0.85; q >= 0.2; q -= 0.08) {
        const b64 = c.toDataURL('image/jpeg', q).split(',')[1];
        const bin = atob(b64);
        chosenBin = bin;
        if (bin.length <= budgetPerPage) break;
      }
      const arr = new Uint8Array(chosenBin.length);
      for (let k = 0; k < chosenBin.length; k++) arr[k] = chosenBin.charCodeAt(k);
      const jpg = await pdfDoc.embedJpg(arr);
      const page = pdfDoc.addPage([595.28, 841.89]);
      const sc = Math.min(555 / jpg.width, 800 / jpg.height);
      page.drawImage(jpg, {
        x: (595.28 - jpg.width * sc) / 2,
        y: (841.89 - jpg.height * sc) / 2,
        width: jpg.width * sc,
        height: jpg.height * sc,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    setPdfOutUrl(URL.createObjectURL(blob));
    setPdfOutBytes(pdfBytes.length);
  };

  // File Checker
  const handleCheckFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const u = ev.target?.result as string;
      let dpiFound = 96;
      try {
        const bin = atob(u.split(',')[1].slice(0, 64));
        if (bin.charCodeAt(0) === 0xff && bin.charCodeAt(3) === 0xe0) {
          const x = (bin.charCodeAt(14) << 8) | bin.charCodeAt(15);
          if (x > 0) dpiFound = x;
        }
      } catch {}
      const im = new Image();
      im.onload = () => {
        setCheckResult({
          w: im.width,
          h: im.height,
          kb: (f.size / 1024).toFixed(1),
          dpi: dpiFound,
          url: u,
        });
      };
      im.src = u;
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  // Age Calc
  const calcAge = () => {
    const d1 = new Date(dob);
    const d2 = new Date(asOn);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d1 > d2) return '0 Years';
    let y = d2.getFullYear() - d1.getFullYear();
    let m = d2.getMonth() - d1.getMonth();
    let d = d2.getDate() - d1.getDate();
    if (d < 0) {
      m--;
      d += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    return `${y} Years, ${m} Months, ${d} Days`;
  };

  const declText = `I, ${
    candidateName.trim() || '[Your Name]'
  }, hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* COMPACT TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← CareerSathi Home
          </Link>
          <span className="text-xs font-black text-amber-400">
            ⚡ Easy 3-Click Exam Form Tool (2025–26)
          </span>
        </div>

        {/* SIMPLE TOOL SWITCHER PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: 'exam-resizer', label: '🎯 Photo / Sign / Thumb' },
            { id: 'pdf-maker', label: '📄 Certificate PDF (KB)' },
            { id: 'id-combiner', label: '🪪 ID Front+Back' },
            { id: 'photo-sign-join', label: '🖼️+✍️ Photo+Sign Joint' },
            { id: 'checker', label: '🔍 Check Size/DPI' },
            { id: 'calc', label: '📅 Age & CGPA Calc' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id as ToolMode)}
              className={`py-2.5 px-2 rounded-xl font-black transition text-center ${
                mode === t.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* MODE 1: SUPER SIMPLE 3-STEP EXAM PHOTO / SIGN / THUMB TOOL   */}
        {/* ============================================================ */}
        {mode === 'exam-resizer' && (
          <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
            {/* STEP 1 & STEP 2 IN ONE CLEAN ROW */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {/* Step 1: Select Exam */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-black text-amber-400 uppercase block">
                  Step 1: Apna Exam Chunein
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleSelectExam(e.target.value)}
                  className="w-full p-3 bg-slate-900 border-2 border-amber-500/60 rounded-xl text-white font-black text-sm outline-none"
                >
                  {EXAM_LIST.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.shortName} — {ex.fullName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">{currentExam.note}</p>
              </div>

              {/* Step 2: Select Document for that Exam */}
              <div className="md:col-span-7 space-y-1.5">
                <label className="text-xs font-black text-emerald-400 uppercase block">
                  Step 2: Kya Banana Hai? (Size Auto-Set Ho Jayega)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentExam.docs.map((doc) => {
                    const active = selectedDoc.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => selectDocumentPreset(doc)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          active
                            ? 'border-emerald-400 bg-emerald-950/40 text-white shadow'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black">{doc.name}</div>
                          <div className="text-[10px] text-amber-300 font-bold">{doc.info}</div>
                        </div>
                        {active && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                            ✓ Set
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Handwritten Declaration Copy Box (Only shown if Declaration selected) */}
            {selectedDoc.category === 'declaration' && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-amber-300">
                    📝 Safed kagaz par Black Pen se yeh likh kar photo upload karein:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(declText);
                      setCopiedDecl(true);
                      setTimeout(() => setCopiedDecl(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded"
                  >
                    {copiedDecl ? '✓ Copied' : 'Copy Text'}
                  </button>
                </div>
                <p className="italic text-slate-200">&ldquo;{declText}&rdquo;</p>
              </div>
            )}

            {/* STEP 3: UPLOAD & INSTANT DOWNLOAD */}
            {!sourceImg ? (
              <label className="block border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition space-y-3">
                <div className="text-4xl">📤</div>
                <div className="text-base md:text-lg font-black text-white">
                  Step 3: Click Here to Upload <span className="text-amber-400">{selectedDoc.name}</span>
                </div>
                <div className="inline-block bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-emerald-400 font-bold">
                  Auto-Set: {widthPx} × {heightPx} px ({selectedDoc.widthCm} × {selectedDoc.heightCm} cm) •{' '}
                  {targetKb} KB • {dpi} DPI
                </div>
                <div>
                  <span className="inline-block mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg">
                    📂 Select Photo / Signature from Phone or PC
                  </span>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-950 p-4 md:p-5 rounded-2xl border border-slate-800">
                {/* Left: Ready Preview & Big Download Button */}
                <div className="md:col-span-6 flex flex-col items-center space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="font-black text-emerald-400">✅ Ready to Upload in Form</span>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black">
                      {formatKb(outputBytes)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center min-h-[170px] w-full">
                    {outputUrl && (
                      <img
                        src={outputUrl}
                        alt="Ready Output"
                        className="max-h-48 w-auto object-contain bg-white rounded shadow-xl"
                      />
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-bold text-center">
                    Size: <strong className="text-white">{widthPx}×{heightPx} px</strong> • File:{' '}
                    <strong className="text-emerald-400">{formatKb(outputBytes)}</strong> •{' '}
                    <strong className="text-amber-300">{dpi} DPI</strong>
                  </div>

                  <a
                    href={outputUrl}
                    download={`${selectedExamId}-${selectedDoc.category}-${widthPx}x${heightPx}.jpg`}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition text-center"
                  >
                    📥 Download Ready File ({formatKb(outputBytes)})
                  </a>

                  <label className="text-xs text-blue-400 hover:underline font-bold cursor-pointer">
                    🔄 Upload Another Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Right: Only 3 Simple Controls */}
                <div className="md:col-span-6 space-y-4 text-xs">
                  {/* 1. Quick KB Selector */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-black text-slate-200">1. File Size (KB):</span>
                      <span className="text-amber-400 font-bold">
                        Required: {minKb}–{maxKb} KB
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[12, 15, 18, 25, 35, 48, 75, 100].map((kb) => (
                        <button
                          key={kb}
                          onClick={() => setTargetKb(kb)}
                          className={`px-3 py-1.5 rounded-lg font-bold border ${
                            targetKb === kb
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-950 text-slate-300 border-slate-800'
                          }`}
                        >
                          {kb} KB
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Contextual Smart Option (Paper Whitener for Sign/Thumb OR Name/Date for Photo) */}
                  {selectedDoc.isInkDoc ? (
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-black text-emerald-400">
                        <input
                          type="checkbox"
                          checked={cleanInkPaper}
                          onChange={(e) => setCleanInkPaper(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        ✨ Clean White Paper (Remove Mobile Shadow)
                      </label>

                      {cleanInkPaper && (
                        <>
                          <div className="flex gap-2">
                            {[
                              { id: 'black', label: '⚫ Black Ink' },
                              { id: 'blue', label: '🔵 Blue Ink' },
                              { id: 'original', label: 'Original' },
                            ].map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setInkTone(t.id as any)}
                                className={`py-1.5 px-2.5 rounded-lg font-bold border flex-1 ${
                                  inkTone === t.id
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-950 text-slate-300 border-slate-800'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block mb-1">
                              Shadow Cleaning Power ({shadowPower})
                            </span>
                            <input
                              type="range"
                              min={180}
                              max={242}
                              value={shadowPower}
                              onChange={(e) => setShadowPower(Number(e.target.value))}
                              className="w-full accent-emerald-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-black text-amber-300">
                        <input
                          type="checkbox"
                          checked={showNameDate}
                          onChange={(e) => setShowNameDate(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        🏷️ Add Name &amp; Date on Photo (UPSC / NEET)
                      </label>
                      {showNameDate && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                          />
                          <input
                            type="text"
                            placeholder="DD-MM-YYYY"
                            value={photoDate}
                            onChange={(e) => setPhotoDate(e.target.value)}
                            className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Rotate / Fit / Optional Custom Size Toggle */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-bold"
                        >
                          ↻ Rotate
                        </button>
                        <button
                          onClick={() => setFitMode(fitMode === 'cover' ? 'contain' : 'cover')}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-bold"
                        >
                          {fitMode === 'cover' ? '📐 Fit Full Image' : '📐 Fill Box'}
                        </button>
                      </div>

                      <button
                        onClick={() => setShowCustomBox(!showCustomBox)}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        {showCustomBox ? '▲ Hide Custom Size' : '⚙️ Custom Width/Height'}
                      </button>
                    </div>

                    {showCustomBox && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Width (px)</span>
                          <input
                            type="number"
                            value={widthPx}
                            onChange={(e) => setWidthPx(Number(e.target.value))}
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Height (px)</span>
                          <input
                            type="number"
                            value={heightPx}
                            onChange={(e) => setHeightPx(Number(e.target.value))}
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">DPI</span>
                          <select
                            value={dpi}
                            onChange={(e) => setDpi(Number(e.target.value))}
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-amber-300 font-bold"
                          >
                            <option value={200}>200 DPI</option>
                            <option value={300}>300 DPI</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: CERTIFICATE JPG TO PDF & KB COMPRESSOR               */}
        {/* ============================================================ */}
        {mode === 'pdf-maker' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white">
                  📄 Marksheet / Caste / EWS Certificate PDF Maker (Exact KB)
                </h2>
                <p className="text-slate-400">
                  Certificate ki photo upload karein aur 50KB, 100KB, 200KB ya 300KB ki PDF banayein.
                </p>
              </div>
              <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer">
                + Upload Certificate Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAddPdfPhotos}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-300">Select PDF KB Limit:</span>
              {[50, 100, 150, 200, 300].map((kb) => (
                <button
                  key={kb}
                  onClick={() => setPdfTargetKb(kb)}
                  className={`px-3 py-1.5 rounded-lg font-bold border ${
                    pdfTargetKb === kb
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  Under {kb} KB
                </button>
              ))}
            </div>

            {pdfImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {pdfImages.map((im, i) => (
                    <div key={im.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <img src={im.url} alt="" className="h-20 object-contain bg-white rounded" />
                      <div className="text-[10px] text-center mt-1">Page {i + 1}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={buildCertificatePdf}
                    className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl"
                  >
                    ⚡ Generate PDF (Under {pdfTargetKb} KB)
                  </button>
                  {pdfOutUrl && (
                    <a
                      href={pdfOutUrl}
                      download={`certificate-${formatKb(pdfOutBytes)}.pdf`}
                      className="px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl"
                    >
                      📥 Download PDF ({formatKb(pdfOutBytes)})
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: ID CARD FRONT + BACK COMBINER                        */}
        {/* ============================================================ */}
        {mode === 'id-combiner' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-black text-white">
              🪪 ID Card Front + Back Combiner (Single Page JPG)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-5 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center cursor-pointer font-bold">
                {idFront ? '✅ Front Side Uploaded' : '📤 1. Upload ID Front Side'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => loadSimpleImg(e, setIdFront)}
                  className="hidden"
                />
              </label>
              <label className="p-5 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center cursor-pointer font-bold">
                {idBack ? '✅ Back Side Uploaded' : '📤 2. Upload ID Back Side'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => loadSimpleImg(e, setIdBack)}
                  className="hidden"
                />
              </label>
            </div>
            {idOutUrl && (
              <div className="text-center space-y-3 pt-2">
                <img
                  src={idOutUrl}
                  alt="Combined ID"
                  className="max-h-60 mx-auto bg-white rounded p-1"
                />
                <a
                  href={idOutUrl}
                  download={`id-card-combined-${formatKb(idOutBytes)}.jpg`}
                  className="inline-block px-8 py-3.5 bg-emerald-500 text-slate-950 font-black rounded-xl"
                >
                  📥 Download Combined ID ({formatKb(idOutBytes)})
                </a>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 4: PHOTO + SIGNATURE JOINT MAKER                        */}
        {/* ============================================================ */}
        {mode === 'photo-sign-join' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-black text-white">
              🖼️+✍️ Photo &amp; Signature Combined Maker (UPPSC OTR / State Forms)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-5 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center cursor-pointer font-bold">
                {joinPhoto ? '✅ Photo Uploaded' : '📤 1. Upload Passport Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => loadSimpleImg(e, setJoinPhoto)}
                  className="hidden"
                />
              </label>
              <label className="p-5 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center cursor-pointer font-bold">
                {joinSign ? '✅ Signature Uploaded' : '📤 2. Upload Signature'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => loadSimpleImg(e, setJoinSign)}
                  className="hidden"
                />
              </label>
            </div>
            {joinOutUrl && (
              <div className="text-center space-y-3 pt-2">
                <img
                  src={joinOutUrl}
                  alt="Combined Photo Sign"
                  className="max-h-56 mx-auto bg-white rounded p-1"
                />
                <a
                  href={joinOutUrl}
                  download={`photo-sign-joint-${formatKb(joinOutBytes)}.jpg`}
                  className="inline-block px-8 py-3.5 bg-emerald-500 text-slate-950 font-black rounded-xl"
                >
                  📥 Download Combined Photo + Sign ({formatKb(joinOutBytes)})
                </a>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 5: CHECK IMAGE SIZE, PIXELS & DPI                       */}
        {/* ============================================================ */}
        {mode === 'checker' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-black text-white">
              🔍 Check Photo / Signature Pixel Size, KB &amp; DPI
            </h2>
            <label className="block p-6 bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer font-bold">
              🔎 Click to Select Image &amp; Check Details
              <input type="file" accept="image/*" onChange={handleCheckFile} className="hidden" />
            </label>
            {checkResult && (
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Pixel Size</span>
                  <strong className="text-base text-white">
                    {checkResult.w} × {checkResult.h} px
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">File Size</span>
                  <strong className="text-base text-emerald-400">{checkResult.kb} KB</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">DPI</span>
                  <strong className="text-base text-amber-400">{checkResult.dpi} DPI</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 6: EXAM AGE & CGPA CALCULATOR                           */}
        {/* ============================================================ */}
        {mode === 'calc' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white">📅 Exam Age Calculator</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block mb-1">Date of Birth</span>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Age As On Date</span>
                  <input
                    type="date"
                    value={asOn}
                    onChange={(e) => setAsOn(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl text-center font-black text-base text-amber-400">
                {calcAge()}
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white">🎓 CGPA to Percentage (CBSE 9.5x)</h3>
              <input
                type="number"
                step="0.01"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="Enter CGPA"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
              />
              <div className="p-3 bg-slate-950 rounded-xl text-center font-black text-base text-emerald-400">
                {(Number(cgpa || 0) * 9.5).toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}