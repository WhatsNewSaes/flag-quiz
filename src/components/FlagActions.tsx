import { useState } from 'react';

interface FlagActionsProps {
  emoji: string;
  flagFilename: string;
  countryName: string;
  hasDownloadable: boolean;
}

export function FlagActions({ emoji, flagFilename, countryName, hasDownloadable }: FlagActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emoji);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked (e.g., insecure context); silently ignore.
    }
  }

  const buttonClass =
    'inline-flex items-center gap-1.5 text-sm font-body border border-retro-border/40 hover:border-retro-border bg-transparent px-3 py-1.5 transition-colors';

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      <button
        type="button"
        onClick={handleCopy}
        className={buttonClass}
        aria-label={`Copy ${countryName} flag emoji`}
      >
        <span aria-hidden="true">{emoji}</span>
        <span>{copied ? 'Copied!' : 'Copy'}</span>
      </button>
      {hasDownloadable && (
        <a
          href={`/flag-images/${flagFilename}`}
          download={flagFilename}
          className={buttonClass}
          aria-label={`Download ${countryName} flag SVG`}
        >
          <span aria-hidden="true">⬇</span>
          <span>Download SVG</span>
        </a>
      )}
    </div>
  );
}
