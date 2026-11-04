'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Link from 'next/link';

interface ConvertedImage {
  pageNumber: number;
  dataUrl: string;
}

export default function PdfToJpgTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load PDF.js from CDN dynamically on client mount
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
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsScriptLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setConvertedImages([]);
        setZipDownloadUrl(null);
      } else {
        alert('Kripya sirf valid PDF file select karein!');
      }
    }
  };

  const convertPdfToJpg = async () => {
    if (!selectedFile) {
      alert('Pehle ek PDF file select karo bhai!');
      return;
    }

    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      alert('PDF engine abhi load ho raha hai, kripya 2 sekund wait karke dubara try karein.');
      return;
    }

    setIsConverting(true);
    setConvertedImages([]);
    setZipDownloadUrl(null);

    try {
      setProgressText('Reading PDF file... ⏳');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const zip = new JSZip();
      const imagesList: ConvertedImage[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Converting page ${i} of ${numPages}... ⏳`);
        const page = await pdfDoc.getPage(i);
        
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) continue;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        imagesList.push({ pageNumber: i, dataUrl });

        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        zip.file(`page_${i}.jpg`, base64Data, { base64: true });
      }

      setProgressText('Generating ZIP package... 📦');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      setZipDownloadUrl(zipUrl);
      setConvertedImages(imagesList);
      alert('PDF Successfully Converted to JPG Images! 🎉');
    } catch (error: any) {
      console.error('PDF to JPG Error:', error);
      alert(`Conversion mein error aaya: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
      setProgressText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <Link href="/" className="text-xs text-blue-400 hover:underline">
            ← Back to CareerSathi Home
          </Link>
        </div>

        <div className="text-center space-y-3">
          <span className="text-xs uppercase bg-purple-900 text-purple-300 font-bold px-3 py-1 rounded-full">
            100% Free & Secure Tool
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            PDF to JPG Converter - Extract Images Online
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Convert any PDF document pages into high-quality JPG images instantly inside your browser. No server uploads required.
          </p>
        </div>

        <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-8 cursor-pointer hover:border-purple-500 transition bg-slate-900/60">
            <span className="text-base font-bold text-purple-400">📄 Click to select or Drop a PDF file here</span>
            <span className="text-xs text-slate-500 mt-2">Select any standard PDF document</span>
            <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
          </label>

          {selectedFile && (
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs">
              <span className="font-medium text-slate-200">Selected File: <strong>{selectedFile.name}</strong></span>
              <button
                onClick={() => { setSelectedFile(null); setConvertedImages([]); setZipDownloadUrl(null); }}
                className="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-950/40 rounded"
              >
                Remove ✕
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={convertPdfToJpg}
              disabled={!selectedFile || isConverting || !isScriptLoaded}
              className={`w-full py-3.5 rounded-xl font-black text-sm shadow-lg transition ${
                !selectedFile || isConverting || !isScriptLoaded
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {!isScriptLoaded ? 'Loading Engine... ⏳' : isConverting ? (progressText || 'Converting PDF... ⏳') : 'Convert PDF to JPG Now 🚀'}
            </button>
          </div>

          {zipDownloadUrl && (
            <div className="p-5 bg-purple-950/60 border border-purple-600 rounded-xl text-center space-y-3 animate-fade-in">
              <div className="text-purple-300 font-bold text-sm">✅ All Pages Converted Successfully!</div>
              <a
                href={zipDownloadUrl}
                download="careersathi-pdf-images.zip"
                className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg transition"
              >
                Download All JPGs as ZIP 📥
              </a>
            </div>
          )}
        </div>

        {convertedImages.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Converted Pages Preview ({convertedImages.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-700">
              {convertedImages.map((img) => (
                <div key={img.pageNumber} className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col items-center space-y-2">
                  <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="h-32 w-full object-contain bg-white rounded" />
                  <span className="text-[11px] text-slate-300 font-medium">Page {img.pageNumber}</span>
                  <a
                    href={img.dataUrl}
                    download={`page_${img.pageNumber}.jpg`}
                    className="text-[10px] px-3 py-1 bg-slate-700 hover:bg-slate-600 text-purple-300 font-bold rounded"
                  >
                    Download JPG
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}