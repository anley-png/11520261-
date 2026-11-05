import { LetterData, WordData, VoweledChar, VoweledWordMatch } from '../types';
import finalWordsData from './finalWords.json';
export { NEWID_MAP, MANIFEST_LETTERS, MANIFEST_WORDS } from './manifestWords';

export const Z = '\u200D';
export const STEP = 1000;
export const LEAD = 600;

export const L: LetterData[] = [
  ['ا', 'alif', 'aa', 0],
  ['ب', 'ba', 'b', 1],
  ['ت', 'ta', 't', 1],
  ['ث', 'tha', 'th', 1],
  ['ج', 'jiim', 'j', 1],
  ['ح', 'Haa', 'H', 1],
  ['خ', 'khaa', 'kh', 1],
  ['د', 'daal', 'd', 0],
  ['ذ', 'dhaal', 'dh', 0],
  ['ر', 'raa', 'r', 0],
  ['ز', 'zayn', 'z', 0],
  ['س', 'siin', 's', 1],
  ['ش', 'shiin', 'sh', 1],
  ['ص', 'Saad', 'S', 1],
  ['ض', 'Daad', 'D', 1],
  ['ط', 'Taa', 'T', 1],
  ['ظ', 'DHaa', 'DH', 1],
  ['ع', "'ayn", "'", 1],
  ['غ', 'ghayn', 'gh', 1],
  ['ف', 'fa', 'f', 1],
  ['ق', 'qaaf', 'q', 1],
  ['ك', 'kaaf', 'k', 1],
  ['ل', 'laam', 'l', 1],
  ['م', 'miim', 'm', 1],
  ['ن', 'nuun', 'n', 1],
  ['ه', 'ha', 'h', 1],
  ['و', 'waaw', 'w', 0],
  ['ي', 'ya', 'y', 1],
];

export const LET = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';

// Complete dataset reinserted from audio_manifest.csv (all 263 recorded words + classic words)
export const W: WordData[] = finalWordsData as WordData[];

export const VW: string[] =
  'بَيْت بَاب كِتَاب قَمَر نَبْت تِبْن بَحْر نَهْر جَمَل وَلَد بِنْت قَلَم شَمْس نَجْم سَمَك وَرْد كَلْب لَيْل نَار شَجَر ثَلْج حُوت فِيل تَمْر عَيْن يَد جَبَل دِيك طَالِب ذَيْل رَجُل زَيْت خُبْز نَمِر غُصْن فَم لَبَن مَطَر نَحْل هَرَم وَجْه شَاي ذُبَاب صَوْت ضَيْف غَزَال قِطَار مِفْتَاح وَقْت صَحْن ضَبَاب طَبِيب عُصْفُور ثَعْلَب دَم وَرَق دِمَاغ رِيَاض مِيرَاث ذِرَاع جِبَال دِيوَان نَاس بَنَات حَوْض قَفَص صُبْح نَخْل وَعْد نَظَر حِفْظ بَيْض قَصْر بَطَل نَسْر بَحْث سَمْع كَهْف صَيْف خَيْط قَلْب عِنَب نُور فُول'.split(
    ' '
  );

export const MK = /[\u064B-\u0652]/;

export const vpar = (s: string): VoweledChar[] => {
  const o: VoweledChar[] = [];
  for (const ch of s) {
    if (MK.test(ch)) {
      if (o.length) o[o.length - 1].m += ch;
    } else {
      o.push({ c: ch, m: '' });
    }
  }
  return o;
};

export const vc = (p: VoweledChar[], n: number): string => {
  const m = p[n].m;
  const x = p[n + 1];
  const pl = x && !x.m;
  return m.includes('\u064E')
    ? pl && x.c === 'ا'
      ? 'aa'
      : 'a'
    : m.includes('\u064F')
    ? pl && x.c === 'و'
      ? 'uu'
      : 'u'
    : m.includes('\u0650')
    ? pl && x.c === 'ي'
      ? 'ee'
      : 'i'
    : m.includes('\u0652')
    ? 'o'
    : '';
};

export const VWK: VoweledWordMatch[] = VW.map((v) => {
  const p = vpar(v);
  const pl = p.map((o) => o.c).join('');
  return { k: W.findIndex((w) => w.word === pl), p };
}).filter((o) => o.k >= 0);

