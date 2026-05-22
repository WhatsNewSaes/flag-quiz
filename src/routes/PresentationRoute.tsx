import { NavBar } from '../components/NavBar';
import { PresentationScreen } from '../screens/PresentationScreen';
import { SEOHead } from '../components/seo/SEOHead';

export function PresentationRoute() {
  return (
    <>
      <SEOHead
        title="Practice Mode - Flag Flashcards | Flag Arcade"
        description="Flashcard-style flag practice. Reveal answers at your own pace and learn every country flag without time pressure."
        canonical="https://flagarcade.com/play/presentation"
      />
      <NavBar />
      <PresentationScreen />
    </>
  );
}
