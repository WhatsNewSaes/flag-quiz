import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { playMenuSelectSound } from '../utils/sounds';
import { getFlagEmoji } from '../utils/flagEmoji';

type NavigateTarget =
  | 'mode-select'
  | 'achievements'
  | 'journey-map'
  | 'free-play'
  | 'campaign-quiz-select'
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

  const authName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Player';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
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

          {/* Right: Profile avatar */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Profile"
          >
            {!loading && user && avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-retro-border"
                referrerPolicy="no-referrer"
              />
            ) : !loading && user ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-retro-border ${
                isDark ? 'bg-yellow-400 text-[#1E3A8A]' : 'bg-retro-accent text-retro-text'
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-retro-border ${
                isDark ? 'bg-blue-700 text-yellow-400' : 'bg-gray-300 text-retro-text'
              }`}>
                ?
              </div>
            )}
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
        {/* Profile header */}
        <div className="border-b-[3px] border-retro-border p-4 bg-retro-accent/10">
          <div className="flex items-center justify-between">
            <span className="font-retro text-sm text-retro-text">Profile</span>
            <button
              onClick={close}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl text-retro-text"
              aria-label="Close profile"
            >
              &#10005;
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b-[3px] border-retro-border">
          <div className="flex items-center gap-3">
            {user && avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full border-2 border-retro-border"
                referrerPolicy="no-referrer"
              />
            ) : user ? (
              <div className="w-12 h-12 rounded-full bg-retro-accent flex items-center justify-center text-xl font-bold border-2 border-retro-border">
                {displayName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl border-2 border-retro-border">
                ?
              </div>
            )}
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
                    {user ? displayName : 'Guest'}
                  </span>
                  <span className="text-retro-text-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    &#9998;
                  </span>
                </button>
              )}
              <div className="font-retro text-xs text-retro-gold flex items-center gap-1 mt-1">
                <span className="text-sm">&#9733;</span> {totalStars} stars
              </div>
            </div>
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
                className="retro-btn w-full px-3 py-2 text-xs font-retro bg-retro-surface text-retro-text min-h-[44px]"
              >
                Sign In with Google
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
