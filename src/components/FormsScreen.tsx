import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  L,
  FORM_NAMES,
  SHORT_VOWELS,
  LONG_VOWELS,
  VowelItem,
  frmv,
  wf,
  vpar,
  wfv,
  isFormLocked,
  getLetterFormAudioId,
  getLetterVowelAudioId,
  getVowelPositionSlots,
  VowelSlotEntry,
  getFormWordsStrict,
} from '../data/arabicData';
import { say, boom, playSoundEffect } from '../utils/audio';

interface FormsScreenProps {
  initialLetter?: number;
  onSelectWord: (wordIndex: number) => void;
  showToast: (msg: string) => void;
  onAddStar?: () => void;
}

type TabMode = 'forms' | 'short_vowels' | 'long_vowels';

export const FormsScreen: React.FC<FormsScreenProps> = ({
  initialLetter = 1,
  onSelectWord,
  showToast,
  onAddStar,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<number>(initialLetter);
  const [activeTab, setActiveTab] = useState<TabMode>('forms');
  const [activeForm, setActiveForm] = useState<number>(() =>
    isFormLocked(initialLetter, 1) ? 0 : 1
  );
  const [activeVowel, setActiveVowel] = useState<VowelItem>(SHORT_VOWELS[0]);
  const [displayContent, setDisplayContent] = useState<React.ReactNode>(null);
  const [earnedStars, setEarnedStars] = useState<Record<string, boolean>>({});

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  // 1. Show Positional Form
  const showForm = useCallback(
    (p: number, silent = false) => {
      const locked = isFormLocked(selectedLetter, p);
      setActiveForm(p);

      if (locked) {
        setDisplayContent(
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3.5rem' }}>🔒</span>
            <div style={{ fontSize: '0.85rem', color: '#ff7a59', fontWeight: 700, marginTop: '4px' }}>
              Shy letter: Never joins next letter!
            </div>
          </div>
        );
        return;
      }

      setDisplayContent(
        <span key={`f-${p}-${Date.now()}`} className="w">
          {frmv(selectedLetter, p)}
        </span>
      );

      if (!silent) {
        say(L[selectedLetter][0], getLetterFormAudioId(selectedLetter, p), showToast);
      }
    },
    [selectedLetter, showToast]
  );

  // 2. Show Vowel (Short or Long)
  const showVowel = useCallback(
    (vowel: VowelItem, silent = false) => {
      clearTimeouts();
      setActiveVowel(vowel);

      const voweledText = L[selectedLetter][0] + vowel.mark;
      setDisplayContent(
        <span key={`v-${vowel.id}-${Date.now()}`} className="w">
          {voweledText}
        </span>
      );

      if (!silent) {
        const audioId = getLetterVowelAudioId(selectedLetter, vowel.audioIndex);
        say(voweledText, audioId, showToast);
      }
    },
    [selectedLetter, showToast]
  );

  // Shape-shift all 4 forms in sequence with audio
  const handleShapeShiftAll = () => {
    clearTimeouts();
    setActiveTab('forms');
    [0, 1, 2, 3].forEach((p, n) => {
      const tid = setTimeout(() => {
        showForm(p);
      }, n * 2400);
      timeoutsRef.current.push(tid);
    });
  };

  // Re-sync on letter or tab switch
  useEffect(() => {
    if (activeTab === 'forms') {
      const defaultForm = isFormLocked(selectedLetter, 1) ? 0 : 1;
      showForm(defaultForm, true);
    } else if (activeTab === 'short_vowels') {
      showVowel(SHORT_VOWELS[0], true);
    } else if (activeTab === 'long_vowels') {
      showVowel(LONG_VOWELS[0], true);
    }
  }, [selectedLetter, activeTab, showForm, showVowel]);

  // Handle star reward for exploring a word
  const handleCollectWordStar = (wordId: string, wordMeaning: string) => {
    if (earnedStars[wordId]) {
      showToast(`⭐ Already collected for ${wordMeaning}! Keep practicing!`);
      return;
    }
    setEarnedStars((prev) => ({ ...prev, [wordId]: true }));
    boom();
    playSoundEffect('correct');
    if (onAddStar) onAddStar();
    showToast(`🌟 Star awarded for learning ${wordMeaning}! Great job!`);
  };

  // Get strictly positioned words for Forms mode
  const formWords = getFormWordsStrict(selectedLetter, activeForm);

  // Get structured position words from files (Start, Middle, Final if available)
  const { slots: vowelSlots } = getVowelPositionSlots(selectedLetter, activeVowel.id);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4px' }}>
      {/* Top Header & Letter Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="letter-select" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Letter:
          </label>
          <select
            id="letter-select"
            value={selectedLetter}
            onChange={(e) => {
              clearTimeouts();
              setSelectedLetter(+e.target.value);
            }}
            style={{ padding: '6px 12px', fontSize: '1.05rem', minWidth: '130px' }}
          >
            {L.map((l, k) => (
              <option key={k} value={k}>
                {l[0]} — {l[1]} ({l[2]})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleShapeShiftAll}
          style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem', background: '#3b2f63' }}
        >
          ▶ Shape-shift all
        </button>
      </div>

      {/* Main Mode Tabs: 4 Forms vs Short Vowels vs Long Vowels */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
        <button
          onClick={() => {
            clearTimeouts();
            setActiveTab('forms');
            const targetForm = isFormLocked(selectedLetter, 1) ? 0 : 1;
            showForm(targetForm);
          }}
          style={{
            flex: 1,
            minHeight: '40px',
            padding: '8px 4px',
            fontSize: '0.85rem',
            background: activeTab === 'forms' ? '#ff7a59' : '#ffffff',
            color: activeTab === 'forms' ? '#ffffff' : '#3b2f63',
            border: '2px solid #ff7a59',
          }}
        >
          🧩 Four Forms
        </button>

        <button
          onClick={() => {
            clearTimeouts();
            setActiveTab('short_vowels');
            showVowel(SHORT_VOWELS[0]);
          }}
          style={{
            flex: 1,
            minHeight: '40px',
            padding: '8px 4px',
            fontSize: '0.85rem',
            background: activeTab === 'short_vowels' ? '#2a9d8f' : '#ffffff',
            color: activeTab === 'short_vowels' ? '#ffffff' : '#3b2f63',
            border: '2px solid #2a9d8f',
          }}
        >
          🔤 Short Vowels (حركات)
        </button>

        <button
          onClick={() => {
            clearTimeouts();
            setActiveTab('long_vowels');
            showVowel(LONG_VOWELS[0]);
          }}
          style={{
            flex: 1,
            minHeight: '40px',
            padding: '8px 4px',
            fontSize: '0.85rem',
            background: activeTab === 'long_vowels' ? '#6a4c93' : '#ffffff',
            color: activeTab === 'long_vowels' ? '#ffffff' : '#3b2f63',
            border: '2px solid #6a4c93',
          }}
        >
          〰️ Long Vowels (مدود)
        </button>
      </div>

      {/* Sub-selector Bar depending on Tab */}
      {activeTab === 'forms' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {FORM_NAMES.map((name, p) => {
            const locked = isFormLocked(selectedLetter, p);
            const isSelected = activeForm === p;
            return (
              <button
                key={p}
                className="t ar"
                style={{
                  minHeight: '62px',
                  padding: '4px',
                  border: isSelected ? '3px solid #ff7a59' : '2px solid transparent',
                  background: isSelected ? '#fff3eb' : '#ffffff',
                  boxShadow: isSelected ? '0 4px 10px rgba(255,122,89,0.25)' : undefined,
                }}
                onClick={() => {
                  clearTimeouts();
                  showForm(p);
                }}
              >
                <div style={{ fontSize: '1.9rem', lineHeight: 1.1 }}>
                  {locked ? '🔒' : frmv(selectedLetter, p)}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#3b2f63' }}>
                  {name}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'short_vowels' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {SHORT_VOWELS.map((v) => {
            const isSelected = activeVowel.id === v.id;
            return (
              <button
                key={v.id}
                className="t ar"
                style={{
                  minHeight: '62px',
                  padding: '4px',
                  border: isSelected ? '3px solid #2a9d8f' : '2px solid transparent',
                  background: isSelected ? '#e8f6f4' : '#ffffff',
                }}
                onClick={() => showVowel(v)}
              >
                <div style={{ fontSize: '1.8rem', lineHeight: 1.1 }}>
                  {L[selectedLetter][0] + v.mark}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#2a9d8f' }}>
                  {v.name} ({v.trans})
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'long_vowels' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {LONG_VOWELS.map((v) => {
            const isSelected = activeVowel.id === v.id;
            return (
              <button
                key={v.id}
                className="t ar"
                style={{
                  minHeight: '62px',
                  padding: '4px',
                  border: isSelected ? '3px solid #6a4c93' : '2px solid transparent',
                  background: isSelected ? '#f3edf9' : '#ffffff',
                }}
                onClick={() => showVowel(v)}
              >
                <div style={{ fontSize: '1.8rem', lineHeight: 1.1 }}>
                  {L[selectedLetter][0] + v.mark}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#6a4c93' }}>
                  {v.name} ({v.trans})
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Center Display: Animated Shape or Vowel with replay audio button */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '12px',
          boxShadow: '0 4px 14px rgba(59,47,99,0.08)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <div id="sh" className="ar big" style={{ fontSize: '4.5rem', lineHeight: 1.2 }}>
          {displayContent}
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b2f63', marginBottom: '4px' }}>
            {activeTab === 'forms'
              ? `${FORM_NAMES[activeForm]} Form of ${L[selectedLetter][1]}`
              : `${activeVowel.name} (${activeVowel.trans}) with ${L[selectedLetter][1]}`}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
            {activeTab === 'forms'
              ? activeForm === 1
                ? 'Appears at the start of the word'
                : activeForm === 2
                ? 'Holds letters on both sides in the middle'
                : activeForm === 3
                ? 'Appears at the final of the word'
                : 'Stands alone or separated'
              : `${activeVowel.arabicName} · Native Human Audio`}
          </div>

          <button
            onClick={() => {
              if (activeTab === 'forms') {
                showForm(activeForm);
              } else {
                showVowel(activeVowel);
              }
            }}
            style={{
              padding: '6px 14px',
              minHeight: '36px',
              fontSize: '0.85rem',
              background: activeTab === 'forms' ? '#ff7a59' : '#2a9d8f',
            }}
          >
            🔊 Hear Pronunciation
          </button>
        </div>
      </div>

      {/* Words Section: Strictly Positioned Words or 3 Star Words */}
      {activeTab === 'forms' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#3b2f63' }}>
              Words with {FORM_NAMES[activeForm]} Form {activeForm === 1 ? '(at Start)' : activeForm === 2 ? '(in the Middle)' : activeForm === 3 ? '(at the Final)' : '(Alone)'}:
            </span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              {formWords.length} words found
            </span>
          </div>

          {formWords.length > 0 ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              {formWords.map(({ k, wordData, charIndex }) => {
                const ix = wordData.indices || [];
                return (
                  <div
                    key={k}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '10px',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #f0edf8',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{wordData.emoji}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          say(wordData.vocalized || wordData.word, wordData.audioId || ('w' + k), showToast);
                        }}
                        style={{
                          background: '#e8f6f4',
                          color: '#2a9d8f',
                          minHeight: '30px',
                          padding: '2px 8px',
                          fontSize: '0.85rem',
                          boxShadow: 'none',
                        }}
                        title="Hear word recording"
                      >
                        🔊
                      </button>
                    </div>

                    <div
                      className="ar"
                      onClick={() => onSelectWord(k)}
                      style={{ fontSize: '2.1rem', textAlign: 'center', cursor: 'pointer', margin: '4px 0', lineHeight: 1.25 }}
                    >
                      {(() => {
                        const parsedForm = vpar(wordData.vocalized || wordData.word);
                        return parsedForm.length > 0 ? (
                          parsedForm.map((_, n) => {
                            const isTarget = n === charIndex;
                            return (
                              <span
                                key={n}
                                style={{
                                  color: isTarget ? '#e63946' : '#3b2f63',
                                  fontWeight: isTarget ? 900 : 500,
                                  backgroundColor: isTarget ? '#ffe8e8' : 'transparent',
                                  borderRadius: isTarget ? '6px' : undefined,
                                }}
                              >
                                {wfv(parsedForm, n)}
                              </span>
                            );
                          })
                        ) : (
                          ix.map((_, n) => (
                            <span
                              key={n}
                              style={{
                                color: n === charIndex ? '#e63946' : '#3b2f63',
                                fontWeight: n === charIndex ? 800 : 400,
                              }}
                            >
                              {wf(ix, n)}
                            </span>
                          ))
                        );
                      })()}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#555' }}>
                      <b>{wordData.meaning}</b>
                      {wordData.amharic && (
                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#777' }}>
                          {wordData.amharic}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectWord(k)}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        minHeight: '32px',
                        fontSize: '0.8rem',
                        background: '#3b2f63',
                      }}
                    >
                      Learn Word ▶
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', textAlign: 'center', color: '#777' }}>
              No words match this specific form yet. Try another form!
            </div>
          )}
        </div>
      ) : (
        /* VOWELS MODE: Word 1, Word 2, Word 3 construction matching attached document. If no words hold the vowel, leave the construction */
        vowelSlots.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#3b2f63' }}>
                {activeTab === 'short_vowels' ? 'Short Vowel' : 'Long Vowel'} ({activeVowel.name}):
              </span>
              <span style={{ fontSize: '0.8rem', color: '#666', background: '#f0edf8', padding: '2px 8px', borderRadius: '10px' }}>
                {vowelSlots.length} Word{vowelSlots.length > 1 ? 's' : ''} in Files
              </span>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {vowelSlots.map((item: VowelSlotEntry, idx: number) => {
                const { wordData, k, position, wordLabel, label, arabicLabel, diagram, charIndex } = item;
                const ix = wordData.indices || [];
                const isCollected = Boolean(earnedStars[wordData.id || String(k)]);

                const posColor =
                  position === 'start' ? '#2a9d8f' : position === 'mid' ? '#d48800' : '#6a4c93';
                const posBg =
                  position === 'start' ? '#e8f6f4' : position === 'mid' ? '#fff9e6' : '#f3edf9';

                return (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      border: `2px solid ${position === 'start' ? '#a7e0d8' : position === 'mid' ? '#ffd166' : '#d2bfe6'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Header: Word 1 / Word 2 / Word 3 as in handwritten sketch */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: posColor }}>
                        {wordLabel}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600 }}>
                        {label} ({arabicLabel})
                      </span>
                    </div>

                    {/* Visual Position Diagram: e.g. بُ × × or × بُ × or × × بُ */}
                    <div
                      className="ar"
                      style={{
                        background: posBg,
                        borderRadius: '10px',
                        padding: '4px',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: posColor,
                        marginBottom: '8px',
                        letterSpacing: '2px',
                      }}
                    >
                      {diagram}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.6rem' }}>{wordData.emoji}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          say(wordData.vocalized || wordData.word, wordData.audioId || ('w' + k), showToast);
                        }}
                        style={{
                          background: '#e8f6f4',
                          color: '#2a9d8f',
                          minHeight: '30px',
                          padding: '2px 8px',
                          fontSize: '0.85rem',
                          boxShadow: 'none',
                        }}
                        title="Listen to native pronunciation"
                      >
                        🔊 Listen
                      </button>
                    </div>

                    {/* Vocalized Word with Highlighted Target Character and Full Harakat */}
                    {(() => {
                      const parsed = vpar(wordData.vocalized || wordData.word);
                      return (
                        <>
                          <div
                            className="ar"
                            onClick={() => onSelectWord(k)}
                            style={{
                              fontSize: '2.5rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              margin: '6px 0',
                              lineHeight: 1.25,
                            }}
                            title="Click to practice word"
                          >
                            {parsed.length > 0 ? (
                              parsed.map((_, n) => {
                                const isTarget = n >= charIndex && n < charIndex + (item.spanLen || 1);
                                return (
                                  <span
                                    key={n}
                                    style={{
                                      color: isTarget ? '#e63946' : '#3b2f63',
                                      fontWeight: isTarget ? 900 : 500,
                                      backgroundColor: isTarget ? '#ffe8e8' : 'transparent',
                                      borderRadius: isTarget ? '8px' : undefined,
                                      padding: isTarget ? '0 2px' : undefined,
                                    }}
                                  >
                                    {wfv(parsed, n)}
                                  </span>
                                );
                              })
                            ) : (
                              ix.map((_, n) => (
                                <span
                                  key={n}
                                  style={{
                                    color: n === charIndex ? '#e63946' : '#3b2f63',
                                    fontWeight: n === charIndex ? 900 : 400,
                                  }}
                                >
                                  {wf(ix, n)}
                                </span>
                              ))
                            )}
                          </div>

                          {/* Explicit Target Sound Badge displaying letter WITH vowel mark */}
                          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <span
                              className="ar"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#fff3eb',
                                border: '1.5px solid #ff7a59',
                                borderRadius: '16px',
                                padding: '2px 10px',
                                fontSize: '1rem',
                                color: '#d90429',
                                fontWeight: 800,
                              }}
                            >
                              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#e63946' }}>
                                {item.vowelMarkDisplay || (L[selectedLetter][0] + activeVowel.mark)}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontFamily: 'system-ui, sans-serif', color: '#555', fontWeight: 700 }}>
                                ({activeVowel.name} · {label})
                              </span>
                            </span>
                          </div>
                        </>
                      );
                    })()}

                    {/* Meaning & Amharic */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <b style={{ fontSize: '0.95rem', color: '#333' }}>{wordData.meaning}</b>
                      {wordData.amharic && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                          {wordData.amharic}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                        “{wordData.transliteration}”
                      </div>
                    </div>

                    {/* Star Collection Button and Learn Button */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCollectWordStar(wordData.id || String(k), wordData.meaning)}
                        style={{
                          flex: 1,
                          minHeight: '34px',
                          padding: '4px',
                          fontSize: '0.8rem',
                          background: isCollected ? '#2a9d8f' : '#ffd166',
                          color: isCollected ? '#fff' : '#4d3800',
                        }}
                      >
                        {isCollected ? '✅ Star Saved' : '⭐ Collect Star'}
                      </button>
                      <button
                        onClick={() => onSelectWord(k)}
                        style={{
                          minHeight: '34px',
                          padding: '4px 10px',
                          fontSize: '0.8rem',
                          background: '#3b2f63',
                        }}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};
