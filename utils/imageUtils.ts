
// مخزن مؤقت للصور لتجنب إعادة التحميل في كل مرة
const imageCache = new Map<string, HTMLImageElement>();

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const loadImages = async (urls: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(
    urls.map(url => {
      if (imageCache.has(url)) return imageCache.get(url)!;
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
          imageCache.set(url, img);
          resolve(img);
        };
      });
    })
  );
};

export const mergeImages = async (
  images: HTMLImageElement[],
  mode: 'HORIZONTAL' | 'VERTICAL' | 'GRID',
  gap: number = 10,
  maxSize: number = 2000 // للتحكم في الجودة والسرعة
): Promise<string> => {
  if (images.length === 0) return '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // تفعيل تنعيم الصور
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (mode === 'HORIZONTAL') {
    const baseHeight = Math.min(maxSize, Math.max(...images.map(img => img.height)));
    const totalWidth = images.reduce((sum, img) => sum + (img.width * (baseHeight / img.height)), 0) + (images.length - 1) * gap;
    
    canvas.width = totalWidth;
    canvas.height = baseHeight;
    
    let x = 0;
    images.forEach(img => {
      const scaledWidth = img.width * (baseHeight / img.height);
      ctx.drawImage(img, x, 0, scaledWidth, baseHeight);
      x += scaledWidth + gap;
    });
  } else if (mode === 'VERTICAL') {
    const baseWidth = Math.min(maxSize, Math.max(...images.map(img => img.width)));
    const totalHeight = images.reduce((sum, img) => sum + (img.height * (baseWidth / img.width)), 0) + (images.length - 1) * gap;
    
    canvas.width = baseWidth;
    canvas.height = totalHeight;
    
    let y = 0;
    images.forEach(img => {
      const scaledHeight = img.height * (baseWidth / img.width);
      ctx.drawImage(img, 0, y, baseWidth, scaledHeight);
      y += scaledHeight + gap;
    });
  } else {
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    const cellSize = maxSize / cols;
    
    canvas.width = cols * cellSize + (cols - 1) * gap;
    canvas.height = rows * cellSize + (rows - 1) * gap;
    
    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);
      
      const scale = Math.min(cellSize / img.width, cellSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const offsetX = (cellSize - w) / 2;
      const offsetY = (cellSize - h) / 2;
      
      ctx.drawImage(img, x + offsetX, y + offsetY, w, h);
    });
  }

  return canvas.toDataURL('image/png', 0.9);
};
