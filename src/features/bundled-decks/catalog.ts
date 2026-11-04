import type { Library } from '../library/model';
import { withBundledAwsDeck, AWS_CATALOG_REVIEWED_AT } from './aws';
import {
  withBundledPatternsDeck,
  PATTERNS_CATALOG_REVIEWED_AT,
} from './patterns';
import { AWS_DECK_ID, PATTERNS_DECK_ID } from './ids';

export function withBundledDecks(library: Library): Library {
  return withBundledPatternsDeck(withBundledAwsDeck(library));
}

export function bundledDeckReviewedAt(id: string): string | undefined {
  if (id === AWS_DECK_ID) return AWS_CATALOG_REVIEWED_AT;
  if (id === PATTERNS_DECK_ID) return PATTERNS_CATALOG_REVIEWED_AT;
  return undefined;
}
