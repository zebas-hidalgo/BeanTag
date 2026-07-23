import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { Trash2, Image as ImageIcon, Share2, ClipboardCopy, X, Search, RotateCcw, Filter, Zap, Droplet, Coffee } from 'lucide-react';
import { stripEmojis, RenderScaChips } from '../utils/scaIcons';

const METHOD_ICONS = {
  'V60 (Filtrado)': `${import.meta.env.BASE_URL}icons/v60.jpg`,
  'Espresso': `${import.meta.env.BASE_URL}icons/espresso.jpg`,
  'AeroPress': `${import.meta.env.BASE_URL}icons/aeropress.jpg`,
  'Prensa Francesa': `${import.meta.env.BASE_URL}icons/frenchpress.jpg`
};

const getMethodLucideIcon = (methodName, size = 18) => {
  const m = (methodName || '').toLowerCase();
  if (m.includes('v60') || m.includes('filtrado')) return <Filter size={size} color="var(--color-crimson)" />;
  if (m.includes('espresso') || m.includes('expresso')) return <Zap size={size} color="var(--color-crimson)" />;
  if (m.includes('aero') || m.includes('press')) return <Droplet size={size} color="var(--color-crimson)" />;
  if (m.includes('prensa') || m.includes('francesa')) return <Coffee size={size} color="var(--color-crimson)" />;
  return <Coffee size={size} color="var(--color-crimson)" />;
};

