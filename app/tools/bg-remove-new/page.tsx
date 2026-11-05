"use client";
import { useState } from 'react';
import { AutoModel, AutoProcessor, env, RawImage } from '@huggingface/transformers';

// Model browser cache me rahega
env.allowLocalModels = false;
env.useBrowserCache = true;

export default function BgRemoveNew() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalUrl(URL.createObjectURL(file));
    setLoading(true);
    setStatus("Best model (RMBG-1.4) load ho raha hai... pehli baar 150MB lagega");
    
    try {
      // sarkariresultportal wala hi model
      const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        dtype: 'fp32',
      });
      const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
      
      setStatus("Background hata raha hu... HD quality");
      const image = await RawImage.fromURL(URL.createObjectURL(file));
      const { pixel_values } = await processor(image);
      const { output } = await model({ input: pixel_values });
      
      const maskData = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);
      
      // Canvas pe original + mask se transparent PNG banao
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image.toCanvas(), 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < maskData.data.length; i++) {
        imgData.data[i * 4 + 3] = maskData.data[i]; // alpha set
      }
      ctx.putImageData(imgData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
        setLoading(false);
        setStatus("");
      }, 'image/png');

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Error: ' + err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-5">
      <h1 className="text-xl font-bold mb-3">Background Remover - RMBG 1.4 (HD)</h1>
      <p className="text-sm text-gray-600 mb-4">sarkariresultportal jaisi quality</p>
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
        <input type="file" accept="image/*" onChange={handleUpload} className="block w-full border p-2 rounded mb-5" />
        {loading && <p className="text-center text-blue-600 font-semibold animate-pulse">{status}</p>}
        <div className="grid grid-cols-2 gap-5 mt-5">
          {originalUrl && <div><p className="font-semibold">Original</p><img src={originalUrl} className="w-full border rounded" /></div>}
          {resultUrl && <div><p className="font-semibold">Result - Clean Edge</p><img src={resultUrl} className="w-full border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" /><a href={resultUrl} download="hd-no-bg.png" className="mt-3 block text-center bg-green-600 text-white py-2 rounded">Download HD PNG</a></div>}
        </div>
      </div>
    </div>
  );
}