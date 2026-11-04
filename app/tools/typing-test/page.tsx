'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ==========================================
// 1. EXAM PRESETS & BEGINNER + EXAM PASSAGES
// ==========================================

interface ExamTypingPreset {
  id: string;
  name: string;
  badge: string;
  lang: 'english' | 'hindi';
  durationMins: number;
  targetWpm: number;
  targetKdph: number;
  backspaceAllowed: boolean;
  urMaxErrorPct: number;
  obcMaxErrorPct: number;
  ruleSummary: string;
}

const TYPING_PRESETS: ExamTypingPreset[] = [
  {
    id: 'beginner-tutor',
    name: '🎓 Beginner Typing Tutor',
    badge: '🖐️ Learn Fingers',
    lang: 'english',
    durationMins: 5,
    targetWpm: 20,
    targetKdph: 6000,
    backspaceAllowed: true,
    urMaxErrorPct: 10,
    obcMaxErrorPct: 15,
    ruleSummary: 'Beginner Mode • Live Hand & Finger Guide Active • Practice Home Row & Word Drills',
  },
  {
    id: 'ssc-cgl-dest',
    name: 'SSC CGL Tier-II (DEST)',
    badge: '🔥 2000 Keystrokes',
    lang: 'english',
    durationMins: 15,
    targetWpm: 27,
    targetKdph: 8000,
    backspaceAllowed: true,
    urMaxErrorPct: 5,
    obcMaxErrorPct: 7,
    ruleSummary: '15 Mins • 2000 Keystrokes (27 WPM) • Backspace Allowed • Max Error: 5% (UR), 7% (OBC/SC/ST)',
  },
  {
    id: 'ssc-chsl-en',
    name: 'SSC CHSL / LDC (35 WPM)',
    badge: '⚡ 35 WPM Rule',
    lang: 'english',
    durationMins: 10,
    targetWpm: 35,
    targetKdph: 10500,
    backspaceAllowed: true,
    urMaxErrorPct: 5,
    obcMaxErrorPct: 7,
    ruleSummary: '10 Mins • 35 WPM (10,500 KDPH) • Backspace Allowed • Official Half/Full Mistake Formula',
  },
  {
    id: 'rrb-ntpc-en',
    name: 'Railway RRB NTPC (30 WPM)',
    badge: '🚆 No Backspace',
    lang: 'english',
    durationMins: 10,
    targetWpm: 30,
    targetKdph: 9000,
    backspaceAllowed: false,
    urMaxErrorPct: 5,
    obcMaxErrorPct: 5,
    ruleSummary: '10 Mins • 30 WPM • Backspace Locked (Strict Railway Rule) • 5% Mistakes Ignored',
  },
  {
    id: 'ssc-rrb-hindi',
    name: 'SSC / RRB / Beltron Hindi',
    badge: '🇮🇳 30 WPM Hindi',
    lang: 'hindi',
    durationMins: 10,
    targetWpm: 30,
    targetKdph: 9000,
    backspaceAllowed: true,
    urMaxErrorPct: 5,
    obcMaxErrorPct: 7,
    ruleSummary: '10 Mins • 30 WPM Hindi • Unicode Mangal Font • Live Finger Guide Active',
  },
];

interface PassageItem {
  id: string;
  title: string;
  lang: 'english' | 'hindi';
  isBeginner?: boolean;
  text: string;
}

