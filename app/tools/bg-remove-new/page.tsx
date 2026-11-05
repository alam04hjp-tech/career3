"use client";
import { useState } from 'react';

export default function BgRemoveNew() {
  const [orig, setOrig] = useState<string | null>(null);
  const [res, setRes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if(!file) return;
    setOrig(URL.createObjectURL(file));
    setLoading(true);
    const { removeBackground } = await import('@imgly/background-removal');
    // isnet = sarkariresultportal jaisi best quality
    const blob = await removeBackground(file, { 
      model: 'isnet_fp16', 
      output: { format: 'image/png', quality: 1 } 
    });
    setRes(URL.createObjectURL(blob));
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 flex flex-col items-center">
      <h1 className="font-bold text-xl mb-4">HD Background Remover - Best Quality</h1>
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-3xl">
        <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 w-full rounded" />
        {loading && <p className="text-blue-600 text-center mt-3 font-bold">Best quality me kaat raha hu... 15 sec lagega</p>}
        <div className="grid grid-cols-2 gap-4 mt-5">
          {orig && <div><p>Original</p><img src={orig} className="border rounded" /></div>}
          {res && <div><p>Result</p><img src={res} className="border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" /><a href={res} download="hd.png" className="bg-green-600 text-white block text-center py-2 rounded mt-2">Download HD PNG</a></div>}
        </div>
      </div>
    </div>
  );
}