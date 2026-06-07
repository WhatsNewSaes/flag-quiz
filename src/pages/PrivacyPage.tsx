import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { SUPPORT_EMAIL } from '../utils/accountDeletion';

const sectionClass = 'space-y-3';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Privacy Policy - Flag Arcade"
        description="Read the Flag Arcade privacy policy, including what data is collected, how it is used, and how to contact us."
        canonical="https://flagarcade.com/privacy"
      />

      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <article className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 md:p-10">
          <p className="font-retro text-[10px] text-retro-text-secondary mb-3">
            Last updated: June 7, 2026
          </p>
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-6">
            Privacy Policy
          </h1>

          <div className="space-y-7 font-body text-sm md:text-base text-retro-text-secondary leading-relaxed">
            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Overview</h2>
              <p>
                Flag Arcade is a geography and flag quiz game. You can play without creating an account. If you choose to sign in, we use your account only to support features such as progress sync.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Information We Collect</h2>
              <p>
                We may collect gameplay information such as progress, scores, achievements, preferences, and selected characters. If you sign in, we may collect account details provided through the authentication provider, such as your email address or user identifier.
              </p>
              <p>
                We also use basic analytics to understand how people use Flag Arcade, which pages or game modes are popular, and whether the app is working correctly.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">How We Use Information</h2>
              <p>
                We use information to run the game, save progress, improve game modes, fix bugs, understand aggregate usage, and keep the service reliable.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">What We Do Not Collect</h2>
              <p>
                Flag Arcade does not request access to precise location, contacts, photos, camera, microphone, health data, or payment information.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Service Providers</h2>
              <p>
                We may use trusted service providers for hosting, analytics, authentication, database storage, and app distribution. These providers process information only as needed to operate Flag Arcade.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Children</h2>
              <p>
                Flag Arcade is designed as a general-audience learning game. We do not knowingly collect personal information from children under 13. If you believe a child provided personal information, contact us so we can review and delete it where appropriate.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Your Choices</h2>
              <p>
                You can play without signing in. You can also clear local browser or app storage to remove local progress on your device.
              </p>
              <p>
                Signed-in players can request deletion of their account and cloud-synced data from the in-app account menu by choosing Delete Account, or by emailing{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-retro-neon-blue underline">{SUPPORT_EMAIL}</a>.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Retention And Deletion</h2>
              <p>
                Account deletion requests are completed within 30 days after verification. Cloud progress, account identity, leaderboard records, and user-linked analytics are deleted through that process. Anonymous aggregate analytics that are not linked to an identified user may be retained to understand reliability and aggregate usage.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="font-retro text-xs text-retro-text">Contact</h2>
              <p>
                For privacy questions or data requests, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-retro-neon-blue underline">{SUPPORT_EMAIL}</a>
                {' '}or visit the{' '}
                <Link to="/support" className="text-retro-neon-blue underline">support page</Link>.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