const BUILTIN_PASSAGES: PassageItem[] = [
  {
    id: 'beg-home-row',
    title: '🎓 Beginner Lesson 1: Home Row Finger Drill (ASDF JKL;)',
    lang: 'english',
    isBeginner: true,
    text: `asdf jkl; asdf jkl; fdsa ;lkj asdf jkl; dad sad lad fad fallaskall salad flaskjakal dad sad fall ask all lad fad; asdf gh jkl; had flag glad half dash flash glass shall hall fall ask jag; add sad dad glad flag half shall glass flask salad`,
  },
  {
    id: 'beg-top-row',
    title: '🎓 Beginner Lesson 2: Top & Home Row Words (QWERTY + ASDF)',
    lang: 'english',
    isBeginner: true,
    text: `qwert yuiop asdfg hjkl; free tree trueip power write quiteyletter water paper after great state order firstulpark early learn clear heart worldichelproute`,
  },
  {
    id: 'en-ssc-1',
    title: '📖 Passage 1: Digital Governance in India (SSC CGL / CHSL Official)',
    lang: 'english',
    text: `Public administration in modern India has undergone a remarkable transformation with the rapid adoption of digital technology across all tiers of government. Earlier, citizens had to visit multiple government offices and stand in long queues to obtain basic certificates, submit application forms, or verify land records. Today, integrated online portals and digital service centers have made it possible to access hundreds of essential welfare schemes from the comfort of home or through a nearby common service center. Transparency in public distribution systems has significantly reduced leakage and ensured that financial benefits reach the intended beneficiaries directly through bank accounts. However, the success of digital governance depends heavily on digital literacy, reliable internet connectivity in rural panchayats, and strong cybersecurity frameworks. When technology is combined with accountability and ethical leadership, public institutions earn the lasting trust of the people they serve.`,
  },
  {
    id: 'en-rrb-2',
    title: '📖 Passage 2: Indian Railways & Economic Lifelines (RRB NTPC Official)',
    lang: 'english',
    text: `Indian Railways serves as the economic lifeline of the nation, connecting distant agricultural heartlands with major industrial hubs and coastal ports every single day. Carrying millions of passengers and massive volumes of freight across thousands of stations requires extraordinary coordination, technical precision, and dedicated human effort. Over the past decade, significant investments have been directed toward complete electrification of broad-gauge routes, elimination of unmanned level crossings, and the introduction of modern high-speed train sets. Dedicated freight corridors have reduced transit time for essential commodities such as coal, steel, food grains, and fertilizers, thereby lowering logistics costs for domestic manufacturers. Safety remains the foremost priority of railway operations, supported by indigenous automatic train protection systems and regular track maintenance.`,
  },
  {
    id: 'en-court-3',
    title: '📖 Passage 3: Judiciary & Constitutional Values (High Court / Beltron)',
    lang: 'english',
    text: `The Constitution of India establishes a democratic republic founded upon the principles of justice, liberty, equality, and fraternity among all citizens. The rule of law ensures that no individual, regardless of rank or social standing, is above the legal framework of the country. An independent judiciary acts as the guardian of fundamental rights and resolves disputes between citizens and the state through fair and impartial proceedings. For justice to be meaningful, legal procedures must be accessible, affordable, and concluded within a reasonable timeframe. Clerical accuracy in recording evidence, maintaining case diaries, and preparing official notices is essential because even a minor typographical error can delay legal remedies.`,
  },
  {
    id: 'hi-mangal-1',
    title: '🇮🇳 हिंदी गद्यांश 1: शिक्षा और डिजिटल भारत का भविष्य (SSC / RRB / Beltron)',
    lang: 'hindi',
    text: `शिक्षा किसी भी राष्ट्र के सामाजिक और आर्थिक विकास की सबसे मजबूत नींव होती है। आज के आधुनिक युग में तकनीक ने शिक्षा के स्वरूप को पूरी तरह बदल दिया है। पहले जहां उच्च शिक्षा और प्रतियोगी परीक्षाओं की तैयारी के लिए छात्रों को बड़े शहरों की ओर पलायन करना पड़ता था, वहीं आज इंटरनेट और डिजिटल माध्यमों के कारण गांव में बैठा हुआ विद्यार्थी भी देश के सर्वश्रेष्ठ शिक्षकों से मार्गदर्शन प्राप्त कर सकता है। ऑनलाइन पुस्तकालय, मॉक टेस्ट और डिजिटल अध्ययन सामग्री ने शिक्षा को सुलभ और सस्ता बना दिया है। फिर भी तकनीक केवल एक साधन है, सफलता का असली आधार छात्र की निरंतर मेहनत, अनुशासन और सकारात्मक सोच ही होती है।`,
  },
  {
    id: 'hi-mangal-2',
    title: '🇮🇳 हिंदी गद्यांश 2: पर्यावरण संरक्षण और हमारा दायित्व (Hindi Practice)',
    lang: 'hindi',
    text: `प्रकृति ने मनुष्य को शुद्ध वायु, निर्मल जल और उपजाऊ भूमि के रूप में अनमोल उपहार दिए हैं, किंतु बढ़ते औद्योगीकरण और वनों की अंधाधुंध कटाई के कारण पर्यावरण का संतुलन बिगड़ता जा रहा है। जलवायु परिवर्तन और बढ़ता तापमान आज संपूर्ण विश्व के सामने एक गंभीर चुनौती बन चुका है। यदि समय रहते हमने नदियों की स्वच्छता और वृक्षारोपण पर ध्यान नहीं दिया, तो आने वाली पीढ़ियों को भारी संकट का सामना करना पड़ेगा। दैनिक जीवन में प्लास्टिक का उपयोग कम करना, जल और बिजली की बचत करना तथा अपने आसपास पेड़ लगाना छोटे लेकिन अत्यंत प्रभावी कदम हैं।`,
  },
];

// ==========================================
// 2. KEYBOARD & HAND FINGER MAPPING ENGINE
// ==========================================

type FingerId =
  | 'L_PINKY'
  | 'L_RING'
  | 'L_MIDDLE'
  | 'L_INDEX'
  | 'THUMB'
  | 'R_INDEX'
  | 'R_MIDDLE'
  | 'R_RING'
  | 'R_PINKY';

