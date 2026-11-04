'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SectionStat {
  name: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: string;
  marks: number;
  maxMarks: number;
}

interface CandidateInfo {
  rollNumber: string;
  candidateName: string;
  venueName: string;
  examDate: string;
  examTime: string;
  subject: string;
}

interface ScorecardResult {
  candidate: CandidateInfo;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  positiveMarks: number;
  negativeMarks: number;
  finalScore: number;
  maxMarks: number;
  accuracy: string;
  estimatedRank: string;
  subjectBreakdown: SectionStat[];
}

export default function AnswerKeyAnalyzer() {
  const [responseUrl, setResponseUrl] = useState('');
  const [positivePerQ, setPositivePerQ] = useState<number>(2);
  const [negativePerQ, setNegativePerQ] = useState<number>(0.5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Decodes Base64 Data-URI returned by AllOrigins for large Digialm HTML files
  const decodeBase64Html = (contents: string): string => {
    if (!contents) return '';
    if (contents.startsWith('data:') && contents.includes('base64,')) {
      try {
        const base64 = contents.split('base64,')[1].trim();
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
      } catch {
        return contents;
      }
    }
    return contents;
  };

  const raceToFirstValid = <T,>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      let failedCount = 0;
      const total = promises.length;
      if (total === 0) return reject(new Error('No fetchers'));

      promises.forEach((p) => {
        p.then(resolve).catch(() => {
          failedCount++;
          if (failedCount === total) reject(new Error('All fetchers failed'));
        });
      });
    });
  };

  const fetchHtmlFromUrl = async (rawUrl: string): Promise<string> => {
    const cleanUrl = rawUrl.trim().split('#')[0].trim();
    const cdnUrl = cleanUrl.replace('://ssc.digialm.com', '://cdn.digialm.com');
    const singleSlashUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
    const urlVariants = Array.from(new Set([cleanUrl, cdnUrl, singleSlashUrl]));

    const validateHtml = (html: string) => {
      const decoded = decodeBase64Html(html);
      if (!decoded || !decoded.includes('question-pnl')) {
        throw new Error('Invalid Digialm HTML');
      }
      return decoded;
    };

    // 1. First try our Next.js Server API Route (/api/fetch-answer-key)
    const apiPromise = fetch('/api/fetch-answer-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('API route failed');
        const data = await res.json();
        return validateHtml(data?.html || '');
      });

    // 2. Also race client-side Cloudflare/Jina/AllOrigins relays
    const clientAttempts: Promise<string>[] = [apiPromise];

    urlVariants.forEach((targetUrl) => {
      const encoded = encodeURIComponent(targetUrl);

      // Cloudflare Edge Proxy (Runs from nearest Indian Cloudflare edge)
      clientAttempts.push(
        fetch(`https://api.cors.lol/?url=${encoded}`)
          .then((r) => {
            if (!r.ok) throw new Error('Failed');
            return r.text();
          })
          .then(validateHtml)
      );

      // Jina Headless HTML Reader
      clientAttempts.push(
        fetch(`https://r.jina.ai/${targetUrl}`, {
          headers: { 'X-Return-Format': 'html' },
        })
          .then((r) => {
            if (!r.ok) throw new Error('Failed');
            return r.text();
          })
          .then(validateHtml)
      );

      // AllOrigins JSON with Base64 Data-URI Decoder
      clientAttempts.push(
        fetch(`https://api.allorigins.win/get?url=${encoded}`)
          .then((r) => {
            if (!r.ok) throw new Error('Failed');
            return r.json();
          })
          .then((data) => validateHtml(data?.contents || ''))
      );

      // AllOrigins Raw
      clientAttempts.push(
        fetch(`https://api.allorigins.win/raw?url=${encoded}`)
          .then((r) => {
            if (!r.ok) throw new Error('Failed');
            return r.text();
          })
          .then(validateHtml)
      );

      // CodeTabs Proxy
      clientAttempts.push(
        fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`)
          .then((r) => {
            if (!r.ok) throw new Error('Failed');
            return r.text();
          })
          .then(validateHtml)
      );
    });

    try {
      return await raceToFirstValid(clientAttempts);
    } catch {
      throw new Error(
        'Digialm ka firewall (WAF) StackBlitz browser proxy ko block kar raha hai ya yeh URL expire (404) ho chuka hai. Niche "Upload .html File" button se ya URL ko naye tab mein check karein.'
      );
    }
  };

  // Core parser for TCS iON / Digialm HTML
  const parseDigialmHtml = (htmlString: string, posMark: number, negMark: number): ScorecardResult => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const candidate: CandidateInfo = {
      rollNumber: 'N/A',
      candidateName: 'Candidate',
      venueName: 'N/A',
      examDate: 'N/A',
      examTime: 'N/A',
      subject: 'SSC / RRB Examination',
    };

    const infoRows = doc.querySelectorAll('.main-info-pnl tr, .main-info-tbl tr');
    infoRows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) {
        const label = (tds[0].textContent || '').trim().toLowerCase();
        const value = (tds[tds.length - 1].textContent || '').trim();
        if (label.includes('roll number') || label.includes('roll no')) candidate.rollNumber = value;
        else if (label.includes('candidate name') || label.includes('participant name')) candidate.candidateName = value;
        else if (label.includes('venue name') || label.includes('test center')) candidate.venueName = value;
        else if (label.includes('exam date') || label.includes('test date')) candidate.examDate = value;
        else if (label.includes('exam time') || label.includes('test time')) candidate.examTime = value;
        else if (label.includes('subject')) candidate.subject = value;
      }
    });

    const evaluateQuestionPanel = (panel: Element) => {
      let chosenOption = '';
      const menuRows = panel.querySelectorAll('.menu-tbl tr');
      menuRows.forEach((tr) => {
        const rowText = (tr.textContent || '').trim();
        if (rowText.includes('Chosen Option')) {
          const tds = tr.querySelectorAll('td');
          if (tds.length > 0) {
            chosenOption = (tds[tds.length - 1].textContent || '').trim();
          }
        }
      });

      if (!chosenOption) {
        const menuText = panel.querySelector('.menu-tbl')?.textContent || '';
        const chosenMatch = menuText.match(/Chosen Option\s*:\s*([1-4]|--)/i);
        if (chosenMatch) chosenOption = chosenMatch[1].trim();
      }

      let rightOption = '';
      const rightAnsEl = panel.querySelector('.rightAns');
      if (rightAnsEl) {
        const rightText = (rightAnsEl.textContent || '').trim();
        const match = rightText.match(/^[✓✔\s]*([1-4])\s*\./) || rightText.match(/^([1-4])/);
        if (match) {
          rightOption = match[1];
        }
      }

      if (!rightOption) {
        const optionCells = panel.querySelectorAll('.rightAns, .wrngAns');
        optionCells.forEach((cell, idx) => {
          if (cell.classList.contains('rightAns')) {
            rightOption = String(idx + 1);
          }
        });
      }

      const isAttempted = /^[1-4]$/.test(chosenOption);
      if (!isAttempted) return 'unattempted';
      if (chosenOption === rightOption) return 'correct';
      return 'incorrect';
    };

    const sectionContainers = doc.querySelectorAll('.section-cntnr');
    const subjectBreakdown: SectionStat[] = [];

    let totalQuestions = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;

    if (sectionContainers.length > 0) {
      sectionContainers.forEach((secEl, secIdx) => {
        const lblBold = secEl.querySelector('.section-lbl .bold');
        const rawLbl = secEl.querySelector('.section-lbl')?.textContent || '';
        const sectionName =
          lblBold?.textContent?.trim() ||
          rawLbl.replace(/Section\s*:\s*/i, '').trim() ||
          `Section ${secIdx + 1}`;

        const panels = secEl.querySelectorAll('.question-pnl');
        let secCorrect = 0;
        let secIncorrect = 0;
        let secUnattempted = 0;

        panels.forEach((panel) => {
          const status = evaluateQuestionPanel(panel);
          if (status === 'correct') secCorrect++;
          else if (status === 'incorrect') secIncorrect++;
          else secUnattempted++;
        });

        const secTotal = panels.length;
        const secAttempted = secCorrect + secIncorrect;
        const secMarks = Number(((secCorrect * posMark) - (secIncorrect * negMark)).toFixed(2));
        const secAccuracy =
          secAttempted > 0 ? `${((secCorrect / secAttempted) * 100).toFixed(1)}%` : '0%';

        subjectBreakdown.push({
          name: sectionName,
          totalQuestions: secTotal,
          attempted: secAttempted,
          correct: secCorrect,
          incorrect: secIncorrect,
          unattempted: secUnattempted,
          accuracy: secAccuracy,
          marks: secMarks,
          maxMarks: secTotal * posMark,
        });

        totalQuestions += secTotal;
        totalAttempted += secAttempted;
        totalCorrect += secCorrect;
        totalIncorrect += secIncorrect;
        totalUnattempted += secUnattempted;
      });
    } else {
      const allPanels = doc.querySelectorAll('.question-pnl');
      if (allPanels.length === 0) {
        throw new Error('Response sheet mein questions (.question-pnl) nahi mile.');
      }

      allPanels.forEach((panel) => {
        const status = evaluateQuestionPanel(panel);
        if (status === 'correct') totalCorrect++;
        else if (status === 'incorrect') totalIncorrect++;
        else totalUnattempted++;
      });

      totalQuestions = allPanels.length;
      totalAttempted = totalCorrect + totalIncorrect;

      subjectBreakdown.push({
        name: 'Overall Paper',
        totalQuestions,
        attempted: totalAttempted,
        correct: totalCorrect,
        incorrect: totalIncorrect,
        unattempted: totalUnattempted,
        accuracy:
          totalAttempted > 0 ? `${((totalCorrect / totalAttempted) * 100).toFixed(1)}%` : '0%',
        marks: Number(((totalCorrect * posMark) - (totalIncorrect * negMark)).toFixed(2)),
        maxMarks: totalQuestions * posMark,
      });
    }

    const positiveMarks = Number((totalCorrect * posMark).toFixed(2));
    const negativeMarks = Number((totalIncorrect * negMark).toFixed(2));
    const finalScore = Number((positiveMarks - negativeMarks).toFixed(2));
    const maxMarks = totalQuestions * posMark;
    const accuracyNum = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
    const scorePercent = maxMarks > 0 ? (finalScore / maxMarks) * 100 : 0;

    let estimatedRank = 'Needs Improvement';
    if (scorePercent >= 80) estimatedRank = 'Top 2% (98+ Percentile 🔥)';
    else if (scorePercent >= 70) estimatedRank = 'Top 8% (Safe Selection Zone ✅)';
    else if (scorePercent >= 60) estimatedRank = 'Top 18% (Borderline / Competitive ⚡)';
    else if (scorePercent >= 45) estimatedRank = 'Top 35% (Moderate Score)';

    return {
      candidate,
      totalQuestions,
      attempted: totalAttempted,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      unattempted: totalUnattempted,
      positiveMarks,
      negativeMarks,
      finalScore,
      maxMarks,
      accuracy: `${accuracyNum.toFixed(1)}%`,
      estimatedRank,
      subjectBreakdown,
    };
  };

  const analyzeResponseSheet = async () => {
    const trimmed = responseUrl.trim();
    if (!trimmed) {
      alert('Kripya apni Answer Key ka URL daalein.');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setErrorMsg('');

    try {
      let htmlContent = '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        htmlContent = await fetchHtmlFromUrl(trimmed);
      } else if (trimmed.includes('question-pnl')) {
        htmlContent = trimmed;
      } else {
        throw new Error('Kripya valid https://ssc.digialm.com/... URL daalein.');
      }

      const parsedData = parseDigialmHtml(htmlContent, positivePerQ, negativePerQ);
      setResult(parsedData);
    } catch (err: any) {
      setErrorMsg(err.message || 'URL parse karne mein error aaya.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Instant Local .html File Upload Handler (Bypasses all StackBlitz CORS/WAF limits)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const htmlContent = String(event.target?.result || '');
        const parsedData = parseDigialmHtml(htmlContent, positivePerQ, negativePerQ);
        setResult(parsedData);
      } catch (err: any) {
        setErrorMsg(err.message || 'Uploaded HTML file valid Digialm sheet nahi hai.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            ← Back to Home
          </Link>
          <h1 className="text-base sm:text-xl font-black text-white">
            ⚡ SSC &amp; RRB Answer Key Score Calculator (By URL)
          </h1>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
          100% Real Digialm URL Parser 🚀
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Input Box Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white">
                Apni Official Answer Key ka URL Paste Karein
              </h2>
              <p className="text-xs text-slate-400">
                TCS iON / Digialm (SSC CGL, CHSL, GD, MTS, RRB NTPC, ALP) ka response sheet link niche daalein:
              </p>
            </div>
            {responseUrl.startsWith('http') && (
              <a
                href={responseUrl.trim().split('#')[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:underline whitespace-nowrap"
              >
                🔗 Check URL in New Tab ↗
              </a>
            )}
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={responseUrl}
              onChange={(e) => setResponseUrl(e.target.value)}
              placeholder="https://ssc.digialm.com//per/g27/pub/... (Paste Answer Key URL here)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            {/* Marking Scheme Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/80 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Correct Answer (+Marks)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={positivePerQ}
                  onChange={(e) => setPositivePerQ(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Negative Marking (-Marks)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={negativePerQ}
                  onChange={(e) => setNegativePerQ(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-red-400 font-bold"
                />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPositivePerQ(2);
                    setNegativePerQ(0.5);
                  }}
                  className={`px-3 py-2 rounded-lg font-bold border transition ${
                    positivePerQ === 2 && negativePerQ === 0.5
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  SSC (+2 / -0.5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPositivePerQ(1);
                    setNegativePerQ(0.33);
                  }}
                  className={`px-3 py-2 rounded-lg font-bold border transition ${
                    positivePerQ === 1 && negativePerQ === 0.33
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Railway (+1 / -0.33)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold p-3.5 rounded-xl space-y-2">
                <div>⚠️ {errorMsg}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={analyzeResponseSheet}
                disabled={isAnalyzing}
                className="flex-1 py-3.5 rounded-xl font-black text-sm transition shadow-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white cursor-pointer shadow-blue-600/20"
              >
                {isAnalyzing
                  ? 'Fetching URL & Calculating Exact Scorecard... 🔍'
                  : 'Check My Score & Section-Wise Marks 📊'}
              </button>

              {/* Secondary 1-Click HTML File Upload (Useful if Digialm link is saved offline) */}
              <label className="py-3.5 px-5 rounded-xl font-bold text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer flex items-center justify-center gap-2 border border-slate-600 transition">
                <span>📂 Or Upload Saved .HTML Sheet</span>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className="space-y-6">
            {/* Candidate Info Banner */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md">
                    {result.candidate.subject}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">
                    {result.candidate.candidateName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Roll No: <strong className="text-slate-200">{result.candidate.rollNumber}</strong> | Exam Date:{' '}
                    <strong className="text-slate-200">{result.candidate.examDate}</strong> ({result.candidate.examTime})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Venue: {result.candidate.venueName}
                  </p>
                </div>

                <div className="bg-slate-900 border border-emerald-500/40 px-6 py-4 rounded-2xl text-right self-stretch md:self-auto flex flex-col justify-center">
                  <div className="text-xs text-slate-400 uppercase font-bold">Final Raw Score</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                    {result.finalScore}{' '}
                    <span className="text-base font-normal text-slate-400">/ {result.maxMarks}</span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold mt-1">
                    {result.estimatedRank}
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-center">
                  <div className="text-[11px] text-slate-400">Attempted</div>
                  <div className="text-lg font-black text-white mt-1">
                    {result.attempted} / {result.totalQuestions}
                  </div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-center">
                  <div className="text-[11px] text-slate-400">Correct (+{result.positiveMarks})</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">{result.correct} ✓</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-center">
                  <div className="text-[11px] text-slate-400">Wrong (-{result.negativeMarks})</div>
                  <div className="text-lg font-black text-red-400 mt-1">{result.incorrect} ✕</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-center">
                  <div className="text-[11px] text-slate-400">Unattempted</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{result.unattempted}</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400">Accuracy</div>
                  <div className="text-lg font-black text-blue-400 mt-1">{result.accuracy}</div>
                </div>
              </div>
            </div>

            {/* Section-Wise Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 overflow-x-auto">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                📋 Subject-Wise Detailed Scorecard
              </h4>

              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 bg-slate-900/60">
                    <th className="py-3 px-4 rounded-tl-lg">Subject / Section</th>
                    <th className="py-3 px-3 text-center">Total Qs</th>
                    <th className="py-3 px-3 text-center">Attempted</th>
                    <th className="py-3 px-3 text-center text-emerald-400">Correct</th>
                    <th className="py-3 px-3 text-center text-red-400">Wrong</th>
                    <th className="py-3 px-3 text-center text-amber-400">Skipped</th>
                    <th className="py-3 px-3 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right rounded-tr-lg">Net Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {result.subjectBreakdown.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{sub.name}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300">{sub.totalQuestions}</td>
                      <td className="py-3.5 px-3 text-center font-semibold text-white">{sub.attempted}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-400">{sub.correct}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-red-400">{sub.incorrect}</td>
                      <td className="py-3.5 px-3 text-center text-amber-400">{sub.unattempted}</td>
                      <td className="py-3.5 px-3 text-center text-blue-300 font-semibold">{sub.accuracy}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                        {sub.marks} <span className="text-[11px] font-normal text-slate-500">/ {sub.maxMarks}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 bg-slate-900/90 font-black text-white">
                    <td className="py-3.5 px-4">TOTAL</td>
                    <td className="py-3.5 px-3 text-center">{result.totalQuestions}</td>
                    <td className="py-3.5 px-3 text-center">{result.attempted}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-400">{result.correct}</td>
                    <td className="py-3.5 px-3 text-center text-red-400">{result.incorrect}</td>
                    <td className="py-3.5 px-3 text-center text-amber-400">{result.unattempted}</td>
                    <td className="py-3.5 px-3 text-center text-blue-400">{result.accuracy}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 text-base">
                      {result.finalScore} / {result.maxMarks}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-4 text-center text-xs text-slate-500">
        CareerSathi AI Suite — Empowering Indian Students with Instant Exam Results.
      </footer>
    </div>
  );
}