import React, { useState } from 'react';
import { W, L } from '../data/arabicData';
import { IslandTheme } from '../types';
import { InteractiveCat } from './InteractiveCat';

interface IslandScreenProps {
  built: number[];
  misses: Record<number, number>;
  stars: number;
  streak: number;
  onOpenAchievements: () => void;
  showToast: (msg: string) => void;
}

const THEMES: { id: IslandTheme; name: string; icon: string; bg: string; minStars: number }[] = [
  { id: 'tropical', name: 'Tropical Oasis', icon: '🏝️', bg: 'linear-gradient(180deg, #a0e8af 0%, #38b000 100%)', minStars: 0 },
  { id: 'desert', name: 'Golden Dunes', icon: '🏜️', bg: 'linear-gradient(180deg, #ffe599 0%, #e69138 100%)', minStars: 5 },
  { id: 'starlight', name: 'Starlight Night', icon: '🌌', bg: 'linear-gradient(180deg, #3d348b 0%, #1b1b3a 100%)', minStars: 15 },
  { id: 'palace', name: 'Sultan Palace', icon: '🏰', bg: 'linear-gradient(180deg, #ffd166 0%, #ef476f 100%)', minStars: 25 },
];

export const IslandScreen: React.FC<IslandScreenProps> = ({
  built,
  misses,
  stars,
  streak,
  onOpenAchievements,
  showToast,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<IslandTheme>(() => {
    try {
      return (localStorage.getItem('island_theme') as IslandTheme) || 'tropical';
    } catch {
      return 'tropical';
    }
  });

  const missEntries = Object.entries(misses)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const handleSelectTheme = (themeId: IslandTheme, minStars: number) => {
    if (stars < minStars) {
      showToast(`⭐ Earn ${minStars} stars to unlock this island theme!`);
      return;
    }
    setSelectedTheme(themeId);
    try {
      localStorage.setItem('island_theme', themeId);
    } catch {
      // ignore
    }
    showToast(`🏝️ Switched to ${themeId} island!`);
  };

  const currentThemeConfig = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>🏝️ My Arabic Island</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span
            style={{
              background: '#fff',
              padding: '6px 12px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            🔥 {streak} {streak === 1 ? 'Day' : 'Days'} Streak
          </span>
          <button
            onClick={onOpenAchievements}
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.85rem', background: '#e76f51' }}
          >
            🏆 Badges
          </button>
        </div>
      </div>

      {/* Island Theme Selector */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '8px 0', flexWrap: 'wrap' }}>
        {THEMES.map((theme) => {
          const isUnlocked = stars >= theme.minStars;
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleSelectTheme(theme.id, theme.minStars)}
              style={{
                minHeight: '36px',
                padding: '4px 10px',
                fontSize: '0.85rem',
                background: isSelected ? '#ff7a59' : isUnlocked ? '#ffffff' : '#e0e0e0',
                color: isSelected ? '#ffffff' : '#3b2f63',
                border: isSelected ? '2px solid #3b2f63' : '1px solid #ccc',
                opacity: isUnlocked ? 1 : 0.65,
              }}
            >
              {theme.icon} {theme.name} {!isUnlocked && `(${theme.minStars}⭐)`}
            </button>
          );
        })}
      </div>

      {/* Main 3D-feel Island Diorama */}
      <div
        style={{
          position: 'relative',
          maxWidth: '560px',
          minHeight: '220px',
          margin: '12px auto',
          borderRadius: '32px',
          background: currentThemeConfig.bg,
          padding: '24px 16px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
          border: '4px solid #ffffff',
          color: selectedTheme === 'starlight' ? '#ffffff' : '#3b2f63',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.4s',
        }}
      >
        <InteractiveCat size={95} showToast={showToast} mood="cheering" />

        {/* Built Items Cloud / Garden */}
        <div
          style={{
            marginTop: '12px',
            fontSize: '2.8rem',
            lineHeight: 1.5,
            letterSpacing: '4px',
            textAlign: 'center',
            minHeight: '60px',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {built.length ? (
            built.map((k) => W[k].emoji).join(' ')
          ) : (
            <span style={{ fontSize: '1rem', fontStyle: 'italic', opacity: 0.9 }}>
              Build words to sprout trees, houses, and animals on your island!
            </span>
          )}
        </div>
      </div>

      {/* Progress metrics */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          maxWidth: '460px',
          margin: '12px auto',
          background: '#fff',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontWeight: 700,
        }}
      >
        <span>📖 {built.length} / {W.length} Words</span>
        <span>⭐ {stars} Stars</span>
        <span>🏝️ Level {Math.floor(stars / 10) + 1}</span>
      </div>

      {missEntries.length > 0 && (
        <div
          style={{
            maxWidth: '460px',
            margin: '8px auto',
            background: '#fff3cd',
            borderRadius: '16px',
            padding: '8px 14px',
            color: '#856404',
          }}
        >
          <b>🎯 Recommended Practice: </b>
          <span className="ar" style={{ fontSize: '1.4rem', marginRight: '6px' }}>
            {missEntries.map(([idx]) => L[+idx]?.[0]).filter(Boolean).join(' ')}
          </span>
        </div>
      )}
    </div>
  );
};
