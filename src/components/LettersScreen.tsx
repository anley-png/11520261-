import React, { useState } from 'react';
import { L, snd } from '../data/arabicData';
import { say } from '../utils/audio';
import { VoicePracticeBar } from './VoicePracticeBar';

interface LettersScreenProps {
  onGoForms: (index: number) => void;
  onGoTrace?: (index: number) => void;
  showToast: (msg: string) => void;
  onAddStar?: () => void;
}

export const LettersScreen: React.FC<LettersScreenProps> = ({
  onGoForms,
  onGoTrace,
  showToast,
  onAddStar,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState<number>(0);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setAnimKey((prev) => prev + 1);
    say(snd(index), 'l' + index, showToast);
  };

  const handleReplayVoice = () => {
    if (selectedIndex === null) return;
    say(snd(selectedIndex), 'l' + selectedIndex, showToast);
  };

  return (
    <div>
      <h2>Touch a letter</h2>
      <div id="sh" className="big ar">
        {selectedIndex !== null ? (
          <span key={animKey} className="w">
            {L[selectedIndex][0]}
          </span>
        ) : (
          '🐱'
        )}
      </div>

      <div id="nm" style={{ minHeight: '36px', marginBottom: '8px' }}>
        {selectedIndex !== null ? (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>
              <b>{L[selectedIndex][1]}</b> — “{L[selectedIndex][2]}”
            </span>
            <button
              onClick={handleReplayVoice}
              style={{ padding: '6px 12px', minHeight: '38px', fontSize: '0.9rem', background: '#2a9d8f' }}
              title="Hear phonetic sound"
            >
              🔊 Sound
            </button>
            <button
              onClick={() => {
                const audioNameId = `s${String(selectedIndex + 1).padStart(2, '0')}_01`;
                say(L[selectedIndex][1], audioNameId, showToast);
              }}
              style={{ padding: '6px 12px', minHeight: '38px', fontSize: '0.9rem', background: '#3b2f63' }}
              title="Hear letter name"
            >
              🗣️ Name
            </button>
            <button
              onClick={() => onGoForms(selectedIndex)}
              style={{ padding: '6px 12px', minHeight: '38px', fontSize: '0.9rem' }}
            >
              See its forms
            </button>
            {onGoTrace && (
              <button
                onClick={() => onGoTrace(selectedIndex)}
                style={{ padding: '6px 12px', minHeight: '38px', fontSize: '0.9rem', background: '#e76f51' }}
              >
                ✍️ Trace
              </button>
            )}
          </div>
        ) : (
          <>&nbsp;</>
        )}
      </div>

      {selectedIndex !== null && (
        <VoicePracticeBar
          targetText={L[selectedIndex][0]}
          label={`${L[selectedIndex][1]} (${L[selectedIndex][0]})`}
          onSuccess={onAddStar}
          showToast={showToast}
        />
      )}

      <div className="grid">
        {L.map((l, i) => (
          <button
            key={i}
            className="t ar"
            onClick={() => handleSelect(i)}
          >
            {l[0]}
          </button>
        ))}
      </div>
    </div>
  );
};
