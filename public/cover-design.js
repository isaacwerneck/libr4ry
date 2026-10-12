export const IMAGE_BYTES = 120000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function imageBounds(value) {
  if (!['x', 'y', 'width', 'height'].every(key => Number.isFinite(value?.[key]))) throw new Error('Posição da imagem inválida.');
  const width = clamp(value.width, .06, 1);
  const height = clamp(value.height, .06, 1);
  return { x: clamp(value.x, 0, 1 - width), y: clamp(value.y, 0, 1 - height), width, height };
}

export function coverDesigns(value) {
  const result = {};
  for (const side of ['front', 'back']) {
    const source = value?.[side] || {};
    const design = {};
    if (/^#[0-9a-f]{6}$/i.test(source.color)) design.color = source.color;
    if (['leather', 'cloth', 'smooth'].includes(source.material)) design.material = source.material;
    if (['natural', 'fine', 'none'].includes(source.texture)) design.texture = source.texture;
    for (const name of ['title', 'subject']) {
      if (typeof source[name] === 'string') design[name] = source[name].slice(0, name === 'title' ? 80 : 60);
    }
    if (source.image) {
      const data = source.image.data;
      if (typeof data !== 'string' || !/^data:image\/webp;base64,UklGR[A-Za-z0-9+/]*={0,2}$/.test(data)
        || data.length > Math.ceil(IMAGE_BYTES / 3) * 4 + 23) throw new Error('Imagem da capa inválida ou muito grande.');
      design.image = { data, ...imageBounds(source.image) };
    }
    result[side] = design;
  }
  return result;
}

export function coverText(book, side) {
  const design = coverDesigns(book.covers)[side];
  return side === 'front' ? { title: book.title, subject: book.subject }
    : { title: design.title ?? '', subject: design.subject ?? '' };
}

export function resizeImage(start, dx, dy, corner) {
  const horizontal = corner.includes('w') ? -dx : dx;
  const vertical = corner.includes('n') ? -dy : dy;
  const scale = clamp(1 + (Math.abs(horizontal / start.width) > Math.abs(vertical / start.height)
    ? horizontal / start.width : vertical / start.height), Math.max(.06 / start.width, .06 / start.height),
  Math.min(1 / start.width, 1 / start.height));
  const width = start.width * scale;
  const height = start.height * scale;
  return imageBounds({ x: corner.includes('w') ? start.x + start.width - width : start.x,
    y: corner.includes('n') ? start.y + start.height - height : start.y, width, height });
}

export async function prepareCoverImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8000000) {
    throw new Error('Escolha uma imagem PNG, JPEG ou WebP de até 8 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 32000000) {
      throw new Error('A imagem deve ter até 32 megapixels.');
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const drawing = canvas.getContext('2d');
    if (!drawing) throw new Error('Este navegador não consegue preparar a imagem.');
    drawing.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.8, .6, .4]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob || blob.type !== 'image/webp') throw new Error('Este navegador não suporta imagens WebP.');
      if (blob.size <= IMAGE_BYTES) {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(blob);
        });
        return { data, aspect: canvas.width / canvas.height };
      }
    }
    throw new Error('Esta imagem continua muito grande. Escolha uma imagem mais simples.');
  } catch (error) {
    throw new Error(error.message || 'Não foi possível abrir a imagem.');
  } finally { URL.revokeObjectURL(url); }
}
