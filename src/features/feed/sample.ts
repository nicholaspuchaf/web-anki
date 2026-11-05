import catalog from '../../content/decks/learning/carousels';
import { parseFeed } from './model';
/** Default resources seed a fresh Feed once, with stable IDs. */
export const sampleFeed = parseFeed(catalog);