export const wfv = (p: VoweledChar[], n: number): string => {
  const ix = p.map((o) => LET.indexOf(o.c));
  const pv = n > 0 && ix[n - 1] >= 0 && L[ix[n - 1]][3] === 1;
  const nx = n < p.length - 1 && ix[n] >= 0 && L[ix[n]][3] === 1;
  return (pv ? Z : '') + p[n].c + p[n].m + (nx ? Z : '');
};

export const COL = ['#e63946', '#2a9d8f', '#f4a261', '#6a4c93', '#1d78c1', '#e76f51'];

export const snd = (i: number): string => (i === 0 ? 'أ' : L[i][0]) + 'َ';

export const frm = (i: number, p: number): string =>
  [L[i][0], L[i][0] + Z, Z + L[i][0] + Z, Z + L[i][0]][p];

export const wf = (ix: number[], k: number): string => {
  const pv = k > 0 && ix[k - 1] >= 0 && L[ix[k - 1]][3] === 1;
  const nx = k < ix.length - 1 && ix[k] >= 0 && L[ix[k]][3] === 1;
  return (pv ? Z : '') + (ix[k] >= 0 ? L[ix[k]][0] : '') + (nx ? Z : '');
};

export const frmv = (i: number, p: number): string =>
  [L[i][0], L[i][0] + 'ـ', 'ـ' + L[i][0] + 'ـ', 'ـ' + L[i][0]][p];

export const VOWELS_CONFIG: [string, string][] = [
  ['َ', 'a'],
  ['ُ', 'u'],
  ['ِ', 'i'],
  ['ْ', ''],
  ['َا', 'aa'],
  ['ُو', 'uu'],
  ['ِي', 'ee'],
];

export interface VowelItem {
  id: string;
  mark: string;
  trans: string;
  name: string;
  arabicName: string;
  category: 'short' | 'long';
  audioCode: string;
  audioIndex: number;
}

export const VOWELS_LIST: VowelItem[] = [
  { id: 'fatha', mark: 'َ', trans: 'a', name: 'Fat-hah', arabicName: 'فَتْحَة', category: 'short', audioCode: '02', audioIndex: 0 },
  { id: 'kasra', mark: 'ِ', trans: 'i', name: 'Kasrah', arabicName: 'كَسْرَة', category: 'short', audioCode: '03', audioIndex: 1 },
  { id: 'damma', mark: 'ُ', trans: 'u', name: 'Dammah', arabicName: 'ضَمَّة', category: 'short', audioCode: '04', audioIndex: 2 },
  { id: 'sukun', mark: 'ْ', trans: 'ْ', name: 'Sukūn', arabicName: 'سُكُون', category: 'short', audioCode: '02', audioIndex: 3 },
  { id: 'alif_madd', mark: 'َا', trans: 'aa', name: 'Alif Madd', arabicName: 'أَلِف مَدّ', category: 'long', audioCode: '05', audioIndex: 4 },
  { id: 'yaa_madd', mark: 'ِي', trans: 'ee', name: 'Yā’ Madd', arabicName: 'يَاء مَدّ', category: 'long', audioCode: '06', audioIndex: 5 },
  { id: 'waaw_madd', mark: 'ُو', trans: 'oo', name: 'Wāw Madd', arabicName: 'وَاو مَدّ', category: 'long', audioCode: '07', audioIndex: 6 },
];

export const SHORT_VOWELS = VOWELS_LIST.filter((v) => v.category === 'short');
export const LONG_VOWELS = VOWELS_LIST.filter((v) => v.category === 'long');

export const FORM_NAMES = ['Isolated', 'Initial', 'Medial', 'Final'];

export const isFormLocked = (letterIndex: number, formIndex: number): boolean => {
  const joins = L[letterIndex][3] === 1;
  return !joins && (formIndex === 1 || formIndex === 2);
};

export const formIndexInWord = (ix: number[], n: number): number => {
  const pv = n > 0 && ix[n - 1] >= 0 && L[ix[n - 1]][3] === 1;
  const nx = n < ix.length - 1 && ix[n] >= 0 && L[ix[n]][3] === 1;
  return pv && nx ? 2 : pv ? 3 : nx ? 1 : 0;
};

