export type StudyImage = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl?: string;
};

export function parseStudyImage(value: unknown): StudyImage {
  if (!value || typeof value !== 'object') throw new Error('Imagem inválida.');
  const image = value as StudyImage;
  if (
    typeof image.src !== 'string' ||
    !/^\/study-assets\/[a-z0-9/-]+\.(png|svg|webp|jpg|jpeg)$/.test(image.src) ||
    typeof image.alt !== 'string' ||
    !image.alt.trim() ||
    typeof image.caption !== 'string' ||
    typeof image.credit !== 'string' ||
    (image.sourceUrl !== undefined &&
      (typeof image.sourceUrl !== 'string' || !isHttpsUrl(image.sourceUrl)))
  )
    throw new Error('Imagem inválida ou origem não permitida.');
  return {
    src: image.src,
    alt: image.alt,
    caption: image.caption,
    credit: image.credit,
    ...(image.sourceUrl ? { sourceUrl: image.sourceUrl } : {}),
  };
}
function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
