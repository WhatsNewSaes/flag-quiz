import { useGameContext } from '../contexts/GameContext';
import { NavBar } from '../components/NavBar';
import { CharactersPage } from '../components/journey/CharactersPage';
import { SEOHead } from '../components/seo/SEOHead';

export function CharactersRoute() {
  const { journeyProgress } = useGameContext();

  return (
    <>
      <SEOHead
        title="Characters - Unlockable Avatars | Flag Arcade"
        description="Browse and unlock pixel-art characters in Flag Arcade's Journey mode. Earn new avatars as you progress through the flag quiz."
        canonical="https://flagarcade.com/play/characters"
      />
      <NavBar />
      <CharactersPage
        unlockedCharacters={journeyProgress.unlockedCharacters}
      />
    </>
  );
}
