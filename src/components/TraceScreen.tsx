import React, { useRef, useState, useEffect, useCallback } from 'react';
import { L, W, snd, FORM_NAMES, frmv, isFormLocked } from '../data/arabicData';
import { say, boom, playSoundEffect } from '../utils/audio';

interface TraceScreenProps {
  initialLetter?: number;
  initialWordIndex?: number;
  initialMode?: 'letters' | 'words';
  onAddStar: () => void;
  onGrowBuilt?: (wordIndex: number) => void;
  showToast: (msg: string) => void;
}

export const TraceScreen: React.FC<TraceScreenProps> = ({
  initialLetter = 0,
  initialWordIndex = 0,
  initialMode = 'letters',
  onAddStar,
  onGrowBuilt,
  showToast,
}) => {
  const [mode, setMode] = useState<'letters' | 'words'>(initialMode);
  const [selectedLetter, setSelectedLetter] = useState<number>(initialLetter);
  const [selectedForm, setSelectedForm] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<number>(initialWordIndex);
  const [coverage, setCoverage] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const templatePointsRef = useRef<Array<{ x: number; y: number; touched: boolean }>>([]);

  const currentWordData = W[selectedWord] || W[0];

  const targetText =
    mode === 'letters'
      ? selectedForm === 0
        ? L[selectedLetter][0]
        : frmv(selectedLetter, selectedForm)
      : currentWordData.vocalized || currentWordData.word;

  const initTemplate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid/dots guidelines
    ctx.strokeStyle = '#e2ecf5';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Baseline guide
    ctx.beginPath();
    ctx.moveTo(20, height * 0.65);
    ctx.lineTo(width - 20, height * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Calculate font size based on text length
    let fontSize = 150;
    if (mode === 'words') {
      const len = targetText.length;
      if (len <= 2) fontSize = 120;
      else if (len === 3) fontSize = 95;
      else if (len === 4) fontSize = 80;
      else fontSize = 66;
    }

    ctx.font = `bold ${fontSize}px "Noto Naskh Arabic", "Amiri", "Scheherazade New", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Faint reference letter/word guideline
    ctx.fillStyle = 'rgba(59, 47, 99, 0.12)';
    ctx.fillText(targetText, width / 2, height / 2 + 10);

    // Dotted stroke outline
    ctx.strokeStyle = '#ff7a59';
    ctx.lineWidth = mode === 'words' ? 3 : 4;
    ctx.setLineDash([6, 6]);
    ctx.strokeText(targetText, width / 2, height / 2 + 10);
    ctx.setLineDash([]);

    // Extract pixels to create target points for coverage check
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const samplePoints: Array<{ x: number; y: number; touched: boolean }> = [];
    const step = mode === 'words' ? 7 : 8;

    for (let y = 10; y < height - 10; y += step) {
      for (let x = 10; x < width - 10; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 40) {
          samplePoints.push({ x, y, touched: false });
        }
      }
    }
    templatePointsRef.current = samplePoints;
    setCoverage(0);
    setIsCompleted(false);
  }, [mode, targetText]);

  useEffect(() => {
    initTemplate();
    if (mode === 'letters') {
      say(snd(selectedLetter), 'l' + selectedLetter, showToast);
    } else {
      say(currentWordData.word, 'w' + selectedWord, showToast);
    }
  }, [initTemplate, mode, selectedLetter, selectedWord, currentWordData.word, showToast]);

  const checkProgress = () => {
    const points = templatePointsRef.current;
    if (!points.length) return;
    const touchedCount = points.filter((p) => p.touched).length;
    const pct = Math.min(100, Math.round((touchedCount / points.length) * 100));
    setCoverage(pct);

    const threshold = mode === 'words' ? 68 : 75;

    if (pct >= threshold && !isCompleted) {
      setIsCompleted(true);
      boom();
      playSoundEffect('correct');
      onAddStar();
      if (mode === 'letters') {
        say(snd(selectedLetter), 'l' + selectedLetter, showToast);
        showToast(`🎉 ممتاز! Mastered tracing letter ${L[selectedLetter][0]}!`);
      } else {
        if (onGrowBuilt) onGrowBuilt(selectedWord);
        say(currentWordData.vocalized || currentWordData.word, currentWordData.audioId || ('w' + selectedWord), showToast);
        showToast(`🎉 أحسنت! Mastered tracing word ${currentWordData.emoji} ${currentWordData.word}!`);
      }
    }
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Glowing brush stroke
    ctx.save();
    ctx.fillStyle = '#2a9d8f';
    ctx.shadowColor = '#2a9d8f';
    ctx.shadowBlur = 10;

    const brushRadius = mode === 'words' ? 14 : 16;
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, brushRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mark hit points
    const checkRadius = mode === 'words' ? 22 : 25;
    templatePointsRef.current.forEach((pt) => {
      if (!pt.touched) {
        const dist = Math.hypot(pt.x - x, pt.y - y);
        if (dist <= checkRadius) {
          pt.touched = true;
        }
      }
    });
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    drawPoint(x, y);
    checkProgress();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    drawPoint(x, y);
    checkProgress();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleNext = () => {
    if (mode === 'letters') {
      const next = (selectedLetter + 1) % L.length;
      setSelectedLetter(next);
      setSelectedForm(0);
    } else {
      const next = (selectedWord + 1) % W.length;
      setSelectedWord(next);
    }
  };

  const handlePrev = () => {
    if (mode === 'letters') {
      const prev = (selectedLetter - 1 + L.length) % L.length;
      setSelectedLetter(prev);
      setSelectedForm(0);
    } else {
      const prev = (selectedWord - 1 + W.length) % W.length;
      setSelectedWord(prev);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '4px 0' }}>✍️ Arabic Tracing Studio</h2>

      {/* Mode Selector Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
        <button
          onClick={() => {
            setMode('letters');
            initTemplate();
          }}
          style={{
            minHeight: '38px',
            padding: '6px 16px',
            background: mode === 'letters' ? '#ff7a59' : '#ffffff',
            color: mode === 'letters' ? '#ffffff' : '#3b2f63',
            border: mode === 'letters' ? '2px solid #3b2f63' : '1px solid #ccc',
          }}
        >
          🔤 Trace Letters
        </button>
        <button
          onClick={() => {
            setMode('words');
            initTemplate();
          }}
          style={{
            minHeight: '38px',
            padding: '6px 16px',
            background: mode === 'words' ? '#ff7a59' : '#ffffff',
            color: mode === 'words' ? '#ffffff' : '#3b2f63',
            border: mode === 'words' ? '2px solid #3b2f63' : '1px solid #ccc',
          }}
        >
          📖 Trace Words
        </button>
      </div>

      {/* Item Selector Row */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <button
          onClick={handlePrev}
          style={{ minHeight: '36px', padding: '4px 10px', fontSize: '0.85rem', background: '#3b2f63' }}
          title="Previous"
        >
          ◀ Prev
        </button>

        {mode === 'letters' ? (
          <>
            <select
              value={selectedLetter}
              onChange={(e) => {
                setSelectedLetter(+e.target.value);
                setSelectedForm(0);
              }}
            >
              {L.map((l, idx) => (
                <option key={idx} value={idx}>
                  {l[0]} {l[1]} ({l[2]})
                </option>
              ))}
            </select>

            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(+e.target.value)}
            >
              {FORM_NAMES.map((name, p) => (
                <option key={p} value={p} disabled={isFormLocked(selectedLetter, p)}>
                  {name} {isFormLocked(selectedLetter, p) ? '(Locked)' : ''}
                </option>
              ))}
            </select>
          </>
        ) : (
          <select
            value={selectedWord}
            onChange={(e) => setSelectedWord(+e.target.value)}
            style={{ maxWidth: '240px' }}
          >
            {W.map((w, idx) => (
              <option key={idx} value={idx}>
                {w.emoji} {w.word} ({w.meaning})
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleNext}
          style={{ minHeight: '36px', padding: '4px 10px', fontSize: '0.85rem', background: '#3b2f63' }}
          title="Next"
        >
          Next ▶
        </button>

        <button
          onClick={() =>
            mode === 'letters'
              ? say(snd(selectedLetter), 'l' + selectedLetter, showToast)
              : say(currentWordData.vocalized || currentWordData.word, currentWordData.audioId || ('w' + selectedWord), showToast)
          }
          style={{ minHeight: '36px', padding: '4px 12px', fontSize: '0.85rem', background: '#2a9d8f' }}
        >
          🔊 Hear
        </button>
      </div>

      {/* Mode Information Card */}
      {mode === 'words' && (
        <div
          style={{
            display: 'inline-block',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '6px 16px',
            marginBottom: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            fontSize: '1rem',
          }}
        >
          <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{currentWordData.emoji}</span>
          <b>{currentWordData.word}</b> = <i>{currentWordData.meaning}</i> (“{currentWordData.transliteration}”)
        </div>
      )}

      {/* Accuracy Meter */}
      <div
        style={{
          maxWidth: '380px',
          margin: '0 auto 8px auto',
          background: '#fff',
          borderRadius: '16px',
          padding: '6px 12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
          <span>Stroke Precision</span>
          <span style={{ color: coverage >= 70 ? '#2a9d8f' : '#ff7a59' }}>{coverage}%</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${coverage}%`,
              height: '100%',
              background: coverage >= 70 ? 'linear-gradient(90deg, #2a9d8f, #48cae4)' : 'linear-gradient(90deg, #ff7a59, #f4a261)',
              transition: 'width 0.2s',
            }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          display: 'inline-block',
          position: 'relative',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 6px 20px rgba(59, 47, 99, 0.12)',
          border: '3px solid #ff7a59',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={mode === 'words' ? 380 : 340}
          height={mode === 'words' ? 240 : 280}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ display: 'block', cursor: 'crosshair', maxWidth: '100%' }}
        />

        {isCompleted && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'p 0.3s ease-out',
            }}
          >
            <div style={{ fontSize: '3rem' }}>🌟</div>
            <h3 style={{ margin: '4px 0', color: '#2a9d8f' }}>
              {mode === 'letters' ? 'ممتاز! Well Traced!' : 'رائع! Word Mastered!'}
            </h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>
              {mode === 'letters'
                ? `You mastered letter ${L[selectedLetter][0]}!`
                : `You wrote ${currentWordData.emoji} ${currentWordData.word}! Added to Island!`}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={initTemplate} style={{ background: '#f4a261', minHeight: '38px', padding: '6px 14px' }}>
                🔄 Trace Again
              </button>
              <button onClick={handleNext} style={{ background: '#2a9d8f', minHeight: '38px', padding: '6px 14px' }}>
                Next {mode === 'letters' ? 'Letter' : 'Word'} ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={initTemplate}
          style={{ minHeight: '40px', padding: '6px 14px', background: '#6a4c93', fontSize: '0.9rem' }}
        >
          🧹 Clear Canvas
        </button>
        <button
          onClick={handleNext}
          style={{ minHeight: '40px', padding: '6px 14px', fontSize: '0.9rem' }}
        >
          Skip / Next ▶
        </button>
      </div>
    </div>
  );
};
