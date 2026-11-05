import { L, W } from '../data/arabicData';
import { NEWID_MAP } from '../data/manifestWords';

let hasWarnedNoVoice = false;
let isMuted = false;
const audioUrlCache = new Map<string, string>();
let currentPlayingAudio: HTMLAudioElement | null = null;
const voiceListeners = new Set<(isSpeaking: boolean) => void>();
let cachedArabicVoice: SpeechSynthesisVoice | null = null;
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Listen for voices ready
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      cachedArabicVoice =
        voices.find((v) => /^ar/i.test(v.lang)) ||
        voices.find((v) => /arabic/i.test(v.name)) ||
        null;
    } catch {
      // ignore
    }
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

export const notifyVoiceState = (isSpeaking: boolean) => {
  voiceListeners.forEach((listener) => {
    try {
      listener(isSpeaking);
    } catch {
      // ignore
    }
  });
};

export const subscribeVoiceState = (listener: (isSpeaking: boolean) => void) => {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
};

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  if (muted) {
    stopAllAudio();
  }
};

export const getIsMuted = () => isMuted;

export const stopAllAudio = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio.currentTime = 0;
    currentPlayingAudio = null;
  }
  cancelSpeech();
  notifyVoiceState(false);
};

export const alt = (id: string): string => {
  let r = id.match(/^l(\d+)$/);
  if (r && L[+r[1]]) return L[+r[1]][1];
  r = id.match(/^w(\d+)$/);
  if (r && W[+r[1]]) return W[+r[1]].transliteration;
  const wordHit = W.find((w) => w.id === id || w.audioId === id);
  if (wordHit) return wordHit.transliteration;
  r = id.match(/^v(\d+)_(\d+)$/);
  if (r && L[+r[1]]) return L[+r[1]][2] + ['a', 'u', 'i', '', 'aa', 'uu', 'ee'][+r[2]];
  return '';
};

// Web Audio procedural sound effects
export const playSoundEffect = (type: 'correct' | 'wrong' | 'pop' | 'sparkle') => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'correct') {
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.15, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.22);
    });
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'sparkle') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }
};

export const tts = (text: string, altText?: string, onVoiceWarning?: (msg: string) => void) => {
  if (isMuted) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      cachedArabicVoice ||
      voices.find((v) => /^ar/i.test(v.lang)) ||
      voices.find((v) => /arabic/i.test(v.name));

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
    } else {
      utterance.lang = 'ar-SA';
      utterance.onerror = () => {
        try {
          const fallback = new SpeechSynthesisUtterance(altText || text);
          fallback.lang = 'en-US';
          window.speechSynthesis.speak(fallback);
        } catch {
          // ignore
        }
      };
    }
    utterance.rate = 0.8;

    utterance.onstart = () => notifyVoiceState(true);
    utterance.onend = () => notifyVoiceState(false);
    utterance.onerror = () => notifyVoiceState(false);

    window.speechSynthesis.speak(utterance);

    if (!arabicVoice && !hasWarnedNoVoice) {
      hasWarnedNoVoice = true;
      if (onVoiceWarning) {
        onVoiceWarning('Using Arabic speech synthesis. Voice ready!');
      }
    }
  } catch (e) {
    console.warn('Speech synthesis failed', e);
    notifyVoiceState(false);
  }
};

/**
 * High-fidelity voice playback:
 * 1. Static recorded native speaker MP3 (/audio/<id>.mp3) from repo archive
 * 2. In-memory object URL cache
 * 3. Server-side AI WAV fallback (/api/tts)
 * 4. Browser SpeechSynthesis fallback
 */
