'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Link from 'next/link';

// ==========================================
// 1. TABLE THEMES & CONFIGURATION INTERFACES
// ==========================================

interface WorkSheetData {
  name: string;
  rows: string[][];
}

interface TableTheme {
  id: string;
  name: string;
  badge: string;
  headerBg: string;
  headerText: string;
  zebraBg: string;
  borderHex: string;
  titleHex: string;
}

const TABLE_THEMES: TableTheme[] = [
  {
    id: 'royal-blue',
    name: '1. Executive Blue',
    badge: '⭐ Default',
    headerBg: '#1E3A8A',
    headerText: '#FFFFFF',
    zebraBg: '#F1F5F9',
    borderHex: '#CBD5E1',
    titleHex: '#1E3A8A',
  },
  {
    id: 'sarkari-emerald',
    name: '2. Sarkari Merit Green',
    badge: '🏛️ Official',
    headerBg: '#065F46',
    headerText: '#FFFFFF',
    zebraBg: '#ECFDF5',
    borderHex: '#A7F3D0',
    titleHex: '#065F46',
  },
  {
    id: 'ca-crimson',
    name: '3. CA / Finance Maroon',
    badge: '📊 Accounts',
    headerBg: '#7F1D1D',
    headerText: '#FEF2F2',
    zebraBg: '#FFF1F2',
    borderHex: '#FECDD3',
    titleHex: '#7F1D1D',
  },
  {
    id: 'dark-slate',
    name: '4. Modern Dark Slate',
    badge: '💼 Corporate',
    headerBg: '#0F172A',
    headerText: '#F8FAFC',
    zebraBg: '#F8FAFC',
    borderHex: '#CBD5E1',
    titleHex: '#0F172A',
  },
  {
    id: 'amber-gold',
    name: '5. Warm Amber Gold',
    badge: '✨ Classic',
    headerBg: '#78350F',
    headerText: '#FEF3C7',
    zebraBg: '#FFFBEB',
    borderHex: '#FDE68A',
    titleHex: '#78350F',
  },
  {
    id: 'print-saver',
    name: '6. B&W Print Saver',
    badge: '🖨️ Cyber Cafe',
    headerBg: '#E5E7EB',
    headerText: '#000000',
    zebraBg: '#FFFFFF',
    borderHex: '#374151',
    titleHex: '#000000',
  },
];