interface FingerMeta {
  id: FingerId;
  hand: 'Left Hand' | 'Right Hand' | 'Both Thumbs';
  fingerName: string;
  hindiHint: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const FINGER_INFO: Record<FingerId, FingerMeta> = {
  L_PINKY: {
    id: 'L_PINKY',
    hand: 'Left Hand',
    fingerName: 'Left Little Finger (Pinky)',
    hindiHint: 'बाएं हाथ की सबसे छोटी उंगली (Chhoti Ungli)',
    colorHex: '#F43F5E',
    bgClass: 'bg-rose-500/25',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-300',
  },
  L_RING: {
    id: 'L_RING',
    hand: 'Left Hand',
    fingerName: 'Left Ring Finger',
    hindiHint: 'बाएं हाथ की अनामिका उंगली (Ring Finger)',
    colorHex: '#F59E0B',
    bgClass: 'bg-amber-500/25',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-300',
  },
  L_MIDDLE: {
    id: 'L_MIDDLE',
    hand: 'Left Hand',
    fingerName: 'Left Middle Finger',
    hindiHint: 'बाएं हाथ की बीच वाली उंगली (Middle Finger)',
    colorHex: '#10B981',
    bgClass: 'bg-emerald-500/25',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-300',
  },
  L_INDEX: {
    id: 'L_INDEX',
    hand: 'Left Hand',
    fingerName: 'Left Index Finger',
    hindiHint: 'बाएं हाथ की तर्जनी उंगली (Index Finger)',
    colorHex: '#3B82F6',
    bgClass: 'bg-blue-500/25',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-300',
  },
  THUMB: {
    id: 'THUMB',
    hand: 'Both Thumbs',
    fingerName: 'Thumb (Spacebar)',
    hindiHint: 'अंगूठा (Spacebar दबाने के लिए)',
    colorHex: '#A855F7',
    bgClass: 'bg-purple-500/25',
    borderClass: 'border-purple-400',
    textClass: 'text-purple-300',
  },
  R_INDEX: {
    id: 'R_INDEX',
    hand: 'Right Hand',
    fingerName: 'Right Index Finger',
    hindiHint: 'दाएं हाथ की तर्जनी उंगली (Index Finger)',
    colorHex: '#06B6D4',
    bgClass: 'bg-cyan-500/25',
    borderClass: 'border-cyan-400',
    textClass: 'text-cyan-300',
  },
  R_MIDDLE: {
    id: 'R_MIDDLE',
    hand: 'Right Hand',
    fingerName: 'Right Middle Finger',
    hindiHint: 'दाएं हाथ की बीच वाली उंगली (Middle Finger)',
    colorHex: '#10B981',
    bgClass: 'bg-emerald-500/25',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-300',
  },
  R_RING: {
    id: 'R_RING',
    hand: 'Right Hand',
    fingerName: 'Right Ring Finger',
    hindiHint: 'दाएं हाथ की अनामिका उंगली (Ring Finger)',
    colorHex: '#F59E0B',
    bgClass: 'bg-amber-500/25',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-300',
  },
  R_PINKY: {
    id: 'R_PINKY',
    hand: 'Right Hand',
    fingerName: 'Right Little Finger (Pinky)',
    hindiHint: 'दाएं हाथ की सबसे छोटी उंगली (Chhoti Ungli)',
    colorHex: '#F43F5E',
    bgClass: 'bg-rose-500/25',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-300',
  },
};

interface KeyDef {
  code: string;
  label: string;
  shiftLabel?: string;
  finger: FingerId;
  widthClass?: string;
  isHomeKey?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { code: '`', label: '`', shiftLabel: '~', finger: 'L_PINKY' },
    { code: '1', label: '1', shiftLabel: '!', finger: 'L_PINKY' },
    { code: '2', label: '2', shiftLabel: '@', finger: 'L_RING' },
    { code: '3', label: '3', shiftLabel: '#', finger: 'L_MIDDLE' },
    { code: '4', label: '4', shiftLabel: '$', finger: 'L_INDEX' },
    { code: '5', label: '5', shiftLabel: '%', finger: 'L_INDEX' },
    { code: '6', label: '6', shiftLabel: '^', finger: 'R_INDEX' },
    { code: '7', label: '7', shiftLabel: '&', finger: 'R_INDEX' },
    { code: '8', label: '8', shiftLabel: '*', finger: 'R_MIDDLE' },
    { code: '9', label: '9', shiftLabel: '(', finger: 'R_RING' },
    { code: '0', label: '0', shiftLabel: ')', finger: 'R_PINKY' },
    { code: '-', label: '-', shiftLabel: '_', finger: 'R_PINKY' },
    { code: '=', label: '=', shiftLabel: '+', finger: 'R_PINKY' },
    { code: 'Backspace', label: '⌫ Back', finger: 'R_PINKY', widthClass: 'w-16 sm:w-20' },
  ],
  [
    { code: 'Tab', label: 'Tab', finger: 'L_PINKY', widthClass: 'w-12 sm:w-14' },
    { code: 'q', label: 'Q', finger: 'L_PINKY' },
    { code: 'w', label: 'W', finger: 'L_RING' },
    { code: 'e', label: 'E', finger: 'L_MIDDLE' },
    { code: 'r', label: 'R', finger: 'L_INDEX' },
    { code: 't', label: 'T', finger: 'L_INDEX' },
    { code: 'y', label: 'Y', finger: 'R_INDEX' },
    { code: 'u', label: 'U', finger: 'R_INDEX' },
    { code: 'i', label: 'I', finger: 'R_MIDDLE' },
    { code: 'o', label: 'O', finger: 'R_RING' },
    { code: 'p', label: 'P', finger: 'R_PINKY' },
    { code: '[', label: '[', shiftLabel: '{', finger: 'R_PINKY' },
    { code: ']', label: ']', shiftLabel: '}', finger: 'R_PINKY' },
    { code: '\\', label: '\\', shiftLabel: '|', finger: 'R_PINKY', widthClass: 'w-12' },
  ],
  [
    { code: 'Caps', label: 'Caps', finger: 'L_PINKY', widthClass: 'w-14 sm:w-16' },
    { code: 'a', label: 'A', finger: 'L_PINKY', isHomeKey: true },
    { code: 's', label: 'S', finger: 'L_RING', isHomeKey: true },
    { code: 'd', label: 'D', finger: 'L_MIDDLE', isHomeKey: true },
    { code: 'f', label: 'F', finger: 'L_INDEX', isHomeKey: true },
    { code: 'g', label: 'G', finger: 'L_INDEX' },
    { code: 'h', label: 'H', finger: 'R_INDEX' },
    { code: 'j', label: 'J', finger: 'R_INDEX', isHomeKey: true },
    { code: 'k', label: 'K', finger: 'R_MIDDLE', isHomeKey: true },
    { code: 'l', label: 'L', finger: 'R_RING', isHomeKey: true },
    { code: ';', label: ';', shiftLabel: ':', finger: 'R_PINKY', isHomeKey: true },
    { code: "'", label: "'", shiftLabel: '"', finger: 'R_PINKY' },
    { code: 'Enter', label: 'Enter ↵', finger: 'R_PINKY', widthClass: 'w-16 sm:w-20' },
  ],
  [
    { code: 'Shift_L', label: '⇧ Shift', finger: 'L_PINKY', widthClass: 'w-16 sm:w-24' },
    { code: 'z', label: 'Z', finger: 'L_PINKY' },
    { code: 'x', label: 'X', finger: 'L_RING' },
    { code: 'c', label: 'C', finger: 'L_MIDDLE' },
    { code: 'v', label: 'V', finger: 'L_INDEX' },
    { code: 'b', label: 'B', finger: 'L_INDEX' },
    { code: 'n', label: 'N', finger: 'R_INDEX' },
    { code: 'm', label: 'M', finger: 'R_INDEX' },
    { code: ',', label: ',', shiftLabel: '<', finger: 'R_MIDDLE' },
    { code: '.', label: '.', shiftLabel: '>', finger: 'R_RING' },
    { code: '/', label: '/', shiftLabel: '?', finger: 'R_PINKY' },
    { code: 'Shift_R', label: '⇧ Shift', finger: 'R_PINKY', widthClass: 'w-16 sm:w-24' },
  ],
  [
    {
      code: ' ',
      label: 'SPACEBAR (Press with Thumb / अंगूठे से दबाएं)',
      finger: 'THUMB',
      widthClass: 'w-64 sm:w-96',
    },
  ],
];

