import React from 'react';
import { InteractiveCat } from './InteractiveCat';

interface HomeScreenProps {
  onStart: () => void;
  onGoTrace: () => void;
  onGoBalloon: () => void;
  showToast: (msg: string) => void;
  streak: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStart,
  onGoTrace,
  onGoBalloon,
  showToast,
  streak,
}) => {
  return (
    <div>
      <div style={{ margin: '10px 0' }}>
        <InteractiveCat size={130} mood="happy" showToast={showToast} />
      </div>

      <h1 style={{ margin: '6px 0', fontSize: '2.4rem' }}>Arabic Letter Island</h1>
      <p style={{ maxWidth: '480px', margin: '4px auto 16px auto', fontSize: '1.05rem', color: '#3b2f63' }}>
        Touch, hear, write and build Arabic letters and words with Mishmish the Cat!
      </p>

      {/* Daily streak chip */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '6px 16px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          marginBottom: '16px',
          fontWeight: 700,
          color: '#e76f51',
        }}
      >
        <span>🔥 {streak} Day Learning Streak!</span>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
        <button onClick={onStart} style={{ fontSize: '1.15rem', padding: '12px 24px' }}>
          🔤 Start Letters ▶
        </button>
        <button
          onClick={onGoTrace}
          style={{ fontSize: '1.1rem', padding: '12px 20px', background: '#2a9d8f' }}
        >
          ✍️ Finger Trace
        </button>
        <button
          onClick={onGoBalloon}
          style={{ fontSize: '1.1rem', padding: '12px 20px', background: '#6a4c93' }}
        >
          🎈 Balloon Pop
        </button>
      </div>

      {/* Play Store Features highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          maxWidth: '520px',
          margin: '20px auto 0 auto',
          textAlign: 'center',
        }}
      >
        <div style={{ background: '#fff', padding: '10px', borderRadius: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '1.6rem' }}>🔊</div>
          <b style={{ fontSize: '0.85rem' }}>AI Native Voice</b>
          <p style={{ fontSize: '0.75rem', margin: '2px 0 0 0', color: '#666' }}>Clear Arabic sounds & vowels</p>
        </div>
        <div style={{ background: '#fff', padding: '10px', borderRadius: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '1.6rem' }}>✍️</div>
          <b style={{ fontSize: '0.85rem' }}>Stroke Tracing</b>
          <p style={{ fontSize: '0.75rem', margin: '2px 0 0 0', color: '#666' }}>28 letters + 4 shapes</p>
        </div>
        <div style={{ background: '#fff', padding: '10px', borderRadius: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '1.6rem' }}>🏝️</div>
          <b style={{ fontSize: '0.85rem' }}>Grow Island</b>
          <p style={{ fontSize: '0.75rem', margin: '2px 0 0 0', color: '#666' }}>115 collectable words</p>
        </div>
      </div>
    </div>
  );
};
