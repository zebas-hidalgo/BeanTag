/**
 * Client-side high performance image compressor for coffee bag OCR & AI vision.
 * Reduces 10MB+ raw phone camera photos to ~250KB JPEG while keeping text crisp.
 */
export async function compressImageForOcr(file, maxDimension = 1600, quality = 0.85) {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo de imagen.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No fue posible leer el archivo de imagen.'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no compatible para análisis.'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas context cannot be acquired
          const rawBase64 = e.target.result;
          return resolve({
            base64Data: rawBase64,
            mimeType: file.type || 'image/jpeg'
          });
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export to optimized JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve({
          base64Data: compressedDataUrl,
          mimeType: 'image/jpeg',
          width,
          height
        });
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
