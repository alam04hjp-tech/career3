// File: app/mock-tests/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// ==========================================
// 1. DATA INTERFACES (SYNCED WITH ADMIN STUDIO)
// ==========================================
interface Question {
  id: string;
  section?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  questionTextHi?: string;
  imageUrl?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
}

interface MockTest {
  id: string;
  slug: string;
  title?: string;
  testTitle: string;
  category: string;
  examCategory?: string;
  duration?: number;
  totalTimeMinutes: number;
  positiveMarksPerQ?: number;
  negativeMarksPerQ?: number;
  totalMarks?: number;
  isFree?: boolean;
  isIndexed?: boolean;
  seoIntro?: string;
  questions: Question[];
  publishedAt: string;
}

type QuestionStatus =
  | 'not-visited'
  | 'not-answered'
  | 'answered'
  | 'marked'
  | 'answered-marked';

type ExamStage =
  | 'general-instructions'
  | 'specific-instructions'
  | 'exam-live'
  | 'result-analysis';

export default function TakeMockTestPage() {
  const params = useParams();
  const testSlug = params?.slug as string;

  // ==========================================
  // 2. CORE EXAM STATES
  // ==========================================
  const [test, setTest] = useState<MockTest | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Flow Stages: Step 1 (General) -> Step 2 (Important + Declaration) -> Step 3 (Live CBT) -> Step 4 (Result)
  const [stage, setStage] = useState<ExamStage>('general-instructions');
  const [instLang, setInstLang] = useState<'HI' | 'EN'>('HI');
  const [defaultLang, setDefaultLang] = useState<'English' | 'Hindi' | ''>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Live CBT States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [viewLang, setViewLang] = useState<'English' | 'Hindi'>('English');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number }>({});
  const [qStatuses, setQStatuses] = useState<{ [qIdx: number]: QuestionStatus }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDurationSecs, setTotalDurationSecs] = useState(0);

  // Modals & Mobile Palette Drawer
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [solutionFilter, setSolutionFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNATTEMPTED'>('ALL');

  // ==========================================
  // 3. LOAD MOCK TEST FROM LOCALSTORAGE
  // ==========================================
  useEffect(() => {
    try {
      const savedTests: MockTest[] = JSON.parse(localStorage.getItem('careersathi_mock_tests') || '[]');
      const found = savedTests.find((t) => t.slug === testSlug);
      if (found && Array.isArray(found.questions) && found.questions.length > 0) {
        setTest(found);
        const mins = Number(found.totalTimeMinutes || found.duration || 60);
        setTimeLeft(mins * 60);
        setTotalDurationSecs(mins * 60);

        const initialStatuses: { [qIdx: number]: QuestionStatus } = {};
        found.questions.forEach((_, idx) => {
          initialStatuses[idx] = idx === 0 ? 'not-answered' : 'not-visited';
        });
        setQStatuses(initialStatuses);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, [testSlug]);

  // ==========================================
  // 4. LIVE COUNTDOWN TIMER (RUNS ONLY IN 'exam-live')
  // ==========================================
  useEffect(() => {
    if (!test || stage !== 'exam-live' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStage('result-analysis');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, stage, timeLeft]);

  // Extract unique sections from questions
  const sections = useMemo(() => {
    if (!test) return ['General Section'];
    const list: string[] = [];
    test.questions.forEach((q) => {
      const secName = q.section?.trim() || 'General Section';
      if (!list.includes(secName)) list.push(secName);
    });
    return list;
  }, [test]);

  const currentQuestion = test?.questions[currentQIndex];
  const currentSection = currentQuestion?.section?.trim() || 'General Section';
  const posMark = Number(test?.positiveMarksPerQ ?? 2);
  const negMark = Number(test?.negativeMarksPerQ ?? 0.5);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ==========================================
  // 5. TCS iON NAVIGATION & PALETTE HANDLERS
  // ==========================================
  const jumpToQuestion = (targetIdx: number) => {
    if (!test) return;
    setQStatuses((prev) => {
      const updated = { ...prev };
      // Update current question if it was still 'not-visited'
      if (updated[currentQIndex] === 'not-visited') {
        updated[currentQIndex] = selectedAnswers[currentQIndex] !== undefined ? 'answered' : 'not-answered';
      }
      // Mark target question as 'not-answered' if visiting for first time
      if (updated[targetIdx] === 'not-visited') {
        updated[targetIdx] = 'not-answered';
      }
      return updated;
    });
    setCurrentQIndex(targetIdx);
    setMobilePaletteOpen(false);
  };

  const handleOptionSelect = (optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optIdx }));
  };

  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQIndex];
      return copy;
    });
    setQStatuses((prev) => ({
      ...prev,
      [currentQIndex]: 'not-answered',
    }));
  };

  const handleSaveAndNext = () => {
    if (!test) return;
    const hasAns = selectedAnswers[currentQIndex] !== undefined;
    const nextIdx = currentQIndex < test.questions.length - 1 ? currentQIndex + 1 : 0;

    setQStatuses((prev) => {
      const updated = { ...prev };
      updated[currentQIndex] = hasAns ? 'answered' : 'not-answered';
      if (updated[nextIdx] === 'not-visited') {
        updated[nextIdx] = 'not-answered';
      }
      return updated;
    });

    setCurrentQIndex(nextIdx);
  };

  const handleMarkForReviewAndNext = () => {
    if (!test) return;
    const hasAns = selectedAnswers[currentQIndex] !== undefined;
    const nextIdx = currentQIndex < test.questions.length - 1 ? currentQIndex + 1 : 0;

    setQStatuses((prev) => {
      const updated = { ...prev };
      updated[currentQIndex] = hasAns ? 'answered-marked' : 'marked';
      if (updated[nextIdx] === 'not-visited') {
        updated[nextIdx] = 'not-answered';
      }
      return updated;
    });

    setCurrentQIndex(nextIdx);
  };

  const handleStartExam = () => {
    if (!defaultLang) {
      alert('कृपया अपनी डिफ़ॉल्ट भाषा चुनें! / Please select your default exam language!');
      return;
    }
    if (!declarationChecked) {
      alert('कृपया घोषणा (Declaration) चेकबॉक्स पर टिक करें! / Please accept the declaration checkbox to proceed.');
      return;
    }
    setViewLang(defaultLang);
    setStage('exam-live');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // 6. PALETTE COUNTS & FINAL SCORE CALCULATION
  // ==========================================
  const paletteSummary = useMemo(() => {
    const counts = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      marked: 0,
      answeredMarked: 0,
    };
    Object.values(qStatuses).forEach((st) => {
      if (st === 'not-visited') counts.notVisited++;
      else if (st === 'not-answered') counts.notAnswered++;
      else if (st === 'answered') counts.answered++;
      else if (st === 'marked') counts.marked++;
      else if (st === 'answered-marked') counts.answeredMarked++;
    });
    return counts;
  }, [qStatuses]);

  const resultMetrics = useMemo(() => {
    if (!test) {
      return {
        correct: 0,
        wrong: 0,
        unattempted: 0,
        rawScore: 0,
        maxScore: 0,
        accuracy: 0,
        percentage: 0,
        sectionBreakdown: [] as {
          section: string;
          total: number;
          correct: number;
          wrong: number;
          unattempted: number;
          score: number;
        }[],
      };
    }

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    const secMap: {
      [sec: string]: { total: number; correct: number; wrong: number; unattempted: number; score: number };
    } = {};

    test.questions.forEach((q, idx) => {
      const sec = q.section?.trim() || 'General Section';
      if (!secMap[sec]) {
        secMap[sec] = { total: 0, correct: 0, wrong: 0, unattempted: 0, score: 0 };
      }
      secMap[sec].total++;

      const userAns = selectedAnswers[idx];
      if (userAns === undefined) {
        unattempted++;
        secMap[sec].unattempted++;
      } else if (userAns === q.correctOptionIndex) {
        correct++;
        secMap[sec].correct++;
        secMap[sec].score += posMark;
      } else {
        wrong++;
        secMap[sec].wrong++;
        secMap[sec].score -= negMark;
      }
    });

    const rawScore = Number((correct * posMark - wrong * negMark).toFixed(2));
    const maxScore = test.questions.length * posMark;
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const percentage = maxScore > 0 ? Math.max(0, Math.round((rawScore / maxScore) * 100)) : 0;

    return {
      correct,
      wrong,
      unattempted,
      rawScore,
      maxScore,
      accuracy,
      percentage,
      sectionBreakdown: Object.entries(secMap).map(([section, data]) => ({
        section,
        ...data,
        score: Number(data.score.toFixed(2)),
      })),
    };
  }, [test, selectedAnswers, posMark, negMark]);

  // Helper for TCS iON Palette Button Styling
  const getPaletteBadgeStyle = (status: QuestionStatus, isCurrent: boolean) => {
    const ring = isCurrent ? 'ring-2 ring-blue-700 ring-offset-1' : '';
    switch (status) {
      case 'answered':
        return `bg-[#22c55e] text-white border-[#16a34a] rounded-t-xl ${ring}`;
      case 'not-answered':
        return `bg-[#ef4444] text-white border-[#dc2626] rounded-b-xl ${ring}`;
      case 'marked':
        return `bg-[#7e22ce] text-white border-[#6b21a8] rounded-full ${ring}`;
      case 'answered-marked':
        return `bg-[#7e22ce] text-white border-[#6b21a8] rounded-full relative ${ring}`;
      case 'not-visited':
      default:
        return `bg-[#e2e8f0] text-slate-800 border-slate-400 rounded ${ring}`;
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-md w-full text-center shadow-md space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-black text-slate-900">Mock Test Not Found</h1>
          <p className="text-xs text-slate-600">
            Yeh Mock Test abhi उपलब्ध nahi hai ya Admin Panel se hata diya gaya hai.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/" className="px-4 py-2 bg-blue-700 text-white rounded text-xs font-bold">
              ← Homepage
            </Link>
            <Link href="/admin" className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">
              Open Admin Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Initializing TCS iON Official CBT Environment...</p>
        </div>
      </div>
    );
  }

  const displayTitle = test.testTitle || test.title || 'Official CBT Mock Test';

  // ============================================================================
  // STAGE 1: GENERAL INSTRUCTIONS (सामान्य निर्देश - REAL TCS iON SCREEN 1)
  // ============================================================================
  if (stage === 'general-instructions') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none">
        {/* Official TCS iON Navy Top Bar */}
        <header className="bg-[#1e3a8a] text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#172554]">
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-xs tracking-wider">
              CAREERSATHI CBT
            </span>
            <h1 className="text-sm sm:text-base font-bold truncate">{displayTitle}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>View Instructions In:</span>
            <select
              value={instLang}
              onChange={(e) => setInstLang(e.target.value as 'HI' | 'EN')}
              className="bg-white text-slate-900 font-bold px-2.5 py-1 rounded border border-slate-300 outline-none"
            >
              <option value="HI">हिन्दी (Hindi)</option>
              <option value="EN">English</option>
            </select>
          </div>
        </header>

        {/* Main Instructions Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left 9 Cols: Scrollable General Instructions */}
          <div className="lg:col-span-9 p-4 sm:p-8 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed border-r border-slate-300">
            <div className="bg-[#e8f1f8] border border-[#b6d4fe] px-4 py-2.5 rounded flex items-center justify-between">
              <h2 className="font-black text-[#1e3a8a] text-sm sm:text-base">
                {instLang === 'HI' ? 'सामान्य अनुदेश (General Instructions)' : 'General Instructions'}
              </h2>
              <span className="text-[11px] font-bold text-slate-600">
                {instLang === 'HI' ? 'कृपया सभी निर्देशों को ध्यानपूर्वक पढ़ें' : 'Please read the instructions carefully'}
              </span>
            </div>

            {instLang === 'HI' ? (
              <div className="space-y-4 text-slate-800">
                <p className="font-bold">1. परीक्षा की कुल अवधि <span className="text-blue-700 underline">{test.totalTimeMinutes || test.duration} मिनट</span> है।</p>
                <p>
                  2. घड़ी सर्वर पर सेट की गई है। आपकी स्क्रीन के दाहिने कोने में सबसे ऊपर काउंटडाउन टाइमर में आपके लिए परीक्षा समाप्त करने के लिए शेष समय दिखाई देगा। जब टाइमर शून्य पर पहुंच जाएगा, तो परीक्षा स्वतः समाप्त हो जाएगी। आपको अपनी परीक्षा को सबमिट करने की आवश्यकता नहीं है।
                </p>
                <p>
                  3. स्क्रीन के दाहिने कोने पर प्रश्न पैलेट (Question Palette) प्रत्येक प्रश्न की स्थिति को निम्न प्रतीकों में से किसी एक का उपयोग करते हुए प्रकट करता है:
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-slate-800">
                <p className="font-bold">1. Total duration of this examination is <span className="text-blue-700 underline">{test.totalTimeMinutes || test.duration} minutes</span>.</p>
                <p>
                  2. The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself.
                </p>
                <p>
                  3. The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                </p>
              </div>
            )}

            {/* Official 5-Symbol Legend Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-2.5 w-20 text-center">प्रतीक / Symbol</th>
                    <th className="border border-slate-300 p-2.5 text-left">अर्थ / Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center bg-[#e2e8f0] border border-slate-400 text-slate-800 font-bold rounded">
                        1
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5">
                      {instLang === 'HI'
                        ? 'आप अभी तक इस प्रश्न पर नहीं गए हैं। (You have not visited the question yet.)'
                        : 'You have not visited the question yet.'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center bg-[#ef4444] text-white font-bold rounded-b-xl">
                        2
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5">
                      {instLang === 'HI'
                        ? 'आपने प्रश्न का उत्तर नहीं दिया है। (You have not answered the question.)'
                        : 'You have not answered the question.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center bg-[#22c55e] text-white font-bold rounded-t-xl">
                        3
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5">
                      {instLang === 'HI'
                        ? 'आपने प्रश्न का उत्तर दे दिया है। (You have answered the question.)'
                        : 'You have answered the question.'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center bg-[#7e22ce] text-white font-bold rounded-full">
                        4
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5">
                      {instLang === 'HI'
                        ? 'आपने प्रश्न का उत्तर नहीं दिया है, पर प्रश्न को पुनर्विचार के लिए चिह्नित किया है। (You have NOT answered the question, but have marked the question for review.)'
                        : 'You have NOT answered the question, but have marked the question for review.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center bg-[#7e22ce] text-white font-bold rounded-full relative">
                        5
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22c55e] border border-white rounded-full flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2.5 font-semibold text-emerald-800">
                      {instLang === 'HI'
                        ? 'प्रश्न का उत्तर दिया गया है और समीक्षा के लिए चिह्नित किया गया है, इसका मूल्यांकन किया जाएगा। (The question(s) "Answered and Marked for Review" will be considered for evaluation.)'
                        : 'The question(s) "Answered and Marked for Review" will be considered for evaluation.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {instLang === 'HI' ? (
              <div className="space-y-3 text-slate-800">
                <h3 className="font-black text-slate-900 underline">प्रश्नों का उत्तर देने की प्रक्रिया:</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>अपना उत्तर चुनने के लिए, विकल्प के बटन पर क्लिक करें।</li>
                  <li>चयनित उत्तर को अचयनित करने के लिए <strong>&quot;Clear Response&quot;</strong> बटन पर क्लिक करें।</li>
                  <li>अपने उत्तर को सहेजने के लिए आपको <strong>&quot;Save &amp; Next&quot;</strong> बटन पर क्लिक करना होगा, अन्यथा उत्तर सहेजा नहीं जाएगा।</li>
                  <li>किसी प्रश्न को समीक्षा के लिए चिह्नित करने हेतु <strong>&quot;Mark for Review &amp; Next&quot;</strong> बटन पर क्लिक करें।</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-slate-800">
                <h3 className="font-black text-slate-900 underline">Answering a Question:</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>To select your answer, click on the button of one of the options.</li>
                  <li>To deselect your chosen answer, click on the <strong>&quot;Clear Response&quot;</strong> button.</li>
                  <li>To save your answer, you MUST click on the <strong>&quot;Save &amp; Next&quot;</strong> button.</li>
                  <li>To mark the question for review, click on the <strong>&quot;Mark for Review &amp; Next&quot;</strong> button.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right 3 Cols: Candidate Profile Card */}
          <div className="lg:col-span-3 bg-slate-50 p-6 flex flex-col items-center justify-start border-t lg:border-t-0 border-slate-300 space-y-4">
            <div className="w-24 h-28 bg-white border-2 border-slate-300 rounded flex flex-col items-center justify-center shadow-sm">
              <span className="text-4xl">👤</span>
              <span className="text-[10px] text-slate-500 font-bold mt-1">CANDIDATE</span>
            </div>
            <div className="text-center">
              <div className="font-black text-slate-900 text-base">CareerSathi Aspirant</div>
              <div className="text-xs text-slate-500 font-mono">Roll No: CS-2026-{test.id.slice(-4)}</div>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[11px] font-bold">
                Exam: {test.category}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Bar -> Go to Page 2 */}
        <footer className="bg-slate-100 border-t border-slate-300 px-6 py-3 flex items-center justify-between">
          <Link href="/" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-bold hover:bg-slate-200">
            ← Cancel &amp; Exit
          </Link>
          <button
            type="button"
            onClick={() => {
              setStage('specific-instructions');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 bg-[#286090] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm rounded shadow"
          >
            Next (आगे बढ़ें) &gt;
          </button>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // STAGE 2: IMPORTANT INSTRUCTIONS, MARKING SCHEME & DECLARATION (महत्वपूर्ण निर्देश एवं घोषणा)
  // ============================================================================
  if (stage === 'specific-instructions') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none">
        {/* Top Bar */}
        <header className="bg-[#1e3a8a] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b-2 border-[#172554]">
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-xs">
              CAREERSATHI CBT
            </span>
            <h1 className="text-sm sm:text-base font-bold truncate">{displayTitle}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>View In:</span>
            <select
              value={instLang}
              onChange={(e) => setInstLang(e.target.value as 'HI' | 'EN')}
              className="bg-white text-slate-900 font-bold px-2.5 py-1 rounded border border-slate-300 outline-none"
            >
              <option value="HI">हिन्दी (Hindi)</option>
              <option value="EN">English</option>
            </select>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
          {/* Left 9 Cols: Exam Pattern, Negative Marking & Declaration */}
          <div className="lg:col-span-9 p-4 sm:p-8 space-y-6 text-xs sm:text-sm border-r border-slate-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="bg-[#e8f1f8] border border-[#b6d4fe] px-4 py-2.5 rounded">
                <h2 className="font-black text-[#1e3a8a] text-sm sm:text-base">
                  {instLang === 'HI'
                    ? 'कुछ महत्वपूर्ण निर्देश (Other Important Instructions)'
                    : 'Other Important Instructions & Exam Pattern'}
                </h2>
              </div>

              {test.seoIntro && (
                <div
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: test.seoIntro }}
                />
              )}

              {/* Exam Marking Scheme Table */}
              <div>
                <h3 className="font-black text-slate-900 mb-2">
                  {instLang === 'HI'
                    ? 'परीक्षा योजना एवं अंकन (Exam Pattern & Marking Scheme):'
                    : 'Exam Pattern & Marking Scheme:'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#1e3a8a] text-white">
                        <th className="border border-slate-300 p-2.5 text-left">विषय / Section</th>
                        <th className="border border-slate-300 p-2.5 text-center">कुल प्रश्न (Total Qs)</th>
                        <th className="border border-slate-300 p-2.5 text-center">सही उत्तर (+ Marks)</th>
                        <th className="border border-slate-300 p-2.5 text-center">गलत उत्तर (Negative Marking)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((secName, idx) => {
                        const secQs = test.questions.filter(
                          (q) => (q.section?.trim() || 'General Section') === secName
                        ).length;
                        return (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="border border-slate-300 p-2.5 font-bold text-slate-900">{secName}</td>
                            <td className="border border-slate-300 p-2.5 text-center font-bold">{secQs}</td>
                            <td className="border border-slate-300 p-2.5 text-center text-emerald-700 font-bold">
                              +{posMark} अंक / प्रश्न
                            </td>
                            <td className="border border-slate-300 p-2.5 text-center text-red-600 font-bold">
                              {negMark > 0 ? `-${negMark} अंक (Negative)` : 'कोई नेगेटिव मार्किंग नहीं (0)'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-amber-50 font-black text-slate-900">
                        <td className="border border-slate-300 p-2.5">कुल योग (Total)</td>
                        <td className="border border-slate-300 p-2.5 text-center">{test.questions.length} प्रश्न</td>
                        <td className="border border-slate-300 p-2.5 text-center">
                          कुल अंक: {test.questions.length * posMark}
                        </td>
                        <td className="border border-slate-300 p-2.5 text-center">
                          समय: {test.totalTimeMinutes || test.duration} मिनट
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-3.5 rounded text-slate-800 space-y-1 text-xs">
                <p className="font-black text-red-700">
                  ⚠️ {instLang === 'HI' ? 'महत्वपूर्ण नकारात्मक अंकन (Negative Marking) नियम:' : 'Important Negative Marking Rule:'}
                </p>
                <p>
                  {instLang === 'HI'
                    ? `प्रत्येक सही उत्तर के लिए +${posMark} अंक दिए जाएंगे तथा प्रत्येक गलत उत्तर के लिए ${negMark} अंक काटे जाएंगे। अनुत्तरित (Unattempted) प्रश्नों के लिए कोई अंक नहीं काटा जाएगा।`
                    : `Each correct answer awards +${posMark} marks and each wrong answer deducts ${negMark} marks. No marks are deducted for unattempted questions.`}
                </p>
              </div>
            </div>

            {/* Default Language Selection + Mandatory Candidate Declaration Box */}
            <div className="border-t-2 border-slate-300 pt-5 space-y-4 bg-slate-50 p-4 rounded-lg">
              <div className="flex flex-wrap items-center gap-3">
                <label className="font-black text-slate-900">
                  {instLang === 'HI'
                    ? 'अपनी डिफ़ॉल्ट परीक्षा भाषा चुनें (Choose your default language): *'
                    : 'Choose your default language: *'}
                </label>
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value as 'English' | 'Hindi' | '')}
                  className="p-2 bg-white border-2 border-blue-600 rounded font-bold text-slate-900 outline-none"
                >
                  <option value="">-- Select Language / भाषा चुनें --</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="English">English</option>
                </select>
                <span className="text-[11px] text-red-600 font-semibold">
                  (यह भाषा परीक्षा के दौरान किसी भी प्रश्न पर बदली जा सकती है)
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-black text-slate-900 block underline">
                  {instLang === 'HI' ? 'घोषणा (Declaration):' : 'Candidate Declaration:'}
                </span>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-blue-700 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 leading-relaxed font-medium">
                    {instLang === 'HI'
                      ? 'मैंने सभी निर्देशों को पढ़ और समझ लिया है। कंप्यूटर पर उपलब्ध कराए गए सभी हार्डवेयर सही स्थिति में हैं। मैं घोषणा करता/करती हूँ कि मेरे पास कोई भी प्रतिबंधित इलेक्ट्रॉनिक उपकरण (मोबाइल, स्मार्टवॉच, कैलकुलेटर आदि) नहीं है और मैं सभी परीक्षा नियमों का पालन करूँगा/करूँगी।'
                      : 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. into the Examination Hall.'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right 3 Cols: Candidate Profile */}
          <div className="lg:col-span-3 bg-slate-50 p-6 flex flex-col items-center justify-start space-y-4">
            <div className="w-24 h-28 bg-white border-2 border-slate-300 rounded flex flex-col items-center justify-center shadow-sm">
              <span className="text-4xl">👤</span>
              <span className="text-[10px] text-slate-500 font-bold mt-1">CANDIDATE</span>
            </div>
            <div className="text-center">
              <div className="font-black text-slate-900 text-base">CareerSathi Aspirant</div>
              <div className="text-xs text-slate-500 font-mono">Roll No: CS-2026-{test.id.slice(-4)}</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Previous & "I am ready to begin" */}
        <footer className="bg-slate-100 border-t border-slate-300 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStage('general-instructions')}
            className="px-5 py-2 bg-white border border-slate-400 text-slate-800 font-bold text-xs sm:text-sm rounded hover:bg-slate-200"
          >
            &lt; Previous (पीछे जाएं)
          </button>

          <button
            type="button"
            onClick={handleStartExam}
            className={`px-8 py-2.5 font-black text-xs sm:text-sm rounded shadow-md transition ${
              defaultLang && declarationChecked
                ? 'bg-[#286090] hover:bg-[#1e3a8a] text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            I am ready to begin (मैं परीक्षा शुरू करने के लिए तैयार हूँ) &gt;
          </button>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // STAGE 3: LIVE GOVERNMENT CBT EXAM INTERFACE (WHITE & OFFICIAL BLUE TCS iON VIEW)
  // ============================================================================
  if (stage === 'exam-live' && currentQuestion) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none">
        {/* 1. TOP TCS iON OFFICIAL HEADER */}
        <header className="bg-[#1e3a8a] text-white px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#172554] sticky top-0 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[11px] shrink-0">
              TCS iON CBT
            </span>
            <h1 className="text-xs sm:text-sm font-bold truncate">{displayTitle}</h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowQuestionPaperModal(true)}
              className="px-2.5 py-1 bg-[#286090] hover:bg-blue-600 text-white rounded font-bold text-[11px] border border-blue-400/40"
            >
              📄 Question Paper
            </button>
            <button
              type="button"
              onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
              className="lg:hidden px-2.5 py-1 bg-amber-400 text-slate-950 rounded font-black text-[11px]"
            >
              🔢 Palette ({paletteSummary.answered}/{test.questions.length})
            </button>
          </div>
        </header>

        {/* 2. SUB-HEADER: SECTION TABS & LIVE TIMER */}
        <div className="bg-[#f1f5f9] border-b border-slate-300 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Sections:</span>
            {sections.map((secName) => {
              const isActiveSec = currentSection === secName;
              const firstQIdx = test.questions.findIndex(
                (q) => (q.section?.trim() || 'General Section') === secName
              );
              return (
                <button
                  key={secName}
                  type="button"
                  onClick={() => {
                    if (firstQIdx !== -1) jumpToQuestion(firstQIdx);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-bold shrink-0 border transition ${
                    isActiveSec
                      ? 'bg-[#286090] text-white border-[#1e3a8a] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {secName}
                </button>
              );
            })}
          </div>

          {/* Official Timer Pill */}
          <div
            className={`px-3.5 py-1 rounded border font-black text-xs sm:text-sm flex items-center gap-2 ${
              timeLeft < 300
                ? 'bg-red-100 border-red-500 text-red-700 animate-pulse'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <span>Time Left:</span>
            <span className="font-mono text-sm sm:text-base">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* 3. MAIN SPLIT EXAM WORKSPACE (LEFT QUESTION CANVAS + RIGHT PALETTE) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative">
          {/* LEFT 9 COLS: WHITE QUESTION CANVAS */}
          <div className="lg:col-span-9 flex flex-col justify-between bg-white border-r border-slate-300">
            <div>
              {/* Question Info Strip (Question No, Marks, Language Switcher) */}
              <div className="bg-[#e8f1f8] border-b border-[#b6d4fe] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-black text-[#1e3a8a] text-sm">
                    Question No. {currentQIndex + 1}
                  </span>
                  {currentQuestion.difficulty && (
                    <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-600">
                      Level: {currentQuestion.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-slate-600">Marks:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                      +{posMark}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded border border-red-300">
                      -{negMark}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-semibold">View In:</span>
                    <select
                      value={viewLang}
                      onChange={(e) => setViewLang(e.target.value as 'English' | 'Hindi')}
                      className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Body & Options */}
              <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
                <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                  {viewLang === 'Hindi' && currentQuestion.questionTextHi
                    ? currentQuestion.questionTextHi
                    : currentQuestion.questionText}
                </div>

                {/* Diagram / Geometry Figure / Chart Image */}
                {currentQuestion.imageUrl && (
                  <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                    <img
                      src={currentQuestion.imageUrl}
                      alt={`Question ${currentQIndex + 1} Figure`}
                      className="max-h-64 w-auto object-contain rounded mx-auto"
                    />
                  </div>
                )}

                {/* 4 Radio Options (Classic White CBT Style) */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQIndex] === optIdx;
                    const optLetter = String.fromCharCode(65 + optIdx);
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleOptionSelect(optIdx)}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 text-slate-950 font-bold shadow-sm'
                            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQIndex}`}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(optIdx)}
                          className="mt-0.5 w-4 h-4 accent-blue-700 shrink-0 cursor-pointer"
                        />
                        <span className="font-bold text-slate-600 shrink-0">({optLetter})</span>
                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom TCS iON Action Buttons Bar */}
            <div className="bg-slate-100 border-t border-slate-300 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-800 border border-purple-400 rounded font-bold text-xs shadow-sm transition"
                >
                  Mark for Review &amp; Next
                </button>
                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-bold text-xs shadow-sm transition"
                >
                  Clear Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                {currentQIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => jumpToQuestion(currentQIndex - 1)}
                    className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded font-bold text-xs"
                  >
                    &lt; Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded font-black text-xs sm:text-sm shadow transition"
                >
                  Save &amp; Next &gt;
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 3 COLS: CANDIDATE INFO & TCS iON QUESTION PALETTE */}
          <aside
            className={`${
              mobilePaletteOpen ? 'fixed inset-0 z-50 bg-white overflow-y-auto p-4' : 'hidden lg:flex'
            } lg:col-span-3 bg-[#f8fafc] flex-col justify-between border-l border-slate-300`}
          >
            <div className="space-y-3 p-3.5">
              {/* Mobile Close Button */}
              {mobilePaletteOpen && (
                <div className="flex justify-between items-center border-b border-slate-300 pb-2 lg:hidden">
                  <span className="font-black text-sm text-slate-900">Question Palette</span>
                  <button
                    type="button"
                    onClick={() => setMobilePaletteOpen(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-800 rounded font-bold text-xs"
                  >
                    ✕ Close
                  </button>
                </div>
              )}

              {/* Candidate Mini Profile */}
              <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-300">
                <div className="w-11 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-xl shrink-0">
                  👤
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-black text-slate-900 truncate">CareerSathi Aspirant</div>
                  <div className="text-[10px] text-slate-500">Section: {currentSection}</div>
                </div>
              </div>

              {/* Live 5-Status Counter Legend */}
              <div className="bg-white p-3 rounded border border-slate-300 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-t-lg bg-[#22c55e] text-white font-bold flex items-center justify-center shrink-0">
                    {paletteSummary.answered}
                  </span>
                  <span className="text-slate-700 font-semibold">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-b-lg bg-[#ef4444] text-white font-bold flex items-center justify-center shrink-0">
                    {paletteSummary.notAnswered}
                  </span>
                  <span className="text-slate-700 font-semibold">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#e2e8f0] border border-slate-400 text-slate-800 font-bold flex items-center justify-center shrink-0">
                    {paletteSummary.notVisited}
                  </span>
                  <span className="text-slate-700 font-semibold">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#7e22ce] text-white font-bold flex items-center justify-center shrink-0">
                    {paletteSummary.marked}
                  </span>
                  <span className="text-slate-700 font-semibold">Marked</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-[#7e22ce] text-white font-bold flex items-center justify-center relative shrink-0">
                    {paletteSummary.answeredMarked}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full border border-white" />
                  </span>
                  <span className="text-slate-700 font-semibold text-[10px]">
                    Answered &amp; Marked for Review (Will be evaluated)
                  </span>
                </div>
              </div>

              {/* Blue Bar: Choose a Question */}
              <div className="bg-[#286090] text-white px-3 py-1.5 rounded-t text-xs font-bold">
                Choose a Question
              </div>

              {/* Scrollable Number Grid */}
              <div className="bg-[#e8f1f8] p-3 rounded-b border border-[#b6d4fe] max-h-64 overflow-y-auto grid grid-cols-5 gap-2">
                {test.questions.map((q, idx) => {
                  const status = qStatuses[idx] || 'not-visited';
                  const isCurrent = idx === currentQIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => jumpToQuestion(idx)}
                      className={`h-9 text-xs font-bold border flex items-center justify-center transition ${getPaletteBadgeStyle(
                        status,
                        isCurrent
                      )}`}
                    >
                      {idx + 1}
                      {status === 'answered-marked' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22c55e] border border-white rounded-full flex items-center justify-center text-[7px] text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Final Exam Button */}
            <div className="p-3.5 bg-slate-200 border-t border-slate-300">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 bg-[#286090] hover:bg-[#1e3a8a] text-white font-black text-sm rounded shadow-md transition"
              >
                Submit Test
              </button>
            </div>
          </aside>
        </div>

        {/* SUBMIT CONFIRMATION SUMMARY MODAL (REAL TCS iON EXAM SUMMARY) */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs sm:text-sm">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h3 className="text-base font-black text-[#1e3a8a]">📋 Exam Submission Summary</h3>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-bold">Total Questions</div>
                  <div className="text-lg font-black text-slate-900">{test.questions.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-700 font-bold">Answered</div>
                  <div className="text-lg font-black text-emerald-700">
                    {paletteSummary.answered + paletteSummary.answeredMarked}
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-[11px] text-red-700 font-bold">Not Answered</div>
                  <div className="text-lg font-black text-red-700">{paletteSummary.notAnswered}</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-[11px] text-purple-700 font-bold">Marked for Review</div>
                  <div className="text-lg font-black text-purple-700">{paletteSummary.marked}</div>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg">
                  <div className="text-[11px] text-slate-600 font-bold">Not Visited</div>
                  <div className="text-lg font-black text-slate-700">{paletteSummary.notVisited}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[11px] text-blue-700 font-bold">Time Remaining</div>
                  <div className="text-base font-black text-blue-800 font-mono">{formatTimer(timeLeft)}</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center font-medium">
                क्या आप वाकई परीक्षा सबमिट करना चाहते हैं? सबमिट करने के बाद आप उत्तर नहीं बदल पाएंगे।
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold"
                >
                  No, Back to Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setStage('result-analysis');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-black shadow"
                >
                  Yes, Final Submit ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL QUESTION PAPER MODAL */}
        {showQuestionPaperModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
              <div className="p-4 bg-[#1e3a8a] text-white rounded-t-xl flex items-center justify-between">
                <h3 className="font-bold text-sm">📄 Complete Question Paper — {displayTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShowQuestionPaperModal(false)}
                  className="px-2.5 py-1 bg-white/20 rounded text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm divide-y divide-slate-200">
                {test.questions.map((q, idx) => (
                  <div key={q.id || idx} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-900">
                        Q.{idx + 1} ({q.section || 'General'})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestionPaperModal(false);
                          jumpToQuestion(idx);
                        }}
                        className="text-[11px] text-blue-600 font-bold underline"
                      >
                        Go to Question →
                      </button>
                    </div>
                    <p className="font-medium text-slate-900">{q.questionText}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // STAGE 4: SCORECARD, ANALYTICS & STEP-BY-STEP SOLUTIONS (RESULT VIEW)
  // ============================================================================
  const timeSpentSecs = Math.max(0, totalDurationSecs - timeLeft);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-12">
      {/* Top Result Header */}
      <header className="bg-[#1e3a8a] text-white px-4 sm:px-8 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
              Official CBT Scorecard &amp; Solutions
            </span>
            <h1 className="text-lg sm:text-xl font-black mt-1">{displayTitle}</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAnswers({});
                const resetSt: { [qIdx: number]: QuestionStatus } = {};
                test.questions.forEach((_, idx) => {
                  resetSt[idx] = idx === 0 ? 'not-answered' : 'not-visited';
                });
                setQStatuses(resetSt);
                setTimeLeft(totalDurationSecs);
                setCurrentQIndex(0);
                setStage('general-instructions');
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow"
            >
              🔄 Re-Attempt Test
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold"
            >
              ← Homepage
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* 1. OVERALL SCORECARD CARDS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="text-base font-black text-slate-900">🏆 Candidate Performance Summary</h2>
            <span className="text-xs text-slate-500 font-semibold">
              Marking Scheme: +{posMark} Correct | -{negMark} Wrong
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-[11px] text-blue-700 font-bold uppercase">Net Score</div>
              <div className="text-xl font-black text-blue-900 mt-1">
                {resultMetrics.rawScore} <span className="text-xs font-normal">/ {resultMetrics.maxScore}</span>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-[11px] text-emerald-700 font-bold uppercase">Correct</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{resultMetrics.correct}</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="text-[11px] text-red-700 font-bold uppercase">Incorrect</div>
              <div className="text-xl font-black text-red-700 mt-1">{resultMetrics.wrong}</div>
            </div>
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-600 font-bold uppercase">Unattempted</div>
              <div className="text-xl font-black text-slate-700 mt-1">{resultMetrics.unattempted}</div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-[11px] text-amber-800 font-bold uppercase">Accuracy</div>
              <div className="text-xl font-black text-amber-700 mt-1">{resultMetrics.accuracy}%</div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="text-[11px] text-purple-700 font-bold uppercase">Time Taken</div>
              <div className="text-lg font-black text-purple-900 mt-1 font-mono">{formatTimer(timeSpentSecs)}</div>
            </div>
          </div>

          {/* SECTION-WISE BREAKDOWN TABLE */}
          {resultMetrics.sectionBreakdown.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-200 p-2.5 text-left">Section Name</th>
                    <th className="border border-slate-200 p-2.5 text-center">Total Qs</th>
                    <th className="border border-slate-200 p-2.5 text-center text-emerald-700">Correct</th>
                    <th className="border border-slate-200 p-2.5 text-center text-red-600">Wrong</th>
                    <th className="border border-slate-200 p-2.5 text-center">Skipped</th>
                    <th className="border border-slate-200 p-2.5 text-center font-black">Net Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {resultMetrics.sectionBreakdown.map((sec, idx) => (
                    <tr key={idx} className="even:bg-slate-50">
                      <td className="border border-slate-200 p-2.5 font-bold text-slate-900">{sec.section}</td>
                      <td className="border border-slate-200 p-2.5 text-center font-bold">{sec.total}</td>
                      <td className="border border-slate-200 p-2.5 text-center text-emerald-700 font-bold">{sec.correct}</td>
                      <td className="border border-slate-200 p-2.5 text-center text-red-600 font-bold">{sec.wrong}</td>
                      <td className="border border-slate-200 p-2.5 text-center text-slate-500">{sec.unattempted}</td>
                      <td className="border border-slate-200 p-2.5 text-center font-black text-blue-900">{sec.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. STEP-BY-STEP QUESTION & SOLUTION REVIEW */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h3 className="text-base font-black text-slate-900">
              💡 Detailed Solutions &amp; Answer Key Review
            </h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(['ALL', 'CORRECT', 'WRONG', 'UNATTEMPTED'] as const).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setSolutionFilter(flt)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    solutionFilter === flt
                      ? 'bg-[#1e3a8a] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {test.questions.map((q, idx) => {
              const userAns = selectedAnswers[idx];
              const isCorrect = userAns === q.correctOptionIndex;
              const isUnattempted = userAns === undefined;

              if (solutionFilter === 'CORRECT' && !isCorrect) return null;
              if (solutionFilter === 'WRONG' && (isCorrect || isUnattempted)) return null;
              if (solutionFilter === 'UNATTEMPTED' && !isUnattempted) return null;

              return (
                <div
                  key={q.id || idx}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs sm:text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#1e3a8a] text-white font-black rounded text-xs">
                        Q.{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {q.section || 'General Section'}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isUnattempted
                          ? 'bg-slate-200 text-slate-700'
                          : isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-700 border border-red-300'
                      }`}
                    >
                      {isUnattempted
                        ? '⚪ Unattempted (0)'
                        : isCorrect
                        ? `✓ Correct (+${posMark})`
                        : `✕ Incorrect (-${negMark})`}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {q.questionText}
                  </p>

                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt={`Solution Figure ${idx + 1}`}
                      className="max-h-52 rounded border border-slate-300 bg-white p-1"
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isRightOpt = oIdx === q.correctOptionIndex;
                      const isUserPicked = oIdx === userAns;
                      const letter = String.fromCharCode(65 + oIdx);

                      let boxStyle = 'bg-white border-slate-200 text-slate-700';
                      if (isRightOpt) {
                        boxStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                      } else if (isUserPicked && !isRightOpt) {
                        boxStyle = 'bg-red-50 border-red-500 text-red-950 font-bold';
                      }

                      return (
                        <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${boxStyle}`}>
                          <span>
                            <strong>({letter})</strong> {opt}
                          </span>
                          {isRightOpt && <span className="text-[11px] text-emerald-700 font-black">✓ Correct Answer</span>}
                          {isUserPicked && !isRightOpt && <span className="text-[11px] text-red-600 font-black">✕ Your Pick</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 p-3.5 bg-amber-50/90 border-l-4 border-amber-500 rounded text-xs text-slate-800 space-y-1">
                      <div className="font-black text-amber-900">💡 Step-by-Step Solution / Shortcut Trick:</div>
                      <p className="leading-relaxed whitespace-pre-line">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}