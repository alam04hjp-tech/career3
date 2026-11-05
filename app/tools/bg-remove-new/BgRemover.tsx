"use client";
import { useState } from 'react';

export default function BgRemover() {
  const [orig, setOrig] = useState<string | null>(null);
  const [res, setRes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setOrig(URL.createObjectURL(file));
    setLoading(true);
    setMsg("RMBG-2.0 (Best Model) download ho raha hai - pehli baar 2 min lagega");
    setRes(null);

    try {
      const { env, AutoModel, AutoProcessor, RawImage } = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const model = await AutoModel.from_pretrained('briaai/RMBG-2.0', { dtype: 'fp32' });
      const processor = await AutoProcessor.from_pretrained('briaai/RMBG-2.0');

      setMsg("HD me kaan, baal ka edge kaat raha hu...");
      const image = await RawImage.fromURL(URL.createObjectURL(file));
      const { pixel_values } = await processor(image);
      const { output } = await model({ input: pixel_values });
      
      const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image.toCanvas(), 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < mask.data.length; i++) {
        imgData.data[i*4+3] = mask.data[i];
      }
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob(b => {
        if(b) setRes(URL.createObjectURL(b));
        setLoading(false); setMsg("");
      }, 'image/png');

    } catch (err:any) { setLoading(false); alert(err.message); }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow w-full max-w-4xl">
      <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 w-full rounded" />
      {loading && <p className="text-center text-blue-600 font-bold mt-4 animate-pulse">{msg}</p>}
      <div className="grid grid-cols-2 gap-5 mt-6">
        {orig && <div><p className="font-bold">Original</p><img src={orig} className="w-full border rounded" /></div>}
        {res && <div><p className="font-bold">Result - RMBG 2.0 (No Patch)</p><img src={res} className="w-full border rounded bg-[url('https://i.imgur.com/8Km9tLL.png')]" /><a href={res} download="fresh-hd.png" className="mt-3 block text-center bg-green-600 text-white py-2 rounded font-bold">Download Fresh PNG</a></div>}
      </div>
    </div>
  );
}