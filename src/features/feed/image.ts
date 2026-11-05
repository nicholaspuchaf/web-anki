export async function readFeedImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Escolha uma imagem PNG, JPEG ou WebP.');
  if (file.size > 8_000_000) throw new Error('A imagem deve ter até 8 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 50_000_000
    )
      throw new Error('Imagem inválida ou grande demais.');
    const scale = Math.min(
      1,
      1800 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a imagem.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/webp', 0.85);
    if (src.length > 4_000_000)
      throw new Error('A imagem continua grande. Escolha uma versão menor.');
    return src;
  } finally {
    URL.revokeObjectURL(url);
  }
}
