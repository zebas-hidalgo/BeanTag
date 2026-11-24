import React, { useState, useRef, useMemo, lazy, Suspense } from 'react';
import { ArrowLeft, Camera, Upload, Sparkles, Play, Share2, Loader2, Minus, Plus, Coffee, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { compressImageForOcr } from '../utils/imageCompressor';
import { GRINDERS, getGrinderConfig } from '../utils/grinders';
import { MethodIcon } from './icons/CoffeeIcons';
import StickerShareModal from './StickerShareModal';
import {
  DEFAULT_CARD_STYLE,
  generateRecipeCardImage,
  generateCoffeeStickerImage
} from '../utils/cardGenerator';

const BrewGuideModal = lazy(() => import('./BrewGuideModal'));

const METHODS = [
  { id: 'V60 (Filtrado)', label: 'V60', baseRatio: 16 },
  { id: 'NextLevel Pulsar Mini', label: 'Pulsar Mini', baseRatio: 16.5 },
  { id: 'AeroPress Go', label: 'AeroPress Go', baseRatio: 14.3 },
  { id: 'AeroPress', label: 'AeroPress', baseRatio: 15 },
  { id: 'Chemex', label: 'Chemex', baseRatio: 16 },
  { id: 'Prensa Francesa', label: 'Prensa', baseRatio: 15 },
  { id: 'Espresso', label: 'Espresso', baseRatio: 2 }
];

const CUP_ML = 200;

export default function QuickBrewView({ onBack, showToast }) {
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

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
  const [cups, setCups] = useState(1);

  const activeMethodObj = useMemo(() => METHODS.find(m => m.id === method) || METHODS[0], [method]);
  const isEspresso = method === 'Espresso';
  const targetWaterMl = isEspresso ? cups * 36 : cups * CUP_ML;

  const [doseOverride, setDoseOverride] = useState(null);
  const computedDoseG = useMemo(() => {
    if (isEspresso) return cups * 18;
    return Math.round((targetWaterMl / activeMethodObj.baseRatio) * 2) / 2;
  }, [isEspresso, cups, targetWaterMl, activeMethodObj.baseRatio]);
  const doseInG = doseOverride !== null ? doseOverride : computedDoseG;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipe, setAiRecipe] = useState(null);
  const [brewOpen, setBrewOpen] = useState(false);

  // Share card state
  const [shareImage, setShareImage] = useState(null);
  const [shareTemplate, setShareTemplate] = useState(DEFAULT_CARD_STYLE);
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
          ...(useGroq ? { 'x-groq-key': groqKey } : { 'x-ai-model': 'gemini-2.5-flash' })
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
          dose_in_g: doseInG,
          grinder
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar receta.');
      setAiRecipe(data);
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
    return {
      method,
      dose_in_g: doseInG,
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
  }, [aiRecipe, method, doseInG, targetWaterMl, activeMethodObj.baseRatio]);

  const renderExportCard = async (
    styleId = shareTemplate,
    transparent = stickerTransparent,
    orientation = stickerOrientation,
    mode = 'sticker'
  ) => {
    if (!syntheticRecipe) return;
    setShareStatus('Generando tarjeta...');
    try {
      const mergedData = { ...syntheticBatch, ...syntheticRecipe, batch_name: syntheticBatch.name };
      const img = mode === 'card'
        ? await generateRecipeCardImage(mergedData, styleId, true)
        : await generateCoffeeStickerImage(mergedData, {
            style: styleId,
            includeRecipe: true,
            transparent,
            orientation
          });
      setShareImage(img);
      setShareStatus('');
    } catch (err) {
      setShareStatus('No se pudo generar la tarjeta.');
    }
  };

  const buildShareText = () => {
    if (!syntheticRecipe) return syntheticBatch.name;
    return `☕ ${syntheticBatch.name}${syntheticBatch.origin ? ` · ${syntheticBatch.origin}` : ''}\n${syntheticRecipe.method} | ${syntheticRecipe.dose_in_g}g → ${syntheticRecipe.water_total_g}g (${syntheticRecipe.ratio}) | ${syntheticRecipe.temperature}°C | ${syntheticRecipe.brew_time}\nMolienda: ${syntheticRecipe.grind}`;
  };

  const activeGrinderMeta = getGrinderConfig(grinder) || GRINDERS[0];

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
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-crimson)', fontFamily: 'var(--font-mono)' }}>
          1 taza = {CUP_ML} ml
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 className="bt-page-title" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Preparación Rápida</h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted)' }}>
          Saca foto a la tarjeta del café, elige tu equipo y tazas, y genera la receta con IA.
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

      {/* 2. Molino, Método y Tazas */}
      <section className="bt-section" style={{ marginBottom: '14px' }}>
        <div className="bt-section-head">
          <h3 className="bt-section-title">2. Molino, Método y Tazas</h3>
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
                onClick={() => { setMethod(m.id); setDoseOverride(null); }}
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

        {/* Tazas de 200ml */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {isEspresso ? 'Cantidad de shots' : 'Tazas (200 ml c/u)'}
          </span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-text)', fontWeight: 700 }}>
            Agua: {targetWaterMl} ml
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', marginBottom: '12px' }}>
          {[1, 2, 3, 4].map((n) => {
            const active = cups === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => { setCups(n); setDoseOverride(null); }}
                style={{
                  minHeight: '44px',
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
                  lineHeight: 1.2
                }}
              >
                <span>{n} {isEspresso ? (n === 1 ? 'shot' : 'shots') : (n === 1 ? 'taza' : 'tazas')}</span>
                <small style={{ fontSize: '10px', opacity: 0.75, fontFamily: 'var(--font-mono)' }}>
                  {isEspresso ? `${n * 36}g` : `${n * CUP_ML}ml`}
                </small>
              </button>
            );
          })}
        </div>

        {/* Ajuste fino de dosis */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--r-control)', background: 'var(--fill)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Coffee size={14} />
            <span>Dosis de café</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="barista-stepper-btn"
              aria-label="Restar 0.5g"
              onClick={() => setDoseOverride(Math.max(5, Math.round((doseInG - 0.5) * 10) / 10))}
            >
              <Minus size={14} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, minWidth: '52px', textAlign: 'center' }}>
              {doseInG}g
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

      {/* 3. Resultado IA + Exportar Tarjeta */}
      {aiRecipe && syntheticRecipe && (
        <section className="bt-section soft-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <h3 className="bt-section-title" style={{ margin: 0 }}>Receta Recomendada</h3>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 700 }}>
              {aiRecipe._model || (aiRecipe._source === 'groq' ? 'Groq IA' : 'Barista IA')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Ratio / Agua</div>
              <strong style={{ fontSize: '13px', color: 'var(--accent-text)' }}>{syntheticRecipe.ratio} ({syntheticRecipe.water_total_g}g)</strong>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Temp</div>
              <strong style={{ fontSize: '13px' }}>{syntheticRecipe.temperature}°C</strong>
            </div>
            <div style={{ padding: '8px', borderRadius: 'var(--r-control)', background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Tiempo</div>
              <strong style={{ fontSize: '13px' }}>{syntheticRecipe.brew_time}</strong>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 'var(--r-control)', background: 'var(--fill)', marginBottom: '12px', fontSize: '13px' }}>
            <strong>{activeGrinderMeta.name}:</strong>{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-text)' }}>
              {aiRecipe.active_grinder_dial?.dial || syntheticRecipe.grind}
            </span>
            {aiRecipe.grind_microns && (
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)', marginLeft: '6px' }}>
                (~{aiRecipe.grind_microns} µm)
              </span>
            )}
          </div>

          {Array.isArray(syntheticRecipe.pours) && syntheticRecipe.pours.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {syntheticRecipe.pours.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: 'var(--r-xs)', background: 'var(--raised)', border: '1px solid var(--line)', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600 }}>{idx + 1}. {p.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                    +{p.water_g}g · {p.time}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => renderExportCard(shareTemplate, stickerTransparent, stickerOrientation, 'card')}
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
              <span>Preparar</span>
            </button>
          </div>
        </section>
      )}

      {/* Exportar Tarjeta / Sticker Modal */}
      <StickerShareModal
        shareImage={shareImage}
        title={syntheticBatch.name ? `Tarjeta · ${syntheticBatch.name}` : 'Tarjeta de Receta'}
        shareTemplate={shareTemplate}
        onChangeTemplate={(id) => {
          setShareTemplate(id);
          renderExportCard(id, stickerTransparent, stickerOrientation, 'card');
        }}
        stickerOrientation={stickerOrientation}
        onChangeOrientation={(o) => {
          setStickerOrientation(o);
          renderExportCard(shareTemplate, stickerTransparent, o, 'sticker');
        }}
        includeRecipe={true}
        onChangeIncludeRecipe={() => {}}
        stickerTransparent={stickerTransparent}
        onChangeTransparent={(t) => {
          setStickerTransparent(t);
          renderExportCard(shareTemplate, t, stickerOrientation, 'sticker');
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
            onSaveTunedRecipe={null}
          />
        </Suspense>
      )}
    </div>
  );
}
