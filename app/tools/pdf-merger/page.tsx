'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

export default function PdfMergerLandingPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setDownloadUrl(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
  };

  const mergePdfs = async () => {
    if (selectedFiles.length < 2) {
      alert('Kam se kam 2 PDF files select karo bhai!');
      return;
    }

    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      alert('PDF Successfully Merged! 🎉');
    } catch (error) {
      console.error(error);
      alert('PDF merge karne mein kuch error aaya. Dubara try karo.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Breadcrumb / Back */}
        <div>
          <Link href="/" className="text-xs text-blue-400 hover:underline">
            ← Back to CareerSathi Home
          </Link>
        </div>

        {/* SEO Optimized H1 Header */}
        <div className="text-center space-y-3">
          <span className="text-xs uppercase bg-blue-900 text-blue-300 font-bold px-3 py-1 rounded-full">
            100% Free & Secure Tool
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Free PDF Merger - Combine PDF Files Online
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Merge multiple PDF documents instantly right inside your browser. No server uploads, no registration, and 100% safe for your marksheets and government form documents.
          </p>
        </div>

        {/* Tool Box */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 transition bg-slate-900/60">
            <span className="text-base font-bold text-blue-400">📁 Drag & Drop PDF files here or Click to Browse</span>
            <span className="text-xs text-slate-500 mt-2">Select 2 or more PDF files from your device</span>
            <input type="file" multiple accept="application/pdf" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selected Files for Merging ({selectedFiles.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[80%]">📄 {file.name}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-950/40 rounded"
                    >
                      Remove ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              onClick={mergePdfs}
              disabled={selectedFiles.length < 2 || isMerging}
              className={`flex-1 py-3.5 rounded-xl font-black text-sm shadow-lg transition ${
                selectedFiles.length < 2 || isMerging
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMerging ? 'Merging PDFs... ⏳' : 'Merge PDFs Now 🚀'}
            </button>

            {selectedFiles.length > 0 && (
              <button
                onClick={() => { setSelectedFiles([]); setDownloadUrl(null); }}
                className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Download Link */}
          {downloadUrl && (
            <div className="p-5 bg-emerald-950/60 border border-emerald-600 rounded-xl text-center space-y-3 animate-fade-in">
              <div className="text-emerald-400 font-bold text-sm">✅ Your Merged PDF is Ready to Download!</div>
              <a
                href={downloadUrl}
                download="careersathi-merged.pdf"
                className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition"
              >
                Download Merged PDF 📥
              </a>
            </div>
          )}
        </div>

        {/* SEO Content Section (Google ke liye text) */}
        <div className="bg-slate-800/60 p-6 md:p-8 rounded-2xl border border-slate-700/80 space-y-4 text-sm text-slate-300">
          <h2 className="text-xl font-bold text-white">How to Combine PDF Files Online on CareerSathi</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-400">
            <li>Click on the file selection box and choose your PDF documents (e.g., Marksheet, ID Proof).</li>
            <li>Verify your selected files list in the order you want them combined.</li>
            <li>Click on the <strong>Merge PDFs Now</strong> button.</li>
            <li>Download your single combined PDF file instantly to your mobile or PC.</li>
          </ol>

          <h3 className="text-lg font-bold text-white pt-4">Why use CareerSathi PDF Combiner for Sarkari Forms?</h3>
          <p className="text-slate-400">
            When filling out online application forms for SSC, UPSC, Banking, or State Board exams, students often need to merge multiple documents into a single file under a specific size limit. Our tool processes everything locally in your browser, ensuring complete privacy of your educational certificates.
          </p>
        </div>

        {/* FAQ Section for Google SEO / Rich Snippets */}
        <div className="bg-slate-800/60 p-6 md:p-8 rounded-2xl border border-slate-700/80 space-y-4">
          <h3 className="text-xl font-bold text-white">Frequently Asked Questions (FAQs)</h3>
          
          <div className="space-y-3 text-sm">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div className="font-bold text-blue-400">Q. Is this PDF Merger tool completely free?</div>
              <div className="text-slate-400 mt-1">Ans. Yes, CareerSathi PDF merger is 100% free with no hidden charges or watermarks.</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div className="font-bold text-blue-400">Q. Are my personal documents safe?</div>
              <div className="text-slate-400 mt-1">Ans. Absolutely! Your files never leave your device because processing happens entirely inside your browser.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}