export const getLetterFormAudioId = (letterIndex: number, formIndex: number): string => {
  const num = String(letterIndex + 1).padStart(2, '0');
  if (formIndex === 0) return `s${num}_01`;
  if (formIndex === 1) return `s${num}_08`;
  if (formIndex === 2) return letterIndex === 1 ? 's02_11' : `s${num}_09`;
  if (formIndex === 3) return letterIndex === 1 ? 's02_12' : `s${num}_10`;
  return `s${num}_01`;
};

export const getLetterVowelAudioId = (letterIndex: number, audioIndex: number): string => {
  const num = String(letterIndex + 1).padStart(2, '0');
  switch (audioIndex) {
    case 0: return `s${num}_02`; // Short a (Fatha)
    case 1: return `s${num}_03`; // Short i (Kasra)
    case 2: return `s${num}_04`; // Short u (Damma)
    case 3: return `s${num}_02`; // Sukun
    case 4: return `s${num}_05`; // Long aa (Alif)
    case 5: return `s${num}_06`; // Long ee (Yaa)
    case 6: return `s${num}_07`; // Long oo (Waaw)
    default: return `s${num}_02`;
  }
};

export interface VowelWordEntry {
  k: number;
  wordData: WordData;
  positionTag: string;
  charIndex: number;
}

export interface VowelSlotEntry {
  position: 'start' | 'mid' | 'fin';
  wordNumber: number;
  wordLabel: string;
  label: string;
  arabicLabel: string;
  diagram: string;
  k: number;
  wordData: WordData;
  charIndex: number;
  spanLen: number;
  vowelMarkDisplay: string;
}

/**
 * Validates whether a word genuinely holds the letter with the specific vowel mark / sound.
 */
export const checkWordHoldsLetterVowel = (
  wordData: WordData,
  letterIndex: number,
  vowelId: string
): { holds: boolean; charIndex: number; spanLen: number; pos: 'start' | 'mid' | 'fin' } => {
  const targetChar = L[letterIndex][0];
  const voc = wordData.vocalized || wordData.word;
  const parsed = vpar(voc);

  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].c === targetChar) {
      const marks = parsed[i].m;
      const nextParsed = i + 1 < parsed.length ? parsed[i + 1] : null;
      const nextChar = nextParsed ? nextParsed.c : '';

      let matched = false;
      let spanLen = 1;

      if (vowelId === 'fatha') {
        if (marks.includes('\u064E') && nextChar !== 'ا' && nextChar !== 'ى') {
          matched = true;
        }
      } else if (vowelId === 'kasra') {
        if (marks.includes('\u0650') && nextChar !== 'ي') {
          matched = true;
        }
      } else if (vowelId === 'damma') {
        // Must genuinely have damma and NOT be prolonged into long oo (followed by و)
        if (marks.includes('\u064F') && nextChar !== 'و') {
          matched = true;
        }
      } else if (vowelId === 'sukun') {
        if (marks.includes('\u0652')) {
          matched = true;
        }
      } else if (vowelId === 'alif_madd') {
        if (nextChar === 'ا' || nextChar === 'آ' || nextChar === 'ى' || marks.includes('َا')) {
          matched = true;
          spanLen = (nextChar === 'ا' || nextChar === 'آ' || nextChar === 'ى') ? 2 : 1;
        }
      } else if (vowelId === 'yaa_madd') {
        if (nextChar === 'ي' || marks.includes('ِي')) {
          matched = true;
          spanLen = nextChar === 'ي' ? 2 : 1;
        }
      } else if (vowelId === 'waaw_madd') {
        if (nextChar === 'و' || marks.includes('ُو')) {
          matched = true;
          spanLen = nextChar === 'و' ? 2 : 1;
        }
      }

      if (matched) {
        let pos: 'start' | 'mid' | 'fin' = 'mid';
        if (i === 0) pos = 'start';
        else if (i + spanLen >= parsed.length) pos = 'fin';
        return { holds: true, charIndex: i, spanLen, pos };
      }
    }
  }

  // Fallback for long vowels if curriculum manifest explicitly tagged this word under that long vowel
  // and the word contains the letter (e.g. w027 mahluwb for Boo end of word).
  // STRICT: NEVER allow for short vowels (damma, fatha, kasra) if the diacritic does not exist on that letter!
  if (vowelId !== 'damma' && vowelId !== 'kasra' && vowelId !== 'fatha') {
    const ex = (wordData.example_of || '').toLowerCase();
    const kw = { alif_madd: ['long aa'], yaa_madd: ['long ee'], waaw_madd: ['long oo'], sukun: ['sukun'] }[vowelId] || [];
    if (kw.some((k) => ex.includes(k))) {
      const ix = wordData.indices || [];
      if (ix.includes(letterIndex)) {
        let pos: 'start' | 'mid' | 'fin' = 'mid';
        if (ex.includes('start of word') || ex.includes('initial')) pos = 'start';
        else if (ex.includes('end of word') || ex.includes('final')) pos = 'fin';
        const cIdx = pos === 'start' ? ix.indexOf(letterIndex) : pos === 'fin' ? ix.lastIndexOf(letterIndex) : ix.indexOf(letterIndex);
        return { holds: true, charIndex: cIdx, spanLen: 1, pos };
      }
    }
  }

  return { holds: false, charIndex: 0, spanLen: 1, pos: 'mid' };
};