// Helper to resolve which key & finger is needed for a given character
function getKeyAndFingerForChar(ch: string): {
  primaryCode: string;
  primaryFinger: FingerId;
  shiftCode: 'Shift_L' | 'Shift_R' | null;
  shiftFinger: FingerId | null;
  displayKeyLabel: string;
} {
  if (!ch || ch === ' ') {
    return {
      primaryCode: ' ',
      primaryFinger: 'THUMB',
      shiftCode: null,
      shiftFinger: null,
      displayKeyLabel: 'SPACEBAR',
    };
  }

  const lower = ch.toLowerCase();
  const isUpperAlpha = ch >= 'A' && ch <= 'Z';

  for (const row of KEYBOARD_ROWS) {
    for (const k of row) {
      if (k.code === lower) {
        const isLeftHand = k.finger.startsWith('L_');
        return {
          primaryCode: k.code,
          primaryFinger: k.finger,
          shiftCode: isUpperAlpha ? (isLeftHand ? 'Shift_R' : 'Shift_L') : null,
          shiftFinger: isUpperAlpha ? (isLeftHand ? 'R_PINKY' : 'L_PINKY') : null,
          displayKeyLabel: isUpperAlpha ? `Shift + ${k.label}` : k.label,
        };
      }
      if (k.shiftLabel === ch) {
        const isLeftHand = k.finger.startsWith('L_');
        return {
          primaryCode: k.code,
          primaryFinger: k.finger,
          shiftCode: isLeftHand ? 'Shift_R' : 'Shift_L',
          shiftFinger: isLeftHand ? 'R_PINKY' : 'L_PINKY',
          displayKeyLabel: `Shift + ${ch}`,
        };
      }
    }
  }

  // Fallback for Hindi or special characters
  return {
    primaryCode: lower,
    primaryFinger: 'R_INDEX',
    shiftCode: null,
    shiftFinger: null,
    displayKeyLabel: ch,
  };
}

interface MistakeDetail {
  wordIndex: number;
  expected: string;
  typed: string;
  type: 'full' | 'half';
}

interface SavedHistoryEntry {
  id: string;
  date: string;
  examName: string;
  netWpm: number;
  grossWpm: number;
  kdph: number;
  accuracy: number;
  errorPct: number;
  qualifiedUr: boolean;
}

