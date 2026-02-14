import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="retro-btn px-3 py-2 text-xs font-retro bg-retro-surface text-retro-text"
      >
        Sign In
      </button>
    );
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'Player';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 retro-btn px-2 py-1.5 bg-retro-surface text-retro-text"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-6 h-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-retro-accent flex items-center justify-center text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-retro max-w-[80px] truncate hidden sm:block">
          {displayName.split(' ')[0]}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 retro-window min-w-[180px]">
            <div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between">
              <span>✦</span><span>Account</span><span>✦</span>
            </div>
            <div className="retro-window-body p-3 space-y-3">
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-retro-accent flex items-center justify-center text-sm font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-xs text-retro-text truncate">
                  {displayName}
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setShowMenu(false);
                }}
                className="retro-btn w-full px-3 py-2 text-xs font-retro bg-retro-neon-red text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