/**
 * Constructs words for the vowel strictly at Start, Middle, and Final if available in the files.
 * If 3 words exist in the files for that vowel (e.g., Boo: buwq at start, mahbuwb in middle, mahluwb at final),
 * they are mapped to the 3 position slots. If only 1 or 2 are in the files, returns only those genuinely available.
 * If no words in the files hold the vowel for a position, that slot is omitted ("leave the construction").
 */
export const getVowelPositionSlots = (
  letterIndex: number,
  vowelId: string
): {
  slots: VowelSlotEntry[];
  totalInFiles: number;
} => {
  const sectionPrefix = `${letterIndex + 1}.`;

  const vowelObj = VOWELS_LIST.find((v) => v.id === vowelId);
  const mark = vowelObj ? vowelObj.mark : '';
  const charWithVowel = L[letterIndex][0] + mark;

  type Candidate = {
    k: number;
    w: WordData;
    charIndex: number;
    spanLen: number;
    pos: 'start' | 'mid' | 'fin';
    ex: string;
  };

  const matched: Candidate[] = [];

  W.forEach((w, k) => {
    if (w.section && w.section.startsWith(sectionPrefix)) {
      const check = checkWordHoldsLetterVowel(w, letterIndex, vowelId);
      if (check.holds) {
        matched.push({
          k,
          w,
          charIndex: check.charIndex,
          spanLen: check.spanLen,
          pos: check.pos,
          ex: (w.example_of || '').toLowerCase(),
        });
      }
    }
  });

  type SlotCandidate = { k: number; wordData: WordData; charIndex: number; spanLen: number };
  let startItem: SlotCandidate | null = null;
  let midItem: SlotCandidate | null = null;
  let finItem: SlotCandidate | null = null;

  // Pass 1: match candidate whose manifest explicitly tags position AND matches genuine position
  for (const c of matched) {
    const isStart = c.ex.includes('start of word') || c.ex.includes('initial');
    const isMid = c.ex.includes('middle of word') || c.ex.includes('medial');
    const isFin = c.ex.includes('end of word') || c.ex.includes('final');

    if (isStart && c.pos === 'start' && !startItem) {
      startItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
    } else if (isMid && c.pos === 'mid' && !midItem) {
      midItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
    } else if (isFin && c.pos === 'fin' && !finItem) {
      finItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
    }
  }

  // Pass 2: place remaining candidates that hold the vowel in the matching slot if open
  for (const c of matched) {
    const isUsed =
      (startItem !== null && startItem.k === c.k) ||
      (midItem !== null && midItem.k === c.k) ||
      (finItem !== null && finItem.k === c.k);
    if (!isUsed) {
      if (c.pos === 'start' && !startItem) {
        startItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
      } else if (c.pos === 'fin' && !finItem) {
        finItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
      } else if (c.pos === 'mid' && !midItem) {
        midItem = { k: c.k, wordData: c.w, charIndex: c.charIndex, spanLen: c.spanLen };
      }
    }
  }

  const slots: VowelSlotEntry[] = [];

  if (startItem) {
    slots.push({
      position: 'start',
      wordNumber: 1,
      wordLabel: 'Word 1',
      label: 'Start of Word',
      arabicLabel: 'في البداية',
      diagram: `${charWithVowel} × ×`,
      k: startItem.k,
      wordData: startItem.wordData,
      charIndex: startItem.charIndex,
      spanLen: startItem.spanLen,
      vowelMarkDisplay: charWithVowel,
    });
  }
  if (midItem) {
    slots.push({
      position: 'mid',
      wordNumber: 2,
      wordLabel: 'Word 2',
      label: 'Middle of Word',
      arabicLabel: 'في الوسط',
      diagram: `× ${charWithVowel} ×`,
      k: midItem.k,
      wordData: midItem.wordData,
      charIndex: midItem.charIndex,
      spanLen: midItem.spanLen,
      vowelMarkDisplay: charWithVowel,
    });
  }
  if (finItem) {
    slots.push({
      position: 'fin',
      wordNumber: 3,
      wordLabel: 'Word 3',
      label: 'Final of Word',
      arabicLabel: 'في النهاية',
      diagram: `× × ${charWithVowel}`,
      k: finItem.k,
      wordData: finItem.wordData,
      charIndex: finItem.charIndex,
      spanLen: finItem.spanLen,
      vowelMarkDisplay: charWithVowel,
    });
  }

  return { slots, totalInFiles: matched.length };
};

