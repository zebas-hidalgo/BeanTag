import React from 'react';
import { Sliders, CheckCircle2, ChevronRight, Gauge } from 'lucide-react';
import { GRINDERS, getGrinderConfig } from '../../utils/grinders';

export default function GrinderSyncMatrix({
  grinderType,
  setGrinderType,
  currentMicrons,
  jmaxRot,
  setJmaxRot,
  jmaxNum,
  setJmaxNum,
  jmaxClick,
  setJmaxClick,
  kUltraDial,
  setKUltraDial,
  odeDial,
  setOdeDial,
  comandanteClicks,
  setComandanteClicks,
  femobookClicks,
  setFemobookClicks,
  kingrinderClicks,
  setKingrinderClicks,
  timemoreClicks,
  setTimemoreClicks,
  baratzaStep,
  setBaratzaStep,
  updateManualGrinder,
  getGrindString
}) {
  const activeGrinderMeta = getGrinderConfig(grinderType) || GRINDERS[0];

  return (
    <div className="barista-card" style={{ marginBottom: '16px' }}>
      {/* Header: Title and Active Micron Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} color="var(--accent-terracotta)" />
          <h3 style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: 'var(--text-primary)'
          }}>
            Calibración de Molienda
          </h3>
        </div>

        {/* Physical Microns D50 Pill */}
        <div className="barista-chip" style={{
          borderColor: 'var(--accent-terracotta)',
          color: 'var(--accent-terracotta)',
          backgroundColor: 'var(--bg-elevated)',
          fontWeight: '800',
          fontFamily: 'var(--font-metric)'
        }}>
          ~{currentMicrons} µm D₅₀
        </div>
      </div>

      {/* Selector de Molino Activo */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '6px',
        padding: '3px',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px',
        scrollbarWidth: 'none'
      }}>
        {GRINDERS.map(g => {
          const isSelected = grinderType === g.id;
          return (
            <button
              type="button"
              key={g.id}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setGrinderType(g.id);
              }}
              style={{
                flex: '0 0 auto',
                minHeight: '44px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                color: isSelected ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                fontWeight: isSelected ? '800' : '600',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              {g.shortName}
            </button>
          );
        })}
      </div>

      {/* Controles Específicos para el Molino Activo */}
      <div className="barista-card-subtle" style={{ padding: '14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {activeGrinderMeta.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {activeGrinderMeta.burrs} • {activeGrinderMeta.stepDesc}
            </div>
          </div>
        </div>

        {/* 1. J-Max (Rot / Num / Click) */}
        {grinderType === 'jmax' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Rotación */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Rotación</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px' }}>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(0, jmaxRot - 1); setJmaxRot(v); updateManualGrinder('jmax', { rot: v, num: jmaxNum, click: jmaxClick }); }}>-</button>
                <span className="barista-metric-val" style={{ fontSize: 'var(--text-lg)' }}>{jmaxRot}</span>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(5, jmaxRot + 1); setJmaxRot(v); updateManualGrinder('jmax', { rot: v, num: jmaxNum, click: jmaxClick }); }}>+</button>
              </div>
            </div>
            {/* Número */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Número</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px' }}>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = (jmaxNum - 1 + 9) % 9; setJmaxNum(v); updateManualGrinder('jmax', { rot: jmaxRot, num: v, click: jmaxClick }); }}>-</button>
                <span className="barista-metric-val" style={{ fontSize: 'var(--text-lg)' }}>{jmaxNum}</span>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = (jmaxNum + 1) % 9; setJmaxNum(v); updateManualGrinder('jmax', { rot: jmaxRot, num: v, click: jmaxClick }); }}>+</button>
              </div>
            </div>
            {/* Clic */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Clic</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px' }}>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = (jmaxClick - 1 + 10) % 10; setJmaxClick(v); updateManualGrinder('jmax', { rot: jmaxRot, num: jmaxNum, click: v }); }}>-</button>
                <span className="barista-metric-val" style={{ fontSize: 'var(--text-lg)' }}>{jmaxClick}</span>
                <button type="button" className="barista-stepper-btn" onClick={() => { const v = (jmaxClick + 1) % 10; setJmaxClick(v); updateManualGrinder('jmax', { rot: jmaxRot, num: jmaxNum, click: v }); }}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* 2. K-Ultra */}
        {grinderType === 'k_ultra' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(2.0, parseFloat((kUltraDial - 0.1).toFixed(1))); setKUltraDial(v); updateManualGrinder('k_ultra', v); }}>-0.1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>{parseFloat(kUltraDial).toFixed(1)}</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({Math.round(kUltraDial * 10)} clics)</div>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(13.0, parseFloat((kUltraDial + 0.1).toFixed(1))); setKUltraDial(v); updateManualGrinder('k_ultra', v); }}>+0.1</button>
          </div>
        )}

        {/* 3. Fellow Ode Gen 2 */}
        {grinderType === 'ode_gen2' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(1.0, parseFloat((odeDial - 0.1).toFixed(1))); setOdeDial(v); updateManualGrinder('ode_gen2', v); }}>-0.1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>Ajuste {parseFloat(odeDial).toFixed(1)}</span>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(11.0, parseFloat((odeDial + 0.1).toFixed(1))); setOdeDial(v); updateManualGrinder('ode_gen2', v); }}>+0.1</button>
          </div>
        )}

        {/* 4. Comandante */}
        {grinderType === 'comandante' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(6, comandanteClicks - 1); setComandanteClicks(v); updateManualGrinder('comandante', v); }}>-1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>{comandanteClicks} clics</span>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(45, comandanteClicks + 1); setComandanteClicks(v); updateManualGrinder('comandante', v); }}>+1</button>
          </div>
        )}

        {/* 5. Femobook A2 */}
        {grinderType === 'femobook' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(6, femobookClicks - 1); setFemobookClicks(v); updateManualGrinder('femobook', v); }}>-1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>{femobookClicks} clics</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>~{(femobookClicks / 40).toFixed(1)} Rotaciones</div>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(120, femobookClicks + 1); setFemobookClicks(v); updateManualGrinder('femobook', v); }}>+1</button>
          </div>
        )}

        {/* 6. Kingrinder K6 */}
        {grinderType === 'kingrinder' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(12, kingrinderClicks - 1); setKingrinderClicks(v); updateManualGrinder('kingrinder', v); }}>-1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>{kingrinderClicks} clics</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{Math.floor(kingrinderClicks / 60)} Rot. {kingrinderClicks % 60} Clics</div>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(170, kingrinderClicks + 1); setKingrinderClicks(v); updateManualGrinder('kingrinder', v); }}>+1</button>
          </div>
        )}

        {/* 7. Timemore */}
        {grinderType === 'timemore' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(5, timemoreClicks - 1); setTimemoreClicks(v); updateManualGrinder('timemore', v); }}>-1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>{timemoreClicks} clics</span>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(36, timemoreClicks + 1); setTimemoreClicks(v); updateManualGrinder('timemore', v); }}>+1</button>
          </div>
        )}

        {/* 8. Baratza */}
        {grinderType === 'baratza' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.max(1, baratzaStep - 1); setBaratzaStep(v); updateManualGrinder('baratza', v); }}>-1</button>
            <div style={{ textAlign: 'center' }}>
              <span className="barista-metric-val" style={{ fontSize: 'var(--text-xl)' }}>Ajuste {baratzaStep}</span>
            </div>
            <button type="button" className="barista-stepper-btn" onClick={() => { const v = Math.min(40, baratzaStep + 1); setBaratzaStep(v); updateManualGrinder('baratza', v); }}>+1</button>
          </div>
        )}
      </div>

      {/* Dial Formateado Resumen */}
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-metric)',
        textAlign: 'center'
      }}>
        Lectura activa: <strong>{getGrindString()}</strong>
      </div>
    </div>
  );
}
