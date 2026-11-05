import React, { useState } from 'react';
import { startVoiceRecognition, boom } from '../utils/audio';

interface VoicePracticeBarProps {
  targetText: string;
  label: string;
  onSuccess?: () => void;
  showToast: (msg: string) => void;
}

export const VoicePracticeBar: React.FC<VoicePracticeBarProps> = ({
  targetText,
  label,
  onSuccess,
  showToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const handleStartPractice = () => {
    if (isListening) return;
    setIsListening(true);
    setFeedback('Listening... Say the Arabic sound clearly! 🎙️');
    setLastTranscript(null);

    const stop = startVoiceRecognition(
      targetText,
      (res) => {
        setIsListening(false);
        setLastTranscript(res.transcript);
        setFeedback(res.feedback);
        if (res.isMatch) {
          boom();
          if (onSuccess) onSuccess();
          showToast('⭐ Great pronunciation! Star awarded!');
        }
      },
      (err) => {
        setIsListening(false);
        setFeedback(err);
      }
    );

    // auto-stop safety timeout
    setTimeout(() => {
      stop();
      setIsListening(false);
    }, 7000);
  };

  return (
    <div
      style={{
        margin: '10px auto',
        padding: '10px 14px',
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '420px',
        boxShadow: '0 2px 8px #0001',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          🎙️ Voice Practice: <b>{label}</b>
        </span>
        <button
          onClick={handleStartPractice}
          disabled={isListening}
          style={{
            minHeight: '38px',
            padding: '6px 12px',
            fontSize: '0.9rem',
            background: isListening ? '#2a9d8f' : '#ff7a59',
            animation: isListening ? 'p 0.8s infinite' : undefined,
          }}
        >
          {isListening ? '🔴 Listening...' : '🎙️ Speak'}
        </button>
      </div>

      {feedback && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#3b2f63' }}>
          {feedback}
          {lastTranscript && (
            <div style={{ marginTop: '3px', opacity: 0.8, fontSize: '0.8rem' }}>
              Heard: “{lastTranscript}”
            </div>
          )}
        </div>
      )}
    </div>
  );
};
