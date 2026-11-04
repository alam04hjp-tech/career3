'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Link from 'next/link';

// ==========================================
// 1. DATA INTERFACES & COLUMN MODES
// ==========================================

interface RawPdfItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExtractedPageSheet {
  pageNumber: number;
  rawItems: RawPdfItem[];
  rows: string[][];
}

type ColumnSplitMode = 'auto' | 'tight' | 'wide' | 'space';
type SheetMergeMode = 'single-master' | 'multi-sheet';

export default function PdfToExcelStudio() {
  // File & Engine States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isPdfReady, setIsPdfReady] = useState<boolean>(false);
  const [isOcrReady, setIsOcrReady] = useState<boolean>(false);

  // Extraction Settings
  const [ocrMode, setOcrMode] = useState<'no-ocr' | 'ocr'>('no-ocr');
  const [ocrLang, setOcrLang] = useState<'eng' | 'hin' | 'eng+hin'>('eng+hin');
  const [colMode, setColMode] = useState<ColumnSplitMode>('auto');
  const [sheetMode, setSheetMode] = useState<SheetMergeMode>('single-master');
  const [onlyTableRows, setOnlyTableRows] = useState<boolean>(false);
  const [convertNumbers, setConvertNumbers] = useState<boolean>(true);
  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number>(1);
  const [scanAlertMsg, setScanAlertMsg] = useState<string>('');

  // Processing & Live Spreadsheet Grid States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [pageSheets, setPageSheets] = useState<ExtractedPageSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [masterRows, setMasterRows] = useState<string[][]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);

  // 1. Load PDF.js & Tesseract.js OCR from CDN
  useEffect(() => {
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

  // ==========================================
  // 2. SMART GEOMETRIC TABLE RECONSTRUCTION ENGINE
  // ==========================================
  const buildRowsFromPositionedItems = (
    items: RawPdfItem[],
    splitMode: ColumnSplitMode,
    filterNonTable: boolean
  ): string[][] => {
    if (items.length === 0) return [];

    // Step A: Sort top-to-bottom (Y), then left-to-right (X)
    const sorted = [...items].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4.5) return a.y - b.y;
      return a.x - b.x;
    });

    // Step B: Group into horizontal visual rows
    const visualRows: { y: number; items: RawPdfItem[] }[] = [];
    for (const it of sorted) {
      const last = visualRows[visualRows.length - 1];
      if (!last || Math.abs(last.y - it.y) > Math.max(it.height * 0.55, 5)) {
        visualRows.push({ y: it.y, items: [it] });
      } else {
        last.items.push(it);
      }
    }

    // Gap threshold in PDF points based on user's selected Column Split Mode
    const gapThreshold =
      splitMode === 'tight' ? 8 : splitMode === 'wide' ? 28 : splitMode === 'space' ? 2 : 15;

    // Step C: Split each visual row into cells
    let grid: string[][] = visualRows.map((row) => {
      row.items.sort((a, b) => a.x - b.x);

      if (splitMode === 'space') {
        const fullLine = row.items.map((x) => x.str.trim()).join(' ');
        return fullLine.split(/\s{2,}|\t+/).filter(Boolean);
      }

      const cells: string[] = [];
      let currentCell = '';
      let prevRightEdge = -1;

      for (const item of row.items) {
        const text = item.str.trim();
        if (!text) continue;

        if (prevRightEdge === -1) {
          currentCell = text;
        } else {
          const gap = item.x - prevRightEdge;
          if (gap >= gapThreshold) {
            cells.push(currentCell.trim());
            currentCell = text;
          } else {
            currentCell += ' ' + text;
          }
        }
        prevRightEdge = item.x + item.width;
      }

      if (currentCell.trim()) {
        cells.push(currentCell.trim());
      }
      return cells;
    });

    // Optional: Strip single-cell paragraph lines to keep only multi-column table data
    if (filterNonTable) {
      grid = grid.filter((r) => r.filter((c) => c.trim() !== '').length >= 2);
    } else {
      grid = grid.filter((r) => r.some((c) => c.trim() !== ''));
    }

    // Normalize column count across all rows
    const maxCols = grid.reduce((max, r) => Math.max(max, r.length), 1);
    return grid.map((r) => {
      const padded = [...r];
      while (padded.length < maxCols) padded.push('');
      return padded;
    });
  };

  // Re-calculate grid whenever user switches Column Split Mode or Table Filter!
  useEffect(() => {
    if (pageSheets.length === 0) return;

    const updatedSheets = pageSheets.map((ps) => ({
      ...ps,
      rows: buildRowsFromPositionedItems(ps.rawItems, colMode, onlyTableRows),
    }));

    setPageSheets(updatedSheets);

    // Build combined master sheet
    const allRows = updatedSheets.flatMap((s) => s.rows);
    const maxC = allRows.reduce((m, r) => Math.max(m, r.length), 1);
    const normalizedMaster = allRows.map((r) => {
      const copy = [...r];
      while (copy.length < maxC) copy.push('');
      return copy;
    });
    setMasterRows(normalizedMaster);
  }, [colMode, onlyTableRows]);

  // ==========================================
  // 3. UPLOAD PDF & AUTO-EXTRACT TABLES
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setSelectedFile(file);
    setPageSheets([]);
    setMasterRows([]);
    setScanAlertMsg('🔍 Analyzing PDF Table Geometry...');

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      setNumPages(pdf.numPages);
      setFromPage(1);
      setToPage(pdf.numPages);

      const firstPage = await pdf.getPage(1);
      const tc = await firstPage.getTextContent();
      const charCount = tc.items
        .map((i: any) => i.str || '')
        .join('')
        .trim().length;

      if (charCount < 12) {
        setOcrMode('ocr');
        setScanAlertMsg(
          '📸 Scanned / Image PDF Detected! Humne Free AI OCR Mode auto-select kar diya hai.'
        );
        await extractPdfToGrid(file, 1, pdf.numPages, 'ocr');
      } else {
        setOcrMode('no-ocr');
        setScanAlertMsg(
          '⚡ Digital Table Detected! Instant X-Y Coordinate Table Extraction Complete.'
        );
        await extractPdfToGrid(file, 1, pdf.numPages, 'no-ocr');
      }
    } catch (err) {
      console.error(err);
      setScanAlertMsg('');
    }
    e.target.value = '';
  };

  const extractPdfToGrid = async (
    fileToUse = selectedFile,
    startP = fromPage,
    endP = toPage,
    modeToUse = ocrMode
  ) => {
    if (!fileToUse) return;
    setIsProcessing(true);
    setProgress(5);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const buffer = await fileToUse.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      const sPage = Math.max(1, Math.min(startP, pdf.numPages));
      const ePage = Math.max(sPage, Math.min(endP, pdf.numPages));
      const total = ePage - sPage + 1;
      const extractedList: ExtractedPageSheet[] = [];

      if (modeToUse === 'no-ocr') {
        for (let p = sPage; p <= ePage; p++) {
          setStatusText(`Extracting Table Coordinates from Page ${p} of ${ePage}... 📊`);
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();

          const rawItems: RawPdfItem[] = [];
          for (const item of textContent.items) {
            if (!item.str || !item.str.trim()) continue;
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const fontH = Math.round(Math.hypot(tx[2], tx[3])) || 11;
            rawItems.push({
              str: item.str,
              x: tx[4],
              y: tx[5],
              width: item.width || item.str.length * 5.5,
              height: fontH,
            });
          }

          const rows = buildRowsFromPositionedItems(rawItems, colMode, onlyTableRows);
          extractedList.push({ pageNumber: p, rawItems, rows });
          setProgress(Math.round(((p - sPage + 1) / total) * 100));
        }
      } else {
        // AI OCR Table Extraction
        const Tesseract = (window as any).Tesseract;
        if (!Tesseract) {
          alert('OCR Engine is loading, please try again in 2 seconds.');
          setIsProcessing(false);
          return;
        }
        setStatusText(`Starting Free AI OCR (${ocrLang.toUpperCase()})... 🧠`);
        const worker = await Tesseract.createWorker(ocrLang);

        for (let p = sPage; p <= ePage; p++) {
          setStatusText(`Scanning Page ${p} of ${ePage} with AI OCR... 🔍`);
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;

          const { data } = await worker.recognize(canvas.toDataURL('image/png'));
          const rawItems: RawPdfItem[] = [];

          if (data.words && data.words.length > 0) {
            data.words.forEach((w: any) => {
              if (w.text && w.text.trim()) {
                rawItems.push({
                  str: w.text.trim(),
                  x: w.bbox.x0 / 2,
                  y: w.bbox.y0 / 2,
                  width: (w.bbox.x1 - w.bbox.x0) / 2,
                  height: (w.bbox.y1 - w.bbox.y0) / 2,
                });
              }
            });
          } else {
            const lines = (data.text || '').split('\n').filter((l: string) => l.trim());
            lines.forEach((lineStr: string, idx: number) => {
              rawItems.push({
                str: lineStr,
                x: 20,
                y: idx * 18,
                width: lineStr.length * 6,
                height: 12,
              });
            });
          }

          const rows = buildRowsFromPositionedItems(rawItems, colMode, onlyTableRows);
          extractedList.push({ pageNumber: p, rawItems, rows });
          setProgress(Math.round(((p - sPage + 1) / total) * 100));
        }
        await worker.terminate();
      }

      setPageSheets(extractedList);
      setActiveSheetIdx(0);

      const allRows = extractedList.flatMap((s) => s.rows);
      const maxC = allRows.reduce((m, r) => Math.max(m, r.length), 1);
      const normalizedMaster = allRows.map((r) => {
        const copy = [...r];
        while (copy.length < maxC) copy.push('');
        return copy;
      });
      setMasterRows(normalizedMaster);
      setStatusText('Table Ready! 🎉');
    } catch (err: any) {
      alert(`Extraction Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 4. INTERACTIVE SPREADSHEET GRID EDITING
  // ==========================================
  const currentGridRows =
    sheetMode === 'single-master'
      ? masterRows
      : pageSheets[activeSheetIdx]?.rows || [];

  const updateGridRows = (newRows: string[][]) => {
    if (sheetMode === 'single-master') {
      setMasterRows(newRows);
    } else {
      setPageSheets((prev) =>
        prev.map((ps, idx) => (idx === activeSheetIdx ? { ...ps, rows: newRows } : ps))
      );
    }
  };

  const handleCellEdit = (rIdx: number, cIdx: number, val: string) => {
    const copy = currentGridRows.map((r) => [...r]);
    if (copy[rIdx]) {
      copy[rIdx][cIdx] = val;
      updateGridRows(copy);
    }
  };

  const handleDeleteRow = (rIdx: number) => {
    updateGridRows(currentGridRows.filter((_, i) => i !== rIdx));
  };

  const handleAddRow = () => {
    const cols = currentGridRows[0]?.length || 4;
    updateGridRows([...currentGridRows, Array(cols).fill('')]);
  };

  const handleAddColumn = () => {
    updateGridRows(currentGridRows.map((r) => [...r, '']));
  };

  const handleDeleteColumn = (cIdx: number) => {
    if ((currentGridRows[0]?.length || 0) <= 1) return;
    updateGridRows(currentGridRows.map((r) => r.filter((_, i) => i !== cIdx)));
  };

  // Calculate Live Numeric Sum & Count for Financial / Marks Verification
  const calculateGridStats = () => {
    let numericCount = 0;
    let numericSum = 0;
    currentGridRows.forEach((row) => {
      row.forEach((cell) => {
        const cleaned = cell.replace(/[₹$,\s]/g, '');
        if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
          const num = parseFloat(cleaned);
          if (!isNaN(num) && num < 100000000) {
            numericCount++;
            numericSum += num;
          }
        }
      });
    });
    return {
      totalRows: currentGridRows.length,
      totalCols: currentGridRows[0]?.length || 0,
      numericCount,
      numericSum: numericSum.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
    };
  };

  const gridStats = calculateGridStats();

  // ==========================================
  // 5. GENUINE OPENXML .XLSX GENERATOR (VIA JSZIP)
  // ==========================================
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const getExcelColLetter = (colIdx: number): string => {
    let temp = colIdx + 1;
    let letter = '';
    while (temp > 0) {
      const rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  };

  const buildWorksheetXml = (rows: string[][]): string => {
    let sheetDataXml = '';

    rows.forEach((row, rIdx) => {
      const rowNum = rIdx + 1;
      let cellsXml = '';

      row.forEach((cellVal, cIdx) => {
        const cellRef = `${getExcelColLetter(cIdx)}${rowNum}`;
        const trimmed = (cellVal || '').trim();
        const cleanedNum = trimmed.replace(/[₹$,\s]/g, '');
        const isNumber =
          convertNumbers &&
          rIdx > 0 &&
          /^-?\d+(\.\d+)?$/.test(cleanedNum) &&
          !cleanedNum.startsWith('0');

        const styleAttr = rIdx === 0 ? ' s="1"' : '';

        if (isNumber) {
          cellsXml += `<c r="${cellRef}"${styleAttr}><v>${cleanedNum}</v></c>`;
        } else {
          cellsXml += `<c r="${cellRef}" t="inlineStr"${styleAttr}><is><t>${escapeXml(
            trimmed
          )}</t></is></c>`;
        }
      });

      sheetDataXml += `<row r="${rowNum}">${cellsXml}</row>`;
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetDataXml}</sheetData>
</worksheet>`;
  };

  const downloadGenuineXlsx = async () => {
    const sheetsToExport =
      sheetMode === 'single-master'
        ? [{ name: 'Master_Table', rows: masterRows }]
        : pageSheets.map((ps) => ({ name: `Page_${ps.pageNumber}`, rows: ps.rows }));

    if (sheetsToExport.length === 0) return;

    const zip = new JSZip();

    // 1. [Content_Types].xml
    const sheetOverrides = sheetsToExport
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${
            i + 1
          }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('\n  ');

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
</Types>`
    );

    // 2. _rels/.rels
    zip.folder('_rels')?.file(
      '.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    );

    // 3. xl/workbook.xml & xl/_rels/workbook.xml.rels
    const sheetsXml = sheetsToExport
      .map(
        (s, i) =>
          `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
      )
      .join('\n    ');

    zip.folder('xl')?.file(
      'workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheetsXml}
  </sheets>
</workbook>`
    );

    const wbRelsXml = sheetsToExport
      .map(
        (_, i) =>
          `<Relationship Id="rId${
            i + 1
          }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
            i + 1
          }.xml"/>`
      )
      .concat([
        `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
      ])
      .join('\n  ');

    zip.folder('xl')?.folder('_rels')?.file(
      'workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${wbRelsXml}
</Relationships>`
    );

    // 4. xl/styles.xml (Bold header style s="1")
    zip.folder('xl')?.file(
      'styles.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
    );

    // 5. Add each worksheet XML
    const wsFolder = zip.folder('xl')?.folder('worksheets');
    sheetsToExport.forEach((s, i) => {
      wsFolder?.file(`sheet${i + 1}.xml`, buildWorksheetXml(s.rows));
    });

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${
      selectedFile?.name.replace(/\.pdf$/i, '') || 'table'
    }-careersathi.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Clean CSV
  const downloadCsv = () => {
    if (currentGridRows.length === 0) return;
    const csvContent = currentGridRows
      .map((row) =>
        row
          .map((cell) => {
            const escaped = (cell || '').replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${
      selectedFile?.name.replace(/\.pdf$/i, '') || 'table'
    }-careersathi.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Tab-Separated Values (Direct Paste into Excel / Google Sheets!)
  const copyForGoogleSheets = () => {
    if (currentGridRows.length === 0) return;
    const tsv = currentGridRows.map((r) => r.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedClipboard(true);
    setTimeout(() => setCopiedClipboard(false), 2500);
  };

  const visibleRows = searchFilter.trim()
    ? currentGridRows.filter((r) =>
        r.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : currentGridRows;

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
              📊 Live Pre-Download Excel Grid Editor + Free AI OCR
            </span>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
              ✓ True .XLSX, .CSV &amp; Google Sheets Copy
            </span>
          </div>
        </div>

        {/* HERO TITLE */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl md:text-4xl font-black text-white">
            PDF to Excel Converter <span className="text-emerald-400">&amp; Live Table Studio</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl mx-auto">
            Convert Bank Statements, Exam Merit Lists, Roll Number PDFs &amp; Invoices into 100% editable Microsoft Excel (<strong>.XLSX</strong>) spreadsheets. Preview &amp; edit cells live before downloading!
          </p>
        </div>

        {/* ============================================================ */}
        {/* UPLOAD ZONE OR LIVE EXCEL SPREADSHEET STUDIO                 */}
        {/* ============================================================ */}
        {!selectedFile ? (
          <label className="block max-w-3xl mx-auto border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 bg-slate-900/90 rounded-3xl p-10 md:p-14 text-center cursor-pointer transition shadow-2xl space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">
              📊
            </div>
            <div className="space-y-1">
              <div className="text-lg md:text-2xl font-black text-white">
                {isPdfReady
                  ? 'Click to Select PDF or Drop PDF File Here'
                  : '⏳ Loading PDF Table Engine...'}
              </div>
              <p className="text-xs text-slate-400">
                Supports Digital &amp; Scanned PDFs • 100% Private Browser Processing (Safe for Bank Statements)
              </p>
            </div>
            <div>
              <span className="inline-block px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl transition">
                📂 Select PDF to Convert to Excel
              </span>
            </div>
            <input
              type="file"
              accept="application/pdf"
              disabled={!isPdfReady}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-5">
            {/* TOP CONTROL PANEL: FILE INFO, COLUMN SENSITIVITY, SHEET MODE & EXPORTS */}
            <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-sm font-black text-white">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Pages: <strong className="text-emerald-400">{numPages}</strong> •{' '}
                      {scanAlertMsg}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={downloadGenuineXlsx}
                    disabled={currentGridRows.length === 0 || isProcessing}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center gap-1.5"
                  >
                    📥 Download Excel (.XLSX)
                  </button>

                  <button
                    onClick={downloadCsv}
                    disabled={currentGridRows.length === 0 || isProcessing}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow transition"
                  >
                    📄 Download .CSV
                  </button>

                  <button
                    onClick={copyForGoogleSheets}
                    disabled={currentGridRows.length === 0 || isProcessing}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow transition"
                  >
                    {copiedClipboard ? '✓ Copied for Excel/Sheets!' : '📋 Copy Table'}
                  </button>

                  <label className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer border border-slate-700">
                    🔄 Change PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* SMART TABLE CONTROLS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* 1. Column Alignment Mode */}
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-black text-amber-400 uppercase block">
                    🎛️ 1. Column Split Sensitivity (Instant Table Fix):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'auto', label: '⚡ Auto Grid' },
                        { id: 'tight', label: '📋 Tight (Roll List)' },
                        { id: 'wide', label: '🏦 Wide (Bank)' },
                        { id: 'space', label: '↔️ Space Split' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setColMode(m.id)}
                        className={`py-2 px-1.5 rounded-lg font-black text-[11px] border transition ${
                          colMode === m.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sheet Layout Mode (Single Master vs Multi-Sheet) */}
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[11px] font-black text-emerald-400 uppercase block">
                    📑 2. Excel Workbook Layout:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSheetMode('single-master')}
                      className={`py-2 px-2.5 rounded-lg font-black border transition ${
                        sheetMode === 'single-master'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      1 Master Sheet (All Pages)
                    </button>
                    <button
                      onClick={() => setSheetMode('multi-sheet')}
                      className={`py-2 px-2.5 rounded-lg font-black border transition ${
                        sheetMode === 'multi-sheet'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      Separate Sheet / Page
                    </button>
                  </div>
                </div>

                {/* 3. Smart Data Cleaners */}
                <div className="md:col-span-3 flex flex-col gap-1.5 pt-2 md:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={onlyTableRows}
                      onChange={(e) => setOnlyTableRows(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    🧹 Strip Non-Table Paragraphs
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={convertNumbers}
                      onChange={(e) => setConvertNumbers(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    🔢 Auto-Format Numbers for SUM()
                  </label>
                </div>
              </div>

              {/* Optional OCR Re-Run Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-bold">Extraction Engine:</span>
                  <button
                    onClick={() => {
                      setOcrMode('no-ocr');
                      extractPdfToGrid(selectedFile, fromPage, toPage, 'no-ocr');
                    }}
                    className={`px-2.5 py-1 rounded font-bold border ${
                      ocrMode === 'no-ocr'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    ⚡ Fast Digital PDF
                  </button>
                  <button
                    onClick={() => {
                      setOcrMode('ocr');
                      extractPdfToGrid(selectedFile, fromPage, toPage, 'ocr');
                    }}
                    className={`px-2.5 py-1 rounded font-bold border ${
                      ocrMode === 'ocr'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🔍 Scanned PDF AI OCR (Free)
                  </button>
                </div>

                {/* Live Telemetry Stats */}
                <div className="flex flex-wrap items-center gap-4 text-slate-300 font-bold">
                  <span>
                    Rows: <strong className="text-white">{gridStats.totalRows}</strong>
                  </span>
                  <span>
                    Columns: <strong className="text-white">{gridStats.totalCols}</strong>
                  </span>
                  {gridStats.numericCount > 0 && (
                    <span>
                      Auto-Sum ({gridStats.numericCount} nums):{' '}
                      <strong className="text-emerald-400">{gridStats.numericSum}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* LIVE INTERACTIVE EXCEL SPREADSHEET PREVIEW & CELL EDITOR     */}
            {/* ============================================================ */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              {/* Sheet Tabs + Search Filter + Add Row/Col Toolbar */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {sheetMode === 'single-master' ? (
                    <span className="px-3 py-1.5 bg-emerald-600 text-white font-black rounded-lg">
                      📊 Master_Table ({masterRows.length} Rows)
                    </span>
                  ) : (
                    pageSheets.map((ps, idx) => (
                      <button
                        key={ps.pageNumber}
                        onClick={() => setActiveSheetIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-black transition ${
                          activeSheetIdx === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Page_{ps.pageNumber} ({ps.rows.length})
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="🔍 Filter / Search Roll No, Name, Amount..."
                    className="w-56 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-lg border border-slate-700"
                  >
                    + Add Row
                  </button>
                  <button
                    onClick={handleAddColumn}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700"
                  >
                    + Add Col
                  </button>
                </div>
              </div>

              {/* Loading Progress */}
              {isProcessing ? (
                <div className="p-16 text-center space-y-3">
                  <div className="text-3xl animate-spin">⏳</div>
                  <div className="text-sm font-black text-emerald-400">
                    {statusText} ({progress}%)
                  </div>
                  <div className="max-w-md mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : visibleRows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No table rows match your filter. Try switching Column Split Mode above.
                </div>
              ) : (
                /* Excel-Style Editable Grid Table */
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-800 text-slate-200">
                      <tr>
                        <th className="border border-slate-700 px-2.5 py-2 text-center w-12 bg-slate-900 font-black text-slate-400">
                          #
                        </th>
                        {(visibleRows[0] || []).map((_, cIdx) => (
                          <th
                            key={cIdx}
                            className="border border-slate-700 px-3 py-2 text-left font-black min-w-[130px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400">
                                Col {getExcelColLetter(cIdx)}
                              </span>
                              <button
                                onClick={() => handleDeleteColumn(cIdx)}
                                title="Delete Column"
                                className="text-[10px] text-slate-400 hover:text-rose-400 px-1"
                              >
                                ✕
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="border border-slate-700 px-2 py-2 text-center w-10 bg-slate-900">
                          🗑️
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.slice(0, 250).map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx === 0
                              ? 'bg-emerald-950/30 font-bold'
                              : 'hover:bg-slate-800/40 bg-slate-950/60'
                          }
                        >
                          <td className="border border-slate-800 px-2 py-1.5 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-800 p-0">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellEdit(rIdx, cIdx, e.target.value)}
                                className={`w-full px-2.5 py-1.5 bg-transparent outline-none focus:bg-slate-800 focus:ring-1 focus:ring-emerald-400 ${
                                  rIdx === 0 ? 'font-black text-amber-300' : 'text-slate-100'
                                }`}
                              />
                            </td>
                          ))}
                          <td className="border border-slate-800 px-2 py-1 text-center">
                            <button
                              onClick={() => handleDeleteRow(rIdx)}
                              title="Delete Row"
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}