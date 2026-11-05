import { feedDatabase } from './feed-database';
import { parseFeed } from '../../features/feed/model';
import { feedDecks, carouselDeckId } from '../../features/feed/decks';

/** Read only existing metadata; never installs content or reinstates deleted resources. */
export async function readFeedDecks() {
  const db = await feedDatabase();
  try {
    const stored = await db.get('state', 'current');
    if (!stored) return { decks: [], referencedIds: new Set<string>() };
    const data = parseFeed(stored);
    return {
      decks: feedDecks(data),
      referencedIds: new Set(data.carousels.map(carouselDeckId)),
    };
  } finally {
    db.close();
  }
}
