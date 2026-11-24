import React from 'react';
import { Sliders, CheckCircle2, ChevronRight, Gauge } from 'lucide-react';
import { HandGrinderIcon, ElectricGrinderIcon } from '../icons/CoffeeIcons';
import { GRINDERS, getGrinderConfig } from '../../utils/grinders';

export default function GrinderSyncMatrix({
  grinderType,
  setGrinderType,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
        <h3 className="bt-section-title" style={{ margin: 0 }}>
          {['ode2', 'baratza'].includes(activeGrinderMeta.id)
            ? <ElectricGrinderIcon size={16} />
            : <HandGrinderIcon size={16} />}
          <span>Molienda</span>
        </h3>
        <span style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {activeGrinderMeta.name}
        </span>
      </div>

      {/* Controles Específicos para el Molino Activo */}
      <div style={{ marginBottom: '12px' }}>

        {/* 1. J-Max (Rot / Num / Click) */}
        {grinderType === 'jmax' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
            {/* Rotación */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rotación</span>
              <span className="barista-metric-val" style={{ fontSize: '22px', lineHeight: 1.1 }}>{jmaxRot}</span>
              <div className="bt-stepper-pill">
                <button type="button" aria-label="Menos rotación" onClick={() => { const v = Math.max(0, jmaxRot - 1); setJmaxRot(v); updateManualGrinder('jmax', { rot: v, num: jmaxNum, click: jmaxClick }); }}>−</button>
                <button type="button" aria-label="Más rotación" onClick={() => { const v = Math.min(5, jmaxRot + 1); setJmaxRot(v); updateManualGrinder('jmax', { rot: v, num: jmaxNum, click: jmaxClick }); }}>+</button>
              </div>
            </div>
            {/* Número */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Número</span>
              <span className="barista-metric-val" style={{ fontSize: '22px', lineHeight: 1.1 }}>{jmaxNum}</span>
              <div className="bt-stepper-pill">
                <button type="button" aria-label="Menos número" onClick={() => { const v = (jmaxNum - 1 + 9) % 9; setJmaxNum(v); updateManualGrinder('jmax', { rot: jmaxRot, num: v, click: jmaxClick }); }}>−</button>
                <button type="button" aria-label="Más número" onClick={() => { const v = (jmaxNum + 1) % 9; setJmaxNum(v); updateManualGrinder('jmax', { rot: jmaxRot, num: v, click: jmaxClick }); }}>+</button>
              </div>
            </div>
            {/* Clic */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Clic</span>
              <span className="barista-metric-val" style={{ fontSize: '22px', lineHeight: 1.1 }}>{jmaxClick}</span>
              <div className="bt-stepper-pill">
                <button type="button" aria-label="Menos clic" onClick={() => { const v = (jmaxClick - 1 + 10) % 10; setJmaxClick(v); updateManualGrinder('jmax', { rot: jmaxRot, num: jmaxNum, click: v }); }}>−</button>
                <button type="button" aria-label="Más clic" onClick={() => { const v = (jmaxClick + 1) % 10; setJmaxClick(v); updateManualGrinder('jmax', { rot: jmaxRot, num: jmaxNum, click: v }); }}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* 2. K-Ultra */}
        {grinderType === 'k_ultra' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="barista-metric-val" style={{ fontSize: '24px' }}>{parseFloat(kUltraDial).toFixed(1)}</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{Math.round(kUltraDial * 10)} clics</div>
            </div>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Más fino (-0.1)" onClick={() => { const v = Math.max(2.0, parseFloat((kUltraDial - 0.1).toFixed(1))); setKUltraDial(v); updateManualGrinder('k_ultra', v); }}>−</button>
              <button type="button" aria-label="Más grueso (+0.1)" onClick={() => { const v = Math.min(13.0, parseFloat((kUltraDial + 0.1).toFixed(1))); setKUltraDial(v); updateManualGrinder('k_ultra', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 3. Fellow Ode Gen 2 */}
        {grinderType === 'ode_gen2' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="barista-metric-val" style={{ fontSize: '24px' }}>Ajuste {parseFloat(odeDial).toFixed(1)}</span>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Más fino (-0.1)" onClick={() => { const v = Math.max(1.0, parseFloat((odeDial - 0.1).toFixed(1))); setOdeDial(v); updateManualGrinder('ode_gen2', v); }}>−</button>
              <button type="button" aria-label="Más grueso (+0.1)" onClick={() => { const v = Math.min(11.0, parseFloat((odeDial + 0.1).toFixed(1))); setOdeDial(v); updateManualGrinder('ode_gen2', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 4. Comandante */}
        {grinderType === 'comandante' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="barista-metric-val" style={{ fontSize: '24px' }}>{comandanteClicks} clics</span>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Menos 1 clic" onClick={() => { const v = Math.max(6, comandanteClicks - 1); setComandanteClicks(v); updateManualGrinder('comandante', v); }}>−</button>
              <button type="button" aria-label="Más 1 clic" onClick={() => { const v = Math.min(45, comandanteClicks + 1); setComandanteClicks(v); updateManualGrinder('comandante', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 5. Femobook A2 */}
        {grinderType === 'femobook' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="barista-metric-val" style={{ fontSize: '24px' }}>{femobookClicks} clics</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>~{(femobookClicks / 40).toFixed(1)} Rotaciones</div>
            </div>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Menos 1 clic" onClick={() => { const v = Math.max(6, femobookClicks - 1); setFemobookClicks(v); updateManualGrinder('femobook', v); }}>−</button>
              <button type="button" aria-label="Más 1 clic" onClick={() => { const v = Math.min(120, femobookClicks + 1); setFemobookClicks(v); updateManualGrinder('femobook', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 6. Kingrinder K6 */}
        {grinderType === 'kingrinder' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <span className="barista-metric-val" style={{ fontSize: '24px' }}>{kingrinderClicks} clics</span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{Math.floor(kingrinderClicks / 60)} Rot. {kingrinderClicks % 60} Clics</div>
            </div>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Menos 1 clic" onClick={() => { const v = Math.max(12, kingrinderClicks - 1); setKingrinderClicks(v); updateManualGrinder('kingrinder', v); }}>−</button>
              <button type="button" aria-label="Más 1 clic" onClick={() => { const v = Math.min(170, kingrinderClicks + 1); setKingrinderClicks(v); updateManualGrinder('kingrinder', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 7. Timemore */}
        {grinderType === 'timemore' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="barista-metric-val" style={{ fontSize: '24px' }}>{timemoreClicks} clics</span>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Menos 1 clic" onClick={() => { const v = Math.max(5, timemoreClicks - 1); setTimemoreClicks(v); updateManualGrinder('timemore', v); }}>−</button>
              <button type="button" aria-label="Más 1 clic" onClick={() => { const v = Math.min(36, timemoreClicks + 1); setTimemoreClicks(v); updateManualGrinder('timemore', v); }}>+</button>
            </div>
          </div>
        )}

        {/* 8. Baratza */}
        {grinderType === 'baratza' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="barista-metric-val" style={{ fontSize: '24px' }}>Ajuste {baratzaStep}</span>
            <div className="bt-stepper-pill is-inline">
              <button type="button" aria-label="Menos 1 paso" onClick={() => { const v = Math.max(1, baratzaStep - 1); setBaratzaStep(v); updateManualGrinder('baratza', v); }}>−</button>
              <button type="button" aria-label="Más 1 paso" onClick={() => { const v = Math.min(40, baratzaStep + 1); setBaratzaStep(v); updateManualGrinder('baratza', v); }}>+</button>
            </div>
          </div>
        )}
      </div>

      <details className="bt-more">
        <summary>Cambiar molino</summary>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '6px',
          padding: '3px',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle)',
          marginTop: '8px',
          scrollbarWidth: 'none'
        }}>
          {GRINDERS.map(g => {
            const isSelected = grinderType === g.id;
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => setGrinderType(g.id)}
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
                  transition: 'var(--transition-ui)'
                }}
              >
                {g.shortName}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
