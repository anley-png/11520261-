import React, { useState, useMemo } from 'react';
import { W, L } from '../data/arabicData';
import { say } from '../utils/audio';

interface WordsScreenProps {
  onSelectWord: (wordIndex: number) => void;
  showToast?: (msg: string) => void;
}

export const WordsScreen: React.FC<WordsScreenProps> = ({ onSelectWord, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const filteredWords = useMemo(() => {
    return W.map((word, index) => ({ word, index })).filter(({ word }) => {
      const matchesSearch =
        !searchTerm ||
        word.word.includes(searchTerm) ||
        (word.vocalized && word.vocalized.includes(searchTerm)) ||
        word.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (word.amharic && word.amharic.includes(searchTerm)) ||
        word.transliteration.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSection =
        selectedSection === 'all' ||
        (word.section && word.section.startsWith(selectedSection));

      return matchesSearch && matchesSection;
    });
  }, [searchTerm, selectedSection]);

  const handlePlayAudio = (e: React.MouseEvent, word: typeof W[0], index: number) => {
    e.stopPropagation();
    say(word.vocalized || word.word, word.audioId || ('w' + index), showToast);
  };

  return (
    <div>
      <h2 style={{ margin: '4px 0' }}>📖 Arabic Vocabulary Words</h2>
      <p style={{ margin: '2px 0 10px 0', fontSize: '0.95rem' }}>
        {W.length} words recorded with native speaker pronunciation!
      </p>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="🔍 Search (Arabic, English, Amharic)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '16px',
            border: '2px solid #ff7a59',
            fontSize: '0.9rem',
            maxWidth: '240px',
            outline: 'none',
          }}
        />

        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.9rem' }}
        >
          <option value="all">All Letters ({W.length} words)</option>
          {L.map((l, i) => (
            <option key={i} value={`${i + 1}.`}>
              {i + 1}. {l[0]} ({l[1]})
            </option>
          ))}
        </select>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {filteredWords.map(({ word, index }) => (
          <button
            key={index}
            className="t"
            onClick={() => onSelectWord(index)}
            style={{ position: 'relative', textAlign: 'center', padding: '10px 8px' }}
          >
            {/* Quick listen button */}
            <span
              onClick={(e) => handlePlayAudio(e, word, index)}
              style={{
                position: 'absolute',
                top: '6px',
                left: '8px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                opacity: 0.85,
              }}
              title="Hear voice"
            >
              🔊
            </span>

            <span className="ar" style={{ fontSize: '2.5rem', display: 'block', margin: '2px 0' }}>
              {word.vocalized || word.word}
            </span>

            <small style={{ font: '13px sans-serif', display: 'block', lineHeight: 1.3 }}>
              {word.emoji} <b>{word.meaning}</b>
              {word.amharic && <span style={{ opacity: 0.85 }}> ({word.amharic})</span>}
              <br />
              <span style={{ color: '#666', fontStyle: 'italic' }}>“{word.transliteration}”</span>
            </small>
          </button>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <p style={{ marginTop: '20px', color: '#666' }}>No words match your search.</p>
      )}
    </div>
  );
};
