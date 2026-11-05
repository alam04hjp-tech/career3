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
      const { removeBackground } = await import('@imgly/background-removal');
      // isnet_fp16 = Best quality, fresh cut, no ear patch
      const blob = await removeBackground(file, {
        model: 'isnet_fp16',
        output: { format: 'image/png', quality: 1 }
      });
      setRes(URL.createObjectURL(blob));
    } catch(err:any){ alert(err.message) }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow w-full max-w-4xl">
      <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 w-full rounded" />
      {loading && <p className="text-center text-blue-600 font-bold mt-4">Best quality (isnet) me kaat raha hu... 15 sec</p>}
      <div className="grid grid-cols-2 gap-5 mt-6">
        {orig && <div><p>Original</p><img src={orig} className="w-full border rounded" /></div>}
        {res && <div><p>Result - Fresh</p><img src={res} className="w-full border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" /><a href={res} download="fresh.png" className="mt-3 block text-center bg-green-600 text-white py-2 rounded font-bold">Download HD</a></div>}
      </div>
    </div>
  );
}