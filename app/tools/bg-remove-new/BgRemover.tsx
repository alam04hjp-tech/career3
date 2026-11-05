"use client";
import { useState } from 'react';

export default function BgRemover() {
  const [orig, setOrig] = useState<string|null>(null);
  const [res, setRes] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e:any) => {
    const file = e.target.files[0];
    if(!file) return;
    setOrig(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { env, pipeline } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      // RMBG-1.4 = Best stable model for Next.js 13
      const segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', { device: 'wasm' });
      const out = await segmenter(URL.createObjectURL(file));
      const mask = out[0].mask;
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise(r=> image.onload = r);
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image,0,0);
      const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width; maskCanvas.height = canvas.height;
      const mCtx = maskCanvas.getContext('2d')!;
      mCtx.drawImage(mask.toCanvas(),0,0,canvas.width,canvas.height);
      const mData = mCtx.getImageData(0,0,canvas.width,canvas.height);
      for(let i=0;i<mData.data.length;i+=4){
        imgData.data[i+3] = mData.data[i];
      }
      ctx.putImageData(imgData,0,0);
      setRes(canvas.toDataURL('image/png'));
    } catch(err:any){ alert(err.message) }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow w-full max-w-4xl">
      <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 w-full rounded" />
      {loading && <p className="text-center text-blue-600 font-bold mt-4">Fresh HD me kaat raha hu... 10 sec</p>}
      <div className="grid grid-cols-2 gap-5 mt-6">
        {orig && <div><p className="font-bold">Original</p><img src={orig} className="w-full border rounded" /></div>}
        {res && <div><p className="font-bold">Result - No Patch</p><img src={res} className="w-full border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" /><a href={res} download="fresh.png" className="mt-3 block text-center bg-green-600 text-white py-2 rounded font-bold">Download</a></div>}
      </div>
    </div>
  );
}