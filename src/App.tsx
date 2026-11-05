import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Screen, Achievement } from './types';
import { HomeScreen } from './components/HomeScreen';
import { LettersScreen } from './components/LettersScreen';
import { FormsScreen } from './components/FormsScreen';
import { TraceScreen } from './components/TraceScreen';
import { WordsScreen } from './components/WordsScreen';
import { WordDetailScreen } from './components/WordDetailScreen';
import { TossScreen } from './components/TossScreen';
import { BalloonGameScreen } from './components/BalloonGameScreen';
import { IslandScreen } from './components/IslandScreen';
import { AchievementsModal } from './components/AchievementsModal';
import { cancelSpeech, setMuted, getIsMuted, subscribeVoiceState } from './utils/audio';

interface ToastItem {
  id: number;
  text: string;
}

const NAV_ITEMS: [Screen, string][] = [
  ['home', '🏠 Home'],
  ['letters', '🔤 Letters'],
  ['forms', '🧩 Forms'],
  ['trace', '✍️ Trace'],
  ['words', '📖 Words'],
  ['toss', '🎯 Toss'],
  ['balloon', '🎈 Balloons'],
  ['island', '🏝️ Island'],
];

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);
  const [selectedLetterForForms, setSelectedLetterForForms] = useState<number>(1);
  const [traceInitialMode, setTraceInitialMode] = useState<'letters' | 'words'>('letters');
  const [traceInitialWordIndex, setTraceInitialWordIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [muted, setMutedState] = useState<boolean>(() => getIsMuted());
  const [showAchievements, setShowAchievements] = useState<boolean>(false);

  // Persistence: stars, built, miss
  const [stars, setStars] = useState<number>(() => {
    try {
      return +localStorage.getItem('st')! || 0;
    } catch {
      return 0;
    }
  });

  const [built, setBuilt] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bt') || '[]') || [];
    } catch {
      return [];
    }
  });

  const [misses, setMisses] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('ms') || '{}') || {};
    } catch {
      return {};
    }
  });

  // Daily Streak calculation
  const [streak] = useState<number>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem('last_active_date');
      const currentStreak = +(localStorage.getItem('active_streak') || 1);
      if (!last) {
        localStorage.setItem('last_active_date', today);
        localStorage.setItem('active_streak', '1');
        return 1;
      }
      if (last === today) {
        return currentStreak;
      }
      const diffDays = Math.round(
        (new Date(today).getTime() - new Date(last).getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays === 1) {
        const next = currentStreak + 1;
        localStorage.setItem('last_active_date', today);
        localStorage.setItem('active_streak', String(next));
        return next;
      } else {
        localStorage.setItem('last_active_date', today);
        localStorage.setItem('active_streak', '1');
        return 1;
      }
    } catch {
      return 1;
    }
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeVoiceState((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const showToast = useCallback((text: string, duration = 7000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // 10-minute stretch break toast
  useEffect(() => {
    const timer = setTimeout(() => {
      showToast('🐱 Stretch break! 10 minutes played.', 8000);
    }, 600000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const addStar = useCallback(() => {
    setStars((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('st', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const growBuilt = useCallback((wordIndex: number) => {
    setBuilt((prev) => {
      if (prev.includes(wordIndex)) return prev;
      const next = [...prev, wordIndex];
      try {
        localStorage.setItem('bt', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const bumpMiss = useCallback((letterIndex: number) => {
    setMisses((prev) => {
      const next = { ...prev, [letterIndex]: (prev[letterIndex] || 0) + 1 };
      try {
        localStorage.setItem('ms', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const navigateTo = (newScreen: Screen) => {
    cancelSpeech();
    setScreen(newScreen);
  };

  const handleSelectWord = (wordIndex: number) => {
    cancelSpeech();
    setSelectedWordIndex(wordIndex);
    setScreen('word');
  };

  const handleGoForms = (letterIndex: number) => {
    cancelSpeech();
    setSelectedLetterForForms(letterIndex);
    setScreen('forms');
  };

  const handleGoTraceLetter = (letterIndex: number) => {
    cancelSpeech();
    setSelectedLetterForForms(letterIndex);
    setTraceInitialMode('letters');
    setScreen('trace');
  };

  const handleGoTraceWord = (wordIndex: number) => {
    cancelSpeech();
    setTraceInitialWordIndex(wordIndex);
    setTraceInitialMode('words');
    setScreen('trace');
  };

  // Achievements calculation
  const achievements: Achievement[] = useMemo(() => {
    const highBalloon = +(localStorage.getItem('balloon_hs') || 0);
    return [
      {
        id: 'first_letter',
        title: 'Alif Explorer',
        desc: 'Begin your journey with the Arabic alphabet',
        icon: '🔤',
        unlocked: stars >= 1,
        progress: Math.min(1, stars / 1),
      },
      {
        id: 'trace_master',
        title: 'Calligrapher',
        desc: 'Complete letter stroke tracing with high precision',
        icon: '✍️',
        unlocked: stars >= 3,
        progress: Math.min(1, stars / 3),
      },
      {
        id: 'word_settler',
        title: 'Island Settler',
        desc: 'Build 5 vocabulary words on your island',
        icon: '🏝️',
        unlocked: built.length >= 5,
        progress: Math.min(1, built.length / 5),
      },
      {
        id: 'balloon_ace',
        title: 'Balloon Ace',
        desc: 'Score 40+ points in Balloon Pop arcade',
        icon: '🎈',
        unlocked: highBalloon >= 40,
        progress: Math.min(1, highBalloon / 40),
      },
      {
        id: 'word_master',
        title: 'Word Wizard',
        desc: 'Build 20 vocabulary words on your island',
        icon: '📜',
        unlocked: built.length >= 20,
        progress: Math.min(1, built.length / 20),
      },
      {
        id: 'streak_star',
        title: 'Daily Champion',
        desc: 'Maintain a 3-day active learning streak',
        icon: '🔥',
        unlocked: streak >= 3,
        progress: Math.min(1, streak / 3),
      },
      {
        id: 'star_collector',
        title: 'Constellation Master',
        desc: 'Earn 25 shining gold stars',
        icon: '⭐',
        unlocked: stars >= 25,
        progress: Math.min(1, stars / 25),
      },
      {
        id: 'cat_friend',
        title: 'Mishmish Best Friend',
        desc: 'Master letters, vowels, and all forms',
        icon: '🐱',
        unlocked: stars >= 15 && built.length >= 10,
        progress: Math.min(1, (stars + built.length) / 25),
      },
    ];
  }, [stars, built.length, streak]);

  return (
    <>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <b style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                transform: isSpeaking ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              🐱
            </span>
            Arabic Letter Island
            {isSpeaking && <span style={{ fontSize: '0.8rem', color: '#ff7a59' }}>🔊 Speaking...</span>}
          </b>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAchievements(true)}
            style={{
              minHeight: '34px',
              padding: '4px 8px',
              fontSize: '0.85rem',
              background: '#e76f51',
              borderRadius: '12px',
            }}
            title="View Trophies"
          >
            🏆
          </button>
          <button
            onClick={toggleMute}
            style={{
              minHeight: '34px',
              padding: '4px 10px',
              fontSize: '0.85rem',
              background: muted ? '#6a4c93' : '#2a9d8f',
              borderRadius: '12px',
            }}
            title={muted ? 'Unmute voice' : 'Mute voice'}
          >
            {muted ? '🔇 Muted' : '🔊 Voice'}
          </button>
          <span id="st" style={{ fontWeight: 700 }}>⭐ {stars}</span>
        </div>
      </header>

      <nav id="nav">
        {NAV_ITEMS.map(([k, label]) => (
          <button
            key={k}
            data-s={k}
            style={screen === k ? { outline: '2px solid #fff', transform: 'scale(1.04)' } : undefined}
            onClick={() => navigateTo(k)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main id="m">
        {screen === 'home' && (
          <HomeScreen
            onStart={() => navigateTo('letters')}
            onGoTrace={() => navigateTo('trace')}
            onGoBalloon={() => navigateTo('balloon')}
            showToast={showToast}
            streak={streak}
          />
        )}

        {screen === 'letters' && (
          <LettersScreen
            onGoForms={handleGoForms}
            onGoTrace={handleGoTraceLetter}
            showToast={showToast}
            onAddStar={addStar}
          />
        )}

        {screen === 'forms' && (
          <FormsScreen
            initialLetter={selectedLetterForForms}
            onSelectWord={handleSelectWord}
            showToast={showToast}
            onAddStar={addStar}
          />
        )}

        {screen === 'trace' && (
          <TraceScreen
            initialLetter={selectedLetterForForms}
            initialWordIndex={traceInitialWordIndex}
            initialMode={traceInitialMode}
            onAddStar={addStar}
            onGrowBuilt={growBuilt}
            showToast={showToast}
          />
        )}

        {screen === 'words' && <WordsScreen onSelectWord={handleSelectWord} />}

        {screen === 'word' && (
          <WordDetailScreen
            wordIndex={selectedWordIndex}
            onAddStar={addStar}
            onGrowBuilt={growBuilt}
            onBumpMiss={bumpMiss}
            showToast={showToast}
            onGoTraceWord={handleGoTraceWord}
          />
        )}

        {screen === 'toss' && (
          <TossScreen
            misses={misses}
            onAddStar={addStar}
            onBumpMiss={bumpMiss}
            showToast={showToast}
          />
        )}

        {screen === 'balloon' && (
          <BalloonGameScreen onAddStar={addStar} showToast={showToast} />
        )}

        {screen === 'island' && (
          <IslandScreen
            built={built}
            misses={misses}
            stars={stars}
            streak={streak}
            onOpenAchievements={() => setShowAchievements(true)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Trophies Modal */}
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={achievements}
      />

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.text}
        </div>
      ))}
    </>
  );
};
