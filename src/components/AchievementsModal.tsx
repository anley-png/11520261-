import React from 'react';
import { Achievement } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
          animation: 'p 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#3b2f63' }}>🏆 Play Store Trophies</h3>
            <small style={{ color: '#666' }}>
              Unlocked: {unlockedCount} / {achievements.length} Badges
            </small>
          </div>
          <button
            onClick={onClose}
            style={{
              minHeight: '34px',
              padding: '4px 10px',
              background: '#eee',
              color: '#333',
              borderRadius: '12px',
              fontSize: '0.9rem',
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {achievements.map((item) => (
            <div
              key={item.id}
              style={{
                border: item.unlocked ? '2px solid #2a9d8f' : '2px dashed #ccc',
                background: item.unlocked ? '#f0fdf4' : '#fafafa',
                borderRadius: '16px',
                padding: '10px',
                textAlign: 'center',
                opacity: item.unlocked ? 1 : 0.75,
              }}
            >
              <div style={{ fontSize: '2rem', filter: item.unlocked ? 'none' : 'grayscale(1)' }}>
                {item.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px', color: '#3b2f63' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', minHeight: '32px' }}>
                {item.desc}
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: item.unlocked ? '#2a9d8f' : '#ddd',
                    color: item.unlocked ? '#fff' : '#666',
                  }}
                >
                  {item.unlocked ? '⭐ Unlocked!' : `${Math.round(item.progress * 100)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
