import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { Trash2, Image as ImageIcon, Share2, ClipboardCopy, X, Search, RotateCcw, Filter, Zap, Droplet, Coffee, Edit3, SlidersHorizontal } from 'lucide-react';
import { stripEmojis, RenderScaChips } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';
import { generateRecipeCardImage, generateCoffeeStickerImage } from '../utils/cardGenerator';

const getMethodLucideIcon = (methodName, size = 18) => {
  const m = (methodName || '').toLowerCase();
  if (m.includes('pulsar')) return <SlidersHorizontal size={size} color="var(--color-crimson)" />;
  if (m.includes('v60') || m.includes('filtrado')) return <Filter size={size} color="var(--color-crimson)" />;
  if (m.includes('espresso') || m.includes('expresso')) return <Zap size={size} color="var(--color-crimson)" />;
  if (m.includes('aero') || m.includes('press')) return <Droplet size={size} color="var(--color-crimson)" />;
  if (m.includes('prensa') || m.includes('francesa')) return <Coffee size={size} color="var(--color-crimson)" />;
  return <Coffee size={size} color="var(--color-crimson)" />;
};

export default function BrewHistory({ onNavigateToInventory, onSelectBatch, batches, showToast }) {
  const [history, setHistory] = useState(null); // null = loading, [] = empty
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editForm, setEditForm] = useState({
    method: '',
    grind: '',
    ratio: '',
    brew_time: '',
    temperature: '',
    sensory_balance: '',
    sensory_body: '',
    sensory_extraction: '',
    notes: '',
    rating: 0,
    dose_in_g: '',
    dose_out_g: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [shareImage, setShareImage] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const [shareIncludeRecipe, setShareIncludeRecipe] = useState(true);
  const [shareFormat, setShareFormat] = useState('card'); // 'card' | 'sticker'
  const [stickerTransparent, setStickerTransparent] = useState(false);
  const [shareTemplate, setShareTemplate] = useState(() => {
    try {
      const pref = localStorage.getItem('beantag-share-style');
      if (pref === 'neobrutalist') return 'neobrutalist';
      if (pref === 'diner' || pref === 'aurora') return 'diner';
      if (pref === 'kissaten' || pref === 'hangtag') return 'kissaten';
      return 'blueprint';
    } catch (e) {
      return 'blueprint';
    }
  });
  const textureRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    fetch(apiUrl('api/recipes'))
      .then(res => res.json())
      .then(data => {
        if (active) {
          setHistory(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (active) setHistory([]);
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

  const exportRecipeAsImage = async (recipe, templateOverride, includeRecipeOverride, formatOverride, transparentOverride) => {
    const currentTpl = templateOverride || shareTemplate || 'blueprint';
    const incRecipe = includeRecipeOverride !== undefined ? includeRecipeOverride : shareIncludeRecipe;
    const currentFormat = formatOverride !== undefined ? formatOverride : shareFormat;
    const isTransparent = transparentOverride !== undefined ? transparentOverride : stickerTransparent;

    setShareStatus(currentFormat === 'sticker' ? 'Generando Sticker Story...' : 'Generando tarjeta en Ultra-HD...');
    setShareImage(null);

    try {
      let dataUrl;
      if (currentFormat === 'sticker') {
        dataUrl = await generateCoffeeStickerImage(recipe, { template: currentTpl, transparent: isTransparent });
        setShareStatus('✅ Sticker Story generado con éxito');
      } else {
        dataUrl = await generateRecipeCardImage(recipe, currentTpl, incRecipe);
        setShareStatus('✅ Tarjeta generada con éxito');
      }
      setShareImage(dataUrl);
    } catch (err) {
      console.error("Canvas export error:", err);
      setShareStatus('❌ Error al generar imagen: ' + err.message);
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
      const suffix = shareFormat === 'sticker' ? 'sticker' : 'receta';
      const filename = `${selectedRecipe.batch_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${suffix}.png`;
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
            new window.ClipboardItem({
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
              new window.ClipboardItem({
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
      const token = localStorage.getItem('beantag-token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch(apiUrl(`api/recipes/${recipeId}`), { method: 'DELETE', headers })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al eliminar receta');
          return data;
        })
        .then(data => {
          if (data.success) {
            setSelectedRecipe(null);
            fetch(apiUrl('api/recipes'))
              .then(res => res.json())
              .then(d => setHistory(d));
          }
        })
        .catch(err => {
          alert(err.message);
        });
    }
  };

  const handleOpenEdit = (recipe) => {
    if (!recipe) return;
    setEditingRecipe(recipe);
    setEditForm({
      method: recipe.method || '',
      grind: recipe.grind || '',
      ratio: recipe.ratio || '',
      brew_time: recipe.brew_time || '',
      temperature: recipe.temperature || '',
      sensory_balance: recipe.sensory_balance || '',
      sensory_body: recipe.sensory_body || '',
      sensory_extraction: recipe.sensory_extraction || '',
      notes: recipe.notes || '',
      rating: recipe.rating || 0,
      dose_in_g: recipe.dose_in_g !== undefined && recipe.dose_in_g !== null ? recipe.dose_in_g : '',
      dose_out_g: recipe.dose_out_g !== undefined && recipe.dose_out_g !== null ? recipe.dose_out_g : '',
      espresso_pressure: recipe.espresso_pressure ?? null,
      espresso_preinfusion: recipe.espresso_preinfusion ?? null
    });
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingRecipe) return;
    setSavingEdit(true);

    try {
      const token = localStorage.getItem('beantag-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`api/recipes/${editingRecipe.id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar receta');

      // Updates history state immutably
      setHistory(prev => (Array.isArray(prev) ? prev.map(r => r.id === editingRecipe.id ? data.recipe : r) : [data.recipe]));
      // Updates selectedRecipe so the open detail view reflects the changes immediately
      setSelectedRecipe(data.recipe);
      // Closes modal
      setEditingRecipe(null);
      if (showToast) showToast('Bitácora actualizada con éxito');
    } catch (err) {
      if (showToast) {
        showToast(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const safeHistory = Array.isArray(history) ? history : [];

  const filteredHistory = safeHistory.filter(recipe => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const batchName = (recipe.batch_name || '').toLowerCase();
      const roaster = (recipe.batch_roaster || recipe.roaster || '').toLowerCase();
      const origin = (recipe.batch_origin || recipe.origin || '').toLowerCase();
      const notes = (recipe.notes || '').toLowerCase();
      const method = (recipe.method || '').toLowerCase();
      
      if (term === 'pulsar' || term === 'pulsar mini') {
        if (method.includes('pulsar')) return true;
      }
      
      return batchName.includes(term) || roaster.includes(term) || origin.includes(term) || notes.includes(term) || method.includes(term);
    }
    return true;
  });

  // R3: Skeleton loading state
  if (history === null) return (
    <div style={{ padding: '12px 12px 0 12px' }}>
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
    <div style={{ padding: '12px 12px 0 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', margin: 0 }}>
          Bitácoras
        </h2>
        {safeHistory.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
            {filteredHistory.length} {filteredHistory.length === 1 ? 'receta' : 'recetas'}
          </span>
        )}
      </div>

      {safeHistory.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
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

          {/* Quick Method Filters */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
            {['Todos', 'V60', 'Espresso', 'AeroPress', 'Pulsar Mini', 'Prensa'].map((m) => {
              const isSelected = (m === 'Todos' && !searchTerm) || 
                (m === 'Pulsar Mini' && (searchTerm.toLowerCase() === 'pulsar mini' || searchTerm.toLowerCase() === 'pulsar')) ||
                (searchTerm.toLowerCase() === m.toLowerCase());
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSearchTerm(m === 'Todos' ? '' : m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--bg-header)' : 'var(--bg-card)',
                    color: 'var(--color-text)',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {safeHistory.length === 0 ? (
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
              {/* Opciones del Ticket POS */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Contenido del Ticket POS:
                </span>
                <div className="canvas-tab-selector">
                  <button
                    type="button"
                    className={`canvas-tab-btn ${shareIncludeRecipe ? 'active' : ''}`}
                    onClick={() => {
                      setShareIncludeRecipe(true);
                      exportRecipeAsImage(selectedRecipe, 'receipt', true);
                    }}
                  >
                    🧾 Con Receta (Extracción)
                  </button>
                  <button
                    type="button"
                    className={`canvas-tab-btn ${!shareIncludeRecipe ? 'active' : ''}`}
                    onClick={() => {
                      setShareIncludeRecipe(false);
                      exportRecipeAsImage(selectedRecipe, 'receipt', false);
                    }}
                  >
                    🌾 Solo Grano (Ficha Café)
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDeleteRecipe(selectedRecipe.id)}>
                  <Trash2 size={12} strokeWidth={2.5} />
                  Eliminar
                </button>
                <button 
                  type="button" 
                  className="btn-candy" 
                  style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                  onClick={() => handleOpenEdit(selectedRecipe)}
                >
                  <Edit3 size={12} strokeWidth={2.5} />
                  Editar
                </button>
                <button type="button" className="btn-candy" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => exportRecipeAsImage(selectedRecipe, 'receipt', shareIncludeRecipe)}>
                  <ImageIcon size={12} strokeWidth={2.5} />
                  Exportar Ticket
                </button>
                <button type="button" className="btn-candy primary" style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedRecipe(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Vista de Edición de Receta */}
      {editingRecipe && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 5, 5, 0.55)',
          zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', boxSizing: 'border-box'
        }} onClick={() => setEditingRecipe(null)}>
          <div className="candy-card static" style={{
            maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '20px', boxSizing: 'border-box',
            boxShadow: '8px 8px 0px var(--border-color)',
            animation: 'soft-pop 250ms var(--transition-spring)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: 0, textTransform: 'uppercase' }}>
                ✏️ Editar Bitácora
              </h3>
              <button type="button" onClick={() => setEditingRecipe(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Método</label>
                <input
                  type="text"
                  list="edit-method-list"
                  className="candy-input"
                  value={editForm.method}
                  onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                <datalist id="edit-method-list">
                  <option value="V60 (Filtrado)" />
                  <option value="Espresso" />
                  <option value="AeroPress" />
                  <option value="NextLevel Pulsar Mini" />
                  <option value="Prensa Francesa" />
                </datalist>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['V60 (Filtrado)', 'Espresso', 'AeroPress', 'NextLevel Pulsar Mini', 'Prensa Francesa'].map(m => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={editForm.method === m}
                      onClick={() => setEditForm({ ...editForm, method: m })}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: editForm.method === m ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        background: editForm.method === m ? 'var(--bg-header)' : 'var(--bg-card)',
                        color: 'var(--color-text)',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {m === 'NextLevel Pulsar Mini' ? 'Pulsar Mini' : m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Molienda</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: J-Max 2.4.0"
                    value={editForm.grind}
                    onChange={(e) => setEditForm({ ...editForm, grind: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Ratio</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: 1:16"
                    value={editForm.ratio}
                    onChange={(e) => setEditForm({ ...editForm, ratio: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Tiempo</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: 2:45"
                    value={editForm.brew_time}
                    onChange={(e) => setEditForm({ ...editForm, brew_time: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Temperatura</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: 93°C"
                    value={editForm.temperature}
                    onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Dosis In (g)</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: 15.0"
                    value={editForm.dose_in_g}
                    onChange={(e) => setEditForm({ ...editForm, dose_in_g: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Dosis Out (g)</label>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Ej: 240.0"
                    value={editForm.dose_out_g}
                    onChange={(e) => setEditForm({ ...editForm, dose_out_g: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Sensory Evaluation Selection */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Extracción</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['Sub', 'En Punto', 'Sobre'].map(ext => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, sensory_extraction: editForm.sensory_extraction === ext ? '' : ext })}
                      style={{
                        flex: 1, padding: '6px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px',
                        border: editForm.sensory_extraction === ext ? '2px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        background: editForm.sensory_extraction === ext ? 'var(--bg-header)' : '#FFF',
                        cursor: 'pointer'
                      }}
                    >
                      {ext === 'Sub' ? 'Sub-ext' : ext === 'Sobre' ? 'Sobre-ext' : '🧪 En Punto'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Balance Sensorial</label>
                <input
                  type="text"
                  className="candy-input"
                  placeholder="Ej: Acidez brillante, Equilibrado, Dulzor predominante"
                  value={editForm.sensory_balance}
                  onChange={(e) => setEditForm({ ...editForm, sensory_balance: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cuerpo</label>
                <input
                  type="text"
                  className="candy-input"
                  placeholder="Ej: Sedoso, Jugoso, Ligero, Cremoso"
                  value={editForm.sensory_body}
                  onChange={(e) => setEditForm({ ...editForm, sensory_body: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Notas de Cata / Observaciones</label>
                <textarea
                  className="candy-input"
                  rows="3"
                  placeholder="Observaciones de la extracción y notas de sabor..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-candy"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setEditingRecipe(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-candy primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vista Previa de Compartir Ticket POS */}
      {shareImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11000, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          padding: '16px 12px', 
          boxSizing: 'border-box',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }} onClick={() => { setShareImage(null); setShareStatus(''); }}>
          <div className="candy-card static animate-entrance" style={{
            maxWidth: '480px', width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            margin: 'auto 0',
            padding: '16px', boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              {/* Row 1: Header + Format Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '12.5px', textTransform: 'uppercase', margin: 0, color: 'var(--color-text)' }}>
                  {shareFormat === 'sticker' ? '🏷️ Sticker Story' : '🧾 Ticket Barista'} • {selectedRecipe?.batch_name}
                </h3>
                {/* Format Toggle */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShareFormat('card');
                      exportRecipeAsImage(selectedRecipe, shareTemplate, shareIncludeRecipe, 'card', stickerTransparent);
                    }}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      border: shareFormat === 'card' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareFormat === 'card' ? 'var(--bg-header)' : 'var(--bg-card)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: shareFormat === 'card' ? 'var(--color-crimson)' : 'var(--color-text)'
                    }}
                  >
                    🧾 Ficha
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShareFormat('sticker');
                      exportRecipeAsImage(selectedRecipe, shareTemplate, shareIncludeRecipe, 'sticker', stickerTransparent);
                    }}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      border: shareFormat === 'sticker' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareFormat === 'sticker' ? 'var(--bg-header)' : 'var(--bg-card)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: shareFormat === 'sticker' ? 'var(--color-crimson)' : 'var(--color-text)'
                    }}
                  >
                    🏷️ Sticker Story
                  </button>
                </div>
              </div>

              {/* Row 2: Sub-options (Content scope if card, background mode if sticker) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                  {shareFormat === 'sticker' ? 'MODO DE FONDO:' : 'CONTENIDO:'}
                </span>
                {shareFormat === 'sticker' ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStickerTransparent(false);
                        exportRecipeAsImage(selectedRecipe, shareTemplate, shareIncludeRecipe, 'sticker', false);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: !stickerTransparent ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: !stickerTransparent ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: !stickerTransparent ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      ⬛ Fondo Sólido
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStickerTransparent(true);
                        exportRecipeAsImage(selectedRecipe, shareTemplate, shareIncludeRecipe, 'sticker', true);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: stickerTransparent ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: stickerTransparent ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: stickerTransparent ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      🏁 Transparente PNG
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShareIncludeRecipe(true);
                        exportRecipeAsImage(selectedRecipe, shareTemplate || 'blueprint', true, 'card', stickerTransparent);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: shareIncludeRecipe ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: shareIncludeRecipe ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      🧾 Con Receta
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShareIncludeRecipe(false);
                        exportRecipeAsImage(selectedRecipe, shareTemplate || 'blueprint', false, 'card', stickerTransparent);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: !shareIncludeRecipe ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: !shareIncludeRecipe ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: !shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      🌾 Solo Grano
                    </button>
                  </div>
                )}
              </div>

              {/* Row 3: Aesthetic Template Selector */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--bg-canvas)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>ESTILO:</span>
                {[
                  { id: 'blueprint', label: '📐 Blueprint' },
                  { id: 'neobrutalist', label: '⚡ Brutalismo' },
                  { id: 'diner', label: '📻 Retro 50s' },
                  { id: 'kissaten', label: '🍵 Kissaten' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShareTemplate(t.id);
                      try { localStorage.setItem('beantag-share-style', t.id); } catch (e) {}
                      exportRecipeAsImage(selectedRecipe, t.id, shareIncludeRecipe, shareFormat, stickerTransparent);
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '9.5px',
                      borderRadius: '4px',
                      border: (shareTemplate || 'blueprint') === t.id ? '1.5px solid var(--color-crimson)' : 'none',
                      backgroundColor: (shareTemplate || 'blueprint') === t.id ? 'var(--bg-card)' : 'transparent',
                      fontWeight: (shareTemplate || 'blueprint') === t.id ? '900' : 'normal',
                      color: (shareTemplate || 'blueprint') === t.id ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              backgroundColor: 'var(--bg-canvas, #F1F5F9)',
              borderRadius: '12px',
              padding: '8px',
              overflowY: 'auto',
              flex: '1 1 auto',
              minHeight: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={shareImage} 
                alt="Ticket de café POS" 
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(70dvh - 180px)',
                  height: 'auto',
                  borderRadius: '6px', 
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)'
                }} 
              />
            </div>
            
            {shareStatus && (
              <div style={{
                background: shareStatus.includes('❌') ? '#FED7D7' : (shareStatus.includes('✅') || shareStatus.includes('📋') || shareStatus.includes('📥')) ? '#C6F6D5' : '#FEFCBF',
                color: shareStatus.includes('❌') ? '#9B2C2C' : (shareStatus.includes('✅') || shareStatus.includes('📋') || shareStatus.includes('📥')) ? '#22543D' : '#744210',
                border: '1.5px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                flexShrink: 0
              }}>
                {shareStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexShrink: 0, paddingTop: '4px' }}>
              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ flex: 1, minHeight: '44px', padding: '9px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px' }} 
                onClick={handleNativeShare}
              >
                <Share2 size={15} strokeWidth={2.5} />
                Compartir / Guardar PNG
              </button>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ minHeight: '44px', padding: '9px 14px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px' }} 
                onClick={() => setShareImage(null)}
              >
                <X size={15} strokeWidth={2.5} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
