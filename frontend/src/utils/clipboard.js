export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback...', err);
    }
  }

  // 2. Universal DOM fallback for HTTP, iOS Safari, PWAs & WebViews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Position in viewport without shifting layout
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    if (typeof navigator !== 'undefined' && navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    }

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Universal copy fallback failed:', err);
    return false;
  }
}

/**
 * Copies a PNG data URL as an image (to paste as a sticker in an Instagram story).
 * Safari needs the ClipboardItem built synchronously inside the tap, with a Promise for the blob.
 */
export async function copyImageToClipboard(dataUrl) {
  if (!dataUrl || typeof navigator === 'undefined' || !navigator.clipboard || typeof window === 'undefined' || !window.ClipboardItem) {
    throw new Error('Este navegador no permite copiar imágenes');
  }
  const blobPromise = fetch(dataUrl).then((r) => r.blob());
  try {
    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blobPromise })]);
  } catch (e) {
    const blob = await blobPromise;
    await navigator.clipboard.write([new window.ClipboardItem({ [blob.type || 'image/png']: blob })]);
  }
  return true;
}

// Plan B for browsers that refuse to copy images (older Safari, in-app browsers):
// open the share sheet so the user can "Guardar imagen", or download as a last resort.
export const STICKER_HINTS = {
  copied: 'Sticker copiado. En la story, mantén presionado y elige «Pegar».',
  shared: 'Elige «Guardar imagen» y añádelo a la story desde tu galería.',
  downloaded: 'Imagen descargada. Añádela a la story desde tu galería.'
};

export async function copyOrShareImage(dataUrl, filename = 'beantag-sticker.png') {
  try {
    await copyImageToClipboard(dataUrl);
    return 'copied';
  } catch (copyErr) {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'image/png' }) : null;
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (shareErr) {
        if (shareErr && shareErr.name === 'AbortError') return 'cancelled';
      }
    }
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    return 'downloaded';
  }
}
