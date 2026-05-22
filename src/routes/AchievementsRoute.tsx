import { useGameContext } from '../contexts/GameContext';
import { NavBar } from '../components/NavBar';
import { AchievementsPage } from '../components/journey/AchievementsPage';
import { SEOHead } from '../components/seo/SEOHead';

export function AchievementsRoute() {
  const { journeyProgress } = useGameContext();

  return (
    <>
      <SEOHead
        title="Achievements - Flag Quiz Badges | Flag Arcade"
        description="Track your flag quiz achievements. Unlock badges as you progress through Journey mode and master flags from every continent."
        canonical="https://flagarcade.com/play/achievements"
      />
      <NavBar />
      <AchievementsPage
        unlockedAchievements={journeyProgress.progress.achievements}
      />
    </>
  );
}
