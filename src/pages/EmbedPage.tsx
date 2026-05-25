import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

const EMBED_URL = 'https://flagarcade.com/embed/arcade';

const SNIPPETS: { id: string; label: string; description: string; code: string }[] = [
  {
    id: 'responsive',
    label: 'Responsive',
    description: 'Fills the width of its container. Best for blog posts and LMS pages.',
    code: `<div style="position:relative;width:100%;max-width:720px;aspect-ratio:3/4;margin:0 auto;">
  <iframe
    src="${EMBED_URL}"
    title="Flag Arcade quiz"
    loading="lazy"
    allow="autoplay"
    style="position:absolute;inset:0;width:100%;height:100%;border:0;"
  ></iframe>
</div>`,
  },
  {
    id: 'fixed',
    label: 'Fixed size (600 × 800)',
    description: 'Set width and height in pixels. Works in Google Sites, Notion embeds, and other tools.',
    code: `<iframe
  src="${EMBED_URL}"
  title="Flag Arcade quiz"
  width="600"
  height="800"
  loading="lazy"
  allow="autoplay"
  style="border:0;"
></iframe>`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked (e.g., insecure context); silently ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel-sm px-3 py-2 hover:translate-y-0.5 hover:shadow-none transition-all"
    >
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  );
}

export function EmbedPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Embed the Flag Quiz on Your Site — Free for Teachers | Flag Arcade"
        description="Drop a free flag-guessing quiz into your classroom site, blog, or LMS. Works inside Google Classroom, Canvas, Notion, and any platform that allows iframes. No signup required."
        canonical="https://flagarcade.com/embed"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-3">
            Embed Flag Arcade
          </h1>
          <p className="font-body text-sm md:text-base text-retro-text-secondary max-w-xl mx-auto">
            Add a free flag-guessing quiz to your classroom site, blog, or LMS. No accounts,
            no ads, no tracking — just copy the snippet and paste it where you want the game
            to appear.
          </p>
        </header>

        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mb-6">
          <h2 className="font-retro text-sm text-retro-text mb-3">Live preview</h2>
          <div className="relative w-full mx-auto" style={{ maxWidth: 600, aspectRatio: '3 / 4' }}>
            <iframe
              src="/embed/arcade"
              title="Flag Arcade quiz preview"
              loading="lazy"
              className="absolute inset-0 w-full h-full border-2 border-retro-border"
            />
          </div>
          <p className="font-body text-xs text-retro-text-secondary mt-3 text-center">
            This is exactly what your visitors will see.
          </p>
        </section>

        {SNIPPETS.map((snippet) => (
          <section
            key={snippet.id}
            className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mb-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h2 className="font-retro text-sm text-retro-text">{snippet.label}</h2>
                <p className="font-body text-xs text-retro-text-secondary mt-1">
                  {snippet.description}
                </p>
              </div>
              <CopyButton text={snippet.code} />
            </div>
            <pre className="font-mono text-xs bg-retro-bg/40 border border-retro-border/40 p-3 overflow-x-auto whitespace-pre">
              <code>{snippet.code}</code>
            </pre>
          </section>
        ))}

        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mb-4">
          <h2 className="font-retro text-sm text-retro-text mb-3">Where it works</h2>
          <ul className="font-body text-sm text-retro-text-secondary space-y-2 list-disc pl-5">
            <li>Google Sites, Notion, WordPress, Wix, Squarespace, Webflow</li>
            <li>Canvas, Schoology, Blackboard, and other LMS platforms that allow HTML embeds</li>
            <li>Any classroom site or teacher blog that lets you paste an <code className="font-mono text-xs">&lt;iframe&gt;</code></li>
          </ul>
          <p className="font-body text-xs text-retro-text-secondary mt-3">
            Note: Google Classroom and Classwork.com don't accept raw iframe HTML inside
            assignments, but you can paste the direct link below as a "View material" link
            and students will open the quiz in a new tab.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="font-mono text-xs bg-retro-bg/40 border border-retro-border/40 px-2 py-1 break-all">
              {EMBED_URL}
            </code>
            <CopyButton text={EMBED_URL} />
          </div>
        </section>

        <section className="bg-retro-accent border-2 border-retro-border shadow-pixel-lg p-6 text-center">
          <h2 className="font-retro text-sm text-retro-text mb-2">Free forever for teachers</h2>
          <p className="font-body text-sm text-retro-text-secondary mb-4">
            All six game modes are free to play on the full site too.
          </p>
          <Link
            to="/play/modes"
            className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-6 py-3 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
          >
            Try All Game Modes
          </Link>
        </section>

        <nav className="mt-8 pb-8 text-center space-x-4">
          <Link to="/" className="font-body text-sm text-retro-neon-blue underline">Home</Link>
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/about" className="font-body text-sm text-retro-neon-blue underline">About</Link>
        </nav>
      </div>
    </div>
  );
}
