import { useGameContext } from '../contexts/GameContext';
import { NavBar } from '../components/NavBar';
import { CharactersPage } from '../components/journey/CharactersPage';

export function CharactersRoute() {
  const { journeyProgress } = useGameContext();

  return (
    <>
      <NavBar />
      <CharactersPage
        unlockedCharacters={journeyProgress.unlockedCharacters}
      />
    </>
  );
}
