import React from 'react';
import { SlidersHorizontal, Coffee, Scale, Gauge, Thermometer, Clock, Sparkles } from 'lucide-react';
import { FAMOUS_RECIPES } from '../../utils/famousRecipes';

const METHODS = [
  { id: 'V60 (Filtrado)', label: 'V60' },
  { id: 'NextLevel Pulsar Mini', label: 'Pulsar Mini' },
  { id: 'AeroPress Go', label: 'AeroPress Go' },
  { id: 'AeroPress', label: 'AeroPress' },
  { id: 'Chemex', label: 'Chemex' },
  { id: 'Espresso', label: 'Espresso' },
  { id: 'Prensa Francesa', label: 'Prensa' }
];

export default function RecipeParamsGrid({
  method,
  setMethod,
  doseInG,
  setDoseInG,
  doseOutG,
  setDoseOutG,
  ratioVal,
  setRatioVal,
  waterTemp,
  setWaterTemp,
  brewTime,
  setBrewTime,
  onApplyFamousRecipe,
  selectedFamousRecipe,
  doseAdjustmentFeedback
}) {
  const isEspresso = method === 'Espresso';
  const isPulsar = method === 'NextLevel Pulsar Mini';

  // Filter famous recipes for this method
  const relevantFamous = FAMOUS_RECIPES.filter(
    r => r.method === method || (isPulsar && r.id.includes('pulsar'))
  );

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 1. Selector Segmentado de Métodos */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '6px',
        padding: '4px',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {METHODS.map((m) => {
          const isActive = method === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setMethod(m.id);
                if (m.id === 'NextLevel Pulsar Mini') {
                  if (!doseInG || doseInG === 20.0 || doseInG === 15.0) setDoseInG(18.0);
                  if (!ratioVal || ratioVal === 15.0 || ratioVal === 16.6) setRatioVal(16.67);
                } else if (m.id === 'AeroPress Go') {
                  if (!doseInG || doseInG === 20.0 || doseInG > 15.0) setDoseInG(14.0);
                  if (!ratioVal || ratioVal === 15.0) setRatioVal(14.3);
                }
              }}
              style={{
                flex: '0 0 auto',
                minHeight: '44px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                fontWeight: isActive ? '800' : '600',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {m.id === 'NextLevel Pulsar Mini' ? <SlidersHorizontal size={14} /> : <Coffee size={14} />}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Recetas Legendarias del Método (Quick Pick) */}
      {relevantFamous.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={13} color="var(--accent-honey)" />
            <span>Recetas Maestras ({method})</span>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {relevantFamous.map((fam) => {
              const isSelected = selectedFamousRecipe?.id === fam.id;
              return (
                <button
                  type="button"
                  key={fam.id}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(8);
                    onApplyFamousRecipe(fam);
                  }}
                  className="barista-btn barista-btn-secondary"
                  style={{
                    flex: '0 0 auto',
                    minHeight: '44px',
                    padding: '8px 14px',
                    backgroundColor: isSelected ? 'var(--accent-honey)' : 'var(--bg-surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    borderColor: isSelected ? 'transparent' : 'var(--border-subtle)',
                    fontSize: 'var(--text-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '800' }}>{fam.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-metric)' }}>
                    {fam.defaultDose}g • {fam.ratio} • {fam.brewTime}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Bento Grid: Parámetros Clave (Dosis, Ratio/Out, Temp, Tiempo) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px'
      }}>
        {/* Widget 1: Dosis Café */}
        <div className="barista-card-subtle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '700' }}>
            <span>Dosis Café</span>
            <Scale size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <button
              type="button"
              className="barista-stepper-btn"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setDoseInG(d => Math.max(5, parseFloat((d - 0.5).toFixed(1))));
              }}
              aria-label="Menos dosis"
            >
              -
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={doseInG}
                onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)}
                className="barista-metric-val"
                style={{ width: '46px', textAlign: 'center', fontSize: 'var(--text-lg)', border: 'none', background: 'transparent', padding: 0 }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600', marginLeft: '2px' }}>g</span>
            </div>
            <button
              type="button"
              className="barista-stepper-btn"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setDoseInG(d => Math.min(50, parseFloat((d + 0.5).toFixed(1))));
              }}
              aria-label="Más dosis"
            >
              +
            </button>
          </div>
          {doseAdjustmentFeedback && (
            <div style={{ fontSize: '10.5px', color: 'var(--accent-honey)', marginTop: '4px', fontWeight: '600' }}>
              {doseAdjustmentFeedback}
            </div>
          )}
        </div>

        {/* Widget 2: Ratio o Dosis Salida (Espresso) */}
        {isEspresso ? (
          <div className="barista-card-subtle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '700' }}>
              <span>Output Taza</span>
              <Gauge size={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <button
                type="button"
                className="barista-stepper-btn"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(6);
                  setDoseOutG(d => Math.max(10, parseFloat((d - 1).toFixed(1))));
                }}
                aria-label="Menos output"
              >
                -
              </button>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={doseOutG}
                  onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)}
                  className="barista-metric-val"
                  style={{ width: '46px', textAlign: 'center', fontSize: 'var(--text-lg)', border: 'none', background: 'transparent', padding: 0 }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600', marginLeft: '2px' }}>g</span>
              </div>
              <button
                type="button"
                className="barista-stepper-btn"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(6);
                  setDoseOutG(d => Math.min(100, parseFloat((d + 1).toFixed(1))));
                }}
                aria-label="Más output"
              >
                +
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center', fontFamily: 'var(--font-metric)' }}>
              Ratio ~1:{doseInG > 0 ? (doseOutG / doseInG).toFixed(1) : 2}
            </div>
          </div>
        ) : (
          <div className="barista-card-subtle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '700' }}>
              <span>Ratio 1:</span>
              <Gauge size={14} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <button
                type="button"
                className="barista-stepper-btn"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(6);
                  setRatioVal(r => Math.max(8, parseFloat((r - 0.5).toFixed(1))));
                }}
                aria-label="Menos ratio"
              >
                -
              </button>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={ratioVal}
                  onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)}
                  className="barista-metric-val"
                  style={{ width: '46px', textAlign: 'center', fontSize: 'var(--text-lg)', border: 'none', background: 'transparent', padding: 0 }}
                />
              </div>
              <button
                type="button"
                className="barista-stepper-btn"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(6);
                  setRatioVal(r => Math.min(25, parseFloat((r + 0.5).toFixed(1))));
                }}
                aria-label="Más ratio"
              >
                +
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center', fontFamily: 'var(--font-metric)' }}>
              ~{Math.round(doseInG * ratioVal)}g agua
            </div>
          </div>
        )}

        {/* Widget 3: Temperatura de Agua */}
        <div className="barista-card-subtle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '700' }}>
            <span>Temp Agua</span>
            <Thermometer size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <button
              type="button"
              className="barista-stepper-btn"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setWaterTemp(t => Math.max(70, t - 1));
              }}
              aria-label="Menos temperatura"
            >
              -
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <input
                type="number"
                inputMode="decimal"
                value={waterTemp}
                onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)}
                className="barista-metric-val"
                style={{ width: '44px', textAlign: 'center', fontSize: 'var(--text-lg)', border: 'none', background: 'transparent', padding: 0 }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600', marginLeft: '2px' }}>°C</span>
            </div>
            <button
              type="button"
              className="barista-stepper-btn"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setWaterTemp(t => Math.min(100, t + 1));
              }}
              aria-label="Más temperatura"
            >
              +
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
            {waterTemp >= 95 ? 'Alta Extracción' : waterTemp <= 90 ? 'Baja Turbulencia' : 'Extracción Balance'}
          </div>
        </div>

        {/* Widget 4: Tiempo Estimado */}
        <div className="barista-card-subtle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '700' }}>
            <span>Tiempo</span>
            <Clock size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '44px' }}>
            <input
              type="text"
              value={brewTime}
              onChange={(e) => setBrewTime(e.target.value)}
              placeholder="3:30 min"
              className="barista-metric-val"
              style={{ width: '100%', textAlign: 'center', fontSize: 'var(--text-base)', border: 'none', background: 'transparent', padding: 0 }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
            {isPulsar ? '3:30 - 3:45 min' : 'Objetivo taza'}
          </div>
        </div>
      </div>
    </div>
  );
}
