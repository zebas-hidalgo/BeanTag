import React, { useState, useRef, useMemo, lazy, Suspense } from 'react';
import {
  ArrowLeft, Camera, Upload, Sparkles, Play, Share2, Loader2,
  Minus, Plus, Coffee, CheckCircle2, AlertTriangle, Lock, Zap, Unlock, Droplet,
  BookmarkPlus, Sliders, Check
} from 'lucide-react';
import { apiUrl } from '../utils/api';
import { compressImageForOcr } from '../utils/imageCompressor';
import { GRINDERS, getGrinderConfig } from '../utils/grinders';
import { computeSensoryCorrection } from '../utils/sensoryTuner';
import { MethodIcon } from './icons/CoffeeIcons';
import StickerShareModal from './StickerShareModal';
import {
  DEFAULT_CARD_STYLE,
  generateCoffeeStickerImage
} from '../utils/cardGenerator';

const BrewGuideModal = lazy(() => import('./BrewGuideModal'));

const METHODS = [
  {
    id: 'V60 (Filtrado)',
    label: 'V60',
    baseRatio: 16.5,
    chamberMax: 800,
    prep: 'Enjuagar filtro cónico con agua caliente, precalentar servidor y tarar en 0.0g.'
  },
  {
    id: 'NextLevel Pulsar Mini',
    label: 'Pulsar Mini',
    baseRatio: 16.5,
    chamberMax: 400,
    prep: 'Enjuagar filtro, cerrar válvula al 100%, colocar café y tener el dispersor listo.'
  },
  {
    id: 'AeroPress Go',
    label: 'AeroPress Go',
    baseRatio: 15,
    chamberMax: 210,
    prep: 'Posición estándar o invertida, filtro enjuagado en tapa compacta, paleta y émbolo listos.'
  },
  {
    id: 'AeroPress',
    label: 'AeroPress',
    baseRatio: 15.5,
    chamberMax: 250,
    prep: 'Filtro enjuagado, paleta/cuchara para agitar y émbolo listo para sello de vacío.'
  },
  {
    id: 'Chemex',
    label: 'Chemex',
    baseRatio: 16.5,
    chamberMax: 1000,
    prep: 'Enjuagar abundantemente el filtro grueso (3 capas hacia el pico) y descartar agua.'
  },
  {
    id: 'Prensa Francesa',
    label: 'Prensa',
    baseRatio: 15.5,
    chamberMax: 1000,
    prep: 'Precalentar jarra, moler grueso y tener 2 cucharas listas para romper costra y desespumar.'
  },
  {
    id: 'Espresso',
    label: 'Espresso',
    baseRatio: 2,
    chamberMax: 72,
    prep: 'Distribución uniforme (WDT), tamp nivelado, purgar grupo y precalentar taza.'
  }
];

const CUP_ML = 200;

function formatMicronsClean(val) {
  if (!val) return '';
  const num = String(val).replace(/[^0-9.,-]/g, '').trim();
  return num ? `~${num} µm` : '';
}

const QUICK_TASTE_PRESETS = [
  { id: 'sour', label: 'Muy ácida', feedback: { taste: 'sour', flow: 'fast', body: 'balanced' } },
  { id: 'bitter', label: 'Muy amarga', feedback: { taste: 'bitter', flow: 'slow', body: 'balanced' } },
  { id: 'thin', label: 'Aguada', feedback: { taste: 'balanced', flow: 'fast', body: 'thin' } },
  { id: 'balanced', label: 'Equilibrada', feedback: { taste: 'balanced', flow: 'on_time', body: 'balanced' } }
];

