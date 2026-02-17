import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { playMenuSelectSound } from '../utils/sounds';
import { getFlagEmoji } from '../utils/flagEmoji';
import { CharacterKey } from '../data/characters';

import boySouth from '../images/character/boy-south.png';
import girlSouth from '../images/character/girl-south.png';
import nicoSouth from '../images/character/nico-south.png';
import amaraSouth from '../images/character/amara-south.png';
import kitsuneSouth from '../images/character/kitsune-south.png';
import krakenSouth from '../images/character/kraken-south.png';
import dragonSouth from '../images/character/dragon-south.png';
import eagleSouth from '../images/character/eagle-south.png';
import phoenixSouth from '../images/character/phoenix-south.png';

const CHARACTER_THUMBS: Record<CharacterKey, string> = {
  boy: boySouth,
  girl: girlSouth,
  nico: nicoSouth,
  amara: amaraSouth,
  kitsune: kitsuneSouth,
  kraken: krakenSouth,
  dragon: dragonSouth,
  eagle: eagleSouth,
  phoenix: phoenixSouth,
};

type NavigateTarget =
  | 'mode-select'
  | 'achievements'
  | 'characters'
  | 'journey-map'
  | 'arcade'
  | 'jeopardy-difficulty-select'
  | 'around-the-world'
  | 'presentation'
  | 'flag-runner';

interface NavBarProps {
  onNavigate: (target: NavigateTarget) => void;
  totalStars?: number;
  variant?: 'default' | 'dark';
  unlockedModes?: string[];
}

function useCustomName(fallback: string) {
  const [customName, setCustomName] = useState<string>(() => {
    return localStorage.getItem('custom-display-name') || '';
  });

  function save(name: string) {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem('custom-display-name', trimmed);
      setCustomName(trimmed);
    } else {
      localStorage.removeItem('custom-display-name');
      setCustomName('');
    }
  }

  return { name: customName || fallback, isCustom: !!customName, save };
}

export function NavBar({ onNavigate, totalStars = 0, variant = 'default' }: NavBarProps) {
  const isDark = variant === 'dark';
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const [selectedCharThumb, setSelectedCharThumb] = useState(() => {
    const key = localStorage.getItem('selected-character')?.replace(/"/g, '') || 'boy';
    return CHARACTER_THUMBS[key as CharacterKey] || CHARACTER_THUMBS.boy;
  });

  useEffect(() => {
    const handler = () => {
      const key = localStorage.getItem('selected-character')?.replace(/"/g, '') || 'boy';
      setSelectedCharThumb(CHARACTER_THUMBS[key as CharacterKey] || CHARACTER_THUMBS.boy);
    };
    window.addEventListener('character-changed', handler);
    return () => window.removeEventListener('character-changed', handler);
  }, []);

  const authName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Guest';
  const { name: displayName, save: saveName } = useCustomName(authName);

  const favoriteFlag = localStorage.getItem('favorite-flag')?.replace(/"/g, '') || '';

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when profile drawer is open
  useEffect(() => {
    if (profileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [profileOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function close() {
    setProfileOpen(false);
    setEditing(false);
  }

  function startEditing() {
    setEditValue(displayName);
    setEditing(true);
  }

  function commitEdit() {
    saveName(editValue);
    setEditing(false);
  }

  return (
    <>
      {/* Sticky top bar */}
      <nav
        className={`nav-bar sticky top-0 z-20 backdrop-blur-sm px-4 py-2 ${
          isDark
            ? 'bg-[#1E3A8A]/95 border-b-[3px] border-blue-900'
            : 'bg-retro-bg/95 border-b-[3px] border-retro-border'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Game Modes — navigates to mode list */}
          <button
            onClick={() => { playMenuSelectSound(); onNavigate('mode-select'); }}
            className={`retro-btn px-4 py-1.5 font-retro text-sm min-h-[44px] ${
              isDark
                ? 'bg-yellow-400 text-[#1E3A8A]'
                : 'bg-retro-accent text-retro-text'
            }`}
          >
            Game Modes
          </button>

          {/* Right: Character avatar + hamburger menu */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="retro-btn min-h-[44px] flex items-center gap-1 px-2 py-1 bg-retro-surface"
            aria-label="Open menu"
          >
            <img
              src={selectedCharThumb}
              alt=""
              className="w-8 h-8"
              style={{ imageRendering: 'pixelated' }}
            />
            <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-retro-text'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`menu-backdrop ${profileOpen ? 'menu-backdrop-open' : ''}`}
        onClick={close}
      />

      {/* Profile Drawer */}
      <div className={`menu-drawer ${profileOpen ? 'menu-drawer-open' : ''}`}>
        {/* User info */}
        <div className="p-4 border-b-[3px] border-retro-border">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-retro-bg/40 border-2 border-retro-border/20 flex items-center justify-center">
              <img
                src={selectedCharThumb}
                alt=""
                className="w-12 h-12"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (

                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  onBlur={commitEdit}
                  maxLength={20}
                  className="w-full font-retro text-sm text-retro-text bg-retro-surface border-2 border-retro-border rounded px-2 py-1 outline-none"
                />
              ) : (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 group"
                >
                  {favoriteFlag && (
                    <span className="text-base">{getFlagEmoji(favoriteFlag)}</span>
                  )}
                  <span className="font-retro text-sm text-retro-text truncate">
                    {displayName}
                  </span>
                  <span className="text-retro-text-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    &#9998;
                  </span>
                </button>
              )}
              <div className="font-retro text-xs text-retro-gold flex items-center gap-1 mt-1">
                <span className="relative top-[-2px]">&#9733;</span> {totalStars} stars
              </div>
            </div>
            <button
              onClick={close}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-retro-text"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Achievements shortcut */}
        <button
          onClick={() => { playMenuSelectSound(); close(); onNavigate('achievements'); }}
          className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left border-b-[3px] border-retro-border hover:bg-retro-accent/10 transition-colors"
        >
          <span className="text-lg">&#127942;</span>
          <span className="font-retro text-sm text-retro-text">Achievements</span>
        </button>

        {/* Characters shortcut */}
        <button
          onClick={() => { playMenuSelectSound(); close(); onNavigate('characters'); }}
          className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left border-b-[3px] border-retro-border hover:bg-retro-accent/10 transition-colors"
        >
          <span className="text-lg">&#128100;</span>
          <span className="font-retro text-sm text-retro-text">Characters</span>
        </button>

        {/* Game Modes shortcut */}
        <button
          onClick={() => { playMenuSelectSound(); close(); onNavigate('mode-select'); }}
          className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left border-b-[3px] border-retro-border hover:bg-retro-accent/10 transition-colors"
        >
          <span className="text-lg">&#127918;</span>
          <span className="font-retro text-sm text-retro-text">Game Modes</span>
        </button>

        {/* Sign In / Sign Out */}
        <div className="p-4 mt-auto">
          {!loading && (
            user ? (
              <button
                onClick={() => { signOut(); close(); }}
                className="retro-btn w-full px-3 py-2 text-xs font-retro bg-retro-neon-red text-white min-h-[44px]"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => { signInWithGoogle(); close(); }}
                className="retro-btn w-full px-3 py-2 text-xs font-retro text-white min-h-[44px] rainbow-shimmer"
              >
                Save Progress
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