export default function ExcelToPdfStudio() {
  // Workbook & Sheet States
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<WorkSheetData[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [isXlsxLibReady, setIsXlsxLibReady] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteRawText, setPasteRawText] = useState<string>('');

  // PDF Page & Table Styling States
  const [pageSize, setPageSize] = useState<'a4' | 'legal' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('royal-blue');
  const activeTheme =
    TABLE_THEMES.find((t) => t.id === selectedThemeId) || TABLE_THEMES[0];

  const [docTitle, setDocTitle] = useState<string>('OFFICIAL STATEMENT / REPORT');
  const [docSubtitle, setDocSubtitle] = useState<string>(
    `Generated on ${new Date().toLocaleDateString('en-IN')}`
  );
  const [showDocHeader, setShowDocHeader] = useState<boolean>(true);
  const [repeatHeaderOnPages, setRepeatHeaderOnPages] = useState<boolean>(true);
  const [showRowSerialNumbers, setShowRowSerialNumbers] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [zebraStripes, setZebraStripes] = useState<boolean>(true);
  const [exportAllSheets, setExportAllSheets] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>('medium');

  // Target KB & Output States
  const [kbMode, setKbMode] = useState<'hd' | 'custom'>('hd');
  const [targetKb, setTargetKb] = useState<number>(200);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [previewPagesUrls, setPreviewPagesUrls] = useState<string[]>([]);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string>('');
  const [pdfByteSize, setPdfByteSize] = useState<number>(0);

  const formatKb = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  // 1. Load SheetJS (xlsx) from CDN for full .xlsx / .xls / .csv support
  useEffect(() => {
    if ((window as any).XLSX) {
      setIsXlsxLibReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = true;
    script.onload = () => setIsXlsxLibReady(true);
    document.body.appendChild(script);
  }, []);

  // ==========================================
  // 2. NATIVE FALLBACK PARSER + SHEETJS PARSER
  // ==========================================
  const normalizeGridRows = (rawGrid: any[][]): string[][] => {
    const cleaned = rawGrid
      .map((row) =>
        (Array.isArray(row) ? row : []).map((cell) =>
          cell === null || cell === undefined ? '' : String(cell).trim()
        )
      )
      .filter((row) => row.some((c) => c !== ''));

    if (cleaned.length === 0) return [['Column 1', 'Column 2'], ['', '']];
    const maxCols = cleaned.reduce((m, r) => Math.max(m, r.length), 1);
    return cleaned.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push('');
      return copy;
    });
  };

  // Native JSZip OpenXML (.xlsx) fallback parser in case CDN is blocked
  const parseXlsxViaJsZip = async (buffer: ArrayBuffer): Promise<WorkSheetData[]> => {
    const zip = await JSZip.loadAsync(buffer);
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
    const sharedStrings: string[] = [];

    if (sharedStringsXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sharedStringsXml, 'application/xml');
      const siNodes = doc.querySelectorAll('si');
      siNodes.forEach((si) => {
        const tNodes = si.querySelectorAll('t');
        let text = '';
        tNodes.forEach((t) => (text += t.textContent || ''));
        sharedStrings.push(text);
      });
    }

    const extractedSheets: WorkSheetData[] = [];
    const sheetFiles = Object.keys(zip.files).filter((k) =>
      /^xl\/worksheets\/sheet\d+\.xml$/.test(k)
    );

    for (let i = 0; i < sheetFiles.length; i++) {
      const xmlStr = await zip.file(sheetFiles[i])?.async('string');
      if (!xmlStr) continue;
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'application/xml');
      const rowNodes = doc.querySelectorAll('row');
      const rows: string[][] = [];

      rowNodes.forEach((rNode) => {
        const rowCells: string[] = [];
        const cNodes = rNode.querySelectorAll('c');
        cNodes.forEach((cNode) => {
          const type = cNode.getAttribute('t');
          const vText = cNode.querySelector('v')?.textContent || '';
          const isText = cNode.querySelector('is t')?.textContent || '';
          if (type === 's') {
            const idx = parseInt(vText, 10);
            rowCells.push(sharedStrings[idx] ?? '');
          } else if (type === 'inlineStr') {
            rowCells.push(isText);
          } else {
            rowCells.push(vText);
          }
        });
        rows.push(rowCells);
      });

      extractedSheets.push({
        name: `Sheet${i + 1}`,
        rows: normalizeGridRows(rows),
      });
    }

    return extractedSheets;
  };

  // Handle Upload (.xlsx, .xls, .csv, .tsv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseTitle = file.name.replace(/\.(xlsx|xls|csv|tsv)$/i, '');
    setFileName(baseTitle);
    setDocTitle(baseTitle.replace(/[-_]/g, ' ').toUpperCase());

    try {
      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        const text = await file.text();
        const sep = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ',';
        const rawRows = text
          .split(/\r?\n/)
          .filter((l) => l.trim())
          .map((line) =>
            line.split(sep).map((cell) => cell.replace(/^"|"$/g, '').trim())
          );

        const norm = normalizeGridRows(rawRows);
        setSheets([{ name: 'Sheet1', rows: norm }]);
        setActiveSheetIdx(0);
        if ((norm[0]?.length || 0) >= 6) setOrientation('landscape');
        else setOrientation('portrait');
      } else {
        const buffer = await file.arrayBuffer();
        const XLSX = (window as any).XLSX;

        if (XLSX) {
          const wb = XLSX.read(buffer, { type: 'array' });
          const parsedSheets: WorkSheetData[] = wb.SheetNames.map((sName: string) => {
            const ws = wb.Sheets[sName];
            const jsonGrid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            return {
              name: sName,
              rows: normalizeGridRows(jsonGrid),
            };
          });
          setSheets(parsedSheets);
          setActiveSheetIdx(0);
          if ((parsedSheets[0]?.rows[0]?.length || 0) >= 6) setOrientation('landscape');
          else setOrientation('portrait');
        } else {
          const fallbackSheets = await parseXlsxViaJsZip(buffer);
          setSheets(fallbackSheets);
          setActiveSheetIdx(0);
        }
      }
    } catch (err: any) {
      alert(`File read error: ${err.message}`);
    }
    e.target.value = '';
  };

  // Load 1-Click Sample Excel Data (Merit List or GST Invoice)
  const loadSampleSpreadsheet = (type: 'merit' | 'invoice') => {
    if (type === 'merit') {
      setFileName('SSC-CGL-2026-Selected-Merit-List');
      setDocTitle('SSC CGL 2026 — PROVISIONAL MERIT & SCORE LIST');
      setDocSubtitle('Staff Selection Commission • Verified Candidate Roll & Marks');
      setSelectedThemeId('sarkari-emerald');
      setOrientation('landscape');
      setSheets([
        {
          name: 'Merit_List_2026',
          rows: [
            ['Roll Number', 'Candidate Name', 'Category', 'Tier-I Marks', 'Tier-II Marks', 'Typing (WPM)', 'Total Score', 'Allotted Post'],
            ['2201045891', 'RAHUL KUMAR SHARMA', 'UR', '164.50', '318.00', '42 WPM', '482.50', 'Inspector (CGST)'],
            ['3201089412', 'PRIYA VERMA', 'OBC', '158.00', '312.50', '39 WPM', '470.50', 'ASO (MEA)'],
            ['4410023198', 'MD SARBAR ALAM', 'EWS', '161.25', '309.00', '44 WPM', '470.25', 'Income Tax Inspector'],
            ['2201098234', 'ANANYA KUMARI', 'OBC', '154.00', '306.00', '38 WPM', '460.00', 'Auditor (CAG)'],
            ['3009128741', 'AMITESH SINGH', 'EWS', '152.75', '304.25', '41 WPM', '457.00', 'Preventive Officer'],
            ['8201033490', 'NEHA GUPTA', 'UR', '159.00', '296.50', '37 WPM', '455.50', 'Executive Assistant'],
            ['2405019283', 'VIKASH PASWAN', 'SC', '142.50', '289.00', '36 WPM', '431.50', 'Inspector (Examiner)'],
            ['3201076519', 'ROHIT RAJPUT', 'UR', '155.00', '298.00', '40 WPM', '453.00', 'Sub-Inspector (CBI)'],
          ],
        },
      ]);
      setActiveSheetIdx(0);
    } else {
      setFileName('Tax-Invoice-Statement-2026');
      setDocTitle('STATEMENT OF ACCOUNTS & GST INVOICE SUMMARY');
      setDocSubtitle('Financial Year 2026–27 • Verified Ledger Export');
      setSelectedThemeId('ca-crimson');
      setOrientation('portrait');
      setSheets([
        {
          name: 'Accounts_Ledger',
          rows: [
            ['Inv Date', 'Invoice No', 'Particulars / Item Description', 'HSN', 'Qty', 'Rate (₹)', 'GST (18%)', 'Total Amount (₹)'],
            ['02-11-2026', 'CS-2026/101', 'Complete SSC & Railway Test Series Batch', '9992', '50', '499.00', '4,491.00', '29,441.00'],
            ['03-11-2026', 'CS-2026/102', 'Printed Bilingual Study Material Kit', '4901', '30', '850.00', '4,590.00', '30,090.00'],
            ['04-11-2026', 'CS-2026/103', 'Digital Smart Classroom License', '9983', '5', '4,500.00', '4,050.00', '26,550.00'],
            ['04-11-2026', 'CS-2026/104', 'CBT Lab Server Maintenance Fee', '9987', '1', '12,000.00', '2,160.00', '14,160.00'],
            ['TOTAL', '-', 'Grand Total (Inclusive of All Taxes)', '-', '86', '-', '₹ 15,291.00', '₹ 1,00,241.00'],
          ],
        },
      ]);
      setActiveSheetIdx(0);
    }
  };

  // Handle Paste from Excel / Google Sheets
  const handleApplyPastedData = () => {
    if (!pasteRawText.trim()) return;
    const sep = pasteRawText.includes('\t') ? '\t' : ',';
    const rawRows = pasteRawText
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((line) => line.split(sep).map((c) => c.trim()));
    const norm = normalizeGridRows(rawRows);
    setFileName('Pasted-Excel-Sheet');
    setSheets([{ name: 'Pasted_Sheet', rows: norm }]);
    setActiveSheetIdx(0);
    setShowPasteModal(false);
    setPasteRawText('');
  };

  // Active Sheet Grid Helpers
  const activeSheet = sheets[activeSheetIdx] || null;
  const activeRows = activeSheet?.rows || [];

  const updateActiveSheetRows = (newRows: string[][]) => {
    setSheets((prev) =>
      prev.map((s, idx) => (idx === activeSheetIdx ? { ...s, rows: newRows } : s))
    );
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const copy = activeRows.map((r) => [...r]);
    if (copy[rIdx]) {
      copy[rIdx][cIdx] = val;
      updateActiveSheetRows(copy);
    }
  };

  const handleAddRow = () => {
    const cols = activeRows[0]?.length || 4;
    updateActiveSheetRows([...activeRows, Array(cols).fill('')]);
  };

  const handleDeleteRow = (rIdx: number) => {
    if (activeRows.length <= 1) return;
    updateActiveSheetRows(activeRows.filter((_, i) => i !== rIdx));
  };

  const handleAddCol = () => {
    updateActiveSheetRows(
      activeRows.map((r, i) => [...r, i === 0 ? `Column ${r.length + 1}` : ''])
    );
  };

  const handleDeleteCol = (cIdx: number) => {
    if ((activeRows[0]?.length || 0) <= 1) return;
    updateActiveSheetRows(activeRows.map((r) => r.filter((_, i) => i !== cIdx)));
  };

  const getColLetter = (idx: number) => {
    let temp = idx + 1;
    let letter = '';
    while (temp > 0) {
      const rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  };

  // ==========================================
  // 3. MULTI-PAGE HIGH-RES CANVAS TABLE PAGINATOR
  // ==========================================
  const wrapCellLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxW: number
  ): string[] => {
    if (!text) return [''];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
  };

  const renderWorkbookToPageCanvases = (scaleFactor = 1.0): HTMLCanvasElement[] => {
    const targetSheets = exportAllSheets ? sheets : activeSheet ? [activeSheet] : [];
    if (targetSheets.length === 0) return [];

    // Base high-resolution canvas dimensions (A4 / Legal / Letter at ~200 DPI)
    let baseW = 1240;
    let baseH = 1754;
    if (pageSize === 'legal') {
      baseW = 1275;
      baseH = 2100;
    } else if (pageSize === 'letter') {
      baseW = 1275;
      baseH = 1650;
    }

    const pageW = Math.round((orientation === 'landscape' ? baseH : baseW) * scaleFactor);
    const pageH = Math.round((orientation === 'landscape' ? baseW : baseH) * scaleFactor);
    const margin = Math.round(48 * scaleFactor);
    const usableW = pageW - margin * 2;

    const baseFontPx =
      (fontScale === 'small' ? 14 : fontScale === 'large' ? 19 : 16.5) * scaleFactor;
    const lineHeightPx = Math.round(baseFontPx * 1.38);
    const cellPadX = Math.round(11 * scaleFactor);
    const cellPadY = Math.round(10 * scaleFactor);

    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d')!;

    const allRenderedCanvases: HTMLCanvasElement[] = [];

    for (const sheet of targetSheets) {
      if (!sheet.rows || sheet.rows.length === 0) continue;

      const rawRows = sheet.rows.map((r, rIdx) => {
        if (!showRowSerialNumbers) return r;
        return [rIdx === 0 ? 'S.No' : String(rIdx), ...r];
      });

      const numCols = rawRows[0]?.length || 1;
      const headerRow = rawRows[0];
      const dataRows = rawRows.slice(1);

      // Step A: Compute proportional column widths so ALL columns fit inside `usableW` without cutting off!
      mCtx.font = `bold ${baseFontPx}px Arial, sans-serif`;
      const colWeights = new Array(numCols).fill(45);

      rawRows.slice(0, 60).forEach((row) => {
        row.forEach((cellVal, cIdx) => {
          const measured = mCtx.measureText(cellVal || '').width + cellPadX * 2.5;
          const clamped = Math.min(usableW * 0.42, Math.max(55 * scaleFactor, measured));
          if (clamped > colWeights[cIdx]) colWeights[cIdx] = clamped;
        });
      });

      const totalWeight = colWeights.reduce((acc, w) => acc + w, 0) || 1;
      const colWidths = colWeights.map((w) => Math.floor((w / totalWeight) * usableW));
      // Fix rounding remainder on last column
      const widthDiff = usableW - colWidths.reduce((a, b) => a + b, 0);
      colWidths[colWidths.length - 1] += widthDiff;

      // Helper to measure a row's wrapped lines and pixel height
      const measureRowLayout = (rowCells: string[], isHeader: boolean) => {
        mCtx.font = `${isHeader ? 'bold ' : ''}${baseFontPx}px Arial, sans-serif`;
        let maxLines = 1;
        const wrappedCells = rowCells.map((cellText, cIdx) => {
          const availTextW = Math.max(24, colWidths[cIdx] - cellPadX * 2);
          const lines = wrapCellLines(mCtx, cellText || '', availTextW);
          if (lines.length > maxLines) maxLines = lines.length;
          return lines;
        });
        const rowHeight = maxLines * lineHeightPx + cellPadY * 2;
        return { wrappedCells, rowHeight };
      };

      const headerLayout = measureRowLayout(headerRow, true);
      const dataLayouts = dataRows.map((r) => measureRowLayout(r, false));

      // Step B: Paginate rows vertically across pages
      const footerReserve = Math.round(52 * scaleFactor);
      const firstPageBannerH = showDocHeader ? Math.round(92 * scaleFactor) : 0;

      interface PageSlice {
        isFirstSheetPage: boolean;
        rows: {
          wrappedCells: string[][];
          rowHeight: number;
          rawCells: string[];
          dataIndex: number;
        }[];
      }

      const sheetPages: PageSlice[] = [];
      let currentSlice: PageSlice = { isFirstSheetPage: true, rows: [] };
      let currentY =
        margin + firstPageBannerH + headerLayout.rowHeight;

      dataLayouts.forEach((dLayout, idx) => {
        if (
          currentY + dLayout.rowHeight > pageH - margin - footerReserve &&
          currentSlice.rows.length > 0
        ) {
          sheetPages.push(currentSlice);
          currentSlice = { isFirstSheetPage: false, rows: [] };
          currentY =
            margin + (repeatHeaderOnPages ? headerLayout.rowHeight : 0);
        }
        currentSlice.rows.push({
          ...dLayout,
          rawCells: dataRows[idx],
          dataIndex: idx,
        });
        currentY += dLayout.rowHeight;
      });

      if (currentSlice.rows.length > 0 || sheetPages.length === 0) {
        sheetPages.push(currentSlice);
      }

      // Step C: Draw each page slice onto a crisp canvas
      sheetPages.forEach((slice) => {
        const c = document.createElement('canvas');
        c.width = pageW;
        c.height = pageH;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pageW, pageH);

        let yCursor = margin;

        // 1. Draw Document Title Banner on First Page of Sheet
        if (slice.isFirstSheetPage && showDocHeader) {
          ctx.fillStyle = activeTheme.titleHex;
          ctx.font = `bold ${Math.round(24 * scaleFactor)}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(docTitle || 'OFFICIAL REPORT', margin, yCursor);

          ctx.fillStyle = '#64748B';
          ctx.font = `bold ${Math.round(14 * scaleFactor)}px Arial, sans-serif`;
          ctx.fillText(
            `${docSubtitle}${exportAllSheets ? `  •  Sheet: ${sheet.name}` : ''}`,
            margin,
            yCursor + Math.round(32 * scaleFactor)
          );

          ctx.strokeStyle = activeTheme.headerBg;
          ctx.lineWidth = Math.max(2, Math.round(3 * scaleFactor));
          ctx.beginPath();
          ctx.moveTo(margin, yCursor + Math.round(62 * scaleFactor));
          ctx.lineTo(pageW - margin, yCursor + Math.round(62 * scaleFactor));
          ctx.stroke();

          yCursor += firstPageBannerH;
        }

        // Helper to draw a single table row
        const drawTableRow = (
          wrappedCells: string[][],
          rowH: number,
          isHeader: boolean,
          rowIndex: number
        ) => {
          // Row Background Fill
          if (isHeader) {
            ctx.fillStyle = activeTheme.headerBg;
            ctx.fillRect(margin, yCursor, usableW, rowH);
          } else if (zebraStripes && rowIndex % 2 === 1) {
            ctx.fillStyle = activeTheme.zebraBg;
            ctx.fillRect(margin, yCursor, usableW, rowH);
          }

          let xCursor = margin;
          wrappedCells.forEach((lines, cIdx) => {
            const colW = colWidths[cIdx];

            // Cell Grid Border
            if (showGridlines || isHeader) {
              ctx.strokeStyle = isHeader ? activeTheme.headerBg : activeTheme.borderHex;
              ctx.lineWidth = Math.max(1, Math.round(1.2 * scaleFactor));
              ctx.strokeRect(xCursor, yCursor, colW, rowH);
            }

            // Cell Text
            ctx.fillStyle = isHeader ? activeTheme.headerText : '#0F172A';
            ctx.font = `${isHeader ? 'bold ' : ''}${baseFontPx}px Arial, sans-serif`;
            ctx.textBaseline = 'top';

            const rawCellStr = (lines.join(' ') || '').trim();
            const isNumericCell =
              !isHeader && /^[₹$+-]?\s*\d[\d,.]*(\s*%|\s*WPM)?$/i.test(rawCellStr);

            lines.forEach((ln, lIdx) => {
              const textY = yCursor + cellPadY + lIdx * lineHeightPx;
              if (isNumericCell && cIdx > 0) {
                ctx.textAlign = 'right';
                ctx.fillText(ln, xCursor + colW - cellPadX, textY);
              } else {
                ctx.textAlign = 'left';
                ctx.fillText(ln, xCursor + cellPadX, textY);
              }
            });

            xCursor += colW;
          });

          yCursor += rowH;
        };

        // 2. Draw Table Header Row
        if (slice.isFirstSheetPage || repeatHeaderOnPages) {
          drawTableRow(headerLayout.wrappedCells, headerLayout.rowHeight, true, 0);
        }

        // 3. Draw Data Rows
        slice.rows.forEach((rItem) => {
          drawTableRow(
            rItem.wrappedCells,
            rItem.rowHeight,
            false,
            rItem.dataIndex
          );
        });

        allRenderedCanvases.push(c);
      });
    }

    // Add Footer Page Numbers ("Page X of Y") across all canvases
    const totalPages = allRenderedCanvases.length;
    allRenderedCanvases.forEach((c, idx) => {
      const ctx = c.getContext('2d')!;
      const footerY = c.height - Math.round(28 * scaleFactor);
      ctx.fillStyle = '#64748B';
      ctx.font = `bold ${Math.round(13 * scaleFactor)}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(fileName || 'CareerSathi Excel to PDF', margin, footerY);

      ctx.textAlign = 'right';
      ctx.fillText(`Page ${idx + 1} of ${totalPages}`, c.width - margin, footerY);
    });

    return allRenderedCanvases;
  };

  // Update Live Page Previews whenever settings or cells change
  useEffect(() => {
    if (sheets.length === 0) return;
    const previewCanvases = renderWorkbookToPageCanvases(0.75);
    setPreviewPagesUrls(previewCanvases.map((c) => c.toDataURL('image/jpeg', 0.85)));
  }, [
    sheets,
    activeSheetIdx,
    pageSize,
    orientation,
    selectedThemeId,
    docTitle,
    docSubtitle,
    showDocHeader,
    repeatHeaderOnPages,
    showRowSerialNumbers,
    showGridlines,
    zebraStripes,
    exportAllSheets,
    fontScale,
  ]);

  // ==========================================
  // 4. GENERATE & DOWNLOAD FINAL PDF (WITH TARGET KB SUPPORT)
  // ==========================================
  const buildPdfBytesWithQuality = async (
    scaleFactor: number,
    jpegQuality: number
  ): Promise<Uint8Array> => {
    const pageCanvases = renderWorkbookToPageCanvases(scaleFactor);
    const pdfDoc = await PDFDocument.create();

    let ptW = 595.28;
    let ptH = 841.89;
    if (pageSize === 'legal') {
      ptW = 612;
      ptH = 1008;
    } else if (pageSize === 'letter') {
      ptW = 612;
      ptH = 792;
    }

    const finalPtW = orientation === 'landscape' ? ptH : ptW;
    const finalPtH = orientation === 'landscape' ? ptW : ptH;

    for (const canvas of pageCanvases) {
      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      const b64 = dataUrl.split(',')[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      const embeddedJpg = await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage([finalPtW, finalPtH]);
      page.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: finalPtW,
        height: finalPtH,
      });
    }

    return await pdfDoc.save({ useObjectStreams: true });
  };

  const handleDownloadPdf = async () => {
    if (sheets.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      let finalPdfBytes: Uint8Array;

      if (kbMode === 'hd') {
        finalPdfBytes = await buildPdfBytesWithQuality(1.35, 0.94);
      } else {
        const desiredBytes = Math.max(25, targetKb) * 1024;
        let lowQ = 0.25;
        let highQ = 0.95;
        let bestBytes: Uint8Array | null = null;
        let minDiff = Infinity;

        for (let pass = 0; pass < 4; pass++) {
          const midQ = (lowQ + highQ) / 2;
          const sc = desiredBytes < 120 * 1024 ? 0.9 : 1.15;
          const trial = await buildPdfBytesWithQuality(sc, midQ);
          const diff = Math.abs(trial.length - desiredBytes);

          if (trial.length <= desiredBytes * 1.05 && diff < minDiff) {
            minDiff = diff;
            bestBytes = trial;
          }
          if (trial.length > desiredBytes) highQ = midQ;
          else lowQ = midQ;
        }

        if (!bestBytes) {
          bestBytes = await buildPdfBytesWithQuality(0.75, 0.4);
        }
        finalPdfBytes = bestBytes;
      }

      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      if (pdfDownloadUrl) URL.revokeObjectURL(pdfDownloadUrl);
      const url = URL.createObjectURL(blob);
      setPdfDownloadUrl(url);
      setPdfByteSize(finalPdfBytes.length);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'excel-sheet'}-careersathi.pdf`;
      a.click();
    } catch (err: any) {
      alert(`PDF generation error: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Print Handler
  const handleDirectPrint = () => {
    const hdCanvases = renderWorkbookToPageCanvases(1.25);
    if (hdCanvases.length === 0) return;
    const imgsHtml = hdCanvases
      .map(
        (c) =>
          `<img src="${c.toDataURL('image/jpeg', 0.95)}" style="width:100%; page-break-after:always; display:block;" />`
      )
      .join('');

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for direct printing.');
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Print PDF - ${fileName || 'CareerSathi'}</title>
          <style>
            @page { size: ${pageSize} ${orientation}; margin: 0; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">${imgsHtml}</body>
      </html>
    `);
    win.document.close();
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
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-black">
              📐 Auto-Fit All Columns (Zero Cut-Off) + Live Grid Editor
            </span>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
              ✓ Supports .XLSX, .XLS, .CSV &amp; Direct Paste
            </span>
          </div>
        </div>

        {/* HERO & SAMPLE LOADERS */}
        <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Excel to PDF Converter <span className="text-emerald-400">&amp; Print Layout Studio</span>
            </h1>
            <p className="text-xs text-slate-400">
              Fits all Excel columns cleanly onto 1 page without cutting off! Edit cells live, pick from 6 table themes, and export to A4 PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => loadSampleSpreadsheet('merit')}
              className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 font-black rounded-xl"
            >
              📋 Load Sample Merit List
            </button>
            <button
              onClick={() => loadSampleSpreadsheet('invoice')}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black rounded-xl"
            >
              🧾 Load Sample GST Invoice
            </button>
            <button
              onClick={() => setShowPasteModal(!showPasteModal)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow"
            >
              📋 Paste from Excel / Sheets
            </button>
          </div>
        </div>

        {/* PASTE FROM EXCEL MODAL DRAWER */}
        {showPasteModal && (
          <div className="bg-slate-900 p-4 rounded-2xl border-2 border-blue-500/50 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-black text-blue-300">
                📋 Copy any cells from Microsoft Excel or Google Sheets (Ctrl+C) and Paste (Ctrl+V) below:
              </span>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕ Close
              </button>
            </div>
            <textarea
              rows={4}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder="Paste Excel or CSV rows here..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
            />
            <button
              onClick={handleApplyPastedData}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl"
            >
              ⚡ Load Pasted Table into Studio
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* UPLOAD ZONE OR INTERACTIVE EXCEL-TO-PDF WORKSPACE            */}
        {/* ============================================================ */}
        {sheets.length === 0 ? (
          <label className="block max-w-3xl mx-auto border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 bg-slate-900/90 rounded-3xl p-10 md:p-14 text-center cursor-pointer transition shadow-2xl space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">
              📗
            </div>
            <div className="space-y-1">
              <div className="text-lg md:text-2xl font-black text-white">
                Click to Upload Excel File (.XLSX, .XLS, .CSV)
              </div>
              <p className="text-xs text-slate-400">
                100% Auto-Fit Columns (No Cut-off Pages) • Hindi &amp; ₹ Supported • Live Cell Editor
              </p>
            </div>
            <div>
              <span className="inline-block px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition">
                📂 Select Excel / CSV File
              </span>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ============================================================ */}
            {/* LEFT: LIVE EDITABLE SPREADSHEET + STYLING CONTROLS (7 COLS)  */}
            {/* ============================================================ */}
            <div className="lg:col-span-7 space-y-5 text-xs">
              {/* 1. Page Setup & 6 Table Themes Card */}
              <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <span className="font-black text-amber-400 uppercase">
                    🎨 1. Page Orientation, Theme &amp; Header Settings
                  </span>
                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg cursor-pointer">
                    📂 Upload Another Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Orientation, Page Size & Font Size */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Page Orientation:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setOrientation('landscape')}
                        className={`py-2 rounded-lg font-black border ${
                          orientation === 'landscape'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        🖼️ Landscape
                      </button>
                      <button
                        onClick={() => setOrientation('portrait')}
                        className={`py-2 rounded-lg font-black border ${
                          orientation === 'portrait'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        📄 Portrait
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Paper Size:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as any)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black"
                    >
                      <option value="a4">A4 Standard (210 × 297 mm)</option>
                      <option value="legal">Legal (Large Lists)</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Table Font Size:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['small', 'medium', 'large'] as const).map((fs) => (
                        <button
                          key={fs}
                          onClick={() => setFontScale(fs)}
                          className={`py-2 rounded-lg font-black uppercase text-[10px] border ${
                            fontScale === fs
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {fs}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6 Professional Color Themes */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-bold block">Select Table Theme:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {TABLE_THEMES.map((th) => {
                      const active = selectedThemeId === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => setSelectedThemeId(th.id)}
                          className={`p-2 rounded-xl border text-left transition ${
                            active
                              ? 'border-amber-400 bg-amber-500/20 text-white shadow'
                              : 'border-slate-800 bg-slate-950 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: th.headerBg }}
                            />
                            <span className="text-[9px] text-amber-300 font-bold">{th.badge}</span>
                          </div>
                          <div className="text-[10px] font-black mt-1 truncate">{th.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Document Header Title & Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={showDocHeader}
                        onChange={(e) => setShowDocHeader(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      🏷️ Add Document Title
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={repeatHeaderOnPages}
                        onChange={(e) => setRepeatHeaderOnPages(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      🔁 Repeat Header on All Pages
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={showRowSerialNumbers}
                        onChange={(e) => setShowRowSerialNumbers(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      🔢 Add S.No Column
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={zebraStripes}
                        onChange={(e) => setZebraStripes(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      🦓 Zebra Rows
                    </label>
                  </div>

                  {showDocHeader && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="Document Heading Title"
                        className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black"
                      />
                      <input
                        type="text"
                        value={docSubtitle}
                        onChange={(e) => setDocSubtitle(e.target.value)}
                        placeholder="Subtitle / Date / Department"
                        className="p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Live Editable Excel Grid Card */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Sheet Switcher Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {sheets.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSheetIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-black transition ${
                          activeSheetIdx === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        📗 {s.name} ({s.rows.length})
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddRow}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-lg border border-slate-700"
                    >
                      + Row
                    </button>
                    <button
                      onClick={handleAddCol}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700"
                    >
                      + Column
                    </button>
                  </div>
                </div>

                {/* Editable Table Grid */}
                <div className="max-h-[380px] overflow-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-800 text-slate-200">
                      <tr>
                        <th className="border border-slate-700 px-2 py-1.5 text-center w-10 bg-slate-900 text-slate-400">
                          #
                        </th>
                        {(activeRows[0] || []).map((_, cIdx) => (
                          <th
                            key={cIdx}
                            className="border border-slate-700 px-2.5 py-1.5 text-left min-w-[115px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-black">
                                Col {getColLetter(cIdx)}
                              </span>
                              <button
                                onClick={() => handleDeleteCol(cIdx)}
                                className="text-[10px] text-slate-400 hover:text-rose-400"
                                title="Delete Column"
                              >
                                ✕
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="border border-slate-700 px-2 py-1.5 text-center w-9 bg-slate-900">
                          🗑️
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRows.slice(0, 150).map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx === 0
                              ? 'bg-emerald-950/30 font-black'
                              : 'hover:bg-slate-800/40 bg-slate-950/60'
                          }
                        >
                          <td className="border border-slate-800 px-2 py-1 text-center font-mono text-[10px] text-slate-500">
                            {rIdx === 0 ? 'HDR' : rIdx}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-800 p-0">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                className={`w-full px-2 py-1.5 bg-transparent outline-none focus:bg-slate-800 ${
                                  rIdx === 0 ? 'text-amber-300 font-black' : 'text-slate-100'
                                }`}
                              />
                            </td>
                          ))}
                          <td className="border border-slate-800 px-1.5 py-1 text-center">
                            <button
                              onClick={() => handleDeleteRow(rIdx)}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT: LIVE A4 PDF PAGE PREVIEW & TARGET KB DOWNLOAD (5 COLS)*/}
            {/* ============================================================ */}
            <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-black text-emerald-400">
                    📄 Live Print-Ready PDF Preview ({previewPagesUrls.length} Page
                    {previewPagesUrls.length > 1 ? 's' : ''})
                  </span>
                  {sheets.length > 1 && (
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={exportAllSheets}
                        onChange={(e) => setExportAllSheets(e.target.checked)}
                        className="rounded"
                      />
                      Merge All {sheets.length} Sheets
                    </label>
                  )}
                </div>

                {/* Scrollable Multi-Page Preview Container */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[430px] overflow-y-auto space-y-4 flex flex-col items-center">
                  {previewPagesUrls.map((url, idx) => (
                    <div key={idx} className="space-y-1 text-center w-full">
                      <img
                        src={url}
                        alt={`PDF Page ${idx + 1}`}
                        className="max-h-[360px] w-auto mx-auto object-contain rounded shadow-2xl border border-slate-700 bg-white"
                      />
                      <span className="text-[10px] text-slate-500 font-bold block">
                        Page {idx + 1} of {previewPagesUrls.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target KB Control & Download Buttons */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-300">🎯 PDF File Size Mode:</span>
                    {pdfByteSize > 0 && (
                      <span className="text-emerald-400 font-black">
                        Last Output: {formatKb(pdfByteSize)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setKbMode('hd')}
                      className={`px-3 py-1.5 rounded-lg font-bold border ${
                        kbMode === 'hd'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      💎 Max HD Print
                    </button>
                    {[100, 200, 300, 500].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => {
                          setKbMode('custom');
                          setTargetKb(kb);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold border ${
                          kbMode === 'custom' && targetKb === kb
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        Under {kb} KB
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-1.5"
                  >
                    📥 {isGeneratingPdf ? 'Building PDF...' : 'Download PDF File'}
                  </button>

                  <button
                    onClick={handleDirectPrint}
                    className="py-4 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-1.5"
                  >
                    🖨️ Print Sheet Directly
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