function slugifyBatchId(name) {
  const base = String(name || 'cafe')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'cafe';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export default function QuickBrewView({
  onBack,
  showToast,
  currentUser,
  onRequireAuth,
  onRefreshBatches,
  onOpenBatch
}) {
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const renderSeqRef = useRef(0);

  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [bean, setBean] = useState({
    name: '',
    roaster: '',
    origin: '',
    producer: '',
    variety: '',
    process: '',
    altitude: '',
    roast_level: 'Medio',
    roaster_notes: '',
    sca_score: ''
  });

  const [method, setMethod] = useState('V60 (Filtrado)');
  const [grinder, setGrinder] = useState(() => localStorage.getItem('default-grinder') || 'jmax');

  // Output mode: 'cups' (200ml each) vs 'manual' (free water + optional dose)
  const [outputMode, setOutputMode] = useState('cups');
  const [cups, setCups] = useState(1);
  const [manualWaterMl, setManualWaterMl] = useState(250);
  const [doseOverride, setDoseOverride] = useState(null);

  const activeMethodObj = useMemo(() => METHODS.find(m => m.id === method) || METHODS[0], [method]);
  const isEspresso = method === 'Espresso';
  const maxCups = isEspresso ? 2 : 4;
  const safeCups = Math.min(cups, maxCups);

  const targetWaterMl = useMemo(() => {
    if (outputMode === 'manual') return Math.max(isEspresso ? 20 : 100, manualWaterMl);
    return isEspresso ? safeCups * 36 : safeCups * CUP_ML;
  }, [outputMode, manualWaterMl, isEspresso, safeCups]);

  const needsBypass = !isEspresso && targetWaterMl > activeMethodObj.chamberMax;
  const bypassWaterG = needsBypass ? Math.max(0, targetWaterMl - activeMethodObj.chamberMax) : 0;

  const computedDoseG = useMemo(() => {
    if (isEspresso) return Math.round((targetWaterMl / 2) * 2) / 2;
    return Math.max(5, Math.round((targetWaterMl / 17.0) * 2) / 2);
  }, [isEspresso, targetWaterMl]);
  const doseInG = doseOverride !== null ? doseOverride : computedDoseG;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipe, setAiRecipe] = useState(null);
  const [brewOpen, setBrewOpen] = useState(false);

  // Save to inventory & quick post-cup sensory tuner state
  const [savingBatch, setSavingBatch] = useState(false);
  const [savedBatchId, setSavedBatchId] = useState(null);
  const [quickTasteId, setQuickTasteId] = useState(null);
  const [tunerPreview, setTunerPreview] = useState(null);

  const handleSaveToInventory = async () => {
    if (savedBatchId && onOpenBatch) {
      onOpenBatch(savedBatchId);
      return;
    }
    if (!currentUser) {
      if (showToast) showToast('Inicia sesión para guardar este café en Mis Cafés.', { type: 'info' });
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const cleanName = (bean.name || '').trim() || 'Café de Especialidad';
    const rawNotes = (bean.roaster_notes || '').trim();
    const formattedNotes = rawNotes && !rawNotes.includes('[Notas:')
      ? `[Notas: ${rawNotes}]`
      : rawNotes;

    setSavingBatch(true);
    try {
      const payload = {
        id: slugifyBatchId(cleanName),
        name: cleanName,
        roaster: (bean.roaster || '').trim() || 'Tueste de especialidad',
        producer: (bean.producer || '').trim() || (bean.roaster || '').trim() || 'Especialidad',
        origin: (bean.origin || '').trim(),
        variety: (bean.variety || '').trim(),
        process: (bean.process || '').trim(),
        altitude: (bean.altitude || '').trim(),
        roast_level: bean.roast_level || 'Medio',
        roaster_notes: formattedNotes,
        sca_score: bean.sca_score ? parseFloat(bean.sca_score) : null,
        storage_type: 'bag',
        total_weight_g: 250,
        dose_weight: syntheticRecipe?.dose_in_g || doseInG
      };
      const res = await fetch(apiUrl('api/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el café.');
      const newId = data.id || payload.id;
      setSavedBatchId(newId);
      if (onRefreshBatches) onRefreshBatches();
      if (showToast) showToast(`"${cleanName}" guardado en Mis Cafés.`, { type: 'success' });
    } catch (err) {
      if (showToast) showToast(err.message || 'Error al guardar el café.', { type: 'error' });
    } finally {
      setSavingBatch(false);
    }
  };

  const handleQuickTaste = (preset) => {
    if (!aiRecipe) return;
    setQuickTasteId(preset.id);
    const currentDial = aiRecipe.active_grinder_dial?.dial || aiRecipe.grind || '';
    const currentTemp = parseFloat(String(aiRecipe.temperature || 93).replace(/[^0-9.]/g, '')) || 93;
    const correction = computeSensoryCorrection(grinder, currentDial, currentTemp, preset.feedback);
    setTunerPreview(correction);
  };

  const applyGrindAndTemp = (newGrindText, newTemp) => {
    setAiRecipe((prev) => {
      if (!prev) return prev;
      const grinderName = prev.active_grinder_dial?.grinder_name || activeGrinderMeta.name;
      return {
        ...prev,
        temperature: newTemp ? `${newTemp}°C` : prev.temperature,
        grind: newGrindText || prev.grind,
        active_grinder_dial: prev.active_grinder_dial
          ? { ...prev.active_grinder_dial, dial: newGrindText || prev.active_grinder_dial.dial }
          : { grinder_name: grinderName, dial: newGrindText }
      };
    });
  };

  const handleApplyTuning = () => {
    if (!tunerPreview) return;
    applyGrindAndTemp(tunerPreview.newGrindText, tunerPreview.newTemp);
    setTunerPreview(null);
    setQuickTasteId(null);
    if (showToast) showToast('Receta recalibrada con el nuevo ajuste de molienda y temperatura.', { type: 'success' });
  };

  const handleSaveTunedFromGuide = async (tunedData) => {
    if (!tunedData) return;
    applyGrindAndTemp(tunedData.newGrindText || tunedData.grind, tunedData.newTemp || tunedData.temperature);
    if (showToast) showToast('Ajuste del cronómetro aplicado a tu receta rápida.', { type: 'success' });
  };

  // Share card state
  const [shareImage, setShareImage] = useState(null);
  const [shareTemplate, setShareTemplate] = useState(DEFAULT_CARD_STYLE);
  const [shareIncludeRecipe, setShareIncludeRecipe] = useState(true);
  const [stickerOrientation, setStickerOrientation] = useState('vertical');
  const [stickerTransparent, setStickerTransparent] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const handleSelectPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setScanning(true);
      const { base64Data, mimeType } = await compressImageForOcr(file, 1280, 0.85);
      setPreviewUrl(base64Data);
      setSavedBatchId(null);

      const groqKey = localStorage.getItem('groq-key') || '';
      const useGroq = Boolean(groqKey && groqKey.trim());
      const res = await fetch(apiUrl('api/ai/scan-bag'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': useGroq ? 'groq' : 'gemini',
          ...(useGroq ? { 'x-groq-key': groqKey } : { 'x-ai-model': 'gemini-2.5-flash' })
        },
        body: JSON.stringify({ imageBase64: base64Data, mimeType: mimeType || 'image/jpeg' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo leer la tarjeta.');

      setBean({
        name: data.name || '',
        roaster: data.roaster || '',
        origin: data.origin || '',
        producer: data.producer || '',
        variety: data.variety || '',
        process: data.process || '',
        altitude: data.altitude || '',
        roast_level: data.roast_level || 'Medio',
        roaster_notes: Array.isArray(data.sca_flavor_tags) && data.sca_flavor_tags.length > 0
          ? `[Notas: ${data.sca_flavor_tags.join(', ')}] ${data.roaster_notes || ''}`.trim()
          : (data.roaster_notes || ''),
        sca_score: data.sca_score || ''
      });
      if (showToast) showToast('Tarjeta leída con IA.', { type: 'success', duration: 2500 });
    } catch (err) {
      if (showToast) showToast(err.message || 'Error al escanear la tarjeta.', { type: 'error', duration: 4000 });
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateRecipe = async () => {
    const groqKey = localStorage.getItem('groq-key') || '';
    const useGroq = Boolean(groqKey && groqKey.trim());
    setAiLoading(true);
    try {
      const res = await fetch(apiUrl('api/recommend-recipe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': useGroq ? 'groq' : 'gemini',
          ...(useGroq ? { 'x-groq-key': groqKey } : { 'x-ai-model': 'gemini-2.5-flash-lite' })
        },
        body: JSON.stringify({
          batch_name: bean.name || 'Café de Especialidad',
          origin: bean.origin || 'Origen Especialidad',
          producer: bean.producer,
          variety: bean.variety,
          process: bean.process,
          altitude: bean.altitude,
          roast_level: bean.roast_level || 'Medio',
          roaster_notes: bean.roaster_notes,
          sca_score: bean.sca_score || null,
          method,
          cups: outputMode === 'cups' ? safeCups : null,
          target_water_g: targetWaterMl,
          chamber_max_g: activeMethodObj.chamberMax,
          bypass_water_g: bypassWaterG || null,
          optimize_min_dose: doseOverride === null,
          dose_in_g: doseInG,
          grinder
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar receta.');
      setAiRecipe(data);
      setTunerPreview(null);
      setQuickTasteId(null);
    } catch (err) {
      if (showToast) showToast(err.message || 'Error al generar la receta.', { type: 'error', duration: 4000 });
    } finally {
      setAiLoading(false);
    }
  };

  const syntheticBatch = useMemo(() => ({
    id: 'quick-brew',
    name: bean.name || 'Preparación Rápida',
    roaster: bean.roaster || 'Tueste de especialidad',
    origin: bean.origin || 'Origen Especialidad',
    variety: bean.variety || '',
    process: bean.process || '',
    altitude: bean.altitude || '',
    roast_level: bean.roast_level || 'Medio',
    roaster_notes: bean.roaster_notes || '',
    sca_score: bean.sca_score || null,
    dose_weight: `${doseInG}g`
  }), [bean, doseInG]);

  const syntheticRecipe = useMemo(() => {
    if (!aiRecipe) return null;
    const effectiveDose = (doseOverride === null && aiRecipe.dose_in_g) ? aiRecipe.dose_in_g : doseInG;
    return {
      method,
      dose_in_g: effectiveDose,
      water_total_g: aiRecipe.water_total_g || targetWaterMl,
      ratio: aiRecipe.ratio || `1:${activeMethodObj.baseRatio}`,
      temperature: parseFloat(String(aiRecipe.temperature || 93).replace(/[^0-9.]/g, '')) || 93,
      brew_time: aiRecipe.brew_time || '3:00 min',
      grind: aiRecipe.active_grinder_dial?.dial
        ? `${aiRecipe.active_grinder_dial.grinder_name}: ${aiRecipe.active_grinder_dial.dial}`
        : (aiRecipe.grind || ''),
      pours: aiRecipe.pours || [],
      notes: aiRecipe.notes || ''
    };
  }, [aiRecipe, doseOverride, method, doseInG, targetWaterMl, activeMethodObj.baseRatio]);

  const renderExportCard = async (
    styleId = shareTemplate,
    transparent = stickerTransparent,
    orientation = stickerOrientation,
    incRecipe = shareIncludeRecipe
  ) => {
    if (!syntheticRecipe) return;
    const seq = ++renderSeqRef.current;
    setShareStatus('Generando tarjeta...');
    try {
      const mergedData = { ...syntheticBatch, ...syntheticRecipe, batch_name: syntheticBatch.name };
      const img = await generateCoffeeStickerImage(mergedData, {
        template: styleId,
        includeRecipe: incRecipe,
        transparent,
        orientation
      });
      if (seq !== renderSeqRef.current) return;
      setShareImage(img);
      setShareStatus('');
    } catch (err) {
      if (seq === renderSeqRef.current) {
        setShareStatus('No se pudo generar la tarjeta.');
      }
    }
  };

  const buildShareText = () => {
    if (!syntheticRecipe) return syntheticBatch.name;
    return `☕ ${syntheticBatch.name}${syntheticBatch.origin ? ` · ${syntheticBatch.origin}` : ''}\n${syntheticRecipe.method} | ${syntheticRecipe.dose_in_g}g → ${syntheticRecipe.water_total_g}g (${syntheticRecipe.ratio}) | ${syntheticRecipe.temperature}°C | ${syntheticRecipe.brew_time}\nMolienda: ${syntheticRecipe.grind}`;
  };

  const activeGrinderMeta = getGrinderConfig(grinder) || GRINDERS[0];
  const cleanMicrons = formatMicronsClean(aiRecipe?.grind_microns);

  return (
    <div className="soft-fade-in" style={{ paddingBottom: '88px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          type="button"
          className="btn-candy"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', minHeight: '44px', margin: 0, fontSize: '12px' }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Volver</span>
        </button>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', fontFamily: 'var(--font-mono)' }}>
          {outputMode === 'cups' ? `Ref. ${CUP_ML} ml/taza` : 'Modo manual'}
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 className="bt-page-title" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Preparación Rápida</h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)' }}>
          Saca foto a la tarjeta del café, elige equipo y volumen, y obtén pasos calibrados con IA.
        </p>
      </div>

      {/* 1. Foto de Tarjeta / Datos del Café */}
      <section className="bt-section" style={{ marginBottom: '14px' }}>
        <div className="bt-section-head">
          <h3 className="bt-section-title">1. Tarjeta del Café</h3>
          <p className="bt-section-desc">Escanea la bolsa o tarjeta con cámara, o escribe el nombre manualmente.</p>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleSelectPhoto} style={{ display: 'none' }} />
        <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleSelectPhoto} style={{ display: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            disabled={scanning}
            onClick={() => cameraInputRef.current?.click()}
            className="barista-btn-primary"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <span>{scanning ? 'Leyendo…' : 'Sacar foto'}</span>
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => uploadInputRef.current?.click()}
            className="barista-btn-secondary"
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', margin: 0 }}
          >
            <Upload size={16} />
            <span>Subir foto</span>
          </button>
        </div>

        {previewUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '8px', borderRadius: 'var(--r-control)', background: 'var(--fill)', border: '1px solid var(--line)' }}>
            <img src={previewUrl} alt="Tarjeta escaneada" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--r-xs)', flexShrink: 0 }} />
            <div style={{ minWidth: 0, fontSize: '12px', color: 'var(--ink-2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} color="var(--ok)" />
                <span>{bean.name || 'Tarjeta cargada'}</span>
              </div>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink-muted)' }}>
                {[bean.origin, bean.variety, bean.process, bean.roast_level].filter(Boolean).join(' · ') || 'Listo para generar receta'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="text"
            className="candy-input"
            placeholder="Nombre del café (ej. Pink Bourbon)"
            value={bean.name}
            onChange={(e) => setBean(b => ({ ...b, name: e.target.value }))}
            style={{ margin: 0, minHeight: '44px', fontSize: '16px', gridColumn: '1 / -1' }}
          />
          <input
            type="text"
            className="candy-input"
            placeholder="Origen (ej. Huila)"
            value={bean.origin}
            onChange={(e) => setBean(b => ({ ...b, origin: e.target.value }))}
            style={{ margin: 0, minHeight: '44px', fontSize: '16px' }}
          />
          <input
            type="text"
            className="candy-input"
            placeholder="Proceso (ej. Lavado)"
            value={bean.process}
            onChange={(e) => setBean(b => ({ ...b, process: e.target.value }))}
            style={{ margin: 0, minHeight: '44px', fontSize: '16px' }}
          />
        </div>
      </section>

      {/* 2. Molino, Método y Volumen (Por tazas o Manual) */}
      <section className="bt-section" style={{ marginBottom: '14px' }}>
        <div className="bt-section-head">
          <h3 className="bt-section-title">2. Equipo y Volumen</h3>
        </div>

        {/* Método */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '6px' }}>Método</div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMethod(m.id);
                  setDoseOverride(null);
                  if (m.id === 'Espresso') {
                    setCups(c => Math.min(2, c));
                    setManualWaterMl(36);
                  } else if (manualWaterMl < 100) {
                    setManualWaterMl(200);
                  }
                }}
                style={{
                  flex: '0 0 auto',
                  minHeight: '44px',
                  padding: '6px 12px',
                  borderRadius: 'var(--r-pill)',
                  border: active ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                  background: active ? 'var(--accent-bg)' : 'var(--raised)',
                  color: active ? 'var(--accent-text)' : 'var(--ink-2)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <MethodIcon method={m.id} size={14} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Molino */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', margin: '8px 0 6px' }}>Molino</div>
        <select
          className="candy-input"
          value={grinder}
          onChange={(e) => setGrinder(e.target.value)}
          style={{ margin: '0 0 12px 0', minHeight: '44px', fontSize: '16px', width: '100%' }}
        >
          {GRINDERS.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.stepDesc})</option>
          ))}
        </select>

        {/* Selector Por Tazas vs Manual */}
        <div className="bt-seg" role="radiogroup" aria-label="Modo de volumen" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            role="radio"
            aria-checked={outputMode === 'cups'}
            className={`bt-seg-btn${outputMode === 'cups' ? ' is-active' : ''}`}
            onClick={() => { setOutputMode('cups'); setDoseOverride(null); }}
          >
            {isEspresso ? 'Por shots' : `Por tazas (${CUP_ML} ml)`}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={outputMode === 'manual'}
            className={`bt-seg-btn${outputMode === 'manual' ? ' is-active' : ''}`}
            onClick={() => setOutputMode('manual')}
          >
            Manual (ml / g)
          </button>
        </div>

        {outputMode === 'cups' ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxCups}, minmax(0, 1fr))`, gap: '6px', marginBottom: '12px' }}>
            {Array.from({ length: maxCups }, (_, idx) => idx + 1).map((n) => {
              const active = safeCups === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setCups(n); setDoseOverride(null); }}
                  style={{
                    minHeight: '46px',
                    borderRadius: 'var(--r-control)',
                    border: active ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                    background: active ? 'var(--accent-bg)' : 'var(--raised)',
                    color: active ? 'var(--accent-text)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.25
                  }}
                >
                  <span>{n} {isEspresso ? (n === 1 ? 'shot' : 'shots') : (n === 1 ? 'taza' : 'tazas')}</span>
                  <small style={{ fontSize: '10px', opacity: 0.78, fontFamily: 'var(--font-mono)' }}>
                    {isEspresso ? `${n * 36}g` : `${n * CUP_ML} ml`}
                  </small>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--r-control)', background: 'var(--fill)', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Droplet size={14} />
              <span>{isEspresso ? 'Yield objetivo' : 'Agua objetivo'}</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="barista-stepper-btn"
                aria-label="Restar agua"
                onClick={() => setManualWaterMl(v => Math.max(isEspresso ? 20 : 100, v - (isEspresso ? 4 : 20)))}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, minWidth: '62px', textAlign: 'center' }}>
                {targetWaterMl} {isEspresso ? 'g' : 'ml'}
              </span>
              <button
                type="button"
                className="barista-stepper-btn"
                aria-label="Sumar agua"
                onClick={() => setManualWaterMl(v => Math.min(isEspresso ? 90 : 1200, v + (isEspresso ? 4 : 20)))}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Aviso físico de cámara / bypass */}
        {needsBypass && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '9px 11px',
            borderRadius: 'var(--r-control)',
            background: 'var(--warn-bg)',
            color: 'var(--warn-text)',
            fontSize: '12px',
            lineHeight: 1.35,
            marginBottom: '10px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              <strong>{activeMethodObj.label}</strong> tiene cámara de ~{activeMethodObj.chamberMax} ml. La IA diseñará extracción concentrada + <strong>bypass de +{bypassWaterG} ml</strong> de agua caliente al final.
            </span>
          </div>
        )}

        {/* Dosis: Auto (IA optimiza mínimo consumo) o ajuste manual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--r-control)', background: 'var(--fill)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Coffee size={14} />
              <span>{doseOverride === null ? 'Dosis mínima (IA)' : 'Dosis manual'}</span>
            </span>
            {doseOverride !== null && (
              <button
                type="button"
                onClick={() => setDoseOverride(null)}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', fontSize: '11px', color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer' }}
              >
                Volver a Auto (IA)
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="barista-stepper-btn"
              aria-label="Restar 0.5g"
              onClick={() => setDoseOverride(Math.max(5, Math.round((doseInG - 0.5) * 10) / 10))}
            >
              <Minus size={14} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, minWidth: '56px', textAlign: 'center', color: doseOverride === null ? 'var(--accent-text)' : 'var(--ink)' }}>
              {doseOverride === null ? (aiRecipe?.dose_in_g ? `${aiRecipe.dose_in_g}g` : 'Auto') : `${doseInG}g`}
            </span>
            <button
              type="button"
              className="barista-stepper-btn"
              aria-label="Sumar 0.5g"
              onClick={() => setDoseOverride(Math.round((doseInG + 0.5) * 10) / 10)}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Generate CTA */}
      <button
        type="button"
        disabled={aiLoading}
        onClick={handleGenerateRecipe}
        className="barista-btn-primary"
        style={{ width: '100%', minHeight: '48px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
      >
        {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        <span>{aiLoading ? 'Calculando receta con IA…' : 'Generar Receta Recomendada (IA)'}</span>
      </button>

      {/* 3. Resultado IA (Grilla limpia 2x2 + Prep + Pasos detallados) */}
      {aiRecipe && syntheticRecipe && (
        <section className="bt-section soft-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
            <h3 className="bt-section-title" style={{ margin: 0 }}>Receta Recomendada</h3>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: 'var(--r-pill)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 700 }}>
              {aiRecipe._model || (aiRecipe._source === 'groq' ? 'Groq IA' : 'Barista IA')}
            </span>
          </div>

          {/* Grilla 2x2 limpia para móvil */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '10px' }}>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>Dosis café</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-text)' }}>
                {syntheticRecipe.dose_in_g}g
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>Agua · Ratio {syntheticRecipe.ratio}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                {syntheticRecipe.water_total_g}g
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>Temperatura</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                {syntheticRecipe.temperature}°C
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>Tiempo objetivo</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                {syntheticRecipe.brew_time}
              </div>
            </div>
          </div>

          {/* Bloque de Molino */}
          <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--fill)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>{activeGrinderMeta.name}</span>
              {cleanMicrons && (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{cleanMicrons}</span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-text)', marginTop: '2px' }}>
              {aiRecipe.active_grinder_dial?.dial || syntheticRecipe.grind}
            </div>
          </div>

          {/* Preparación previa (antes de 0:00) */}
          <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px dashed var(--line-strong)', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)', marginBottom: '3px' }}>
              Antes de 0:00 · Preparación ({activeMethodObj.label})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
              {activeMethodObj.prep}
            </div>
          </div>

          {/* Pasos cronometrados detallados */}
          {Array.isArray(syntheticRecipe.pours) && syntheticRecipe.pours.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {syntheticRecipe.pours.map((p, idx) => {
                const isDry = !p.water_g || Number(p.water_g) <= 0;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--r-control)',
                      background: 'var(--raised)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                          {idx + 1}. {p.label || p.title}
                        </span>
                        {p.valve && p.valve !== 'none' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 7px',
                              borderRadius: 'var(--r-pill)',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: p.valve === 'closed'
                                ? 'var(--valve-closed-bg)'
                                : (p.valve === 'half' ? 'var(--valve-half-bg)' : 'var(--valve-open-bg)'),
                              color: p.valve === 'closed'
                                ? 'var(--valve-closed-text)'
                                : (p.valve === 'half' ? 'var(--valve-half-text)' : 'var(--valve-open-text)')
                            }}
                          >
                            {p.valve === 'closed' ? <Lock size={10} /> : (p.valve === 'half' ? <Zap size={10} /> : <Unlock size={10} />)}
                            <span>{p.valve === 'closed' ? 'Cerrada' : (p.valve === 'half' ? 'Válvula 50%' : 'Abierta')}</span>
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>
                        {p.time}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                      {isDry ? (
                        <span>Sin vertido · Acum: {p.total_water_g}g</span>
                      ) : (
                        <span>
                          <strong style={{ color: 'var(--ink)' }}>+{p.water_g}g</strong> → Acum: {p.total_water_g}g
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <div style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.4, marginTop: '2px' }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ajuste rápido post-taza (sensoryTuner) */}
          <div style={{
            padding: '12px',
            borderRadius: 'var(--r-control)',
            background: 'var(--fill)',
            border: '1px solid var(--line)',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
              <Sliders size={13} aria-hidden="true" />
              <span>¿Cómo quedó la taza? Ajuste rápido</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
              {QUICK_TASTE_PRESETS.map((preset) => {
                const active = quickTasteId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleQuickTaste(preset)}
                    style={{
                      minHeight: '36px',
                      padding: '6px 10px',
                      borderRadius: 'var(--r-pill)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                      background: active ? 'color-mix(in oklab, var(--accent) 14%, var(--surface))' : 'var(--surface)',
                      color: active ? 'var(--accent-text, var(--ink))' : 'var(--ink)',
                      fontSize: '12px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {tunerPreview && (
              <div style={{
                padding: '10px',
                borderRadius: 'var(--r-control)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                    {tunerPreview.newGrindText} · {tunerPreview.newTemp}°C
                  </span>
                  {tunerPreview.diagnosis !== 'balanced' && (
                    <button
                      type="button"
                      className="btn-candy primary"
                      onClick={handleApplyTuning}
                      style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, margin: 0 }}
                    >
                      Aplicar ajuste
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
                  {tunerPreview.explanation}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => renderExportCard(shareTemplate, stickerTransparent, stickerOrientation, shareIncludeRecipe)}
              className="barista-btn-secondary"
              style={{ minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: 0, fontSize: '13px' }}
            >
              <Share2 size={16} />
              <span>Exportar tarjeta</span>
            </button>
            <button
              type="button"
              onClick={() => setBrewOpen(true)}
              className="barista-btn-primary"
              style={{ minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Play size={16} fill="currentColor" />
              <span>Cronómetro guiado</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveToInventory}
            disabled={savingBatch}
            className="barista-btn-secondary"
            style={{
              width: '100%',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              margin: 0,
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {savingBatch ? (
              <Loader2 size={15} className="spin" />
            ) : savedBatchId ? (
              <Check size={15} />
            ) : (
              <BookmarkPlus size={15} />
            )}
            <span>
              {savingBatch
                ? 'Guardando en Mis Cafés...'
                : savedBatchId
                  ? 'Guardado en Mis Cafés · Ver ficha'
                  : 'Guardar café en Mis Cafés'}
            </span>
          </button>
        </section>
      )}

      {/* Exportar Tarjeta / Sticker Modal */}
      <StickerShareModal
        shareImage={shareImage}
        title={syntheticBatch.name ? `Tarjeta · ${syntheticBatch.name}` : 'Tarjeta de Receta'}
        shareTemplate={shareTemplate}
        onChangeTemplate={(id) => {
          setShareTemplate(id);
          renderExportCard(id, stickerTransparent, stickerOrientation, shareIncludeRecipe);
        }}
        stickerOrientation={stickerOrientation}
        onChangeOrientation={(o) => {
          setStickerOrientation(o);
          renderExportCard(shareTemplate, stickerTransparent, o, shareIncludeRecipe);
        }}
        includeRecipe={shareIncludeRecipe}
        onChangeIncludeRecipe={(inc) => {
          setShareIncludeRecipe(inc);
          renderExportCard(shareTemplate, stickerTransparent, stickerOrientation, inc);
        }}
        stickerTransparent={stickerTransparent}
        onChangeTransparent={(t) => {
          setStickerTransparent(t);
          renderExportCard(shareTemplate, t, stickerOrientation, shareIncludeRecipe);
        }}
        shareStatus={shareStatus}
        setShareStatus={setShareStatus}
        onClose={() => { setShareImage(null); setShareStatus(''); }}
        onShareNative={async () => {
          if (!shareImage) return;
          try {
            if (navigator.share) {
              const blob = await (await fetch(shareImage)).blob();
              const file = new File([blob], `beantag-receta.png`, { type: 'image/png' });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: syntheticBatch.name, text: buildShareText(), files: [file] });
                return;
              }
            }
            const a = document.createElement('a');
            a.href = shareImage;
            a.download = `beantag-receta.png`;
            a.click();
          } catch (_) {}
        }}
        onCopyText={() => {
          navigator.clipboard?.writeText(buildShareText());
          setShareStatus('Texto copiado.');
        }}
      />

      {brewOpen && syntheticRecipe && (
        <Suspense fallback={null}>
          <BrewGuideModal
            isOpen={brewOpen}
            onClose={() => setBrewOpen(false)}
            recipe={syntheticRecipe}
            batch={syntheticBatch}
            onSaveTunedRecipe={handleSaveTunedFromGuide}
          />
        </Suspense>
      )}
    </div>
  );
}
