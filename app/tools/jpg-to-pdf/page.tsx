'app/client'; // (Keep 'use client' at top)
'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

interface ImageFile {
  file: File;
  previewUrl: string;
}

export default function JpgToPdfLandingPage() {
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('careersathi-merged.pdf');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Customization States
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'FitImage'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(20);
  const [mergeIntoSinglePdf, setMergeIntoSinglePdf] = useState<boolean>(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      
      const newImages: ImageFile[] = filesArray.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      setSelectedImages(prev => [...prev, ...newImages]);
      setDownloadUrl(null);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
    setDownloadUrl(null);
  };

  const getImageBytesViaCanvas = (file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context failed'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            blob.arrayBuffer().then((buffer) => {
              resolve({
                bytes: new Uint8Array(buffer),
                width: img.width,
                height: img.height
              });
            });
          }, 'image/jpeg', 0.95);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const createPdfFromSingleImage = async (imgData: { bytes: Uint8Array; width: number; height: number }): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const embeddedImage = await pdfDoc.embedJpg(imgData.bytes);

    let pageWidth = 595.28;
    let pageHeight = 841.89;

    if (pageSize === 'Letter') {
      pageWidth = 612;
      pageHeight = 792;
    } else if (pageSize === 'FitImage') {
      pageWidth = imgData.width;
      pageHeight = imgData.height;
    }

    if (pageSize !== 'FitImage' && orientation === 'landscape') {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    if (pageSize === 'FitImage') {
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgData.width,
        height: imgData.height,
      });
    } else {
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);
      const imgDims = embeddedImage.scaleToFit(usableWidth, usableHeight);
      const x = margin + (usableWidth - imgDims.width) / 2;
      const y = margin + (usableHeight - imgDims.height) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imgDims.width,
        height: imgDims.height,
      });
    }

    return await pdfDoc.save();
  };

  const convertToPdf = async () => {
    if (selectedImages.length === 0) {
      alert('Kam se kam ek image select karo bhai!');
      return;
    }

    setIsConverting(true);
    try {
      if (mergeIntoSinglePdf) {
        // --- CASE 1: Merge all images into ONE single PDF ---
        const pdfDoc = await PDFDocument.create();

        for (const imgItem of selectedImages) {
          const imgData = await getImageBytesViaCanvas(imgItem.file);
          const embeddedImage = await pdfDoc.embedJpg(imgData.bytes);

          let pageWidth = 595.28;
          let pageHeight = 841.89;

          if (pageSize === 'Letter') {
            pageWidth = 612;
            pageHeight = 792;
          } else if (pageSize === 'FitImage') {
            pageWidth = imgData.width;
            pageHeight = imgData.height;
          }

          if (pageSize !== 'FitImage' && orientation === 'landscape') {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
          }

          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          if (pageSize === 'FitImage') {
            page.drawImage(embeddedImage, {
              x: 0,
              y: 0,
              width: imgData.width,
              height: imgData.height,
            });
          } else {
            const usableWidth = pageWidth - (margin * 2);
            const usableHeight = pageHeight - (margin * 2);
            const imgDims = embeddedImage.scaleToFit(usableWidth, usableHeight);
            const x = margin + (usableWidth - imgDims.width) / 2;
            const y = margin + (usableHeight - imgDims.height) / 2;

            page.drawImage(embeddedImage, {
              x,
              y,
              width: imgDims.width,
              height: imgDims.height,
            });
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFileName('careersathi-merged.pdf');
        setSuccessMessage('✅ All Images Merged into Single PDF Successfully!');

      } else {
        // --- CASE 2: Generate Separate PDFs for EACH image and download individually ---
        for (let i = 0; i < selectedImages.length; i++) {
          const imgItem = selectedImages[i];
          const imgData = await getImageBytesViaCanvas(imgItem.file);
          const singlePdfBytes = await createPdfFromSingleImage(imgData);

          const blob = new Blob([singlePdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          // Trigger automatic browser download for each file
          const a = document.createElement('a');
          a.href = url;
          const baseName = imgItem.file.name.substring(0, imgItem.file.name.lastIndexOf('.')) || `image_${i+1}`;
          a.download = `${baseName}-careersathi.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        setDownloadUrl(null); // No single main download button needed since files downloaded automatically
        setSuccessMessage('✅ All Separate PDFs downloaded successfully! 🎉');
        alert('Saari images ki alag-alag PDFs download ho gayi hain! 📥');
      }

    } catch (error: any) {
      console.error('PDF Conversion Error:', error);
      alert(`Conversion mein error aaya: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
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
          <span className="text-xs uppercase bg-emerald-900 text-emerald-300 font-bold px-3 py-1 rounded-full">
            Advanced Tool with Customization
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            JPG to PDF Converter & Merger
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Convert images to PDF with custom page size, orientation, margins, and separate/merge options instantly in your browser.
          </p>
        </div>

        {/* Customization Controls Panel */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as any)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
            >
              <option value="A4">A4 Standard</option>
              <option value="Letter">US Letter</option>
              <option value="FitImage">Fit to Image Size</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Orientation</label>
            <select
              value={orientation}
              disabled={pageSize === 'FitImage'}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium disabled:opacity-50"
            >
              <option value="portrait">Portrait 📄</option>
              <option value="landscape">Landscape 🖼️</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Margin Size</label>
            <select
              value={margin}
              disabled={pageSize === 'FitImage'}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium disabled:opacity-50"
            >
              <option value={0}>No Margin (0 pt)</option>
              <option value={20}>Small Margin (20 pt)</option>
              <option value={40}>Big Margin (40 pt)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Merge Preference</label>
            <div className="flex items-center h-10 bg-slate-900 px-3 border border-slate-700 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer text-emerald-400 font-bold">
                <input
                  type="checkbox"
                  checked={mergeIntoSinglePdf}
                  onChange={(e) => setMergeIntoSinglePdf(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-emerald-600 focus:ring-0"
                />
                Merge into 1 PDF
              </label>
            </div>
          </div>
        </div>

        {/* Upload Box */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-8 cursor-pointer hover:border-emerald-500 transition bg-slate-900/60">
            <span className="text-base font-bold text-emerald-400">📷 Drag & Drop Images here or Click to Browse</span>
            <span className="text-xs text-slate-500 mt-2">Select multiple JPG, JPEG or PNG files</span>
            <input type="file" multiple accept="image/jpeg, image/png, image/jpg" onChange={handleImageChange} className="hidden" />
          </label>

          {selectedImages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selected Images ({selectedImages.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-700">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative group bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col items-center">
                    <img src={img.previewUrl} alt="preview" className="h-20 w-full object-cover rounded mb-2" />
                    <span className="text-[11px] text-slate-300 truncate w-full text-center">{img.file.name}</span>
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-[10px] opacity-80 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              onClick={convertToPdf}
              disabled={selectedImages.length === 0 || isConverting}
              className={`flex-1 py-3.5 rounded-xl font-black text-sm shadow-lg transition ${
                selectedImages.length === 0 || isConverting
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isConverting ? 'Processing... ⏳' : 'Convert & Process Now 🚀'}
            </button>

            {selectedImages.length > 0 && (
              <button
                onClick={() => setSelectedImages([])}
                className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Single PDF Download Button */}
          {downloadUrl && mergeIntoSinglePdf && (
            <div className="p-5 bg-emerald-950/60 border border-emerald-600 rounded-xl text-center space-y-3 animate-fade-in">
              <div className="text-emerald-400 font-bold text-sm">{successMessage || '✅ Your File is Ready!'}</div>
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition"
              >
                Download Merged PDF 📥
              </a>
            </div>
          )}

          {/* Separate PDFs Success Message */}
          {!mergeIntoSinglePdf && successMessage && !isConverting && selectedImages.length > 0 && (
            <div className="p-5 bg-emerald-950/60 border border-emerald-600 rounded-xl text-center space-y-2 animate-fade-in">
              <div className="text-emerald-400 font-bold text-sm">{successMessage}</div>
              <p className="text-xs text-slate-400">Sabhi files alag-alag PDF ke roop mein aapke device par download ho chuki hain.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}