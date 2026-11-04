'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface MockTest {
  id: string;
  slug: string;
  testTitle: string;
  category: string;
  totalTimeMinutes: number;
  questions: Question[];
  publishedAt: string;
}

export default function TakeMockTestPage() {
  const params = useParams();
  const testSlug = params?.slug as string;

  const [test, setTest] = useState<MockTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // LocalStorage se slug ke base par mock test find karna
    const savedTests = JSON.parse(localStorage.getItem('careersathi_mock_tests') || '[]');
    const found = savedTests.find((t: MockTest) => t.slug === testSlug);
    if (found) {
      setTest(found);
      setTimeLeft(found.totalTimeMinutes * 60); // minutes to seconds conversion
    }
  }, [testSlug]);

  // Live Countdown Timer
  useEffect(() => {
    if (!test || isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto submit on timer expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, isSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQIndex]: optionIndex });
  };

  const handleSubmitTest = () => {
    setIsSubmitted(true);
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <p className="text-sm font-bold animate-pulse">Loading SEO-Optimized Exam Environment...</p>
      </div>
    );
  }

  // Score Calculation (+4 for correct, -1 for incorrect)
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  if (isSubmitted) {
    test.questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      if (userAns === undefined) {
        unattemptedCount++;
      } else if (userAns === q.correctOptionIndex) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
  }

  const totalScore = correctCount * 4 - incorrectCount * 1;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Top Header with Live Timer */}
      <header className="bg-slate-800 border-b border-slate-700 py-3 px-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div>
          <h1 className="text-base sm:text-lg font-black text-blue-400">{test.testTitle}</h1>
          <p className="text-xs text-slate-400">Category: {test.category}</p>
        </div>

        {!isSubmitted && (
          <div className="bg-red-900/60 border border-red-500 text-red-200 px-4 py-1.5 rounded-lg text-xs font-black tracking-widest animate-pulse">
            ⏳ Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* Main Exam Area */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 my-6">
        {!isSubmitted ? (
          <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="text-xs font-bold text-slate-400">Question {currentQIndex + 1} of {test.questions.length}</span>
              <span className="text-xs text-blue-400 font-semibold">Multiple Choice Question</span>
            </div>

            <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {test.questions[currentQIndex].questionText}
            </div>

            <div className="space-y-3 pt-2">
              {test.questions[currentQIndex].options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-3 ${
                    selectedAnswers[currentQIndex] === optIdx
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedAnswers[currentQIndex] === optIdx ? 'bg-white text-blue-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-700">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition"
              >
                ← Previous
              </button>

              {currentQIndex < test.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to submit the test?')) {
                      handleSubmitTest();
                    }
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow transition"
                >
                  Submit Test 🚀
                </button>
              )}
            </div>

          </div>
        ) : (
          /* SCORE CARD & REPORT */
          <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-900/50 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">🏆</div>
            <h2 className="text-2xl font-black text-white">Test Submitted Successfully!</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-2xl font-black text-yellow-400 mt-1">{totalScore} Marks</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">Correct</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{correctCount}</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">Incorrect</div>
                <div className="text-2xl font-black text-red-400 mt-1">{incorrectCount}</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">Unattempted</div>
                <div className="text-2xl font-black text-slate-400 mt-1">{unattemptedCount}</div>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow inline-block">
                ← Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-500 text-center py-4 text-xs">
        <p>© 2026 CareerSathi.com — Mock Test Portal.</p>
      </footer>
    </div>
  );
}