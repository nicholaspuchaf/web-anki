export type FeedGesture = {
  x: number;
  y: number;
  atTop: boolean;
  atBottom: boolean;
};

export function carouselGesture(
  start: FeedGesture,
  end: { x: number; y: number },
  mobile: boolean,
): -1 | 0 | 1 {
  if (!mobile) return 0;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dy) < 72 || Math.abs(dy) < Math.abs(dx) * 1.25) return 0;
  if (dy < 0 && start.atBottom) return 1;
  if (dy > 0 && start.atTop) return -1;
  return 0;
}
