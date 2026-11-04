'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Link from 'next/link';

type ToolType =
  | 'select'
  | 'edit-existing'
  | 'text'
  | 'whiteout'
  | 'highlight'
  | 'rect'
  | 'circle'
  | 'check'
  | 'cross';

type FontFamilyType = 'Helvetica' | 'Times' | 'Courier';

interface EditorElement {
  id: string;
  page: number;
  type: 'text' | 'whiteout' | 'highlight' | 'rect' | 'circle' | 'image' | 'signature';
  x: number; // In PDF points (scale = 1)
  y: number; // In PDF points from top (scale = 1)
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamilyType;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  bgColor?: string;
  hasBg?: boolean;
  opacity?: number;
  strokeWidth?: number;
  imageDataUrl?: string;
}

interface DetectedPdfText {
  id: string;
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export default function SejdaStylePdfEditor() {
  // PDF State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.3);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);

  // Editor Elements & Selection
  const [activeTool, setActiveTool] = useState<ToolType>('edit-existing');
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detectedTexts, setDetectedTexts] = useState<DetectedPdfText[]>([]);

  // Eyedropper Mode ('text' | 'bg' | null)
  const [eyedropperTarget, setEyedropperTarget] = useState<'text' | 'bg' | null>(null);

  // Dragging / Resizing State
  const [interaction, setInteraction] = useState<{
    mode: 'drag' | 'resize' | null;
    id: string | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  }>({ mode: null, id: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });

