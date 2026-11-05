import React, { useState, useEffect, useRef, useCallback } from 'react';
import { L, snd, shuf } from '../data/arabicData';
import { say, boom, playSoundEffect } from '../utils/audio';

interface BalloonGameScreenProps {
  onAddStar: () => void;
  showToast: (msg: string) => void;
}

interface BalloonItem {
  id: number;
  letterIndex: number;
  x: number; // percentage from left (10% to 80%)
  speed: number;
  color: string;
  popped: boolean;
}

const BALLOON_COLORS = ['#ff7a59', '#2a9d8f', '#e76f51', '#6a4c93', '#1d78c1', '#f4a261'];

export const BalloonGameScreen: React.FC<BalloonGameScreenProps> = ({
  onAddStar,
  showToast,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [targetLetter, setTargetLetter] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return +localStorage.getItem('balloon_hs')! || 0;
    } catch {
      return 0;
    }
  });

  const nextBalloonId = useRef<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pickNewTarget = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * L.length);
    setTargetLetter(randomIdx);
    say(snd(randomIdx), 'l' + randomIdx, showToast);
  }, [showToast]);

  const spawnBalloons = useCallback(() => {
    // Generate 4 balloons, at least 1 must be target
    const distractors = shuf(L.map((_, i) => i).filter((i) => i !== targetLetter)).slice(0, 3);
    const chosen = shuf([targetLetter, ...distractors]);

    const newBatch: BalloonItem[] = chosen.map((idx, n) => ({
      id: nextBalloonId.current++,
      letterIndex: idx,
      x: 12 + n * 22 + (Math.random() * 8 - 4),
      speed: 1.2 + Math.random() * 0.8,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      popped: false,
    }));

    setBalloons(newBatch);
  }, [targetLetter]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    pickNewTarget();
  };

  useEffect(() => {
    if (isPlaying && !gameOver) {
      spawnBalloons();
    }
  }, [isPlaying, gameOver, targetLetter, spawnBalloons]);

  // Countdown timer
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameOver]);

  // Handle game over logic
  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem('balloon_hs', String(score));
        } catch {
          // ignore
        }
      }
      if (score >= 5) {
        boom();
        onAddStar();
        showToast(`🎈 Awesome score: ${score}! Star awarded!`);
      }
    }
  }, [gameOver, score, highScore, onAddStar, showToast]);

  const handlePop = (balloon: BalloonItem) => {
    if (balloon.popped || gameOver) return;

    if (balloon.letterIndex === targetLetter) {
      // Correct!
      playSoundEffect('pop');
      const newCombo = combo + 1;
      const points = 10 * newCombo;
      setScore((s) => s + points);
      setCombo(newCombo);

      // Mark popped
      setBalloons((prev) =>
        prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b))
      );

      // Next target after brief delay
      setTimeout(() => {
        pickNewTarget();
      }, 500);
    } else {
      // Wrong balloon
      playSoundEffect('wrong');
      setCombo(0);
      say(snd(targetLetter), 'l' + targetLetter, showToast);
      showToast(`Look for ${L[targetLetter][0]} (${L[targetLetter][1]})!`);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '4px 0' }}>🎈 Balloon Pop Arcade</h2>
      <p style={{ margin: '2px 0 10px 0', fontSize: '0.95rem' }}>
        Listen to the cat and pop the balloon carrying the right letter!
      </p>

      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          maxWidth: '460px',
          margin: '0 auto 10px auto',
          background: '#fff',
          borderRadius: '16px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontWeight: 700,
        }}
      >
        <span>⏱️ {timeLeft}s</span>
        <span>🏆 Score: {score}</span>
        {combo > 1 && <span style={{ color: '#ff7a59' }}>🔥 {combo}x Combo!</span>}
        <span>⭐ High: {highScore}</span>
      </div>

      {!isPlaying && !gameOver && (
        <div
          style={{
            maxWidth: '380px',
            margin: '20px auto',
            background: '#fff',
            borderRadius: '24px',
            padding: '24px 16px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎈🐱</div>
          <h3>Pop The Arabic Letters!</h3>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            Test your fast reflexes and listening skills! Pop matching balloons before time runs out.
          </p>
          <button onClick={startGame} style={{ fontSize: '1.2rem', padding: '12px 28px' }}>
            Start Game ▶
          </button>
        </div>
      )}

      {isPlaying && (
        <div>
          {/* Target callout */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '8px 18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Pop Letter:</span>
            <span className="ar" style={{ fontSize: '2.5rem', color: '#e63946', fontWeight: 700 }}>
              {L[targetLetter][0]}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              ({L[targetLetter][1]} — “{L[targetLetter][2]}”)
            </span>
            <button
              onClick={() => say(snd(targetLetter), 'l' + targetLetter, showToast)}
              style={{ minHeight: '34px', padding: '4px 10px', fontSize: '0.8rem', background: '#2a9d8f' }}
            >
              🔊 Repeat
            </button>
          </div>

          {/* Balloon Playfield */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              height: '320px',
              margin: '0 auto',
              background: 'linear-gradient(to bottom, #d0f4de, #bfe9ff)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)',
              border: '3px solid #fff',
            }}
          >
            {balloons.map((balloon) => (
              <button
                key={balloon.id}
                onClick={() => handlePop(balloon)}
                style={{
                  position: 'absolute',
                  left: `${balloon.x}%`,
                  bottom: '30px',
                  width: '74px',
                  height: '92px',
                  borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                  background: balloon.color,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '2.4rem',
                  fontWeight: 700,
                  boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s, opacity 0.2s',
                  transform: balloon.popped ? 'scale(1.5)' : 'scale(1)',
                  opacity: balloon.popped ? 0 : 1,
                  pointerEvents: balloon.popped ? 'none' : 'auto',
                  animation: 'b 2.5s infinite ease-in-out',
                }}
              >
                <span className="ar">{L[balloon.letterIndex][0]}</span>
                {/* Balloon string knot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8px',
                    height: '6px',
                    background: balloon.color,
                    borderRadius: '2px',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <div
          style={{
            maxWidth: '380px',
            margin: '20px auto',
            background: '#fff',
            borderRadius: '24px',
            padding: '24px 16px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            animation: 'p 0.3s ease-out',
          }}
        >
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <h3>Round Complete!</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '6px 0', color: '#ff7a59' }}>
            Final Score: {score}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '16px' }}>
            High Score: {highScore} points
          </p>
          <button onClick={startGame} style={{ fontSize: '1.1rem', padding: '10px 24px' }}>
            Play Again 🔄
          </button>
        </div>
      )}
    </div>
  );
};
