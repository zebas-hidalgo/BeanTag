import React, { useMemo, useState } from 'react';
import {
  Play,
  Eye,
  SlidersHorizontal,
  Trophy,
  Clock,
  Thermometer,
  Scale,
  Coffee,
  ArrowDownUp
} from 'lucide-react';
import { getGrinderConfig } from '../utils/grinders.js';

/**
 * Formats date and time string into a clean, localized Spanish representation.
 */
function formatDateTime(dateStr) {
  if (!dateStr) return 'Sin fecha';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dateFormatted = d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Safely parses temperature from number or string (e.g. 93, "93°C", "92.5").
 */
function parseTempNum(tempVal) {
  if (typeof tempVal === 'number' && Number.isFinite(tempVal)) return tempVal;
  if (!tempVal) return null;
  const match = String(tempVal).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Calculates dose out in grams, falling back to dose_in_g * ratio if available.
 */
function calculateDoseOut(rec) {
  if (rec.dose_out_g != null && !isNaN(parseFloat(rec.dose_out_g))) {
    return parseFloat(rec.dose_out_g);
  }
  const doseIn = parseFloat(rec.dose_in_g);
  if (!isNaN(doseIn) && rec.ratio) {
    const match = String(rec.ratio).match(/1:(\d+(?:\.\d+)?)/);
    if (match) {
      const mult = parseFloat(match[1]);
      if (!isNaN(mult)) {
        return Math.round(doseIn * mult * 10) / 10;
      }
    }
  }
  return null;
}

/**
 * Extracts click delta from recipe fields, notes, or grind string differences.
 */
function extractClickDelta(rec, prevRec) {
  // 1. Explicit properties
  if (rec.click_delta != null && Number.isFinite(Number(rec.click_delta))) return Number(rec.click_delta);
  if (rec.clickDelta != null && Number.isFinite(Number(rec.clickDelta))) return Number(rec.clickDelta);
  if (rec.correction?.clickDelta != null && Number.isFinite(Number(rec.correction.clickDelta))) return Number(rec.correction.clickDelta);

  // 2. Parse from notes (e.g. "+2 clics", "-1 clic", "sugirió +2 clics")
  if (rec.notes) {
    const directMatch = String(rec.notes).match(/([+-]\d+)\s*(?:clics?|clicks?|pasos?)/i);
    if (directMatch) return parseInt(directMatch[1], 10);

    const finoMatch = String(rec.notes).match(/(\d+)\s*(?:clics?|clicks?)\s*m[aá]s\s*fino/i);
    if (finoMatch) return -parseInt(finoMatch[1], 10);

    const gruesoMatch = String(rec.notes).match(/(\d+)\s*(?:clics?|clicks?)\s*m[aá]s\s*grueso/i);
    if (gruesoMatch) return parseInt(gruesoMatch[1], 10);
  }

  // 3. Computed from grind string between current and previous iteration
  if (prevRec && rec.grind && prevRec.grind) {
    const currC = String(rec.grind).match(/(\d+)\s*(?:clics?|clicks?)/i);
    const prevC = String(prevRec.grind).match(/(\d+)\s*(?:clics?|clicks?)/i);
    if (currC && prevC) {
      return parseInt(currC[1], 10) - parseInt(prevC[1], 10);
    }
  }

  return null;
}

/**
 * DialInTimeline Component
 * Displays the chronological lineage and evolution of recipes for a coffee batch.
 */
export default function DialInTimeline({
  recipes = [],
  activeGrinderId = 'femobook',
  onSelectRecipe,
  onBrewRecipe
}) {
  // Optional display direction toggle: chronological (#1 -> #N) or reverse (#N -> #1)
  const [reverseDisplay, setReverseDisplay] = useState(false);

  const grinderConfig = useMemo(() => {
    return getGrinderConfig(activeGrinderId);
  }, [activeGrinderId]);

  // Process recipes chronologically to determine iterations, sweet spots, and deltas
  const processedRecipes = useMemo(() => {
    const validRecipes = Array.isArray(recipes) ? recipes.filter(Boolean) : [];
    if (validRecipes.length === 0) return [];

    // Sort chronologically (oldest to newest)
    const sorted = [...validRecipes].sort((a, b) => {
      const parseTime = (item) => {
        if (!item) return 0;
        const raw = item.created_at || item.date || item.timestamp;
        if (!raw) return 0;
        const t = new Date(raw).getTime();
        return isNaN(t) ? 0 : t;
      };
      const timeA = parseTime(a);
      const timeB = parseTime(b);
      if (timeA && timeB && timeA !== timeB) {
        return timeA - timeB;
      }
      return 0;
    });

    return sorted.map((rec, index) => {
      const iterationNumber = index + 1;
      const prevRec = index > 0 ? sorted[index - 1] : null;

      // Identify Sweet Spot
      const hasFiveStars = Number(rec.rating) === 5;
      const notesLower = String(rec.notes || '').toLowerCase();
      const isSweetSpot = hasFiveStars || notesLower.includes('sweet spot') || notesLower.includes('sweetspot');

      // Temperature Delta relative to previous iteration
      const currentTemp = parseTempNum(rec.temperature);
      let tempDelta = null;
      if (prevRec) {
        const prevTemp = parseTempNum(prevRec.temperature);
        if (currentTemp !== null && prevTemp !== null) {
          tempDelta = Math.round((currentTemp - prevTemp) * 10) / 10;
        }
      }

      // Extract Click Delta
      const clickDelta = extractClickDelta(rec, prevRec);

      // Dose In & Dose Out
      const doseIn = rec.dose_in_g != null && !isNaN(parseFloat(rec.dose_in_g))
        ? parseFloat(rec.dose_in_g)
        : null;
      const doseOut = calculateDoseOut(rec);

      return {
        rec,
        iterationNumber,
        isSweetSpot,
        currentTemp,
        tempDelta,
        clickDelta,
        doseIn,
        doseOut
      };
    });
  }, [recipes]);

  // Determine display list according to reverseDisplay toggle
  const displayList = useMemo(() => {
    if (!reverseDisplay) return processedRecipes;
    return [...processedRecipes].reverse();
  }, [processedRecipes, reverseDisplay]);

  // Sweet spot iteration found
  const sweetSpotIteration = useMemo(() => {
    return processedRecipes.find(item => item.isSweetSpot);
  }, [processedRecipes]);

  // Empty state handling
  if (!recipes || recipes.length === 0) {
    return (
      <div
        className="candy-card static"
        style={{
          textAlign: 'center',
          padding: '36px 20px',
          background: 'var(--bg-card)',
          border: '1.5px dashed var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'none'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(188, 84, 73, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--color-crimson, #BC5449)'
          }}
        >
          <Coffee size={28} />
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '15px',
            fontWeight: '800',
            margin: '0 0 8px 0',
            color: 'var(--color-text)'
          }}
        >
          Linaje de Calibración
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted, #6B7280)',
            maxWidth: '380px',
            margin: '0 auto 16px auto',
            lineHeight: '1.5'
          }}
        >
          Aún no hay extracciones registradas para este lote. ¡Prepara tu primera taza con el Modo Barista para iniciar el linaje de calibración!
        </p>
        {typeof onBrewRecipe === 'function' && (
          <button
            type="button"
            className="btn-candy primary"
            onClick={() => onBrewRecipe(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              margin: '0 auto'
            }}
          >
            <Play size={13} fill="currentColor" />
            <span>Iniciar Primera Calibración</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Timeline Controls / Summary Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '13px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--color-text)'
            }}
          >
            Evolución del Dial-in
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'var(--bg-canvas, rgba(0,0,0,0.04))',
              border: '1px solid var(--border-color)',
              color: 'var(--color-text-muted)'
            }}
          >
            {processedRecipes.length} {processedRecipes.length === 1 ? 'iteración' : 'iteraciones'}
          </span>
          {sweetSpotIteration && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(217, 119, 6, 0.12)',
                border: '1px solid var(--barista-accent-honey, #D97706)',
                color: 'var(--barista-accent-honey, #D97706)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trophy size={11} /> Sweet Spot #{sweetSpotIteration.iterationNumber}
            </span>
          )}
        </div>

        {processedRecipes.length > 1 && (
          <button
            type="button"
            className="barista-btn-ghost"
            onClick={() => setReverseDisplay(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            title="Cambiar orden de visualización"
          >
            <ArrowDownUp size={12} />
            <span>{reverseDisplay ? 'Ver cronológico (#1 ➔ #N)' : 'Ver reciente primero'}</span>
          </button>
        )}
      </div>

      {/* Vertical Timeline Container */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {displayList.map((item, index) => {
          const isLast = index === displayList.length - 1;
          const {
            rec,
            iterationNumber,
            isSweetSpot,
            currentTemp,
            tempDelta,
            clickDelta,
            doseIn,
            doseOut
          } = item;

          // Determine grind label text
          const rawGrind = rec.grind ? String(rec.grind).trim() : '';
          const grinderShortName = grinderConfig?.shortName || 'Molino';
          let grindLabel = rawGrind || 'Molienda estándar';
          if (rawGrind && !rawGrind.toLowerCase().includes(grinderShortName.toLowerCase())) {
            grindLabel = `${grinderShortName}: ${rawGrind}`;
          }

          return (
            <div
              key={rec.id || `iteration-${iterationNumber}-${index}`}
              style={{
                position: 'relative',
                paddingLeft: '32px',
                paddingBottom: isLast ? '0px' : '22px'
              }}
            >
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '26px',
                    bottom: '0px',
                    width: '2px',
                    backgroundColor: 'var(--border-color)',
                    zIndex: 1
                  }}
                />
              )}

              {/* Step Node Marker */}
              <div
                style={{
                  position: 'absolute',
                  left: '3px',
                  top: '12px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: isSweetSpot
                    ? 'var(--barista-accent-honey, #D97706)'
                    : 'var(--bg-card, #FFFFFF)',
                  border: isSweetSpot
                    ? '2px solid #FFFFFF'
                    : '2px solid var(--color-crimson, #BC5449)',
                  boxShadow: isSweetSpot
                    ? '0 0 0 4px var(--barista-accent-honey-glow, rgba(217, 119, 6, 0.25))'
                    : '0 0 0 3px rgba(188, 84, 73, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                {isSweetSpot ? (
                  <Trophy size={10} color="#FFFFFF" strokeWidth={2.5} />
                ) : (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-crimson, #BC5449)'
                    }}
                  />
                )}
              </div>

              {/* Node Card */}
              <div
                className="candy-card static"
                style={{
                  padding: '14px 16px',
                  margin: 0,
                  background: isSweetSpot
                    ? 'linear-gradient(180deg, var(--bg-card) 0%, rgba(217, 119, 6, 0.04) 100%)'
                    : 'var(--bg-card)',
                  border: isSweetSpot
                    ? '1.5px solid var(--barista-accent-honey, #D97706)'
                    : '1px solid var(--border-color)',
                  boxShadow: isSweetSpot
                    ? '0 4px 16px var(--barista-accent-honey-glow, rgba(217, 119, 6, 0.15))'
                    : 'none',
                  borderRadius: '14px'
                }}
              >
                {/* 1. Header: #X • {formatted date/time} + Sweet Spot badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading, sans-serif)',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: isSweetSpot
                          ? 'var(--barista-accent-honey, #D97706)'
                          : 'var(--color-crimson, #BC5449)',
                        letterSpacing: '0.5px'
                      }}
                    >
                      #{iterationNumber}
                    </span>
                    <span style={{ color: 'var(--border-color)', fontSize: '11px' }}>•</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-muted, #6B7280)',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: '500'
                      }}
                    >
                      {formatDateTime(rec.created_at || rec.date || rec.timestamp)}
                    </span>
                  </div>

                  {isSweetSpot && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: 'rgba(217, 119, 6, 0.15)',
                        border: '1.5px solid var(--barista-accent-honey, #D97706)',
                        color: 'var(--barista-accent-honey, #D97706)',
                        fontWeight: '800',
                        fontSize: '11px',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 6px var(--barista-accent-honey-glow, rgba(217, 119, 6, 0.2))'
                      }}
                    >
                      <span>🏆 Sweet Spot Calibrado (⭐ {Number.isFinite(Number(rec.rating)) ? Number(rec.rating).toFixed(1) : '5.0'})</span>
                    </div>
                  )}
                </div>

                {/* 2. Grinder badge: prominent dial formatting with grinder icon */}
                <div style={{ marginBottom: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(188, 84, 73, 0.08)',
                      border: '1px solid rgba(188, 84, 73, 0.25)',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    <SlidersHorizontal size={14} color="var(--color-crimson, #BC5449)" />
                    <span>
                      <strong style={{ color: 'var(--color-crimson, #BC5449)' }}>
                        Molino:
                      </strong>{' '}
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: '700' }}>
                        {grindLabel}
                      </span>
                    </span>

                    {clickDelta !== null && clickDelta !== 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          background: clickDelta > 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: clickDelta > 0 ? 'var(--barista-accent-honey, #D97706)' : '#059669',
                          border: `1px solid ${clickDelta > 0 ? 'rgba(217, 119, 6, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}
                      >
                        {clickDelta > 0 ? `+${clickDelta} clics` : `${clickDelta} clics`}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Parameter chips: Ratio / Dosis, Temp, Tiempo */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  {/* Ratio / Dosis */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-canvas, rgba(0,0,0,0.03))',
                      border: '1px solid var(--border-color)',
                      fontSize: '11px',
                      color: 'var(--color-text)'
                    }}
                  >
                    <Scale size={13} color="var(--color-crimson, #BC5449)" />
                    <span>
                      <strong style={{ color: 'var(--color-text-muted, #6B7280)', fontSize: '10px' }}>
                        Ratio / Dosis:{' '}
                      </strong>
                      {doseIn != null ? `${doseIn}g` : '—'} ➔ {doseOut != null ? `${doseOut}g` : '—'} • {rec.ratio || '1:15'}
                    </span>
                  </div>

                  {/* Temp */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-canvas, rgba(0,0,0,0.03))',
                      border: '1px solid var(--border-color)',
                      fontSize: '11px',
                      color: 'var(--color-text)'
                    }}
                  >
                    <Thermometer size={13} color="var(--barista-accent-honey, #D97706)" />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <strong style={{ color: 'var(--color-text-muted, #6B7280)', fontSize: '10px' }}>
                        Temp:{' '}
                      </strong>
                      <span>{currentTemp !== null ? `${currentTemp}°C` : (rec.temperature || '—')}</span>
                      {tempDelta !== null && tempDelta !== 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '1px 5px',
                            borderRadius: '5px',
                            background: tempDelta > 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: tempDelta > 0 ? 'var(--barista-accent-honey, #D97706)' : '#059669',
                            border: `1px solid ${tempDelta > 0 ? 'rgba(217, 119, 6, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        >
                          {tempDelta > 0 ? `+${tempDelta}°C` : `${tempDelta}°C`}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Tiempo */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-canvas, rgba(0,0,0,0.03))',
                      border: '1px solid var(--border-color)',
                      fontSize: '11px',
                      color: 'var(--color-text)'
                    }}
                  >
                    <Clock size={13} color="var(--color-text-muted, #6B7280)" />
                    <span>
                      <strong style={{ color: 'var(--color-text-muted, #6B7280)', fontSize: '10px' }}>
                        Tiempo:{' '}
                      </strong>
                      {rec.brew_time || '—'}
                    </span>
                  </div>
                </div>

                {/* 4. Sensory feedback / notes */}
                {(rec.notes || rec.sensory_balance || rec.sensory_body || rec.sensory_extraction) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-canvas, rgba(0, 0, 0, 0.02))',
                      borderLeft: isSweetSpot
                        ? '3px solid var(--barista-accent-honey, #D97706)'
                        : '3px solid var(--color-crimson, #BC5449)',
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Sensory chips row */}
                    {(rec.sensory_balance || rec.sensory_body || rec.sensory_extraction) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: rec.notes ? '6px' : '0' }}>
                        {rec.sensory_balance && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              background: 'rgba(217, 119, 6, 0.12)',
                              color: 'var(--barista-accent-honey, #D97706)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(217, 119, 6, 0.25)'
                            }}
                          >
                            ⚖️ {rec.sensory_balance}
                          </span>
                        )}
                        {rec.sensory_body && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#2563EB',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(59, 130, 246, 0.25)'
                            }}
                          >
                            🍯 {rec.sensory_body}
                          </span>
                        )}
                        {rec.sensory_extraction && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              background: rec.sensory_extraction === 'En Punto' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: rec.sensory_extraction === 'En Punto' ? '#059669' : '#DC2626',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${rec.sensory_extraction === 'En Punto' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                            }}
                          >
                            🧪 {rec.sensory_extraction}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tasting notes or diagnostic */}
                    {rec.notes && (
                      <div
                        style={{
                          fontSize: '11px',
                          lineHeight: '1.45',
                          color: 'var(--color-text)',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {rec.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    type="button"
                    className="btn-candy primary"
                    onClick={() => {
                      if (typeof onBrewRecipe === 'function') {
                        onBrewRecipe(rec);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      margin: 0
                    }}
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Preparar Esta Versión</span>
                  </button>

                  <button
                    type="button"
                    className="barista-btn-secondary"
                    onClick={() => {
                      if (typeof onSelectRecipe === 'function') {
                        onSelectRecipe(rec);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      margin: 0
                    }}
                  >
                    <Eye size={12} />
                    <span>Ver / Editar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
