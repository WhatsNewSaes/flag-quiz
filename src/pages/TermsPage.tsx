import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

const sectionClass = 'space-y-3';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Terms of Use - Flag Arcade"
        description="Read the Flag Arcade terms of use for playing the website and mobile app."
        canonical="https://flagarcade.com/terms"
      />

      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <article className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 md:p-10">
          <p className="font-retro text-[10px] text-retro-text-secondary mb-3">
            Last updated: June 7, 2026
          </p>
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-6">
            Terms of Use
          </h1>

          <div className="space-y-7 font-body text-sm md:text-base text-retro-text-secondary leading-relaxed">
            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Using Flag Arcade</h2>
              <p>
                Flag Arcade is provided for learning, practice, and entertainment. By using the site or mobile app, you agree to use it lawfully and respectfully.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Accounts And Progress</h2>
              <p>
                You can play many parts of Flag Arcade without an account. If account features are available, you are responsible for keeping your sign-in method secure.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Content</h2>
              <p>
                Flag names, geography facts, images, and game content are provided for educational use. We work to keep the information accurate, but country and territory information can change over time.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Availability</h2>
              <p>
                We may update, change, or remove features as the game improves. We do not guarantee that Flag Arcade will always be available or error-free.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Privacy</h2>
              <p>
                Your use of Flag Arcade is also covered by our{' '}
                <Link to="/privacy" className="text-retro-neon-blue underline">Privacy Policy</Link>.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Contact</h2>
              <p>
                For questions about these terms, visit the{' '}
                <Link to="/support" className="text-retro-neon-blue underline">support page</Link>.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