/**
 * Returns the genuine example words from the repository files for this vowel.
 */
export const getGenuineVowelWordsFromFiles = (
  letterIndex: number,
  vowelId: string
): VowelWordEntry[] => {
  const { slots } = getVowelPositionSlots(letterIndex, vowelId);
  return slots.map((s) => ({
    k: s.k,
    wordData: s.wordData,
    positionTag: `${s.label} (${s.arabicLabel})`,
    charIndex: s.charIndex,
  }));
};

/**
 * Returns strictly positioned words for each form:
 * - Form 1 (Initial): letter strictly at start (index 0)
 * - Form 2 (Medial): letter strictly in the middle (index 1 to length - 2)
 * - Form 3 (Final): letter strictly at final (last index)
 * - Form 0 (Isolated): words where letter stands alone / isolated
 */
export const getFormWordsStrict = (
  letterIndex: number,
  formIndex: number
): Array<{ k: number; wordData: WordData; charIndex: number }> => {
  const matches: Array<{ k: number; wordData: WordData; charIndex: number; score: number }> = [];

  W.forEach((w, k) => {
    const ix = w.indices || [];
    if (!ix.length) return;

    if (formIndex === 1) {
      // Strictly at START
      if (ix[0] === letterIndex) {
        const ex = (w.example_of || '').toLowerCase();
        const score = ex.includes('start') ? 10 : 5;
        matches.push({ k, wordData: w, charIndex: 0, score });
      }
    } else if (formIndex === 2) {
      // Strictly in the MIDDLE (between first and last letter)
      for (let pos = 1; pos < ix.length - 1; pos++) {
        if (ix[pos] === letterIndex) {
          const ex = (w.example_of || '').toLowerCase();
          const score = ex.includes('middle') ? 10 : 5;
          matches.push({ k, wordData: w, charIndex: pos, score });
          break;
        }
      }
    } else if (formIndex === 3) {
      // Strictly at the FINAL position
      if (ix[ix.length - 1] === letterIndex) {
        const ex = (w.example_of || '').toLowerCase();
        const score = ex.includes('end') || ex.includes('final') ? 10 : 5;
        matches.push({ k, wordData: w, charIndex: ix.length - 1, score });
      }
    } else {
      // Isolated form: letter alone or matching isolated / shy
      const charIndex = ix.indexOf(letterIndex);
      if (charIndex >= 0) {
        const isIsolated = formIndexInWord(ix, charIndex) === 0;
        const score = isIsolated ? 10 : 3;
        matches.push({ k, wordData: w, charIndex, score });
      }
    }
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 6);
};

export const shuf = <T>(a: T[]): T[] =>
  a
    .map((x) => [Math.random(), x] as [number, T])
    .sort((p, q) => p[0] - q[0])
    .map((x) => x[1]);
