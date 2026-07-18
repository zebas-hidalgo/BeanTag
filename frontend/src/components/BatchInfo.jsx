import React from 'react';
import { formatLocalDateStr } from '../utils/date';
import { getScaIcon, stripEmojis } from '../utils/scaIcons';
import { ArrowLeft, Nfc } from 'lucide-react';

export default function BatchInfo({ batch, onBack, onSubtractDose, onSaveRecipe, showToast, setBatch }) {
  if (!batch) return null;

  const doseNum = parseFloat(batch.dose_weight) || 20.0;
  const isLowStock = batch.remaining_doses <= 2;
  const lastRecipe = batch.recipes && batch.recipes.length > 0 ? batch.recipes[0] : null;

  let restingDays = 0;
  let restingDaysText = 'Sin datos';
  let freezeTime = 'Sin datos';
  let degasStatus = { label: 'Degas Desconocido', color: '#718096', description: 'Sin información de fechas.' };
  
  if (batch.roast_date && batch.freeze_date) {
    const roast = new Date(batch.roast_date);
    const freeze = new Date(batch.freeze_date);
    const diffTime = Math.abs(freeze - roast);
    restingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    restingDaysText = `${restingDays} días de reposo`;

    if (restingDays <= 5) {
      degasStatus = { label: 'Degas Insuficiente', color: '#E53E3E', description: 'Poco reposo. El CO₂ atrapado puede producir sabores metálicos o agrios.' };
    } else if (restingDays >= 6 && restingDays <= 20) {
      degasStatus = { label: 'Degas Perfecto', color: '#38A169', description: 'Reposo ideal. Máxima expresión aromática y estabilidad en congelación.' };
    } else {
      degasStatus = { label: 'Degas Alto', color: '#D69E2E', description: 'Reposo prolongado. Los aromáticos volátiles pueden estar suavizados.' };
    }
  }
  
  if (batch.freeze_date) {
    const freeze = new Date(batch.freeze_date);
    const today = new Date();
    const diffTime = Math.abs(today - freeze);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      freezeTime = `Congelado hace ${diffDays} días`;
    } else {
      freezeTime = `Congelado hace ${Math.floor(diffDays / 7)} semanas`;
    }
  }

  const handleDoseDeduction = () => {
    onSubtractDose(batch.id, () => {
      setBatch(prev => ({ ...prev, remaining_doses: Math.max(0, prev.remaining_doses - 1) }));
    });
  };

  const handleWriteNfc = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({ records: [{ recordType: "url", data: `https://beantag.cafe/batch/${batch.id}` }] });
        showToast('Etiqueta NFC vinculada con éxito. 🎉', { type: 'success', duration: 3000 });
      } catch (error) {
        showToast('Error al escribir NFC: ' + error.message, { type: 'error', duration: 4000 });
      }
    } else {
      showToast('Escritura NFC no disponible en este dispositivo (Usa Chrome en Android).', { type: 'error', duration: 5000 });
    }
  };

  const handleRepeatLastRecipe = () => {
    if (!lastRecipe) return;
    onSubtractDose(batch.id, () => {
      onSaveRecipe({
        batch_id: batch.id, method: lastRecipe.method, ratio: lastRecipe.ratio, grind: lastRecipe.grind,
        temperature: lastRecipe.temperature, brew_time: lastRecipe.brew_time, notes: `${lastRecipe.notes || ''} (Repetición rápida)`.trim(),
        sensory_balance: lastRecipe.sensory_balance || 'Dulce', sensory_body: lastRecipe.sensory_body || 'Medio', sensory_extraction: lastRecipe.sensory_extraction || 'En Punto',
        dose_in_g: lastRecipe.dose_in_g !== null && lastRecipe.dose_in_g !== undefined ? lastRecipe.dose_in_g : doseNum,
        dose_out_g: lastRecipe.dose_out_g !== null && lastRecipe.dose_out_g !== undefined ? lastRecipe.dose_out_g : null,
        espresso_pressure: lastRecipe.espresso_pressure !== null && lastRecipe.espresso_pressure !== undefined ? lastRecipe.espresso_pressure : null,
        espresso_preinfusion: lastRecipe.espresso_preinfusion !== null && lastRecipe.espresso_preinfusion !== undefined ? lastRecipe.espresso_preinfusion : null
      });
      const doseInVal = lastRecipe.dose_in_g !== null && lastRecipe.dose_in_g !== undefined ? lastRecipe.dose_in_g : doseNum;
      setBatch(prev => ({ ...prev, remaining_weight_g: Math.max(0.0, prev.remaining_weight_g - doseInVal) }));
    });
  };

  const parseGrindToMicrons = (grindStr) => {
    if (!grindStr || !grindStr.includes('J-Max:')) return null;
    const parts = grindStr.replace('J-Max:', '').trim().split('.');
    if (parts.length === 3) {
      const rot = parseInt(parts[0]) || 0, num = parseInt(parts[1]) || 0, click = parseInt(parts[2]) || 0;
      return Math.round(((rot * 90) + (num * 10) + click) * 8.8);
    }
    return null;
  };

  // Derive ratioVal from lastRecipe for the water display
  let derivedRatio = 15.0;
  if (lastRecipe && lastRecipe.ratio && lastRecipe.ratio.includes('1:')) {
    const rm = lastRecipe.ratio.match(/1:([0-9.]+)/);
    if (rm) derivedRatio = parseFloat(rm[1]) || 15.0;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn-candy" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} strokeWidth={3} />
          Volver
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-candy" onClick={() => {
            if ('NDEFReader' in window) showToast('Acerca la etiqueta NFC al teléfono...', { type: 'info', duration: 5000 });
            handleWriteNfc();
          }} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Nfc size={16} strokeWidth={2.5} />
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Vincular</span>
          </button>
          {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS TUBOS!</span>}
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', textTransform: 'uppercase', wordBreak: 'break-word' }}>{batch.name}</h2>
      <div className="grain-details-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div><strong>Productor:</strong> {batch.producer}</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong>Variedad:</strong> {batch.variety || 'N/A'}</span>
          <span><strong>Proceso:</strong> {batch.process || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong>Altitud:</strong> {batch.altitude || 'N/A'}</span>
          <span><strong>Tubo:</strong> {batch.dose_weight || '20.0g'}</span>
        </div>
      </div>

      {(() => {
        let scaTags = [];
        let customNotes = '';
        if (batch.roaster_notes) {
          const notesStr = String(batch.roaster_notes);
          if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
            const match = notesStr.match(/\[Notas: (.*?)\]/);
            if (match) scaTags = match[1].split(',').map(s => s.trim());
            if (notesStr.includes(' | ')) customNotes = notesStr.split(' | ')[1].trim();
          } else {
            customNotes = notesStr.trim();
          }
        }
        if (scaTags.length === 0 && !customNotes) return null;
        return (
          <div style={{ marginTop: '14px', marginBottom: '14px', padding: '12px', backgroundColor: 'var(--bg-card)', border: '2px solid #000000', borderRadius: '8px', boxShadow: '3px 3px 0px #000000' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 10px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
              Notas de Cata
            </h4>
            {scaTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: customNotes ? '10px' : '0' }}>
                {scaTags.map((tag, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#FFFFFF', border: '2px solid #000000', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: 'var(--color-text)', boxShadow: '1px 1px 0px #000000' }}>
                    {getScaIcon(tag, 13, 2.5)}
                    {stripEmojis(tag)}
                  </span>
                ))}
              </div>
            )}
            {customNotes && <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>"{customNotes}"</div>}
          </div>
        );
      })()}

      <div className="candy-card static">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Estado en Congelador:</div>
            <span style={{ fontSize: '15px', fontWeight: '900' }}>{batch.remaining_doses} / {batch.total_doses} Tubos ({batch.remaining_weight_g || 0}g rest.)</span>
          </div>
          {batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleDoseDeduction} style={{ margin: 0, padding: '8px 12px', fontSize: '11px' }}>
              - Restar 1 Tubo
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px' }}>🔥</span><span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Tueste:</span><strong>{formatLocalDateStr(batch.roast_date)}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px' }}>❄️</span><span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Congelado:</span><strong>{formatLocalDateStr(batch.freeze_date)}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px' }}>⏳</span><span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Reposado:</span><strong>{restingDaysText}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px' }}>🧊</span><span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Estadía:</span><strong>{freezeTime}</strong></div>
        </div>
      </div>

      {batch.roast_date && batch.freeze_date && (
        <div className="candy-card static" style={{ borderLeft: `6px solid ${degasStatus.color}`, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: '900', color: degasStatus.color, textTransform: 'uppercase' }}>{degasStatus.label} ({restingDays} Días)</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{degasStatus.description}</p>
        </div>
      )}

      {lastRecipe && (
        <div className="recipe-target-banner">
          <div style={{ fontSize: '9px', fontWeight: '900', color: '#E53E3E', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Última Configuración Exitosa (Referencia)</div>
          <div style={{ fontSize: '13px', fontWeight: '900' }}>{lastRecipe.method} | {lastRecipe.grind} | {lastRecipe.ratio}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Molido para <strong>{batch.dose_weight}</strong> (~{parseGrindToMicrons(lastRecipe.grind)} µm). Agua: <strong>{(doseNum * derivedRatio).toFixed(0)}g</strong>.</div>
          {batch.remaining_doses > 0 && <button className="btn-candy primary" onClick={handleRepeatLastRecipe} style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '10px' }}>Repetir Receta Anterior y Restar Tubo (1-Click)</button>}
        </div>
      )}
    </>
  );
}
