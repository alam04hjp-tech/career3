"use client";
import dynamic from 'next/dynamic';
const BgRemover = dynamic(() => import('./BgRemover'), { ssr: false });

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-5">
      <h1 className="text-2xl font-bold mb-2">HD Background Remover - RMBG 2.0</h1>
      <p className="text-sm text-gray-600 mb-5">sarkariresultportal jaisi 100% fresh quality</p>
      <BgRemover />
    </div>
  );
}