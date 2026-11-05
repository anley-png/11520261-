import React, { useState } from 'react';
import { say, playSoundEffect } from '../utils/audio';

interface InteractiveCatProps {
  mood?: 'idle' | 'happy' | 'cheering' | 'thinking';
  isSpeaking?: boolean;
  size?: number;
  customMessage?: string;
  showToast?: (msg: string) => void;
}

const CAT_PHRASES = [
  { ar: 'مَرْحَباً!', en: 'Marhaban! (Hello!)' },
  { ar: 'أَهْلاً وَسَهْلاً!', en: 'Ahlan wa Sahlan! (Welcome!)' },
  { ar: 'أَنْتَ بَطَلٌ!', en: 'Anta batal! (You are a hero!)' },
  { ar: 'أَحْسَنْتَ كَثِيراً!', en: 'Ahsanta! (Well done!)' },
  { ar: 'تَعَالَ نَتَعَلَّمْ!', en: 'Taala nataallam! (Come let us learn!)' },
];

export const InteractiveCat: React.FC<InteractiveCatProps> = ({
  mood = 'idle',
  isSpeaking = false,
  size = 110,
  customMessage,
  showToast,
}) => {
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [wiggle, setWiggle] = useState<boolean>(false);

  const handleCatClick = () => {
    playSoundEffect('pop');
    setWiggle(true);
    setTimeout(() => setWiggle(false), 500);

    const phrase = CAT_PHRASES[Math.floor(Math.random() * CAT_PHRASES.length)];
    setBubbleText(`${phrase.ar} ${phrase.en}`);
    say(phrase.ar, 'cat_greeting', showToast);
    setTimeout(() => setBubbleText(null), 3500);
  };

  const displayText = customMessage || bubbleText;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={handleCatClick}
      title="Tap Mishmish the Cat to say hello!"
    >
      {displayText && (
        <div
          style={{
            position: 'absolute',
            bottom: `${size * 0.95}px`,
            background: '#ffffff',
            color: '#3b2f63',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            border: '2px solid #ff7a59',
            whiteSpace: 'nowrap',
            zIndex: 10,
            animation: 'p 0.25s ease-out',
          }}
        >
          {displayText}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: '#ffffff',
              borderRight: '2px solid #ff7a59',
              borderBottom: '2px solid #ff7a59',
            }}
          />
        </div>
      )}

      <div
        className={wiggle ? 'sh' : mood === 'cheering' ? 'cat' : 'cat2'}
        style={{
          width: `${size}px`,
          height: `${size * 0.9}px`,
          transition: 'transform 0.2s',
          transform: isSpeaking ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <svg
          viewBox="0 0 160 140"
          width="100%"
          height="100%"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))' }}
        >
          {/* Ears */}
          <polygon points="32,60 15,10 65,35" fill="#f4a261" />
          <polygon points="34,55 24,20 60,37" fill="#ffb4a2" />

          <polygon points="128,60 145,10 95,35" fill="#f4a261" />
          <polygon points="126,55 136,20 100,37" fill="#ffb4a2" />

          {/* Head */}
          <ellipse cx="80" cy="75" rx="58" ry="48" fill="#f4a261" />

          {/* Cheek tufts */}
          <ellipse cx="40" cy="88" rx="14" ry="10" fill="#f4a261" />
          <ellipse cx="120" cy="88" rx="14" ry="10" fill="#f4a261" />

          {/* Cheeks blush */}
          <ellipse cx="44" cy="86" rx="9" ry="6" fill="#ff7a59" opacity="0.6" />
          <ellipse cx="116" cy="86" rx="9" ry="6" fill="#ff7a59" opacity="0.6" />

          {/* Forehead markings */}
          <path d="M 75 35 L 80 46 L 85 35" stroke="#e76f51" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 68 38 L 73 48" stroke="#e76f51" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 92 38 L 87 48" stroke="#e76f51" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Eyes */}
          <g className="eye">
            <ellipse cx="56" cy="68" rx="10" ry="12" fill="#3b2f63" />
            <ellipse cx="104" cy="68" rx="10" ry="12" fill="#3b2f63" />
            {/* Eye shines */}
            <circle cx="53" cy="64" r="4" fill="#ffffff" />
            <circle cx="58" cy="72" r="1.8" fill="#ffffff" />
            <circle cx="101" cy="64" r="4" fill="#ffffff" />
            <circle cx="106" cy="72" r="1.8" fill="#ffffff" />
          </g>

          {/* Nose */}
          <polygon points="76,80 84,80 80,86" fill="#e76f51" />

          {/* Whiskers */}
          <line x1="28" y1="80" x2="48" y2="83" stroke="#3b2f63" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="26" y1="90" x2="48" y2="88" stroke="#3b2f63" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="132" y1="80" x2="112" y2="83" stroke="#3b2f63" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="134" y1="90" x2="112" y2="88" stroke="#3b2f63" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

          {/* Mouth */}
          {isSpeaking ? (
            <ellipse cx="80" cy="94" rx="8" ry="7" fill="#9d0208" />
          ) : (
            <path
              d="M 72 87 Q 80 94 80 88 Q 80 94 88 87"
              stroke="#3b2f63"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Bowtie / Island Collar */}
          <polygon points="70,118 90,118 80,123" fill="#2a9d8f" />
          <circle cx="80" cy="120" r="4" fill="#e9c46a" />
        </svg>
      </div>
    </div>
  );
};