export default function TypingTestStudio() {
  // Preset & Passage Selection
  const [selectedPreset, setSelectedPreset] = useState<ExamTypingPreset>(TYPING_PRESETS[1]); // Default SSC CGL
  const [selectedPassageId, setSelectedPassageId] = useState<string>('en-ssc-1');
  const [customPassageText, setCustomPassageText] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Font Size & UI Toggles
  const [fontSizePx, setFontSizePx] = useState<number>(22); // Larger default text (22px)!
  const [showHandGuide, setShowHandGuide] = useState<boolean>(true); // Live Keyboard + Hand Finger Guide
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [lockBackspace, setLockBackspace] = useState<boolean>(false);
  const [tcsRealExamMode, setTcsRealExamMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [candidateName, setCandidateName] = useState<string>('');
  const [copiedShareText, setCopiedShareText] = useState<boolean>(false);

  // Runtime States
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [backspaceCount, setBackspaceCount] = useState<number>(0);

  // History State
  const [history, setHistory] = useState<SavedHistoryEntry[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const passageBoxRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('careersathi_typing_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Filter passages matching current preset language
  const availablePassages = BUILTIN_PASSAGES.filter((p) => p.lang === selectedPreset.lang);
  const currentPassageObj =
    availablePassages.find((p) => p.id === selectedPassageId) ||
    availablePassages[0] ||
    BUILTIN_PASSAGES[0];

  const rawPassage = customPassageText.trim()
    ? customPassageText.trim()
    : currentPassageObj.text.trim();

  const fullPassageText = `${rawPassage} ${rawPassage}`;
  const targetWords = fullPassageText.split(/\s+/).filter(Boolean);

  // Parse user's typed words
  const typedWordsRaw = typedText.length > 0 ? typedText.split(/\s+/) : [];
  const endsWithSpace = /\s$/.test(typedText);
  const committedWordsCount = isFinished
    ? typedWordsRaw.filter(Boolean).length
    : endsWithSpace
    ? typedWordsRaw.filter(Boolean).length
    : Math.max(0, typedWordsRaw.length - 1);

  const activeWordIndex = committedWordsCount;
  const currentTargetWord = targetWords[activeWordIndex] || '';
  const currentTypedPartial = endsWithSpace ? '' : typedWordsRaw[typedWordsRaw.length - 1] || '';

  // Determine the exact NEXT character to type for the Live Hand & Keyboard Guide!
  const nextCharToType =
    currentTypedPartial.length < currentTargetWord.length
      ? currentTargetWord[currentTypedPartial.length]
      : ' ';

  const liveKeyGuide = getKeyAndFingerForChar(nextCharToType);
  const activeFingerMeta = FINGER_INFO[liveKeyGuide.primaryFinger];

  // Select Preset Handler
  const handleSelectPreset = (preset: ExamTypingPreset) => {
    setSelectedPreset(preset);
    setDurationMinutes(preset.durationMins);
    setSecondsLeft(preset.durationMins * 60);
    setLockBackspace(!preset.backspaceAllowed);

    const matchingPassages = BUILTIN_PASSAGES.filter((p) => p.lang === preset.lang);
    if (preset.id === 'beginner-tutor') {
      setSelectedPassageId('beg-home-row');
      setShowHandGuide(true);
    } else if (matchingPassages.length > 0) {
      const nonBeg = matchingPassages.find((p) => !p.isBeginner) || matchingPassages[0];
      setSelectedPassageId(nonBeg.id);
    }
    setCustomPassageText('');
    resetTest(preset.durationMins);
  };

  const resetTest = (mins = durationMinutes) => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(mins * 60);
    setElapsedSeconds(0);
    setTypedText('');
    setBackspaceCount(0);
    if (passageBoxRef.current) {
      passageBoxRef.current.scrollTop = 0;
    }
  };

  // Timer Effect
  useEffect(() => {
    if (!isRunning || isFinished) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isFinished]);

  // Auto-scroll active word
  useEffect(() => {
    if (activeWordRef.current && passageBoxRef.current) {
      const container = passageBoxRef.current;
      const wordEl = activeWordRef.current;
      const wordTop = wordEl.offsetTop - container.offsetTop;
      if (wordTop > container.scrollTop + container.clientHeight - 70) {
        container.scrollTo({ top: wordTop - 35, behavior: 'smooth' });
      }
    }
  }, [activeWordIndex]);

  // Mechanical Key Click Audio
  const playKeyClickSound = (isError = false) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isError ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isError ? 190 : 520, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  };

  const stripPunct = (str: string) => str.replace(/[.,;:"'?!()-]/g, '');

  // Evaluate Official SSC / Railway Scorecard
  const evaluateResults = () => {
    const wordsToEvaluate = isFinished
      ? typedWordsRaw.filter(Boolean)
      : typedWordsRaw.slice(0, committedWordsCount);

    let correctWords = 0;
    let fullMistakes = 0;
    let halfMistakes = 0;
    const mistakeList: MistakeDetail[] = [];

    wordsToEvaluate.forEach((typedW, idx) => {
      const expectedW = targetWords[idx] || '';
      if (typedW === expectedW) {
        correctWords++;
      } else if (
        typedW.toLowerCase() === expectedW.toLowerCase() ||
        stripPunct(typedW) === stripPunct(expectedW)
      ) {
        halfMistakes++;
        mistakeList.push({
          wordIndex: idx + 1,
          expected: expectedW,
          typed: typedW,
          type: 'half',
        });
      } else {
        fullMistakes++;
        mistakeList.push({
          wordIndex: idx + 1,
          expected: expectedW,
          typed: typedW,
          type: 'full',
        });
      }
    });

    const totalAttemptedWords = wordsToEvaluate.length;
    const totalKeystrokes = typedText.length;
    const effectiveMinutes = Math.max(elapsedSeconds, 1) / 60;

    const totalPenaltyMistakes = fullMistakes + halfMistakes * 0.5;
    const grossWpm = Number((totalKeystrokes / 5 / effectiveMinutes).toFixed(1));
    const netWpm = Math.max(
      0,
      Number(((totalKeystrokes / 5 - totalPenaltyMistakes) / effectiveMinutes).toFixed(1))
    );
    const kdph = Math.round((totalKeystrokes / effectiveMinutes) * 60);
    const cpm = Math.round(totalKeystrokes / effectiveMinutes);

    const errorPct =
      totalAttemptedWords > 0
        ? Number(((totalPenaltyMistakes / totalAttemptedWords) * 100).toFixed(2))
        : 0;
    const accuracy = Math.max(0, Number((100 - errorPct).toFixed(2)));

    const speedQualified = netWpm >= selectedPreset.targetWpm;
    const qualifiedUr = speedQualified && errorPct <= selectedPreset.urMaxErrorPct;
    const qualifiedObcScSt = speedQualified && errorPct <= selectedPreset.obcMaxErrorPct;

    return {
      totalAttemptedWords,
      correctWords,
      fullMistakes,
      halfMistakes,
      totalPenaltyMistakes,
      totalKeystrokes,
      grossWpm,
      netWpm,
      kdph,
      cpm,
      errorPct,
      accuracy,
      qualifiedUr,
      qualifiedObcScSt,
      mistakeList,
    };
  };

  const stats = evaluateResults();

  const finishTest = () => {
    setIsRunning(false);
    setIsFinished(true);

    setTimeout(() => {
      const finalStats = evaluateResults();
      const newEntry: SavedHistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        examName: selectedPreset.name,
        netWpm: finalStats.netWpm,
        grossWpm: finalStats.grossWpm,
        kdph: finalStats.kdph,
        accuracy: finalStats.accuracy,
        errorPct: finalStats.errorPct,
        qualifiedUr: finalStats.qualifiedUr,
      };
      setHistory((prev) => {
        const updated = [newEntry, ...prev].slice(0, 10);
        localStorage.setItem('careersathi_typing_history', JSON.stringify(updated));
        return updated;
      });
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (lockBackspace) {
        e.preventDefault();
        playKeyClickSound(true);
        return;
      }
      setBackspaceCount((c) => c + 1);
    } else if (e.key.length === 1 || e.key === ' ') {
      playKeyClickSound(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    const val = e.target.value;
    if (!isRunning && val.length > 0) {
      setIsRunning(true);
    }
    setTypedText(val);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ==========================================
  // 3. SHARE & DOWNLOAD SCORECARD HELPERS
  // ==========================================
  const getShareMessage = () => {
    const statusText = stats.qualifiedUr
      ? '🏆 QUALIFIED (UR/All Categories)'
      : stats.qualifiedObcScSt
      ? '✅ QUALIFIED (OBC/SC/ST/EWS)'
      : '⚡ Practicing';
    return `🎯 *CareerSathi Typing Test Scorecard*\n👤 Candidate: ${
      candidateName.trim() || 'Aspirant'
    }\n📋 Exam: ${selectedPreset.name}\n⚡ Net Speed: *${stats.netWpm} WPM* (Gross: ${
      stats.grossWpm
    } WPM)\n⌨️ Keystrokes: *${stats.kdph} KDPH* (${stats.totalKeystrokes} keys)\n🎯 Accuracy: *${
      stats.accuracy
    }%* (Error: ${stats.errorPct}%)\n📊 Verdict: ${statusText}\n\n👉 Test your typing speed free on CareerSathi!`;
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(getShareMessage())}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      window.location.href
    )}&text=${encodeURIComponent(getShareMessage())}`;
    window.open(url, '_blank');
  };

  const copyScorecardSummary = () => {
    navigator.clipboard.writeText(getShareMessage());
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  const buildScorecardCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 920;
    canvas.height = 560;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 920, 560);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 920, 560);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 5;
    ctx.strokeRect(18, 18, 884, 524);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAREERSATHI.COM — OFFICIAL TYPING SKILL CERTIFICATE', 460, 66);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.fillText(
      `Candidate: ${(candidateName.trim() || 'EXAM ASPIRANT').toUpperCase()}   •   Exam: ${
        selectedPreset.name
      }   •   Date: ${new Date().toLocaleDateString('en-IN')}`,
      460,
      104
    );

    const cards = [
      {
        label: 'NET SPEED (WPM)',
        val: `${stats.netWpm} WPM`,
        sub: `Gross: ${stats.grossWpm} WPM`,
        color: '#10B981',
      },
      {
        label: 'KEYSTROKES (KDPH)',
        val: `${stats.kdph}`,
        sub: `${stats.totalKeystrokes} Key Depressions`,
        color: '#38BDF8',
      },
      {
        label: 'ACCURACY',
        val: `${stats.accuracy}%`,
        sub: `Full: ${stats.fullMistakes} | Half: ${stats.halfMistakes}`,
        color: '#F59E0B',
      },
      {
        label: 'ERROR PERCENTAGE',
        val: `${stats.errorPct}%`,
        sub: `Allowed: ${selectedPreset.urMaxErrorPct}% (UR)`,
        color: stats.errorPct <= selectedPreset.urMaxErrorPct ? '#10B981' : '#F43F5E',
      },
    ];

    cards.forEach((c, i) => {
      const bx = 42 + i * 212;
      const by = 135;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(bx, by, 198, 160);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 198, 160);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(c.label, bx + 99, by + 35);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.fillText(c.val, bx + 99, by + 92);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText(c.sub, bx + 99, by + 135);
    });

    ctx.fillStyle = stats.qualifiedObcScSt ? '#064E3B' : '#4C0519';
    ctx.fillRect(42, 325, 836, 110);
    ctx.strokeStyle = stats.qualifiedObcScSt ? '#10B981' : '#F43F5E';
    ctx.strokeRect(42, 325, 836, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(
      stats.qualifiedUr
        ? '🏆 VERDICT: QUALIFIED FOR UR / GENERAL & ALL CATEGORIES!'
        : stats.qualifiedObcScSt
        ? '✅ VERDICT: QUALIFIED UNDER OBC / SC / ST / EWS RELAXATION (7% ERROR)!'
        : '⚡ VERDICT: KEEP PRACTICING TO REACH TARGET WPM & ACCURACY!',
      460,
      368
    );

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(
      `Words Typed: ${stats.totalAttemptedWords}  |  Correct Words: ${
        stats.correctWords
      }  |  CPM: ${stats.cpm}  |  Backspaces: ${backspaceCount}`,
      460,
      408
    );

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(
      '🌐 Verified by CareerSathi.com — India’s #1 Free SSC, Railway & Banking Typing Studio',
      460,
      495
    );

    return canvas;
  };

  const downloadScorecardImage = () => {
    const canvas = buildScorecardCanvas();
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareerSathi-Typing-Certificate-${stats.netWpm}WPM.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-5 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* COMPACT TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800">
          <Link href="/" className="text-xs text-blue-400 hover:underline font-bold">
            ← Back to CareerSathi Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400">
              ⌨️ SSC &amp; Railway Typing Studio + Live Hand Finger Guide
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STEP 1: EASY EXAM MODE PILLS + QUICK SETTINGS                */}
        {/* ============================================================ */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          {/* 5 Clean Exam Mode Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPING_PRESETS.map((preset) => {
              const active = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'border-amber-400 bg-amber-500/20 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-black text-amber-300">{preset.badge}</span>
                  <span className="text-xs font-black mt-0.5 leading-snug">{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Passage, Time & Beginner Hand Guide Toggle Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-800/80 text-xs">
            <div className="md:col-span-5 flex gap-2">
              <select
                value={selectedPassageId}
                onChange={(e) => {
                  setSelectedPassageId(e.target.value);
                  setCustomPassageText('');
                  resetTest();
                }}
                className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold outline-none"
              >
                {availablePassages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomModal(!showCustomModal)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-slate-700 shrink-0"
              >
                📋 Custom
              </button>
            </div>

            <div className="md:col-span-3 flex items-center gap-1.5">
              <span className="text-slate-400 font-bold mr-1">Time:</span>
              {[2, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setDurationMinutes(m);
                    resetTest(m);
                  }}
                  className={`flex-1 py-2 rounded-xl font-black border ${
                    durationMinutes === m
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setShowHandGuide(!showHandGuide)}
                className={`px-3 py-2 rounded-xl font-black border transition ${
                  showHandGuide
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                🖐️ {showHandGuide ? 'Hand Guide: ON' : 'Hand Guide: OFF'}
              </button>

              <label className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer font-bold text-rose-300">
                <input
                  type="checkbox"
                  checked={lockBackspace}
                  onChange={(e) => setLockBackspace(e.target.checked)}
                  className="rounded"
                />
                🚫 No Backspace
              </label>

              <label className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-2 rounded-xl border border-slate-800 cursor-pointer font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded"
                />
                🔊
              </label>
            </div>
          </div>

          {showCustomModal && (
            <div className="p-3 bg-slate-950 rounded-xl border border-blue-500/40 space-y-2 text-xs">
              <textarea
                rows={3}
                value={customPassageText}
                onChange={(e) => {
                  setCustomPassageText(e.target.value);
                  resetTest();
                }}
                placeholder="Paste your own English or Hindi practice passage here..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 2. LIVE STATS STRIP + TEXT SIZE CONTROLLER (A- / A+)         */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Time Left</span>
              <span
                className={`text-xl sm:text-2xl font-black ${
                  secondsLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-amber-400'
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Speed</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {stats.netWpm} <small className="text-xs">WPM</small>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Keystrokes</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400">
                {stats.kdph} <small className="text-xs">KDPH</small>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy</span>
              <span className="text-xl sm:text-2xl font-black text-purple-400">
                {stats.accuracy}%
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mistakes</span>
              <span className="text-lg font-black text-rose-400">
                {stats.fullMistakes}F / {stats.halfMistakes}H
              </span>
            </div>
          </div>

          {/* TEXT FONT SIZE CONTROLLER (A- / A+) */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-bold">Text Size:</span>
            <button
              onClick={() => setFontSizePx((s) => Math.max(16, s - 2))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-lg border border-slate-700"
              title="Decrease Text Size"
            >
              A-
            </button>
            <span className="font-black text-amber-400 w-10 text-center">{fontSizePx}px</span>
            <button
              onClick={() => setFontSizePx((s) => Math.min(34, s + 2))}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg"
              title="Increase Text Size"
            >
              A+
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. MAIN TYPING WORKSPACE OR ENHANCED SCORECARD               */}
        {/* ============================================================ */}
        {!isFinished ? (
          <div className="space-y-4">
            {/* Reference Passage & Input Box */}
            <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              {/* Reference Passage Box (Dynamic Font Size) */}
              <div
                ref={passageBoxRef}
                style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.65 }}
                className="h-44 md:h-52 overflow-y-auto p-4 bg-white text-slate-900 rounded-xl border-2 border-slate-700 font-medium select-none shadow-inner"
              >
                {targetWords.map((word, idx) => {
                  let wordClass = 'px-1.5 py-0.5 rounded transition-colors ';

                  if (!tcsRealExamMode) {
                    if (idx < committedWordsCount) {
                      const userW = typedWordsRaw[idx] || '';
                      if (userW === word) {
                        wordClass += 'text-emerald-700 bg-emerald-100 font-semibold';
                      } else if (
                        userW.toLowerCase() === word.toLowerCase() ||
                        stripPunct(userW) === stripPunct(word)
                      ) {
                        wordClass += 'text-amber-800 bg-amber-200 underline font-bold';
                      } else {
                        wordClass += 'text-rose-700 bg-rose-200 line-through font-bold';
                      }
                    } else if (idx === activeWordIndex) {
                      wordClass += 'bg-blue-600 text-white font-bold shadow';
                    }
                  }

                  return (
                    <React.Fragment key={idx}>
                      <span
                        ref={idx === activeWordIndex ? activeWordRef : null}
                        className={wordClass}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Typing Input Box (Matches Dynamic Font Size!) */}
              <textarea
                ref={textareaRef}
                rows={3}
                value={typedText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.5 }}
                placeholder="Click here and start typing... (See live finger guide below 👇)"
                className="w-full p-4 bg-slate-950 border-2 border-amber-500/70 focus:border-amber-400 rounded-xl text-white outline-none font-mono shadow-inner"
              />

              {/* Quick Action Bar */}
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => resetTest()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700"
                  >
                    🔄 Restart
                  </button>
                  <span className="text-slate-400">
                    Current Word:{' '}
                    <strong className="text-amber-300 text-sm">{currentTargetWord}</strong>
                  </span>
                </div>

                <button
                  onClick={finishTest}
                  disabled={typedText.trim().length === 0}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl shadow-lg transition"
                >
                  ✅ Submit &amp; View Scorecard →
                </button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 4. REAL-TIME INTERACTIVE KEYBOARD + LEFT/RIGHT HAND GUIDE    */}
            {/* ============================================================ */}
            {showHandGuide && (
              <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                {/* Live Next-Key & Finger Coach Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-lg shadow">
                      Press: {liveKeyGuide.displayKeyLabel}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white">
                        🖐️ Use <span className="text-amber-400">{activeFingerMeta.fingerName}</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-bold">
                        {activeFingerMeta.hindiHint}
                        {liveKeyGuide.shiftFinger &&
                          ` + Hold Shift with ${FINGER_INFO[liveKeyGuide.shiftFinger].fingerName}`}
                      </div>
                    </div>
                  </div>

                  {/* Finger Color Legend */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Pinky
                    </span>
                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Ring
                    </span>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Middle
                    </span>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Left Index
                    </span>
                    <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Right Index
                    </span>
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Thumb (Space)
                    </span>
                  </div>
                </div>

                {/* Keyboard + Left/Right Hands Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* LEFT HAND VISUAL FINGER DIAGRAM */}
                  <div className="lg:col-span-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-xs font-black text-slate-300 uppercase mb-2">
                      🤚 Left Hand (बायां हाथ)
                    </span>
                    <div className="flex items-end justify-center gap-2 h-36 pt-2">
                      {(
                        [
                          { id: 'L_PINKY', label: 'Pinky', h: 'h-20' },
                          { id: 'L_RING', label: 'Ring', h: 'h-26' },
                          { id: 'L_MIDDLE', label: 'Mid', h: 'h-28' },
                          { id: 'L_INDEX', label: 'Index', h: 'h-24' },
                          { id: 'THUMB', label: 'Thumb', h: 'h-14' },
                        ] as const
                      ).map((f) => {
                        const isPrimary = liveKeyGuide.primaryFinger === f.id;
                        const isShift = liveKeyGuide.shiftFinger === f.id;
                        const isActive = isPrimary || isShift;
                        const meta = FINGER_INFO[f.id];
                        return (
                          <div key={f.id} className="flex flex-col items-center gap-1">
                            {isActive && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded animate-bounce">
                                {isShift ? 'SHIFT' : 'PRESS'}
                              </span>
                            )}
                            <div
                              style={{
                                backgroundColor: isActive ? meta.colorHex : '#1E293B',
                                borderColor: meta.colorHex,
                              }}
                              className={`w-9 ${f.h} rounded-t-full border-2 flex flex-col items-center justify-end pb-2 transition-all ${
                                isActive ? 'scale-110 shadow-lg ring-2 ring-white' : 'opacity-70'
                              }`}
                            >
                              <span className="text-[9px] font-black text-white">{f.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-44 h-6 bg-slate-800 rounded-b-2xl border-t border-slate-700 text-center text-[10px] text-slate-400 font-bold">
                      Home Keys: A • S • D • F
                    </div>
                  </div>

                  {/* CENTER: INTERACTIVE QWERTY KEYBOARD */}
                  <div className="lg:col-span-6 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
                    <div className="min-w-[460px] space-y-1.5 flex flex-col items-center">
                      {KEYBOARD_ROWS.map((row, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-center gap-1">
                          {row.map((k) => {
                            const isPrimaryTarget = liveKeyGuide.primaryCode === k.code;
                            const isShiftTarget = liveKeyGuide.shiftCode === k.code;
                            const isHighlighted = isPrimaryTarget || isShiftTarget;
                            const fMeta = FINGER_INFO[k.finger];

                            return (
                              <div
                                key={k.code}
                                className={`${
                                  k.widthClass || 'w-8 sm:w-9'
                                } h-9 rounded-lg border flex flex-col items-center justify-center text-[11px] font-black transition-all select-none ${
                                  isHighlighted
                                    ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-lg z-10 ring-2 ring-amber-300'
                                    : `${fMeta.bgClass} ${fMeta.borderClass} text-slate-200`
                                }`}
                              >
                                <span>{k.label}</span>
                                {k.isHomeKey && !isHighlighted && (
                                  <span className="w-2 h-0.5 bg-amber-400 rounded-full mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT HAND VISUAL FINGER DIAGRAM */}
                  <div className="lg:col-span-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-xs font-black text-slate-300 uppercase mb-2">
                      ✋ Right Hand (दायां हाथ)
                    </span>
                    <div className="flex items-end justify-center gap-2 h-36 pt-2">
                      {(
                        [
                          { id: 'THUMB', label: 'Thumb', h: 'h-14' },
                          { id: 'R_INDEX', label: 'Index', h: 'h-24' },
                          { id: 'R_MIDDLE', label: 'Mid', h: 'h-28' },
                          { id: 'R_RING', label: 'Ring', h: 'h-26' },
                          { id: 'R_PINKY', label: 'Pinky', h: 'h-20' },
                        ] as const
                      ).map((f) => {
                        const isPrimary = liveKeyGuide.primaryFinger === f.id;
                        const isShift = liveKeyGuide.shiftFinger === f.id;
                        const isActive = isPrimary || isShift;
                        const meta = FINGER_INFO[f.id];
                        return (
                          <div key={f.id} className="flex flex-col items-center gap-1">
                            {isActive && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded animate-bounce">
                                {isShift ? 'SHIFT' : 'PRESS'}
                              </span>
                            )}
                            <div
                              style={{
                                backgroundColor: isActive ? meta.colorHex : '#1E293B',
                                borderColor: meta.colorHex,
                              }}
                              className={`w-9 ${f.h} rounded-t-full border-2 flex flex-col items-center justify-end pb-2 transition-all ${
                                isActive ? 'scale-110 shadow-lg ring-2 ring-white' : 'opacity-70'
                              }`}
                            >
                              <span className="text-[9px] font-black text-white">{f.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-44 h-6 bg-slate-800 rounded-b-2xl border-t border-slate-700 text-center text-[10px] text-slate-400 font-bold">
                      Home Keys: J • K • L • ;
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* 5. ENHANCED OFFICIAL SCORECARD + 1-CLICK WHATSAPP/TELEGRAM   */
          /* ============================================================ */
          <div className="bg-slate-900 p-6 rounded-2xl border-2 border-emerald-500/60 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black uppercase bg-amber-500 text-slate-950 px-3 py-1 rounded-full">
                  {selectedPreset.name} — Official Evaluation Report
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  {stats.qualifiedUr
                    ? '🏆 Congratulations! You Qualified (UR / All Categories)'
                    : stats.qualifiedObcScSt
                    ? '✅ Qualified Under OBC / SC / ST / EWS Relaxation (7% Error)'
                    : '⚡ Good Attempt! Practice Daily to Reach Target Speed & Accuracy'}
                </h2>
              </div>

              <button
                onClick={() => resetTest()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg"
              >
                🔄 Take Another Test
              </button>
            </div>

            {/* 6 Comprehensive Scorecard Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40">
                <span className="text-[11px] text-slate-400 font-bold block">NET SPEED</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{stats.netWpm}</div>
                <span className="text-[10px] text-slate-400">WPM (Req: {selectedPreset.targetWpm})</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">GROSS SPEED</span>
                <div className="text-2xl font-black text-white mt-1">{stats.grossWpm}</div>
                <span className="text-[10px] text-slate-400">Raw WPM</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">KEYSTROKES (KDPH)</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">{stats.kdph}</div>
                <span className="text-[10px] text-slate-400">{stats.totalKeystrokes} Keys Typed</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">ACCURACY</span>
                <div className="text-2xl font-black text-amber-400 mt-1">{stats.accuracy}%</div>
                <span className="text-[10px] text-slate-400">
                  {stats.correctWords}/{stats.totalAttemptedWords} Words OK
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">ERROR %</span>
                <div
                  className={`text-2xl font-black mt-1 ${
                    stats.errorPct <= selectedPreset.urMaxErrorPct
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {stats.errorPct}%
                </div>
                <span className="text-[10px] text-slate-400">
                  Max Allowed: {selectedPreset.urMaxErrorPct}%
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">MISTAKES</span>
                <div className="text-xl font-black text-rose-400 mt-1">
                  {stats.fullMistakes}F / {stats.halfMistakes}H
                </div>
                <span className="text-[10px] text-slate-400">Backspaces: {backspaceCount}</span>
              </div>
            </div>

            {/* SHARE & DOWNLOAD CERTIFICATE BAR */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber-300">
                    🎓 Download Certificate &amp; Share Your Result with Friends
                  </h3>
                  <p className="text-xs text-slate-400">
                    Apna naam likhein aur Scorecard Certificate download ya WhatsApp/Telegram par share karein:
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Enter Your Full Name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full sm:w-64 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <button
                  onClick={downloadScorecardImage}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  📥 Download Certificate PNG
                </button>

                <button
                  onClick={shareOnWhatsApp}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  📲 Share on WhatsApp
                </button>

                <button
                  onClick={shareOnTelegram}
                  className="py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  ✈️ Share on Telegram
                </button>

                <button
                  onClick={copyScorecardSummary}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  {copiedShareText ? '✓ Copied Scorecard!' : '📋 Copy Result Text'}
                </button>
              </div>
            </div>

            {/* Mistake Words Review */}
            {stats.mistakeList.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-black text-slate-300 uppercase">
                  🔍 Mistake Words Review ({stats.mistakeList.length}):
                </h4>
                <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.mistakeList.map((m, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-slate-500">#{m.wordIndex}: </span>
                        <span className="line-through text-rose-400 font-bold mr-1">{m.typed}</span>
                        <span className="text-emerald-400 font-bold">→ {m.expected}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                        {m.type === 'full' ? '1.0 Full' : '0.5 Half'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. RECENT ATTEMPTS HISTORY                                   */}
        {/* ============================================================ */}
        {history.length > 0 && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white">
                📈 Your Recent Typing History (Last {history.length} Tests)
              </h3>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('careersathi_typing_history');
                }}
                className="text-rose-400 hover:underline font-bold"
              >
                Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3">Net WPM</th>
                    <th className="py-2 px-3">KDPH</th>
                    <th className="py-2 px-3">Accuracy</th>
                    <th className="py-2 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2 px-3 text-slate-400">{h.date}</td>
                      <td className="py-2 px-3 font-bold text-white">{h.examName}</td>
                      <td className="py-2 px-3 font-black text-emerald-400">{h.netWpm} WPM</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">{h.kdph}</td>
                      <td className="py-2 px-3 text-amber-300 font-bold">{h.accuracy}%</td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            h.qualifiedUr
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {h.qualifiedUr ? '✓ QUALIFIED' : 'PRACTICE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}