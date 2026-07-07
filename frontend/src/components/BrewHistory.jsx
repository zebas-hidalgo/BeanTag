import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';

const METHOD_ICONS = {
  'V60 (Filtrado)': '/icons/v60.jpg',
  'Espresso': '/icons/espresso.jpg',
  'AeroPress': '/icons/aeropress.jpg',
  'Prensa Francesa': '/icons/frenchpress.jpg'
};

export default function BrewHistory({ onNavigateToInventory, onSelectBatch }) {
  const [history, setHistory] = useState(null); // null = loading, [] = empty
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [shareImage, setShareImage] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const textureRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setHistory(data);
        }
      });
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

  const exportRecipeAsImage = async (recipe) => {
    setShareStatus('Generando imagen de receta...');
    setShareImage(null);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 840;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');

      // 1. Limpiar canvas
      ctx.clearRect(0, 0, 840, 540);

      // 2. Dibujar textura del papel de fondo
      const textureImg = await loadTexture();
      if (textureImg) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.drawImage(textureImg, 15, 15, 810, 510);
        ctx.restore();
      }

      // 3. Filtro de opacidad blanco (65%) sobre la textura para legibilidad
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(15, 15, 810, 510);

      // 4. Dibujar doble borde negro
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(15, 15, 810, 510);
      
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, 800, 500);

      // 5. Encabezado: Línea vertical naranja y textos
      ctx.fillStyle = '#F94C00';
      ctx.fillRect(50, 45, 6, 46);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(50, 45, 6, 46);

      ctx.font = '500 32px Fredoka, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('BeanTag', 68, 78);

      // Orden y fecha
      ctx.font = '700 14px Share Tech Mono, monospace';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      const createdDate = new Date(recipe.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      ctx.fillText(`REGISTRO: #0${recipe.id || '294'}`, 790, 63);
      ctx.fillText(createdDate.toUpperCase(), 790, 83);
      ctx.textAlign = 'left';

      // Línea divisoria inferior del encabezado
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(50, 105);
      ctx.lineTo(790, 105);
      ctx.stroke();

      // 6. Cuerpo: Detalles Técnicos del Grano
      ctx.font = '700 16px Space Grotesk, sans-serif';
      ctx.fillStyle = '#F94C00';
      ctx.fillText('[ GRANO SELECCIONADO ]', 50, 145);

      ctx.font = '500 34px Outfit, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(recipe.batch_name || 'N/A', 50, 195);

      ctx.font = '400 19px Outfit, sans-serif';
      // Columna Izquierda (x = 50)
      ctx.fillText(`Origen: ${recipe.batch_origin || 'N/A'}`, 50, 245);
      ctx.fillText(`Tostador: ${recipe.batch_roaster || 'N/A'}`, 50, 287);
      ctx.fillText(`Variedad: ${recipe.batch_variety || 'N/A'}`, 50, 329);

      // Columna Derecha (x = 450)
      ctx.fillText(`Productor: ${recipe.batch_producer || 'N/A'}`, 450, 245);
      ctx.fillText(`Proceso: ${recipe.batch_process || 'N/A'}`, 450, 287);
      
      const roastDateText = recipe.batch_roast_date ? formatLocalDateStr(recipe.batch_roast_date) : 'N/A';
      ctx.fillText(`Tueste: ${roastDateText}`, 450, 329);

      // 7. Sección 1: Notas de Cata de la Rueda SCA
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#000000';
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(50, 365);
      ctx.lineTo(790, 365);
      ctx.stroke();
      ctx.restore();

      ctx.font = '700 15px Space Grotesk, sans-serif';
      ctx.fillStyle = '#F94C00';
      ctx.fillText('[ NOTAS DE CATA (RUEDA SCA) ]', 50, 395);

      // Obtener y decodificar sólo los tags de la Rueda SCA de batch_roaster_notes
      let scaNotes = '';
      if (recipe.batch_roaster_notes) {
        const notesStr = String(recipe.batch_roaster_notes);
        if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
          const match = notesStr.match(/\[Notas: (.*?)\]/);
          if (match) {
            scaNotes = match[1].trim();
          }
        } else {
          if (notesStr.includes(' | ')) {
            scaNotes = notesStr.split(' | ')[0].trim();
          } else {
            scaNotes = notesStr.trim();
          }
        }
      }
      if (!scaNotes) {
        scaNotes = 'Sin notas de cata registradas';
      }

      ctx.font = '700 22px Outfit, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(scaNotes, 50, 435);

      // 8. Footer: Firma
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(50, 475);
      ctx.lineTo(790, 475);
      ctx.stroke();

      ctx.font = '500 19px JetBrains Mono, monospace';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      ctx.fillText('BEANTAG.CAFE', 790, 512);
      ctx.textAlign = 'left';

      // Export as Data URL to preview in modal
      const dataUrl = canvas.toDataURL('image/png');
      setShareImage(dataUrl);
      setShareStatus('Imagen lista para compartir.');
    } catch (e) {
      console.error("Canvas rendering failed", e);
      setShareStatus('❌ Fallo al generar la imagen.');
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
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Bitácoras
      </h2>

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
      ) : (
        history.map(item => {
          const microns = parseGrindToMicrons(item.grind);
          return (
            <div 
              key={item.id} 
              className="candy-card" 
              style={{ borderLeft: '6px solid var(--color-crimson)' }}
              onClick={() => setSelectedRecipe(item)}
            >
              <div className="card-header-flex">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    {METHOD_ICONS[item.method] && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
                        <img src={METHOD_ICONS[item.method]} alt={item.method} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
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
                
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                  Puntuación: <span style={{ color: 'var(--color-crimson)' }}>{'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}</span>
                </p>
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
                  {METHOD_ICONS[selectedRecipe.method] && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
                      <img src={METHOD_ICONS[selectedRecipe.method]} alt={selectedRecipe.method} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
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
                  displayNotes = notesStr.split(' | ')[1].trim();
                } else if (!notesStr.includes('[Notas: ')) {
                  displayNotes = notesStr.trim();
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                Puntuación: <span style={{ color: 'var(--color-crimson)', fontSize: '14px' }}>{'★'.repeat(selectedRecipe.rating || 5)}{'☆'.repeat(5 - (selectedRecipe.rating || 5))}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)' }} onClick={() => handleDeleteRecipe(selectedRecipe.id)}>
                  🗑️ Eliminar
                </button>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px' }} onClick={() => exportRecipeAsImage(selectedRecipe)}>
                  📤 Compartir
                </button>
                <button type="button" className="btn-candy primary" style={{ padding: '8px 10px', margin: 0, fontSize: '11px' }} onClick={() => setSelectedRecipe(null)}>
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
                style={{ flex: 1, padding: '10px', margin: 0 }} 
                onClick={handleNativeShare}
              >
                📲 Compartir / Descargar
              </button>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ padding: '10px 16px', margin: 0 }} 
                onClick={() => { setShareImage(null); setShareStatus(''); }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
