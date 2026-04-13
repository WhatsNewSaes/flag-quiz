import { useGameContext } from '../contexts/GameContext';
import { NavBar } from '../components/NavBar';
import { AchievementsPage } from '../components/journey/AchievementsPage';

export function AchievementsRoute() {
  const { journeyProgress } = useGameContext();

  return (
    <>
      <NavBar />
      <AchievementsPage
        unlockedAchievements={journeyProgress.progress.achievements}
      />
    </>
  );
}