  // Signature Modal State
  const [showSigModal, setShowSigModal] = useState<boolean>(false);
  const [sigColor, setSigColor] = useState<string>('#000080');
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);

  // Export State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // 1. Load PDF.js from CDN
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsScriptLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  // 2. Render Current Page & Detect Existing Text (Sejda Style)
  useEffect(() => {
    if (!pdfDocProxy || !pdfCanvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        const viewport1 = page.getViewport({ scale: 1.0 });
        setPageSize({ width: viewport1.width, height: viewport1.height });

        const viewport = page.getViewport({ scale: zoom });
        const canvas = pdfCanvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (isCancelled) return;

        // Extract existing text positions for Sejda-style click-to-edit
        const textContent = await page.getTextContent();
        const pdfjsLib = (window as any).pdfjsLib;
        const extracted: DetectedPdfText[] = [];

        textContent.items.forEach((item: any, idx: number) => {
          if (!item.str || !item.str.trim()) return;
          const tx = pdfjsLib.Util.transform(viewport1.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]);
          const x = tx[4];
          const y = tx[5] - fontHeight * 0.85;
          const width = Math.max(item.width || fontHeight * item.str.length * 0.5, 14);
          const height = Math.max(fontHeight * 1.15, 12);

          extracted.push({
            id: `pdf-txt-${currentPage}-${idx}`,
            str: item.str,
            x,
            y,
            width,
            height,
            fontSize: Math.max(Math.round(fontHeight * 0.92), 8),
          });
        });

        setDetectedTexts(extracted);
      } catch (err) {
        console.error('Page render error:', err);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, currentPage, zoom]);

  // Handle PDF Upload
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
      setElements([]);
      setSelectedId(null);
      setDownloadUrl(null);
      setCurrentPage(1);

      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const doc = await loadingTask.promise;
        setPdfDocProxy(doc);
        setNumPages(doc.numPages);
      }
    }
  };

  // Sample pixel color from rendered PDF canvas (for seamless background whiteout or ink matching)
  const sampleCanvasColor = (pdfX: number, pdfY: number): string => {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return '#ffffff';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';
    const cx = Math.min(Math.max(Math.round(pdfX * zoom), 0), canvas.width - 1);
    const cy = Math.min(Math.max(Math.round(pdfY * zoom), 0), canvas.height - 1);
    const pixel = ctx.getImageData(cx, cy, 1, 1).data;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
  };

  // Click on Existing PDF Text to Edit/Replace it in-place (Sejda Core Feature)
  const handleConvertDetectedText = (dt: DetectedPdfText) => {
    // Sample background color slightly outside top-left of the text so whiteout blends with marksheet/form paper
    const sampledBg = sampleCanvasColor(Math.max(dt.x - 2, 1), Math.max(dt.y - 2, 1));

    const newEl: EditorElement = {
      id: `el-${Date.now()}`,
      page: currentPage,
      type: 'text',
      x: dt.x - 1,
      y: dt.y - 1,
      width: dt.width + 16,
      height: dt.height + 4,
      text: dt.str,
      fontSize: dt.fontSize,
      fontFamily: 'Helvetica',
      bold: false,
      italic: false,
      color: '#000000',
      bgColor: sampledBg,
      hasBg: true, // Covers old text automatically
      opacity: 1,
    };

    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setActiveTool('select');
  };

  // Click on Canvas Overlay to Add New Items or Use Eyedropper
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // If Eyedropper is active, pick color from PDF
    if (eyedropperTarget && selectedId) {
      const pickedColor = sampleCanvasColor(clickX, clickY);
      updateElement(selectedId, eyedropperTarget === 'text' ? { color: pickedColor } : { bgColor: pickedColor, hasBg: true });
      setEyedropperTarget(null);
      return;
    }

    if (activeTool === 'select' || activeTool === 'edit-existing') {
      if (e.target === e.currentTarget) {
        setSelectedId(null);
      }
      return;
    }

    const id = `el-${Date.now()}`;
    let newEl: EditorElement | null = null;

    if (activeTool === 'text') {
      newEl = {
        id,
        page: currentPage,
        type: 'text',
        x: clickX,
        y: clickY - 10,
        width: 140,
        height: 26,
        text: 'Type here',
        fontSize: 13,
        fontFamily: 'Helvetica',
        bold: false,
        italic: false,
        color: '#000000',
        bgColor: '#ffffff',
        hasBg: false,
        opacity: 1,
      };
    } else if (activeTool === 'whiteout') {
      const bg = sampleCanvasColor(clickX, clickY);
      newEl = {
        id,
        page: currentPage,
        type: 'whiteout',
        x: clickX - 40,
        y: clickY - 12,
        width: 100,
        height: 25,
        bgColor: bg,
        opacity: 1,
      };
    } else if (activeTool === 'highlight') {
      newEl = {
        id,
        page: currentPage,
        type: 'highlight',
        x: clickX - 40,
        y: clickY - 10,
        width: 110,
        height: 20,
        bgColor: '#fde047',
        opacity: 0.45,
      };
    } else if (activeTool === 'rect') {
      newEl = {
        id,
        page: currentPage,
        type: 'rect',
        x: clickX - 40,
        y: clickY - 25,
        width: 90,
        height: 50,
        color: '#ef4444',
        bgColor: '#ffffff',
        hasBg: false,
        strokeWidth: 2,
        opacity: 1,
      };
    } else if (activeTool === 'circle') {
      newEl = {
        id,
        page: currentPage,
        type: 'circle',
        x: clickX - 25,
        y: clickY - 25,
        width: 50,
        height: 50,
        color: '#ef4444',
        strokeWidth: 2,
        opacity: 1,
      };
    } else if (activeTool === 'check' || activeTool === 'cross') {
      newEl = {
        id,
        page: currentPage,
        type: 'text',
        x: clickX - 8,
        y: clickY - 12,
        width: 28,
        height: 28,
        text: activeTool === 'check' ? '✓' : '✗',
        fontSize: 18,
        fontFamily: 'Helvetica',
        bold: true,
        color: activeTool === 'check' ? '#16a34a' : '#dc2626',
        hasBg: false,
        opacity: 1,
      };
    }

    if (newEl) {
      setElements((prev) => [...prev, newEl!]);
      setSelectedId(newEl.id);
      setActiveTool('select');
    }
  };

  // Update Element Helper
  const updateElement = (id: string, patch: Partial<EditorElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  };

  // Delete Selected Element
  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate Selected Element
  const duplicateElement = (el: EditorElement) => {
    const copy: EditorElement = {
      ...el,
      id: `el-${Date.now()}`,
      x: el.x + 15,
      y: el.y + 15,
    };
    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  // Drag & Resize Mouse Handlers
  const startDrag = (e: React.MouseEvent, el: EditorElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setInteraction({
      mode: 'drag',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
    });
  };

  const startResize = (e: React.MouseEvent, el: EditorElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setInteraction({
      mode: 'resize',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interaction.mode || !interaction.id) return;
    const dx = (e.clientX - interaction.startX) / zoom;
    const dy = (e.clientY - interaction.startY) / zoom;

    if (interaction.mode === 'drag') {
      updateElement(interaction.id, {
        x: interaction.origX + dx,
        y: interaction.origY + dy,
      });
    } else if (interaction.mode === 'resize') {
      updateElement(interaction.id, {
        width: Math.max(16, interaction.origW + dx),
        height: Math.max(12, interaction.origH + dy),
      });
    }
  };

  const handleMouseUp = () => {
    if (interaction.mode) {
      setInteraction({ mode: null, id: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });
    }
  };

  // Handle Image Upload to PDF
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const aspect = img.width / img.height;
          const w = 120;
          const h = w / aspect;
          const newEl: EditorElement = {
            id: `el-${Date.now()}`,
            page: currentPage,
            type: 'image',
            x: 100,
            y: 120,
            width: w,
            height: h,
            imageDataUrl: ev.target?.result as string,
            opacity: 1,
          };
          setElements((prev) => [...prev, newEl]);
          setSelectedId(newEl.id);
          setActiveTool('select');
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Signature Pad Drawing Handlers
  const startSigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSig(true);
  };

  const moveSigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearSigPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const insertSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const newEl: EditorElement = {
      id: `el-${Date.now()}`,
      page: currentPage,
      type: 'signature',
      x: 150,
      y: 300,
      width: 150,
      height: 60,
      imageDataUrl: dataUrl,
      opacity: 1,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setShowSigModal(false);
    setActiveTool('select');
  };

  // Helper: Hex to pdf-lib rgb()
  const hexToRgb = (hex: string = '#000000') => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
  };

  // Helper: Render non-ASCII text or symbols (e.g. Hindi, ✓, ✗) to high-res PNG for pdf-lib
  const renderUnicodeTextToPng = (el: EditorElement): Promise<Uint8Array> => {
    return new Promise((resolve) => {
      const scale = 4; // 4x retina quality
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(el.width * scale, 40);
      canvas.height = Math.max(el.height * scale, 40);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      if (el.hasBg && el.bgColor) {
        ctx.fillStyle = el.bgColor;
        ctx.fillRect(0, 0, el.width, el.height);
      }

      const fontStyle = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize || 13}px ${
        el.fontFamily === 'Times' ? 'serif' : el.fontFamily === 'Courier' ? 'monospace' : 'sans-serif'
      }`;
      ctx.font = fontStyle;
      ctx.fillStyle = el.color || '#000000';
      ctx.textBaseline = 'top';
      ctx.fillText(el.text || '', 1, 1);

      canvas.toBlob((blob) => {
        blob!.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      }, 'image/png');
    });
  };

  // Helper: Convert any image data URL to standard PNG bytes
  const dataUrlToPngBytes = (dataUrl: string): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        c.toBlob((blob) => {
          if (!blob) return reject(new Error('Image conversion failed'));
          blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)));
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  // Export Final Edited PDF
  const saveEditedPdf = async () => {
    if (!pdfBuffer) return;
    setIsSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer.slice(0));
      const pages = pdfDoc.getPages();

      // Embed standard font families
      const fonts = {
        Helvetica: {
          normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
          bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
          italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
          boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
        },
        Times: {
          normal: await pdfDoc.embedFont(StandardFonts.TimesRoman),
          bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
          italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
          boldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
        },
        Courier: {
          normal: await pdfDoc.embedFont(StandardFonts.Courier),
          bold: await pdfDoc.embedFont(StandardFonts.CourierBold),
          italic: await pdfDoc.embedFont(StandardFonts.CourierOblique),
          boldItalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
        },
      };

      for (const el of elements) {
        const page = pages[el.page - 1];
        if (!page) continue;
        const { height: pHeight } = page.getSize();

        if (el.type === 'whiteout' || el.type === 'highlight') {
          page.drawRectangle({
            x: el.x,
            y: pHeight - el.y - el.height,
            width: el.width,
            height: el.height,
            color: hexToRgb(el.bgColor || '#ffffff'),
            opacity: el.opacity ?? 1,
          });
        } else if (el.type === 'rect') {
          page.drawRectangle({
            x: el.x,
            y: pHeight - el.y - el.height,
            width: el.width,
            height: el.height,
            borderColor: hexToRgb(el.color || '#ef4444'),
            borderWidth: el.strokeWidth || 2,
            color: el.hasBg ? hexToRgb(el.bgColor || '#ffffff') : undefined,
            opacity: el.opacity ?? 1,
          });
        } else if (el.type === 'circle') {
          page.drawEllipse({
            x: el.x + el.width / 2,
            y: pHeight - el.y - el.height / 2,
            xScale: el.width / 2,
            yScale: el.height / 2,
            borderColor: hexToRgb(el.color || '#ef4444'),
            borderWidth: el.strokeWidth || 2,
          });
        } else if (el.type === 'image' || el.type === 'signature') {
          if (el.imageDataUrl) {
            const pngBytes = await dataUrlToPngBytes(el.imageDataUrl);
            const embeddedPng = await pdfDoc.embedPng(pngBytes);
            page.drawImage(embeddedPng, {
              x: el.x,
              y: pHeight - el.y - el.height,
              width: el.width,
              height: el.height,
            });
          }
        } else if (el.type === 'text') {
          const textVal = el.text || '';
          const isStandardAscii = /^[\x20-\x7E]*$/.test(textVal);

          if (!isStandardAscii) {
            // Fallback for symbols (✓, ✗) or Hindi text
            const pngBytes = await renderUnicodeTextToPng(el);
            const embeddedPng = await pdfDoc.embedPng(pngBytes);
            page.drawImage(embeddedPng, {
              x: el.x,
              y: pHeight - el.y - el.height,
              width: el.width,
              height: el.height,
            });
          } else {
            // 1. Draw Whiteout / Background box if enabled
            if (el.hasBg) {
              page.drawRectangle({
                x: el.x,
                y: pHeight - el.y - el.height,
                width: el.width,
                height: el.height,
                color: hexToRgb(el.bgColor || '#ffffff'),
              });
            }

            // 2. Draw crisp Vector Text
            if (textVal.trim().length > 0) {
              const fam = fonts[el.fontFamily || 'Helvetica'];
              const chosenFont =
                el.bold && el.italic
                  ? fam.boldItalic
                  : el.bold
                  ? fam.bold
                  : el.italic
                  ? fam.italic
                  : fam.normal;

              const fSize = el.fontSize || 13;
              page.drawText(textVal, {
                x: el.x + 1,
                y: pHeight - el.y - fSize * 0.88,
                size: fSize,
                font: chosenFont,
                color: hexToRgb(el.color || '#000000'),
              });
            }
          }
        }
      }

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile?.name.replace('.pdf', '') || 'document'}-edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Save karne mein error aaya: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const pageElements = elements.filter((el) => el.page === currentPage);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← CareerSathi
          </Link>
          <h1 className="text-sm md:text-base font-black text-white flex items-center gap-2">
            <span>📄 Visual PDF Editor</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
              Sejda Pro Mode
            </span>
          </h1>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2">
            {/* Page Navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-700 text-xs gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2 py-0.5 bg-slate-700 rounded disabled:opacity-40 hover:bg-slate-600"
              >
                ◀
              </button>
              <span className="font-bold">
                Page {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="px-2 py-0.5 bg-slate-700 rounded disabled:opacity-40 hover:bg-slate-600"
              >
                ▶
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-700 text-xs gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                className="px-2 py-0.5 bg-slate-700 rounded hover:bg-slate-600 font-bold"
              >
                -
              </button>
              <span className="font-bold w-11 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}
                className="px-2 py-0.5 bg-slate-700 rounded hover:bg-slate-600 font-bold"
              >
                +
              </button>
            </div>

            {/* Apply & Download */}
            <button
              onClick={saveEditedPdf}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-lg transition"
            >
              {isSaving ? 'Saving PDF... ⏳' : 'Apply Changes & Download 📥'}
            </button>
          </div>
        )}
      </div>

      {/* Main Sejda-Style Toolbar */}
      {selectedFile && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-center gap-2 sticky top-[53px] z-30 shadow-md">
          <button
            onClick={() => setActiveTool('edit-existing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTool === 'edit-existing'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Click any existing text on the PDF to edit or replace it"
          >
            ✏️ Edit PDF Text
          </button>

          <button
            onClick={() => setActiveTool('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔤 + Add Text
          </button>

          <button
            onClick={() => setActiveTool('whiteout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTool === 'whiteout'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🧹 Whiteout / Erase
          </button>

          <button
            onClick={() => setShowSigModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
          >
            ✒️ Sign
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
          >
            🖼️ Add Image
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => setActiveTool('highlight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTool === 'highlight'
                ? 'bg-yellow-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🖍️ Highlight
          </button>

          <button
            onClick={() => setActiveTool('rect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'rect' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ▭ Box
          </button>

          <button
            onClick={() => setActiveTool('circle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'circle' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ◯ Circle
          </button>

          <button
            onClick={() => setActiveTool('check')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'check' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            ✓ Tick
          </button>

          <button
            onClick={() => setActiveTool('cross')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'cross' ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400 hover:bg-slate-700'
            }`}
          >
            ✗ Cross
          </button>

          <button
            onClick={() => setActiveTool('select')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'select' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            👆 Move / Select
          </button>
        </div>
      )}

      {/* Selected Element Formatting Bar */}
      {selectedElement && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-xs sticky top-[101px] z-30">
          {selectedElement.type === 'text' && (
            <>
              <input
                type="text"
                value={selectedElement.text || ''}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                placeholder="Edit text..."
                className="px-2.5 py-1 bg-slate-900 border border-amber-500 rounded text-white font-medium w-48 focus:outline-none"
              />

              <select
                value={selectedElement.fontFamily || 'Helvetica'}
                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value as FontFamilyType })}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
              >
                <option value="Helvetica">Helvetica / Arial</option>
                <option value="Times">Times New Roman</option>
                <option value="Courier">Courier Mono</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5">
                <span className="text-slate-400">Size:</span>
                <input
                  type="number"
                  min={6}
                  max={72}
                  value={selectedElement.fontSize || 13}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                  className="w-12 bg-transparent text-white font-bold text-center focus:outline-none"
                />
              </div>

              <button
                onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })}
                className={`px-2.5 py-1 rounded font-black border ${
                  selectedElement.bold
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                B
              </button>

              <button
                onClick={() => updateElement(selectedElement.id, { italic: !selectedElement.italic })}
                className={`px-2.5 py-1 rounded italic font-serif border ${
                  selectedElement.italic
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                I
              </button>

              {/* Text Color & Eyedropper */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                <span>Text:</span>
                <input
                  type="color"
                  value={selectedElement.color || '#000000'}
                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                  className="w-5 h-5 cursor-pointer bg-transparent border-0"
                />
                <button
                  onClick={() => setEyedropperTarget('text')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    eyedropperTarget === 'text' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-200'
                  }`}
                  title="Pick exact ink color from PDF"
                >
                  🎯 Pick
                </button>
              </div>
            </>
          )}

          {/* Background / Whiteout Color Controls */}
          {(selectedElement.type === 'text' ||
            selectedElement.type === 'whiteout' ||
            selectedElement.type === 'highlight' ||
            selectedElement.type === 'rect') && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-700">
              {(selectedElement.type === 'text' || selectedElement.type === 'rect') && (
                <input
                  type="checkbox"
                  checked={selectedElement.hasBg ?? false}
                  onChange={(e) => updateElement(selectedElement.id, { hasBg: e.target.checked })}
                  title="Enable solid background fill to hide old PDF text underneath"
                />
              )}
              <span>BG Fill:</span>
              <input
                type="color"
                value={selectedElement.bgColor || '#ffffff'}
                onChange={(e) => updateElement(selectedElement.id, { bgColor: e.target.value, hasBg: true })}
                className="w-5 h-5 cursor-pointer bg-transparent border-0"
              />
              <button
                onClick={() => setEyedropperTarget('bg')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  eyedropperTarget === 'bg' ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-200'
                }`}
                title="Click on PDF background to match paper color seamlessly"
              >
                🎯 Match Paper
              </button>
            </div>
          )}

          <button
            onClick={() => duplicateElement(selectedElement)}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold"
          >
            📋 Duplicate
          </button>

          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded font-bold"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Eyedropper Active Banner */}
      {eyedropperTarget && (
        <div className="bg-amber-500 text-slate-950 text-xs font-black text-center py-1.5">
          🎯 PDF ke jis hisse ka color copy karna hai, wahan click karo!{' '}
          <button onClick={() => setEyedropperTarget(null)} className="underline ml-3">
            Cancel
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        {!selectedFile ? (
          <div className="max-w-xl w-full mt-12 bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="space-y-2">
              <span className="text-xs uppercase bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-full">
                100% Client-Side Sejda Alternative
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Edit PDF Documents Visually
              </h2>
              <p className="text-xs text-slate-400">
                Click directly on existing PDF text to edit or replace it, erase sections, add photos, draw signatures, and download instantly.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-12 cursor-pointer transition bg-slate-950/60">
              <span className="text-4xl mb-3">📄</span>
              <span className="text-base font-bold text-amber-400">
                {isScriptLoaded ? 'Click to Upload PDF File' : 'Loading PDF Engine... ⏳'}
              </span>
              <span className="text-xs text-slate-500 mt-1">100% private — files stay inside your browser</span>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isScriptLoaded}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            {/* Helpful Mode Hint */}
            <div className="mb-3 text-xs text-slate-400 bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-800">
              {activeTool === 'edit-existing' && (
                <span>
                  💡 <strong>Edit PDF Text Mode:</strong> PDF ke kisi bhi likhe huye word/number par click karo usko change ya delete karne ke liye!
                </span>
              )}
              {activeTool === 'text' && (
                <span>
                  💡 <strong>Add Text Mode:</strong> PDF par jahan naya text likhna hai wahan click karo.
                </span>
              )}
              {activeTool === 'whiteout' && (
                <span>
                  💡 <strong>Whiteout Mode:</strong> Purane text ya stamp ko chhupane ke liye uske upar click karo.
                </span>
              )}
              {activeTool === 'select' && (
                <span>
                  💡 <strong>Move / Resize Mode:</strong> Kisi bhi box ko drag karke set karo ya corner se resize karo.
                </span>
              )}
            </div>

            {/* PDF Canvas + Interactive Visual Layer */}
            <div
              className="relative shadow-2xl border border-slate-700 bg-white"
              style={{
                width: pageSize.width * zoom,
                height: pageSize.height * zoom,
                cursor: eyedropperTarget
                  ? 'crosshair'
                  : activeTool === 'text'
                  ? 'text'
                  : activeTool === 'select'
                  ? 'default'
                  : 'crosshair',
              }}
              onClick={handleCanvasClick}
            >
              {/* Rendered PDF Page */}
              <canvas ref={pdfCanvasRef} className="block pointer-events-none" />

              {/* Sejda-Style Clickable Existing PDF Text Layer */}
              {activeTool === 'edit-existing' &&
                !eyedropperTarget &&
                detectedTexts.map((dt) => (
                  <div
                    key={dt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertDetectedText(dt);
                    }}
                    title={`Click to edit: "${dt.str}"`}
                    style={{
                      position: 'absolute',
                      left: dt.x * zoom,
                      top: dt.y * zoom,
                      width: dt.width * zoom,
                      height: dt.height * zoom,
                    }}
                    className="border border-transparent hover:border-blue-500 hover:bg-blue-500/15 cursor-text transition-colors rounded-[2px]"
                  />
                ))}

              {/* Added / Edited Elements Overlay */}
              {pageElements.map((el) => {
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => startDrag(e, el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: el.x * zoom,
                      top: el.y * zoom,
                      width: el.width * zoom,
                      height: el.height * zoom,
                      backgroundColor:
                        el.type === 'whiteout' || el.type === 'highlight' || el.hasBg
                          ? el.bgColor || '#ffffff'
                          : 'transparent',
                      opacity: el.opacity ?? 1,
                      border:
                        el.type === 'rect'
                          ? `${(el.strokeWidth || 2) * zoom}px solid ${el.color || '#ef4444'}`
                          : el.type === 'circle'
                          ? `${(el.strokeWidth || 2) * zoom}px solid ${el.color || '#ef4444'}`
                          : isSelected
                          ? '1.5px dashed #2563eb'
                          : '1px dashed transparent',
                      borderRadius: el.type === 'circle' ? '9999px' : '0px',
                      cursor: 'move',
                    }}
                    className="group"
                  >
                    {/* Editable Text Content */}
                    {el.type === 'text' && (
                      <input
                        type="text"
                        value={el.text || ''}
                        onChange={(e) => updateElement(el.id, { text: e.target.value })}
                        style={{
                          fontSize: (el.fontSize || 13) * zoom,
                          fontFamily:
                            el.fontFamily === 'Times'
                              ? '"Times New Roman", Times, serif'
                              : el.fontFamily === 'Courier'
                              ? '"Courier New", Courier, monospace'
                              : 'Helvetica, Arial, sans-serif',
                          fontWeight: el.bold ? 'bold' : 'normal',
                          fontStyle: el.italic ? 'italic' : 'normal',
                          color: el.color || '#000000',
                          lineHeight: 1,
                        }}
                        className="w-full h-full bg-transparent outline-none px-[1px] m-0 border-0"
                      />
                    )}

                    {/* Image or Signature Content */}
                    {(el.type === 'image' || el.type === 'signature') && el.imageDataUrl && (
                      <img
                        src={el.imageDataUrl}
                        alt="inserted"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    )}

                    {/* Bottom-Right Resize Handle */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => startResize(e, el)}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize shadow"
                        title="Drag to resize"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Download Ready Banner */}
            {downloadUrl && (
              <div className="mt-6 p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center gap-4">
                <span className="text-xs font-bold text-emerald-300">
                  ✅ Edited PDF Ready!
                </span>
                <a
                  href={downloadUrl}
                  download={`${selectedFile?.name.replace('.pdf', '') || 'document'}-edited.pdf`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg"
                >
                  Download Again 📥
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Signature Drawing Modal */}
      {showSigModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">✒️ Draw Your Signature</h3>
              <button onClick={() => setShowSigModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Ink Color:</span>
              {[
                { name: 'Blue', hex: '#000080' },
                { name: 'Black', hex: '#000000' },
                { name: 'Red', hex: '#dc2626' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSigColor(c.hex)}
                  className={`px-3 py-1 rounded-full font-bold border ${
                    sigColor === c.hex ? 'border-white scale-105' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: c.hex, color: '#fff' }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <canvas
              ref={sigCanvasRef}
              width={380}
              height={160}
              onMouseDown={startSigDraw}
              onMouseMove={moveSigDraw}
              onMouseUp={() => setIsDrawingSig(false)}
              onMouseLeave={() => setIsDrawingSig(false)}
              className="w-full bg-white rounded-xl border-2 border-slate-600 cursor-crosshair"
            />

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={clearSigPad}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Clear Pad
              </button>
              <button
                onClick={insertSignature}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow"
              >
                Insert Signature on PDF ✍️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}