"use client";
import { useState } from 'react';

export default function BgRemoveNew() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalUrl(URL.createObjectURL(file));
    setLoading(true);
    setResultUrl(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/remove-bg', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('fail');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err) {
      alert('Background remove fail, dobara try karo');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-5">
      <h1 className="text-2xl font-bold mb-5">Background Remover - Apna Model</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleUpload}
          className="block w-full border p-2 rounded mb-5"
        />

        {loading && <p className="text-center text-blue-600 font-semibold">Background hata raha hu... 6-8 sec lagega pehli baar</p>}

        <div className="grid grid-cols-2 gap-5 mt-5">
          {originalUrl && (
            <div>
              <p className="font-semibold">Original</p>
              <img src={originalUrl} alt="original" className="w-full border rounded" />
            </div>
          )}
          {resultUrl && (
            <div>
              <p className="font-semibold">Result (Transparent)</p>
              <img src={resultUrl} alt="result" className="w-full border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" />
              <a href={resultUrl} download="no-bg.png" className="mt-3 block text-center bg-blue-600 text-white py-2 rounded">
                Download PNG
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}