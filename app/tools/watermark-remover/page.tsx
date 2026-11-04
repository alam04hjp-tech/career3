'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

type RemovalEngine = 'inpaint' | 'notes-dewatermark' | 'color-key' | 'paper-fill';
type ToolMode = 'brush' | 'box' | 'eyedropper';

interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PageItem {
  id: string;
  name: string;
  originalUrl: string;
  currentUrl: string;
  history: string[];
  historyIndex: number;
  width: number;
  height: number;
}

export default function WatermarkRemoverPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [baseFileName, setBaseFileName] = useState<string>('careersathi-cleaned');

  // Studio Tool & Engine States
  const [engine, setEngine] = useState<RemovalEngine>('inpaint');
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [brushSize, setBrushSize] = useState<number>(28);

  // Engine Parameters
  const [inpaintRadius, setInpaintRadius] = useState<number>(14);
  const [notesThreshold, setNotesThreshold] = useState<number>(175);
  const [inkProtection, setInkProtection] = useState<number>(115);
  const [sampledColor, setSampledColor] = useState<{ r: number; g: number; b: number }>({
    r: 200,
    g: 200,
    b: 200,
  });
  const [colorTolerance, setColorTolerance] = useState<number>(55);

  // Canvas Refs
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<RectBox | null>(null);
  const [hasMaskStrokes, setHasMaskStrokes] = useState<boolean>(false);

  // UI States
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<string>('');
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);

  const activePage = pages[activeIndex] || null;

  const renderPageToCanvas = useCallback(
    (page: PageItem | null, showOriginal: boolean = false) => {
      if (!page || !imageCanvasRef.current || !maskCanvasRef.current) return;
      const imgCanvas = imageCanvasRef.current;
      const mskCanvas = maskCanvasRef.current;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        const ctx = imgCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        if (mskCanvas.width !== img.width || mskCanvas.height !== img.height) {
          mskCanvas.width = img.width;
          mskCanvas.height = img.height;
        }
      };
      img.src = showOriginal ? page.originalUrl : page.currentUrl;
    },
    []
  );

  useEffect(() => {
    renderPageToCanvas(activePage, isComparingOriginal);
  }, [activePage, isComparingOriginal, renderPageToCanvas]);

  const clearMaskCanvas = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setHasMaskStrokes(false);
    setCurrentBox(null);
  };

  // Safe PDF Loader via CDN script injection (Avoids Node Canvas Module error)
  const loadPdfFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF.js safely from CDN in browser
    const pdfjsLib = await new Promise<any>((resolve, reject) => {
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

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const total = pdf.numPages;
    const loadedPages: PageItem[] = [];

    for (let p = 1; p <= total; p++) {
      setLoadingMsg(`Rendering PDF Page ${p} of ${total} in HD...`);
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
      loadedPages.push({
        id: `pdf-p-${p}-${Date.now()}`,
        name: `Page ${p}`,
        originalUrl: dataUrl,
        currentUrl: dataUrl,
        history: [dataUrl],
        historyIndex: 0,
        width: canvas.width,
        height: canvas.height,
      });
    }
    setPages(loadedPages);
    setActiveIndex(0);
  };

  const loadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    setIsLoadingFile(true);
    setLoadingMsg('Loading high-resolution pages...');

    try {
      const firstFile = fileList[0];
      const cleanName = firstFile.name.replace(/\.[^/.]+$/, '');
      setBaseFileName(`${cleanName}-no-watermark`);

      if (firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf')) {
        await loadPdfFile(firstFile);
      } else {
        const loadedImages: PageItem[] = [];
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i];
          if (!f.type.startsWith('image/')) continue;
          const dataUrl = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (ev) => res(ev.target?.result as string);
            reader.readAsDataURL(f);
          });
          const dims = await new Promise<{ w: number; h: number }>((res) => {
            const im = new Image();
            im.onload = () => res({ w: im.width, h: im.height });
            im.src = dataUrl;
          });
          loadedImages.push({
            id: `img-${i}-${Date.now()}`,
            name: f.name,
            originalUrl: dataUrl,
            currentUrl: dataUrl,
            history: [dataUrl],
            historyIndex: 0,
            width: dims.w,
            height: dims.h,
          });
        }
        if (loadedImages.length > 0) {
          setPages(loadedImages);
          setActiveIndex(0);
        }
      }
      clearMaskCanvas();
    } catch (err: unknown) {
      console.error('File load error:', err);
      alert('File load karne mein error aaya. Kripya valid Image ya PDF select karein.');
    } finally {
      setIsLoadingFile(false);
      setLoadingMsg('');
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await loadFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = maskCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!activePage || !maskCanvasRef.current || !imageCanvasRef.current) return;
    const coords = getCanvasCoords(e);

    if (toolMode === 'eyedropper') {
      const imgCtx = imageCanvasRef.current.getContext('2d')!;
      const pixel = imgCtx.getImageData(coords.x, coords.y, 1, 1).data;
      setSampledColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
      setEngine('color-key');
      setToolMode('box');
      return;
    }

    setIsDrawing(true);
    const mCtx = maskCanvasRef.current.getContext('2d')!;

    if (toolMode === 'brush') {
      mCtx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
      mCtx.fillStyle = 'rgba(244, 63, 94, 0.65)';
      mCtx.lineWidth = brushSize * (maskCanvasRef.current.width / 800);
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.beginPath();
      mCtx.arc(coords.x, coords.y, mCtx.lineWidth / 2, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.beginPath();
      mCtx.moveTo(coords.x, coords.y);
      setHasMaskStrokes(true);
    } else if (toolMode === 'box') {
      setBoxStart(coords);
      setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handlePointerMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const coords = getCanvasCoords(e);
    const mCtx = maskCanvasRef.current.getContext('2d')!;

    if (toolMode === 'brush') {
      mCtx.lineTo(coords.x, coords.y);
      mCtx.stroke();
      setHasMaskStrokes(true);
    } else if (toolMode === 'box' && boxStart) {
      const rx = Math.min(boxStart.x, coords.x);
      const ry = Math.min(boxStart.y, coords.y);
      const rw = Math.abs(coords.x - boxStart.x);
      const rh = Math.abs(coords.y - boxStart.y);
      setCurrentBox({ x: rx, y: ry, w: rw, h: rh });
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !maskCanvasRef.current) return;
    setIsDrawing(false);

    if (toolMode === 'box' && currentBox && currentBox.w > 4 && currentBox.h > 4) {
      const mCtx = maskCanvasRef.current.getContext('2d')!;
      mCtx.fillStyle = 'rgba(244, 63, 94, 0.65)';
      mCtx.fillRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      setHasMaskStrokes(true);
      setCurrentBox(null);
      setBoxStart(null);
    }
  };

  const runRemovalAlgorithmOnCanvas = (
    sourceCanvas: HTMLCanvasElement,
    maskData: Uint8ClampedArray | null,
    selectedEngine: RemovalEngine
  ): string => {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    const ctx = workCanvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let hasAnyMask = false;
    const isMasked = new Uint8Array(w * h);

    if (maskData) {
      for (let i = 0; i < w * h; i++) {
        if (maskData[i * 4 + 3] > 20) {
          isMasked[i] = 1;
          hasAnyMask = true;
        }
      }
    }

    if (selectedEngine === 'inpaint') {
      if (!hasAnyMask) return workCanvas.toDataURL('image/jpeg', 0.95);

      const dilated = new Uint8Array(isMasked);
      for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
          const idx = y * w + x;
          if (isMasked[idx]) {
            dilated[idx - 1] = 1;
            dilated[idx + 1] = 1;
            dilated[idx - w] = 1;
            dilated[idx + w] = 1;
          }
        }
      }

      const unknown = new Uint8Array(dilated);
      const maxPasses = Math.max(25, inpaintRadius * 4);

      for (let pass = 0; pass < maxPasses; pass++) {
        const boundaryIndices: number[] = [];

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (unknown[idx] === 1) {
              if (
                unknown[idx - 1] === 0 ||
                unknown[idx + 1] === 0 ||
                unknown[idx - w] === 0 ||
                unknown[idx + w] === 0
              ) {
                boundaryIndices.push(idx);
              }
            }
          }
        }

        if (boundaryIndices.length === 0) break;

        for (let b = 0; b < boundaryIndices.length; b++) {
          const idx = boundaryIndices[b];
          const x = idx % w;
          const y = (idx - x) / w;

          let sumR = 0,
            sumG = 0,
            sumB = 0,
            sumWeight = 0;

          const rad = 3;
          for (let dy = -rad; dy <= rad; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -rad; dx <= rad; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              const nIdx = ny * w + nx;
              if (unknown[nIdx] === 0) {
                const distSq = dx * dx + dy * dy;
                const weight = 1 / (distSq + 0.5);
                const pOff = nIdx * 4;
                sumR += data[pOff] * weight;
                sumG += data[pOff + 1] * weight;
                sumB += data[pOff + 2] * weight;
                sumWeight += weight;
              }
            }
          }

          if (sumWeight > 0) {
            const pOff = idx * 4;
            const grain = (Math.random() - 0.5) * 3.2;
            data[pOff] = Math.min(255, Math.max(0, Math.round(sumR / sumWeight + grain)));
            data[pOff + 1] = Math.min(255, Math.max(0, Math.round(sumG / sumWeight + grain)));
            data[pOff + 2] = Math.min(255, Math.max(0, Math.round(sumB / sumWeight + grain)));
          }
        }

        for (let b = 0; b < boundaryIndices.length; b++) {
          unknown[boundaryIndices[b]] = 0;
        }
      }
    } else if (selectedEngine === 'notes-dewatermark') {
      for (let i = 0; i < w * h; i++) {
        if (hasAnyMask && isMasked[i] === 0) continue;

        const p = i * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const colorSpread = maxC - minC;

        if (lum < inkProtection && colorSpread < 75) {
          const darken = 0.78;
          data[p] = Math.max(0, Math.round(r * darken));
          data[p + 1] = Math.max(0, Math.round(g * darken));
          data[p + 2] = Math.max(0, Math.round(b * darken));
        } else if (lum >= notesThreshold || (lum >= inkProtection && colorSpread > 28)) {
          data[p] = 255;
          data[p + 1] = 255;
          data[p + 2] = 255;
        }
      }
    } else if (selectedEngine === 'color-key') {
      const tolSq = colorTolerance * colorTolerance * 3;
      for (let i = 0; i < w * h; i++) {
        if (hasAnyMask && isMasked[i] === 0) continue;

        const p = i * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];

        const dr = r - sampledColor.r;
        const dg = g - sampledColor.g;
        const db = b - sampledColor.b;
        const distSq = dr * dr + dg * dg + db * db;

        if (distSq <= tolSq) {
          data[p] = 255;
          data[p + 1] = 255;
          data[p + 2] = 255;
        }
      }
    } else if (selectedEngine === 'paper-fill') {
      if (!hasAnyMask) return workCanvas.toDataURL('image/jpeg', 0.95);

      let sumR = 0,
        sumG = 0,
        sumB = 0,
        count = 0;

      for (let y = 2; y < h - 2; y += 2) {
        for (let x = 2; x < w - 2; x += 2) {
          const idx = y * w + x;
          if (
            isMasked[idx] === 0 &&
            (isMasked[idx - 1] === 1 ||
              isMasked[idx + 1] === 1 ||
              isMasked[idx - w] === 1 ||
              isMasked[idx + w] === 1)
          ) {
            const p = idx * 4;
            sumR += data[p];
            sumG += data[p + 1];
            sumB += data[p + 2];
            count++;
          }
        }
      }

      const fillR = count > 0 ? Math.round(sumR / count) : 255;
      const fillG = count > 0 ? Math.round(sumG / count) : 255;
      const fillB = count > 0 ? Math.round(sumB / count) : 255;

      for (let i = 0; i < w * h; i++) {
        if (isMasked[i] === 1) {
          const p = i * 4;
          data[p] = fillR;
          data[p + 1] = fillG;
          data[p + 2] = fillB;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return workCanvas.toDataURL('image/jpeg', 0.95);
  };

  const pushPageHistory = (pageIdx: number, newUrl: string) => {
    setPages((prev) =>
      prev.map((pg, idx) => {
        if (idx !== pageIdx) return pg;
        const slicedHistory = pg.history.slice(0, pg.historyIndex + 1);
        const nextHistory = [...slicedHistory, newUrl].slice(-10);
        return {
          ...pg,
          currentUrl: newUrl,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
        };
      })
    );
  };

  const handleRemoveOnCurrentPage = async () => {
    if (!activePage || !imageCanvasRef.current || !maskCanvasRef.current) return;

    if ((engine === 'inpaint' || engine === 'paper-fill') && !hasMaskStrokes) {
      alert('Pehle watermark par Brush ya Box se highlight karein!');
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 40));

    try {
      const mCtx = maskCanvasRef.current.getContext('2d')!;
      const maskImgData = hasMaskStrokes
        ? mCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height).data
        : null;

      const cleanedDataUrl = runRemovalAlgorithmOnCanvas(
        imageCanvasRef.current,
        maskImgData,
        engine
      );
      pushPageHistory(activeIndex, cleanedDataUrl);
      clearMaskCanvas();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToAllPages = async () => {
    if (pages.length === 0 || !maskCanvasRef.current) return;

    setIsProcessing(true);
    const refMaskW = maskCanvasRef.current.width;
    const refMaskH = maskCanvasRef.current.height;
    const currentMaskHasStrokes = hasMaskStrokes;

    const maskSnapshotCanvas = document.createElement('canvas');
    maskSnapshotCanvas.width = refMaskW;
    maskSnapshotCanvas.height = refMaskH;
    maskSnapshotCanvas.getContext('2d')!.drawImage(maskCanvasRef.current, 0, 0);

    try {
      for (let i = 0; i < pages.length; i++) {
        setBatchProgress(`Cleaning Page ${i + 1} of ${pages.length}...`);
        await new Promise((r) => setTimeout(r, 20));

        const pg = pages[i];
        const tempImgCanvas = document.createElement('canvas');
        await new Promise<void>((res) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => {
            tempImgCanvas.width = im.width;
            tempImgCanvas.height = im.height;
            tempImgCanvas.getContext('2d')!.drawImage(im, 0, 0);
            res();
          };
          im.src = pg.currentUrl;
        });

        let scaledMaskData: Uint8ClampedArray | null = null;
        if (currentMaskHasStrokes) {
          const scaledMaskCanvas = document.createElement('canvas');
          scaledMaskCanvas.width = tempImgCanvas.width;
          scaledMaskCanvas.height = tempImgCanvas.height;
          const smCtx = scaledMaskCanvas.getContext('2d')!;
          smCtx.drawImage(maskSnapshotCanvas, 0, 0, tempImgCanvas.width, tempImgCanvas.height);
          scaledMaskData = smCtx.getImageData(0, 0, tempImgCanvas.width, tempImgCanvas.height).data;
        }

        const resultUrl = runRemovalAlgorithmOnCanvas(tempImgCanvas, scaledMaskData, engine);
        pushPageHistory(i, resultUrl);
      }
      clearMaskCanvas();
    } finally {
      setBatchProgress('');
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (!activePage || activePage.historyIndex <= 0) return;
    setPages((prev) =>
      prev.map((pg, idx) => {
        if (idx !== activeIndex) return pg;
        const nextIdx = pg.historyIndex - 1;
        return {
          ...pg,
          historyIndex: nextIdx,
          currentUrl: pg.history[nextIdx],
        };
      })
    );
  };

  const handleResetPage = () => {
    if (!activePage) return;
    pushPageHistory(activeIndex, activePage.originalUrl);
    clearMaskCanvas();
  };

  const downloadCurrentImage = (format: 'png' | 'jpg') => {
    if (!activePage) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')!.drawImage(img, 0, 0);
      const url = format === 'png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFileName}-page-${activeIndex + 1}.${format}`;
      a.click();
    };
    img.src = activePage.currentUrl;
  };

  const downloadAllAsPdf = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setBatchProgress('Building Clean PDF...');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        const base64 = pg.currentUrl.split(',')[1];
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) {
          bytes[j] = bin.charCodeAt(j);
        }

        const embeddedImg = pg.currentUrl.startsWith('data:image/png')
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);

        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBatchProgress('');
      setIsProcessing(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setBatchProgress('Packing into ZIP...');

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      pages.forEach((pg, idx) => {
        const base64 = pg.currentUrl.split(',')[1];
        zip.file(`${baseFileName}-page-${idx + 1}.jpg`, base64, { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFileName}-images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBatchProgress('');
      setIsProcessing(false);
    }
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
                ✨ AI Watermark &amp; Stamp Remover
              </h1>
              <p className="text-[11px] text-slate-400">
                Remove Watermarks, Logos &amp; Stamps from Photos &amp; Multi-Page PDFs
              </p>
            </div>
          </div>

          <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition flex items-center gap-2">
            📂 Upload Image(s) or PDF
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {/* Empty State */}
        {pages.length === 0 && !isLoadingFile && (
          <div className="bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-3xl p-8 md:p-14 text-center space-y-6 transition">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-4xl">
              🪄
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl font-black text-white">
                Drop Photos or Coaching PDF Here (Or Press Ctrl + V)
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports JPG, PNG, WebP &amp; Multi-Page PDFs. 100% Free, Unlimited Downloads, No Watermark.
              </p>
            </div>

            <div className="flex justify-center">
              <label className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl cursor-pointer transition">
                🚀 Select Image or PDF File
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingFile && (
          <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <div className="text-3xl animate-spin inline-block">⏳</div>
            <div className="text-sm font-black text-amber-400">{loadingMsg}</div>
          </div>
        )}

        {/* Main Workspace */}
        {pages.length > 0 && !isLoadingFile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Sidebar */}
            <div className="lg:col-span-4 space-y-4 text-xs">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-black text-white uppercase text-[11px]">
                  1. Select Removal Mode
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'inpaint', title: '🧠 Texture Inpainting (Photos/Logos)' },
                    { id: 'notes-dewatermark', title: '📄 Notes De-Watermark (Text-Safe)' },
                    { id: 'color-key', title: '🎯 Color-Key Eraser (Eyedropper)' },
                    { id: 'paper-fill', title: '🩹 Smart Paper Fill (Header/Footer)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEngine(item.id as RemovalEngine)}
                      className={`p-3 rounded-xl border text-left transition font-bold ${
                        engine === item.id
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-black text-white uppercase text-[11px]">
                  2. Selection Tool
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setToolMode('brush')}
                    className={`py-2 px-1 rounded-xl font-bold border text-center ${
                      toolMode === 'brush'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    🖌️ Brush
                  </button>
                  <button
                    type="button"
                    onClick={() => setToolMode('box')}
                    className={`py-2 px-1 rounded-xl font-bold border text-center ${
                      toolMode === 'box'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    ⬛ Box
                  </button>
                  <button
                    type="button"
                    onClick={() => setToolMode('eyedropper')}
                    className={`py-2 px-1 rounded-xl font-bold border text-center ${
                      toolMode === 'eyedropper'
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    💧 Dropper
                  </button>
                </div>

                {toolMode === 'brush' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Brush Size</span>
                      <span className="text-rose-400 font-bold">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={90}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleRemoveOnCurrentPage}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
                  >
                    {isProcessing ? 'Removing...' : '🪄 Remove Watermark (This Page)'}
                  </button>

                  {pages.length > 1 && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApplyToAllPages}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                    >
                      ⚡ Apply to ALL {pages.length} Pages
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!activePage || activePage.historyIndex <= 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold"
                  >
                    ↩ Undo
                  </button>
                  <button
                    type="button"
                    onClick={clearMaskCanvas}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg font-bold"
                  >
                    🧹 Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-bold"
                  >
                    🔄 Reset Page
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onMouseDown={() => setIsComparingOriginal(true)}
                    onMouseUp={() => setIsComparingOriginal(false)}
                    onTouchStart={() => setIsComparingOriginal(true)}
                    onTouchEnd={() => setIsComparingOriginal(false)}
                    className="px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 rounded-lg font-black select-none"
                  >
                    👁️ Hold: Original
                  </button>

                  <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(50, z - 25))}
                      className="px-1.5 font-black text-slate-300"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-bold text-amber-400">{zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(200, z + 25))}
                      className="px-1.5 font-black text-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Viewport */}
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center min-h-[440px] max-h-[620px] overflow-auto">
                {batchProgress && (
                  <div className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col items-center justify-center space-y-2">
                    <div className="text-2xl animate-spin">⚡</div>
                    <div className="text-sm font-black text-amber-400">{batchProgress}</div>
                  </div>
                )}

                <div
                  className="relative inline-block shadow-2xl rounded overflow-hidden"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <canvas
                    ref={imageCanvasRef}
                    className="block max-h-[560px] w-auto object-contain bg-white"
                  />
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    className={`absolute inset-0 w-full h-full ${
                      toolMode === 'eyedropper' ? 'cursor-crosshair' : 'cursor-cell'
                    }`}
                  />
                  {currentBox && maskCanvasRef.current && (
                    <div
                      className="absolute border-2 border-rose-500 bg-rose-500/30 pointer-events-none"
                      style={{
                        left: `${(currentBox.x / maskCanvasRef.current.width) * 100}%`,
                        top: `${(currentBox.y / maskCanvasRef.current.height) * 100}%`,
                        width: `${(currentBox.w / maskCanvasRef.current.width) * 100}%`,
                        height: `${(currentBox.h / maskCanvasRef.current.height) * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Multi-Page Thumbnails */}
              {pages.length > 1 && (
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-400">
                    Pages ({pages.length}) — Click to view:
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {pages.map((pg, idx) => (
                      <div
                        key={pg.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          clearMaskCanvas();
                        }}
                        className={`min-w-[80px] p-1.5 rounded-xl border-2 cursor-pointer text-center ${
                          idx === activeIndex
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-950 opacity-70'
                        }`}
                      >
                        <img
                          src={pg.currentUrl}
                          alt={pg.name}
                          className="h-16 w-full object-contain bg-white rounded mb-1"
                        />
                        <span className="text-[10px] font-bold text-slate-300">
                          P.{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Bar */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-emerald-400">✅ HD Export Ready</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadCurrentImage('png')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                  >
                    📥 PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCurrentImage('jpg')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                  >
                    📥 JPG
                  </button>
                  <button
                    type="button"
                    onClick={downloadAllAsPdf}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl"
                  >
                    📄 PDF ({pages.length} P)
                  </button>
                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={downloadAllAsZip}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl"
                    >
                      📦 ZIP
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}