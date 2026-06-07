import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { SUPPORT_EMAIL } from '../utils/accountDeletion';

export function SupportPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Support - Flag Arcade"
        description="Get support for Flag Arcade, including privacy questions, bug reports, and app store support."
        canonical="https://flagarcade.com/support"
      />

      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <article className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 md:p-10">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-6">
            Support
          </h1>

          <div className="space-y-5 font-body text-sm md:text-base text-retro-text-secondary leading-relaxed">
            <p>
              Need help with Flag Arcade, want to report a bug, or have a privacy request? Use the links below to reach the team.
            </p>

            <div className="border-2 border-retro-border bg-white/70 p-4 shadow-pixel-sm">
              <h2 className="font-retro text-xs text-retro-text mb-3">Contact</h2>
              <p>
                Flag Arcade is built by UX Cabin. For support, email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-retro-neon-blue underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                {' '}or visit{' '}
                <a
                  href="https://uxcabin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-retro-neon-blue underline"
                >
                  uxcabin.com
                </a>.
              </p>
            </div>

            <div className="border-2 border-retro-border bg-white/70 p-4 shadow-pixel-sm">
              <h2 className="font-retro text-xs text-retro-text mb-3">Account Deletion</h2>
              <p>
                Signed-in players can request deletion of their account and cloud-synced game data from the in-app menu by choosing Delete Account. You can also email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Flag Arcade account deletion request')}`}
                  className="text-retro-neon-blue underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                {' '}with the email address used to sign in.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/privacy"
                className="border-2 border-retro-border bg-retro-bg px-4 py-3 font-retro text-[10px] text-retro-text shadow-pixel-sm hover:translate-y-0.5 transition-transform"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="border-2 border-retro-border bg-retro-bg px-4 py-3 font-retro text-[10px] text-retro-text shadow-pixel-sm hover:translate-y-0.5 transition-transform"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
