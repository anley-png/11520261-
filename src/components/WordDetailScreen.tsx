import React, { useState, useEffect, useRef } from 'react';
import { W, L, COL, STEP, LEAD, wf, snd, shuf, vpar, wfv } from '../data/arabicData';
import { say, boom, playSoundEffect } from '../utils/audio';
import { VoicePracticeBar } from './VoicePracticeBar';

interface WordDetailScreenProps {
  wordIndex: number;
  onAddStar: () => void;
  onGrowBuilt: (wordIndex: number) => void;
  onBumpMiss: (letterIndex: number) => void;
  showToast: (msg: string) => void;
  onGoTraceWord?: (wordIndex: number) => void;
}

type Mode = 'idle' | 'watch' | 'build' | 'fix';

interface BuildTile {
  letterIndex: number;
  formChar: string;
  hidden: boolean;
  id: number;
}

export const WordDetailScreen: React.FC<WordDetailScreenProps> = ({
  wordIndex,
  onAddStar,
  onGrowBuilt,
  onBumpMiss,
  showToast,
  onGoTraceWord,
}) => {
  const wordData = W[wordIndex];
  const ix = wordData.indices;
  const parsed = vpar(wordData.vocalized || wordData.word);

  const [mode, setMode] = useState<Mode>('idle');
  const [infoText, setInfoText] = useState<React.ReactNode>('');
  const [finished, setFinished] = useState<boolean>(false);
  const [snapEffect, setSnapEffect] = useState<boolean>(false);

  // Watch mode state
  const [watchRevealedCount, setWatchRevealedCount] = useState<number>(0);

  // Build mode state
  const [buildPlacedLetters, setBuildPlacedLetters] = useState<Array<{ char: string; color: string; pop?: boolean }>>([]);
  const [buildTiles, setBuildTiles] = useState<BuildTile[]>([]);
  const [buildShakeIndex, setBuildShakeIndex] = useState<number | null>(null);

  // Fix mode state
  const [fixWordIndices, setFixWordIndices] = useState<number[]>([]);
  const [fixCorruptPos, setFixCorruptPos] = useState<number>(-1);
  const [fixLetterOptions, setFixLetterOptions] = useState<number[] | null>(null);
  const [fixShakeIndex, setFixShakeIndex] = useState<number | null>(null);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    // Reset state when wordIndex changes
    clearAllTimeouts();
    setMode('idle');
    setInfoText('');
    setFinished(false);
    setSnapEffect(false);
    setWatchRevealedCount(0);
    setBuildPlacedLetters([]);
    setBuildTiles([]);
    setFixLetterOptions(null);
    return () => clearAllTimeouts();
  }, [wordIndex]);

  const finish = () => {
    setFinished(true);
    setSnapEffect(true);
    playSoundEffect('correct');
    say(wordData.vocalized || wordData.word, wordData.audioId || ('w' + wordIndex), showToast);
    boom();
    onAddStar();
    onGrowBuilt(wordIndex);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch (e) {
        // ignore
      }
    }
  };

  // --- 1. WATCH MODE ---
  const handleWatch = () => {
    clearAllTimeouts();
    setMode('watch');
    setFinished(false);
    setSnapEffect(false);
    setInfoText('');
    setWatchRevealedCount(0);

    parsed.forEach((item, n) => {
      const x = ix[n];
      // Voice plays vocalized letter sound first
      const vocalizedCharSound = item.c + item.m;
      const tid1 = setTimeout(() => {
        say(vocalizedCharSound, 'l' + x, showToast);
      }, n * STEP);
      timeoutsRef.current.push(tid1);

      // Letter appears LEAD ms later with full vocalization
      const tid2 = setTimeout(() => {
        setWatchRevealedCount(n + 1);
        if (x !== undefined && !L[x][3] && n < parsed.length - 1) {
          setInfoText('🙈 Shy letter: it won’t hold hands!');
        }
      }, n * STEP + LEAD);
      timeoutsRef.current.push(tid2);
    });

    const tidFinish = setTimeout(() => {
      finish();
    }, parsed.length * STEP + LEAD + 500);
    timeoutsRef.current.push(tidFinish);
  };

  // --- 2. BUILD MODE ---
  const handleBuild = () => {
    clearAllTimeouts();
    setMode('build');
    setFinished(false);
    setSnapEffect(false);
    setInfoText('');
    setBuildPlacedLetters(Array(parsed.length).fill({ char: '', color: '' }));

    // Generate distractors
    const nonWordLetters = L.map((_, i) => i).filter((i) => !ix.includes(i));
    const distractors = shuf(nonWordLetters).slice(0, 2);

    const pool = shuf(
      ix
        .map((x, q) => ({ x, q }))
        .concat(
          distractors.map((x) => ({ x, q: Math.floor(Math.random() * ix.length) }))
        )
    );

    const tiles: BuildTile[] = pool.map(({ x, q }, idx) => {
      const copy = ix.slice();
      copy[q] = x;
      const tileChar = (x === ix[q] && parsed[q]) ? wfv(parsed, q) : wf(copy, q);
      return {
        letterIndex: x,
        formChar: tileChar,
        hidden: false,
        id: idx,
      };
    });

    setBuildTiles(tiles);
  };

  const handleTileClick = (tile: BuildTile) => {
    if (finished) return;
    const currentPos = buildPlacedLetters.findIndex((item) => !item.char);
    if (currentPos === -1) return;

    if (tile.letterIndex === ix[currentPos]) {
      // Correct letter
      playSoundEffect('pop');
      const vocalizedCharSound = parsed[currentPos] ? (parsed[currentPos].c + parsed[currentPos].m) : snd(tile.letterIndex);
      say(vocalizedCharSound, 'l' + tile.letterIndex, showToast);
      const nextPlaced = [...buildPlacedLetters];
      nextPlaced[currentPos] = {
        char: parsed[currentPos] ? wfv(parsed, currentPos) : wf(ix, currentPos),
        color: COL[currentPos % 6],
        pop: true,
      };
      setBuildPlacedLetters(nextPlaced);

      setBuildTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, hidden: true } : t))
      );

      if (currentPos + 1 === parsed.length) {
        const tid = setTimeout(() => {
          finish();
        }, 600);
        timeoutsRef.current.push(tid);
      }
    } else {
      // Wrong letter
      playSoundEffect('wrong');
      onBumpMiss(ix[currentPos]);
      say(snd(ix[currentPos]), 'l' + ix[currentPos], showToast);
      setBuildShakeIndex(currentPos);
      const nextPlaced = [...buildPlacedLetters];
      nextPlaced[currentPos] = { char: '🤔', color: '' };
      setBuildPlacedLetters(nextPlaced);

      const tid = setTimeout(() => {
        setBuildShakeIndex(null);
        setBuildPlacedLetters((prev) => {
          const reset = [...prev];
          if (reset[currentPos]?.char === '🤔') {
            reset[currentPos] = { char: '', color: '' };
          }
          return reset;
        });
      }, 600);
      timeoutsRef.current.push(tid);
    }
  };

  // --- 3. FIX IT MODE ---
  const handleFix = () => {
    clearAllTimeouts();
    setMode('fix');
    setFinished(false);
    setSnapEffect(false);
    setInfoText('One letter is wrong. Tap it!');
    setFixLetterOptions(null);

    const corruptPos = Math.floor(Math.random() * ix.length);
    const good = ix[corruptPos];
    let bad: number;
    do {
      bad = Math.floor(Math.random() * 28);
    } while (bad === good);

    const altered = ix.slice();
    altered[corruptPos] = bad;

    setFixCorruptPos(corruptPos);
    setFixWordIndices(altered);
  };

  const handleFixLetterClick = (clickedIndex: number) => {
    if (fixLetterOptions !== null) return;
    if (clickedIndex !== fixCorruptPos) {
      setFixShakeIndex(clickedIndex);
      setTimeout(() => setFixShakeIndex(null), 400);
      return;
    }

    const good = ix[fixCorruptPos];
    const bad = fixWordIndices[fixCorruptPos];
    const otherLetters = L.map((_, i) => i).filter((i) => i !== good && i !== bad);
    const randomThird = shuf(otherLetters)[0];

    const options = shuf([good, bad, randomThird]);
    setInfoText('Pick the right letter');
    setFixLetterOptions(options);
  };

  const handleFixOptionPick = (pickedLetter: number) => {
    const good = ix[fixCorruptPos];
    if (pickedLetter === good) {
      setFixLetterOptions(null);
      setFixWordIndices(ix);
      finish();
    } else {
      say(snd(good), 'l' + good, showToast);
      setFixShakeIndex(pickedLetter);
      setTimeout(() => setFixShakeIndex(null), 400);
    }
  };

  return (
    <div>
      <h2>
        {wordData.emoji} {wordData.meaning}
        {wordData.amharic && <span style={{ opacity: 0.8, fontSize: '0.9em' }}> ({wordData.amharic})</span>}
        {' — '}<span className="ar" style={{ color: '#ff7a59', fontSize: '1.2em' }}>{wordData.vocalized || wordData.word}</span>
        {' — '}“{wordData.transliteration}”
      </h2>

      {/* Main output area */}
      <div
        id="out"
        className={`big ar ${snapEffect ? 'snap' : ''}`}
        style={{ minHeight: '130px', direction: 'rtl' }}
      >
        {mode === 'idle' && (
          <span>{wordData.vocalized || wordData.word}</span>
        )}

        {mode === 'watch' && (
          <>
            {parsed.slice(0, watchRevealedCount).map((_, n) => (
              <span
                key={n}
                className="pop"
                style={{
                  color: COL[n % 6],
                  display: 'inline-block',
                }}
              >
                {wfv(parsed, n)}
              </span>
            ))}
          </>
        )}

        {mode === 'build' && (
          <>
            {buildPlacedLetters.map((tile, n) => (
              <span
                key={n}
                className={`box ${buildShakeIndex === n ? 'sh' : ''} ${
                  tile.pop ? 'pop' : ''
                }`}
                style={{
                  color: tile.color || '#3b2f63',
                  display: 'inline-block',
                }}
              >
                {tile.char}
              </span>
            ))}
          </>
        )}

        {mode === 'fix' && (
          <>
            {finished ? (
              parsed.map((_, n) => (
                <span
                  key={n}
                  style={{ color: COL[n % 6], display: 'inline-block' }}
                >
                  {wfv(parsed, n)}
                </span>
              ))
            ) : (
              fixWordIndices.map((_, n) => {
                const isCorrupt = n === fixCorruptPos;
                const displayChar = !isCorrupt && parsed[n] ? wfv(parsed, n) : wf(fixWordIndices, n);
                return (
                  <button
                    key={n}
                    className={`t ar ${fixShakeIndex === n ? 'sh' : ''}`}
                    onClick={() => handleFixLetterClick(n)}
                    style={{
                      fontSize: '4.5rem',
                      margin: '0 4px',
                      padding: '4px 10px',
                      minHeight: '80px',
                    }}
                  >
                    {displayChar}
                  </button>
                );
              })
            )}
          </>
        )}
      </div>

      <div id="info" style={{ minHeight: '28px', margin: '8px 0' }}>
        {infoText}
        {finished && (
          <div className="card">
            <h3>
              {wordData.emoji} {wordData.vocalized || wordData.word} = {wordData.meaning}
              {wordData.amharic && ` (${wordData.amharic})`} (“{wordData.transliteration}”)
            </h3>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <button
          onClick={() => say(wordData.vocalized || wordData.word, wordData.audioId || ('w' + wordIndex), showToast)}
          style={{ background: '#2a9d8f' }}
        >
          🔊 Hear Word
        </button>
        {onGoTraceWord && (
          <button
            onClick={() => onGoTraceWord(wordIndex)}
            style={{ background: '#e76f51' }}
          >
            ✍️ Trace it
          </button>
        )}
        <button id="wb" onClick={handleWatch}>
          ▶ Watch
        </button>
        <button id="bb" onClick={handleBuild}>
          🧱 Build it
        </button>
        <button id="fx" onClick={handleFix}>
          🔧 Fix it
        </button>
      </div>

      <VoicePracticeBar
        targetText={wordData.vocalized || wordData.word}
        label={`${wordData.emoji} ${wordData.vocalized || wordData.word}`}
        onSuccess={onAddStar}
        showToast={showToast}
      />

      {/* Mode-specific lower interactive area */}
      <div id="bd" style={{ marginTop: '12px' }}>
        {mode === 'build' && !finished && (
          <div className="grid ar">
            {buildTiles.map((tile) => (
              <button
                key={tile.id}
                className="t ar"
                onClick={() => handleTileClick(tile)}
                style={{
                  visibility: tile.hidden ? 'hidden' : 'visible',
                  fontSize: '2.5rem',
                }}
              >
                {tile.formChar}
              </button>
            ))}
          </div>
        )}

        {mode === 'fix' && fixLetterOptions && !finished && (
          <div className="grid ar">
            {fixLetterOptions.map((x) => (
              <button
                key={x}
                className={`t ar ${fixShakeIndex === x ? 'sh' : ''}`}
                onClick={() => handleFixOptionPick(x)}
                style={{ fontSize: '2.5rem' }}
              >
                {L[x][0]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