export default function BrewHistory({ onNavigateToInventory, onSelectBatch }) {
  const [history, setHistory] = useState(null); // null = loading, [] = empty
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [shareImage, setShareImage] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const [shareIncludeRecipe, setShareIncludeRecipe] = useState(true);
  const [shareTemplate, setShareTemplate] = useState('receipt');
  const textureRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setHistory(data);
        }
      });
      
    const img = new Image();
    img.src = '/paper_texture.jpg';
    img.onload = () => { textureRef.current = img; };

    return () => { active = false; };
  }, []);

  // J-Max microns calculator helper
  const parseGrindToMicrons = (grindStr) => {
    if (!grindStr || !grindStr.includes('J-Max:')) return null;
    const parts = grindStr.replace('J-Max:', '').trim().split('.');
    if (parts.length === 3) {
      const rot = parseInt(parts[0]) || 0;
      const num = parseInt(parts[1]) || 0;
      const click = parseInt(parts[2]) || 0;
      const totalClicks = (rot * 90) + (num * 10) + click;
      return Math.round(totalClicks * 8.8); // 8.8 microns per click
    }
    return null;
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const loadTexture = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = '/paper_texture.jpg';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const exportRecipeAsImage = (recipe, templateOverride, includeRecipeOverride) => {
    const currentTpl = templateOverride || shareTemplate || 'retro';
    const incRecipe = includeRecipeOverride !== undefined ? includeRecipeOverride : shareIncludeRecipe;
    setShareStatus('Generando vista previa...');
    setShareImage(null);

    try {
      const canvas = document.createElement('canvas');
      // Render at 2x resolution for ultra-sharp typography on high-DPI screens and chat apps
      const scaleFactor = 2;
      canvas.width = 840 * scaleFactor;
      canvas.height = 540 * scaleFactor;
      const ctx = canvas.getContext('2d');
      ctx.scale(scaleFactor, scaleFactor);

      const style = getComputedStyle(document.documentElement);
      const colorAccent = style.getPropertyValue('--color-crimson').trim() || '#F94C00';
      const colorTextDark = '#0F172A'; // High-contrast charcoal black
      const colorTextMuted = '#334155'; // High-contrast slate

      // Helpers para prevenir colisión y permitir salto de línea
      const drawTruncatedText = (text, x, y, maxWidth) => {
        const str = String(text || '');
        if (!maxWidth || ctx.measureText(str).width <= maxWidth) {
          ctx.fillText(str, x, y);
          return;
        }
        let truncated = str;
        while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + '…', x, y);
      };

      const drawFittedText = (text, x, y, maxWidth, initialSize, fontName = 'Outfit', weight = '800') => {
        const str = String(text || '');
        let size = initialSize;
        ctx.font = `${weight} ${size}px ${fontName}, sans-serif`;
        while (size > 14 && ctx.measureText(str).width > maxWidth) {
          size -= 1;
          ctx.font = `${weight} ${size}px ${fontName}, sans-serif`;
        }
        if (ctx.measureText(str).width > maxWidth) {
          drawWrappedText(str, x, y, maxWidth, size * 1.2, 2);
        } else {
          ctx.fillText(str, x, y);
        }
      };

      const drawWrappedText = (text, x, y, maxWidth, lineHeight = 22, maxLines = 3) => {
        const str = String(text || '');
        if (!str) return 0;
        const words = str.split(' ');
        let line = '';
        let currentY = y;
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
            lineCount++;
            if (lineCount >= maxLines - 1) {
              const remaining = words.slice(n).join(' ');
              drawTruncatedText(remaining, x, currentY, maxWidth);
              return lineCount + 1;
            }
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, currentY);
        return lineCount + 1;
      };

      // --- PLANTILLA: TICKET DE BARISTA AUTÉNTICO (THERMAL RECEIPT - HIGH DPI) ---
      ctx.clearRect(0, 0, 840, 540);

      // Dibujar cuerpo de recibo a ancho completo (0 a 840) con cortes zig-zag superior e inferior
      const tLeft = 0;
      const tRight = 840;
      const toothW = 14;
      const toothH = 10;
      const topY = 0;
      const bottomY = 540;

      ctx.beginPath();
      ctx.moveTo(tLeft, topY + toothH);

      // Corte zig-zag superior
      for (let x = tLeft; x < tRight; x += toothW) {
        ctx.lineTo(x + toothW / 2, topY);
        ctx.lineTo(Math.min(tRight, x + toothW), topY + toothH);
      }

      // Borde derecho
      ctx.lineTo(tRight, bottomY - toothH);

      // Corte zig-zag inferior
      for (let x = tRight; x > tLeft; x -= toothW) {
        ctx.lineTo(x - toothW / 2, bottomY);
        ctx.lineTo(Math.max(tLeft, x - toothW), bottomY - toothH);
      }

      // Borde izquierdo
      ctx.lineTo(tLeft, topY + toothH);
      ctx.closePath();

      // Rellenar recibo en papel térmico cremoso
      ctx.fillStyle = '#FAF8F5';
      ctx.fill();

      // Delinear silueta del papel cortado
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Central paper fold crease
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(420, 15);
      ctx.lineTo(420, 525);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = colorTextDark;
      ctx.font = '800 25px "Space Grotesk", sans-serif';
      drawTruncatedText(`RECIBO #0${recipe.id || '294'} | ${incRecipe ? 'REGISTRO DE EXTRACCIÓN' : 'FICHA TÉCNICA DE LOTE'}`, 50, 68, 740);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(50, 95); ctx.lineTo(790, 95); ctx.stroke();

      // Header Table Columns
      ctx.font = '800 17px "JetBrains Mono", monospace';
      ctx.fillStyle = colorTextMuted;
      drawTruncatedText('CANT.  DESCRIPCIÓN                        VALOR', 50, 125, 740);

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(50, 138); ctx.lineTo(790, 138); ctx.stroke();

      // Table Rows
      ctx.font = '800 20px "JetBrains Mono", monospace';
      ctx.fillStyle = colorTextDark;

      if (incRecipe) {
        drawTruncatedText('1x     GRANO:', 50, 175, 220);
        drawTruncatedText(String(recipe.batch_name || 'N/A').toUpperCase(), 230, 175, 360);
        drawTruncatedText(recipe.batch_roaster ? String(recipe.batch_roaster).toUpperCase() : 'SPECIALTY', 610, 175, 180);

        drawTruncatedText('1x     MÉTODO:', 50, 215, 220);
        drawTruncatedText(String(recipe.method || 'N/A').toUpperCase(), 230, 215, 360);
        drawTruncatedText(`${recipe.dose_in_g || 20}G`, 610, 215, 180);

        drawTruncatedText('1x     MOLIENDA:', 50, 255, 220);
        drawTruncatedText(String(recipe.grind || 'N/A').toUpperCase(), 230, 255, 360);
        drawTruncatedText(recipe.temperature || '93°C', 610, 255, 180);

        drawTruncatedText('1x     RATIO/TIEMPO:', 50, 295, 220);
        drawTruncatedText(String(recipe.ratio || '1:15').toUpperCase(), 230, 295, 360);
        drawTruncatedText(String(recipe.brew_time || '2:30').toUpperCase(), 610, 295, 180);
      } else {
        drawTruncatedText('1x     GRANO:', 50, 175, 220);
        drawTruncatedText(String(recipe.batch_name || 'N/A').toUpperCase(), 230, 175, 360);
        drawTruncatedText(recipe.batch_origin ? String(recipe.batch_origin).toUpperCase() : 'ORIGEN', 610, 175, 180);

        drawTruncatedText('1x     PRODUCTOR:', 50, 215, 220);
        drawTruncatedText(String(recipe.batch_producer || 'N/A').toUpperCase(), 230, 215, 360);
        drawTruncatedText('LOTE', 610, 215, 180);

        drawTruncatedText('1x     VARIEDAD:', 50, 255, 220);
        drawTruncatedText(String(recipe.batch_variety || 'N/A').toUpperCase(), 230, 255, 360);
        drawTruncatedText(recipe.batch_altitude ? String(recipe.batch_altitude).toUpperCase() : 'ALTITUD', 610, 255, 180);

        drawTruncatedText('1x     PROCESO:', 50, 295, 220);
        drawTruncatedText(String(recipe.batch_process || 'N/A').toUpperCase(), 230, 295, 360);
        drawTruncatedText(recipe.batch_roast_date ? String(recipe.batch_roast_date).toUpperCase() : 'TUESTE', 610, 295, 180);
      }

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(50, 335); ctx.lineTo(790, 335); ctx.stroke();
      ctx.restore();

      let receiptNotes = '';
      if (recipe.batch_roaster_notes) {
        const notesStr = String(recipe.batch_roaster_notes);
        if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
          const match = notesStr.match(/\[Notas: (.*?)\]/);
          if (match) receiptNotes = match[1].trim();
        } else if (notesStr.includes(' | ')) {
          receiptNotes = notesStr.split(' | ')[0].trim();
        } else {
          receiptNotes = notesStr.trim();
        }
      }
      if (!receiptNotes) receiptNotes = recipe.notes || 'ESPECIALIDAD';
      receiptNotes = stripEmojis(receiptNotes);

      ctx.font = '800 22px "JetBrains Mono", monospace';
      ctx.fillStyle = colorTextDark;
      drawTruncatedText(`NOTAS: ..... ${String(receiptNotes).toUpperCase()}`, 50, 368, 740);
      const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      drawTruncatedText(`FECHA: ..... ${receiptDate.toUpperCase()}`, 50, 405, 520);

      // Código de Barras Térmico Realista de Recibo POS
      ctx.fillStyle = colorTextDark;
      const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
      let curBarX = 50;
      barPattern.forEach((w, i) => {
        if (i % 2 === 0) {
          ctx.fillRect(curBarX, 432, w * 2.2, 38);
        }
        curBarX += (w * 2.2) + 2.5;
      });
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = colorTextMuted;
      ctx.fillText(`* 0 2 9 4 - B E A N T A G - ${recipe.id || '88'} *`, 50, 485);

      // Timbre circular personalizado BEANTAG + Fecha
      ctx.strokeStyle = colorAccent;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(650, 400, 62, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(650, 400, 56, 0, Math.PI * 2); ctx.stroke();
      
      ctx.font = '900 19px "Space Grotesk", sans-serif';
      ctx.fillStyle = colorAccent;
      ctx.textAlign = 'center';
      ctx.fillText('BEANTAG', 650, 393);
      
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.fillText(receiptDate.toUpperCase(), 650, 417);
      ctx.textAlign = 'left';
      const dataUrl = canvas.toDataURL('image/png');
      setShareImage(dataUrl);
      setShareStatus('✅ Tarjeta generada con éxito');
    } catch (err) {
      console.error("Canvas export error:", err);
      setShareStatus('❌ Error al generar tarjeta: ' + err.message);
    }
  };


  const handleNativeShare = async () => {
    if (!shareImage || !selectedRecipe) return;
    setShareStatus('Intentando compartir...');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    console.log("[BeanTag] NativeShare triggered. Env:", { isIOS, isStandalone, hasShare: !!navigator.share, hasClipboard: !!navigator.clipboard });

    try {
      const blob = dataURLtoBlob(shareImage);
      const filename = `${selectedRecipe.batch_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_receta.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Fallback 1: Web Share API with File
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          console.log("[BeanTag] Attempting Web Share with file...");
          await navigator.share({
            files: [file],
            title: `Receta de ${selectedRecipe.batch_name}`,
            text: `Calibración de café: ${selectedRecipe.method}`
          });
          setShareStatus('✅ Compartido con éxito');
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setShareStatus('Compartido cancelado por el usuario.');
            return;
          }
          console.warn("[BeanTag] Web Share con archivos falló:", shareErr);
        }
      }

      // Fallback 2: Web Share API con solo texto
      if (navigator.share) {
        try {
          console.log("[BeanTag] Attempting Web Share with text/link...");
          await navigator.share({
            title: `Receta de ${selectedRecipe.batch_name}`,
            text: `☕ Bitácora de Café: ${selectedRecipe.batch_name} - Método: ${selectedRecipe.method}\nMolienda: ${selectedRecipe.grind || 'N/A'}\nRatio: ${selectedRecipe.ratio || 'N/A'}`
          });
          setShareStatus('✅ Compartido enlace/texto con éxito');
          return;
        } catch (shareTextErr) {
          if (shareTextErr.name === 'AbortError') {
            setShareStatus('Compartido cancelado por el usuario.');
            return;
          }
          console.warn("[BeanTag] Web Share de texto falló:", shareTextErr);
        }
      }

      // Fallback 3: Copiar imagen al portapapeles (directo o con Promise)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          console.log("[BeanTag] Attempting Clipboard copy (direct blob)...");
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setShareStatus('📋 ¡Imagen copiada al portapapeles! Puedes pegarla directamente.');
          return;
        } catch (clipImgErr) {
          console.warn("[BeanTag] Copiar imagen al portapapeles (directo) falló, intentando con Promise...", clipImgErr);
          try {
            console.log("[BeanTag] Attempting Clipboard copy (promise wrapped)...");
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: Promise.resolve(blob)
              })
            ]);
            setShareStatus('📋 ¡Imagen copiada al portapapeles! Puedes pegarla directamente.');
            return;
          } catch (clipImgErrPromise) {
            console.warn("[BeanTag] Copiar imagen al portapapeles (con Promise) falló:", clipImgErrPromise);
          }
        }
      }

      // Fallback 4: Copiar texto al portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          console.log("[BeanTag] Attempting Clipboard text copy...");
          const recipeText = `☕ RECETA DE CAFÉ (BeanTag)\n` +
            `Café: ${selectedRecipe.batch_name}\n` +
            `Método: ${selectedRecipe.method}\n` +
            `Molienda: ${selectedRecipe.grind || 'N/A'}\n` +
            `Ratio: ${selectedRecipe.ratio || 'N/A'}\n` +
            `Tiempo: ${selectedRecipe.brew_time || 'N/A'}\n` +
            `Notas: ${selectedRecipe.notes || ''}`;
          await navigator.clipboard.writeText(recipeText);
          setShareStatus('📋 ¡Datos de la receta copiados como texto!');
          return;
        } catch (clipTextErr) {
          console.warn("[BeanTag] Copiar texto al portapapeles falló:", clipTextErr);
        }
      }

      // Fallback 5: Descarga directa (si no es iOS standalone)
      console.log("[BeanTag] Attempting direct anchor download...");
      const link = document.createElement('a');
      link.download = filename;
      link.href = shareImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (isIOS && isStandalone) {
        setShareStatus('📱 Safari PWA: Mantén presionada la imagen para guardarla.');
      } else {
        setShareStatus('📥 Descarga iniciada.');
      }
    } catch (e) {
      console.error("[BeanTag] All share and download attempts failed", e);
      setShareStatus('❌ Error al compartir. Mantén presionada la imagen para guardarla.');
    }
  };

  const handleDeleteRecipe = (recipeId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta preparación de la bitácora?')) {
      fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSelectedRecipe(null);
            fetch('/api/recipes')
              .then(res => res.json())
              .then(d => setHistory(d));
          }
        });
    }
  };

  const filteredHistory = (history || []).filter(recipe => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const batchName = (recipe.batch_name || '').toLowerCase();
      const roaster = (recipe.batch_roaster || recipe.roaster || '').toLowerCase();
      const origin = (recipe.batch_origin || recipe.origin || '').toLowerCase();
      const notes = (recipe.notes || '').toLowerCase();
      const method = (recipe.method || '').toLowerCase();
      
      return batchName.includes(term) || roaster.includes(term) || origin.includes(term) || notes.includes(term) || method.includes(term);
    }
    return true;
  });

  // R3: Skeleton loading state
  if (history === null) return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Bitácoras
      </h2>
      {[1, 2, 3].map(i => (
        <div key={i} className="candy-card skeleton-card" style={{ cursor: 'default', height: '90px' }}>
          <div className="skeleton-line" style={{ width: '50%', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '10px', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '30%', height: '10px', marginTop: '6px' }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', margin: 0 }}>
          Bitácoras
        </h2>
        {history.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
            {filteredHistory.length} {filteredHistory.length === 1 ? 'receta' : 'recetas'}
          </span>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, tostador, método u origen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="candy-input"
              style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {history.length === 0 ? (
        /* R8: Empty state CTA with guidance */
        <div className="candy-card static" style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>☕</div>
          <p style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Aún no has registrado ninguna receta.</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
            Selecciona un café del congelador y registra tu primera preparación.
          </p>
          <button className="btn-candy primary" style={{ margin: '0 auto' }} onClick={onNavigateToInventory}>
            Ir al Congelador
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="candy-card static soft-fade-in" style={{ textAlign: 'center', padding: '30px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>No hay resultados</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      ) : (
        filteredHistory.map(item => {
          const microns = parseGrindToMicrons(item.grind);
          return (
            <div 
              key={item.id} 
              className="candy-card soft-fade-in" 
              style={{ borderLeft: '6px solid var(--color-crimson)' }}
              onClick={() => setSelectedRecipe(item)}
            >
              <div className="card-header-flex">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
                      {getMethodLucideIcon(item.method, 16)}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', margin: 0, textTransform: 'uppercase' }}>{item.method}</h3>
                  </div>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectBatch) onSelectBatch(item.batch_id);
                    }}
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: 'var(--color-crimson)', 
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {item.batch_name}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568' }}>
                  {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                <p style={{ margin: '2px 0' }}>
                  <strong>Molienda:</strong> {item.grind || 'N/A'} {microns ? `(~${microns} µm)` : ''} | <strong>Ratio:</strong> {item.ratio || 'N/A'}
                </p>
                
                {/* Sensory properties tag row (Balance, Body, Extraction) */}
                {(item.sensory_balance || item.sensory_body || item.sensory_extraction) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                    {item.sensory_balance && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#FEEBC8', color: '#C05621', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FBD38D' }}>
                        ⚖️ {item.sensory_balance}
                      </span>
                    )}
                    {item.sensory_body && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#EBF8FF', color: '#2B6CB0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BEE3F8' }}>
                        🍯 {item.sensory_body}
                      </span>
                    )}
                    {item.sensory_extraction && (
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold',
                        background: item.sensory_extraction === 'En Punto' ? '#C6F6D5' : '#FED7D7',
                        color: item.sensory_extraction === 'En Punto' ? '#22543D' : '#9B2C2C',
                        padding: '2px 6px', borderRadius: '4px',
                        border: item.sensory_extraction === 'En Punto' ? '1px solid #9AE6B4' : '1px solid #FEB2B2'
                      }}>
                        🧪 {item.sensory_extraction === 'Sub' ? 'Sub-ext' : item.sensory_extraction === 'Sobre' ? 'Sobre-ext' : 'En Punto'}
                      </span>
                    )}
                  </div>
                )}

                {item.notes && <p style={{ margin: '4px 0 2px 0', fontStyle: 'italic', color: 'var(--color-text)' }}><strong>Notas:</strong> {item.notes}</p>}
                <RenderScaChips notesStr={item.batch_roaster_notes || item.notes} />
              </div>
            </div>
          );
        })
      )}

      {/* Modal / Vista de Detalle de Receta */}
      {selectedRecipe && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 5, 5, 0.4)', // backdrop overlay
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', boxSizing: 'border-box'
        }} onClick={() => setSelectedRecipe(null)}>
          <div className="candy-card static" style={{
            maxWidth: '380px', width: '100%',
            padding: '20px', boxSizing: 'border-box',
            boxShadow: '8px 8px 0px var(--border-color)',
            animation: 'soft-pop 250ms var(--transition-spring)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
                    {getMethodLucideIcon(selectedRecipe.method, 18)}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: 0, textTransform: 'uppercase' }}>
                    {selectedRecipe.method}
                  </h3>
                </div>
                <span 
                  onClick={() => {
                    setSelectedRecipe(null);
                    if (onSelectBatch) onSelectBatch(selectedRecipe.batch_id);
                  }}
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 900, 
                    color: 'var(--color-crimson)', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {selectedRecipe.batch_name}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568', background: '#EDF2F7', padding: '3px 8px', borderRadius: '4px', border: '2px solid var(--border-color)' }}>
                {new Date(selectedRecipe.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Ficha técnica de la preparación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2.5px solid var(--border-color)', borderBottom: '2.5px solid var(--border-color)', padding: '12px 0', margin: '14px 0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Molienda:</span>
                <strong>{selectedRecipe.grind || 'N/A'} {parseGrindToMicrons(selectedRecipe.grind) ? `(~${parseGrindToMicrons(selectedRecipe.grind)} µm)` : ''}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Ratio:</span>
                <strong>{selectedRecipe.ratio || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Tiempo de Extracción:</span>
                <strong>{selectedRecipe.brew_time || 'N/A'}</strong>
              </div>
              {selectedRecipe.temperature && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Temperatura:</span>
                  <strong>{selectedRecipe.temperature}</strong>
                </div>
              )}
            </div>

            {/* Evaluación sensorial */}
            {(selectedRecipe.sensory_balance || selectedRecipe.sensory_body || selectedRecipe.sensory_extraction) && (
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 8px 0', color: 'var(--color-crimson)' }}>
                  Evaluación Sensorial
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedRecipe.sensory_balance && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#FEEBC8', color: '#C05621', padding: '4px 8px', borderRadius: '4px', border: '2px solid var(--border-color)' }}>
                      ⚖️ {selectedRecipe.sensory_balance}
                    </span>
                  )}
                  {selectedRecipe.sensory_body && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '4px', border: '2px solid var(--border-color)' }}>
                      🍯 {selectedRecipe.sensory_body}
                    </span>
                  )}
                  {selectedRecipe.sensory_extraction && (
                    <span style={{
                      fontSize: '10px', fontWeight: 'bold',
                      background: selectedRecipe.sensory_extraction === 'En Punto' ? '#C6F6D5' : '#FED7D7',
                      color: selectedRecipe.sensory_extraction === 'En Punto' ? '#22543D' : '#9B2C2C',
                      padding: '4px 8px', borderRadius: '4px',
                      border: '2px solid var(--border-color)'
                    }}>
                      🧪 {selectedRecipe.sensory_extraction === 'Sub' ? 'Sub-ext' : selectedRecipe.sensory_extraction === 'Sobre' ? 'Sobre-ext' : 'En Punto'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notas y Puntuación */}
            {(() => {
              let displayNotes = '';
              if (selectedRecipe.batch_roaster_notes) {
                const notesStr = String(selectedRecipe.batch_roaster_notes);
                if (notesStr.includes(' | ')) {
                  displayNotes = stripEmojis(notesStr.split(' | ')[1].trim());
                } else if (!notesStr.includes('[Notas: ')) {
                  displayNotes = stripEmojis(notesStr.trim());
                }
              }
              if (!displayNotes && selectedRecipe.notes) {
                displayNotes = selectedRecipe.notes;
              }
              
              if (!displayNotes) return null;

              return (
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-crimson)' }}>
                    Notas de Cata
                  </h4>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '12px', lineHeight: '1.4' }}>
                    "{displayNotes}"
                  </p>
                </div>
              );
            })()}

            {/* Opciones de Compartir */}
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              border: '2px solid var(--border-color)', 
              borderRadius: '6px', 
              backgroundColor: 'var(--bg-canvas)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '900', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
                Tipo de Tarjeta para Compartir
              </span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-candy"
                  onClick={() => { setShareIncludeRecipe(true); if (selectedRecipe) exportRecipeAsImage(selectedRecipe, shareTemplate, true); }}
                  style={{ 
                    flex: 1, 
                    margin: 0, 
                    fontSize: '10px', 
                    padding: '8px 4px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--bg-card)',
                    color: shareIncludeRecipe ? '#FFFFFF' : 'var(--color-text)',
                    boxShadow: shareIncludeRecipe ? 'none' : '3px 3px 0px var(--border-color)',
                    transform: shareIncludeRecipe ? 'translate(2px, 2px)' : 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Grano + Receta
                </button>
                <button 
                  type="button" 
                  className="btn-candy"
                  onClick={() => { setShareIncludeRecipe(false); if (selectedRecipe) exportRecipeAsImage(selectedRecipe, shareTemplate, false); }}
                  style={{ 
                    flex: 1, 
                    margin: 0, 
                    fontSize: '10px', 
                    padding: '8px 4px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: !shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--bg-card)',
                    color: !shareIncludeRecipe ? '#FFFFFF' : 'var(--color-text)',
                    boxShadow: !shareIncludeRecipe ? 'none' : '3px 3px 0px var(--border-color)',
                    transform: !shareIncludeRecipe ? 'translate(2px, 2px)' : 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Solo Grano
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDeleteRecipe(selectedRecipe.id)}>
                  <Trash2 size={12} strokeWidth={2.5} />
                  Eliminar
                </button>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => exportRecipeAsImage(selectedRecipe)}>
                  <ImageIcon size={12} strokeWidth={2.5} />
                  Compartir (IG)
                </button>
                <button type="button" className="btn-candy primary" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedRecipe(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista Previa de Compartir Imagen */}
      {shareImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 5, 5, 0.7)',
          zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', boxSizing: 'border-box'
        }} onClick={() => { setShareImage(null); setShareStatus(''); }}>
          <div className="candy-card static" style={{
            maxWidth: '380px', width: '100%',
            padding: '18px', boxSizing: 'border-box',
            boxShadow: '8px 8px 0px var(--border-color)',
            animation: 'soft-pop 250ms var(--transition-spring)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', textTransform: 'uppercase', margin: 0 }}>
              📸 Tarjeta Lista para Compartir
            </h3>

            <img 
              src={shareImage} 
              alt="Receta de café" 
              style={{
                width: '100%', 
                border: '3px solid #000000', 
                borderRadius: '4px', 
                boxShadow: '4px 4px 0px #000000',
                display: 'block'
              }} 
            />
            
            {shareStatus && (
              <div style={{
                background: shareStatus.includes('❌') ? '#FED7D7' : (shareStatus.includes('✅') || shareStatus.includes('📋') || shareStatus.includes('📥')) ? '#C6F6D5' : '#FEFCBF',
                color: shareStatus.includes('❌') ? '#9B2C2C' : (shareStatus.includes('✅') || shareStatus.includes('📋') || shareStatus.includes('📥')) ? '#22543D' : '#744210',
                border: '3px solid #000000',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                boxShadow: '3px 3px 0px #000000',
                margin: '8px 0',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {shareStatus}
              </div>
            )}

            <p style={{ fontSize: '11px', margin: 0, lineHeight: '1.4', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              💡 <strong>Celular:</strong> Si el botón de abajo no responde, mantén presionada la imagen para guardarla en Fotos.<br/>
              💻 <strong>PC:</strong> Clic derecho y "Guardar imagen como...".
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ flex: 1, padding: '10px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={handleNativeShare}
              >
                <Share2 size={16} strokeWidth={2.5} />
                Compartir / Descargar
              </button>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ padding: '10px 16px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={() => setShareImage(null)}
              >
                <X size={16} strokeWidth={2.5} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
