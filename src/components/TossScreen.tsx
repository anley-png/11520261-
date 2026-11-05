import React, { useState, useEffect, useRef, useCallback } from 'react';
import { L, frm, snd } from '../data/arabicData';
import { say, boom, playSoundEffect } from '../utils/audio';

interface TossScreenProps {
  misses: Record<number, number>;
  onAddStar: () => void;
  onBumpMiss: (letterIndex: number) => void;
  showToast: (msg: string) => void;
}

const POSITIONS = [
  { icon: '🫕', label: 'Pot' },
  { icon: '🐔', label: 'Hens' },
  { icon: '🐭', label: 'Mouse' },
  { icon: '🏠', label: 'House' },
];

export const TossScreen: React.FC<TossScreenProps> = ({
  misses,
  onAddStar,
  onBumpMiss,
  showToast,
}) => {
  const [currentLetter, setCurrentLetter] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [shakingChoice, setShakingChoice] = useState<number | null>(null);
  const roundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNewRound = useCallback(() => {
    // Only letters that join to next
    const joiners = L.map((_, i) => i).filter((i) => L[i][3] === 1);
    const pool = joiners.flatMap((i) =>
      Array(1 + (misses[i] || 0)).fill(i)
    );
    const chosenLetter = pool[Math.floor(Math.random() * pool.length)];
    const chosenPos = Math.floor(Math.random() * 4);

    setCurrentLetter(chosenLetter);
    setCurrentPosition(chosenPos);
    setShakingChoice(null);
  }, [misses]);

  useEffect(() => {
    startNewRound();
    return () => {
      if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
    };
  }, [startNewRound]);

  const handleChoice = (q: number) => {
    if (q === currentPosition) {
      playSoundEffect('correct');
      boom();
      onAddStar();
      say(snd(currentLetter), 'l' + currentLetter, showToast);
      if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = setTimeout(() => {
        startNewRound();
      }, 1200);
    } else {
      playSoundEffect('wrong');
      onBumpMiss(currentLetter);
      setShakingChoice(q);
      setTimeout(() => {
        setShakingChoice(null);
      }, 400);
    }
  };

  return (
    <div>
      <h2>Where does the cat throw it?</h2>
      <div className="cat">🐱⚽</div>
      <div className="big ar">{frm(currentLetter, currentPosition)}</div>
      <p>Pot = alone · Hens = start · Mouse = middle · House = end</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {POSITIONS.map((pos, q) => (
          <button
            key={q}
            className={`t ${shakingChoice === q ? 'sh' : ''}`}
            onClick={() => handleChoice(q)}
            style={{ minWidth: '70px', padding: '8px 14px' }}
          >
            {pos.icon}
            <br />
            <small style={{ font: '14px sans-serif' }}>{pos.label}</small>
          </button>
        ))}
      </div>
    </div>
  );
};
