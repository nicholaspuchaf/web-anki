import { withBundledAuvpDeck, AUVP_REVIEWED_AT } from './auvp';
import { AUVP_DECK_ID } from './ids';
import { withBundledMc714Deck, MC714_REVIEWED_AT } from './mc714';
import type { Library } from '../library/model';
import { withBundledAwsDeck, AWS_CATALOG_REVIEWED_AT } from './aws';
import {
  withBundledPatternsDeck,
  PATTERNS_CATALOG_REVIEWED_AT,
} from './patterns';
import { AWS_DECK_ID, PATTERNS_DECK_ID, MC714_DECK_ID } from './ids';

export function withBundledDecks(library: Library): Library {
  return withBundledAuvpDeck(
    withBundledMc714Deck(withBundledPatternsDeck(withBundledAwsDeck(library))),
  );
}

export function bundledDeckReviewedAt(id: string): string | undefined {
  if (id === AUVP_DECK_ID) return AUVP_REVIEWED_AT;
  if (id === MC714_DECK_ID) return MC714_REVIEWED_AT;
  if (id === AWS_DECK_ID) return AWS_CATALOG_REVIEWED_AT;
  if (id === PATTERNS_DECK_ID) return PATTERNS_CATALOG_REVIEWED_AT;
  return undefined;
}