export const say = async (
  text: string,
  id: string,
  onVoiceWarning?: (msg: string) => void
): Promise<void> => {
  if (isMuted) return;

  const resolvedId = NEWID_MAP[id] || id;

  // Stop currently playing audio
  stopAllAudio();
  notifyVoiceState(true);

  // 1. Try recorded native speaker MP3 FIRST
  try {
    const staticAudio = new Audio(import.meta.env.BASE_URL + 'audio/' + resolvedId + '.mp3');
    currentPlayingAudio = staticAudio;
    staticAudio.onended = () => {
      currentPlayingAudio = null;
      notifyVoiceState(false);
    };
    staticAudio.onerror = () => {
      currentPlayingAudio = null;
      fallbackTts(text, id, onVoiceWarning);
    };
    await staticAudio.play();
    return;
  } catch (err: any) {
    if (err && err.name === 'AbortError') {
      // Audio playback was simply interrupted by another sound
      return;
    }
    // If play fails synchronously (e.g. 404 or unsupported), continue to fallback
    fallbackTts(text, id, onVoiceWarning);
  }
};

const fallbackTts = async (
  text: string,
  id: string,
  onVoiceWarning?: (msg: string) => void
) => {
  const cacheKey = id || text;

  // 2. Check in-memory object URL cache
  if (audioUrlCache.has(cacheKey)) {
    const url = audioUrlCache.get(cacheKey)!;
    try {
      const audio = new Audio(url);
      currentPlayingAudio = audio;
      audio.onended = () => {
        currentPlayingAudio = null;
        notifyVoiceState(false);
      };
      audio.onerror = () => {
        currentPlayingAudio = null;
        notifyVoiceState(false);
      };
      await audio.play();
      return;
    } catch {
      // fallback
    }
  }

  // 3. Fetch server-side AI voice from /api/tts
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, id, alt: alt(id) }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('audio')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioUrlCache.set(cacheKey, url);

        const audio = new Audio(url);
        currentPlayingAudio = audio;
        audio.onended = () => {
          currentPlayingAudio = null;
          notifyVoiceState(false);
        };
        audio.onerror = () => {
          currentPlayingAudio = null;
          notifyVoiceState(false);
        };
        await audio.play();
        return;
      }
    }
  } catch {
    // server unreachable or error, continue to fallback
  }

  // 4. Final fallback to browser speech synthesis
  tts(text, alt(id), onVoiceWarning);
};

export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
};

export const boom = () => {
  playSoundEffect('sparkle');
  if (typeof document === 'undefined') return;
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'f';
    el.textContent = ['🎉', '⭐', '✨', '🌟'][i % 4];
    el.style.left = Math.random() * 90 + 'vw';
    el.style.top = 60 + Math.random() * 30 + 'vh';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
};

// Web Speech Recognition for Voice Practice
export interface VoiceRecognitionResult {
  transcript: string;
  isMatch: boolean;
  feedback: string;
}

export const startVoiceRecognition = (
  targetText: string,
  onResult: (res: VoiceRecognitionResult) => void,
  onError: (err: string) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    onError('Speech recognition not supported in this environment');
    return () => {};
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Microphone speech recognition is not supported in this browser. Try Chrome or Edge.');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ar-SA';
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = async (event: any) => {
    const transcript = event.results[0][0].transcript || '';
    try {
      const verifyRes = await fetch('/api/speech/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetText, spokenText: transcript }),
      });
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        onResult({
          transcript,
          isMatch: data.correct,
          feedback: data.feedback,
        });
        return;
      }
    } catch {
      // fallback local match
    }

    const cleanTarget = targetText.replace(/[\u064B-\u0652]/g, '').trim();
    const cleanSpoken = transcript.replace(/[\u064B-\u0652]/g, '').trim();
    const isMatch = cleanTarget === cleanSpoken || cleanSpoken.includes(cleanTarget);

    onResult({
      transcript,
      isMatch,
      feedback: isMatch ? 'ممتاز! Well said!' : 'Nice try! Try once more!',
    });
  };

  recognition.onerror = (e: any) => {
    onError(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Could not hear clearly. Try again!');
  };

  try {
    recognition.start();
  } catch (err: any) {
    onError('Could not start microphone: ' + (err.message || 'unknown error'));
  }

  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };
};
