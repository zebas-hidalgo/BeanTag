import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Coffee, Timer, Scale, Thermometer, Flame } from 'lucide-react';

export default function BaristaDisplayModal({ isOpen, onClose, batch, recipe }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isOpen) return null;

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const doseIn = recipe ? recipe.dose_in || batch?.dose_weight || '20.0g' : batch?.dose_weight || '20.0g';
  const ratio = recipe ? recipe.ratio || '1:15.0' : '1:15.0';
  const method = recipe ? recipe.method || 'V60 (Filtrado)' : 'V60 (Filtrado)';
  const grind = recipe ? recipe.grind || 'J-Max: 1.5.0' : 'J-Max: 1.5.0';
  const temp = recipe ? recipe.water_temp || 93 : 93;

  // Calculate target water weight
  const doseGrams = parseFloat(String(doseIn).replace('g', '')) || 20;
  const ratioNum = parseFloat(String(ratio).replace('1:', '')) || 15;
  const targetWater = Math.round(doseGrams * ratioNum);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0A0E0D',
      color: '#ECFDF5',
      zIndex: 20000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-mono, monospace)',
      overflowY: 'auto'
    }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Coffee size={24} color="#E9C46A" />
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#E9C46A', fontFamily: 'var(--font-heading)' }}>
            BARISTA STANDBY DISPLAY
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Coffee Batch Name */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
          {batch?.name || 'Café Especial'}
        </div>
        <div style={{ fontSize: '14px', color: '#2A9D8F', marginTop: '4px' }}>
          {batch?.producer ? `Finca: ${batch.producer}` : ''} {batch?.origin ? `• ${batch.origin}` : ''}
        </div>
      </div>

      {/* Main Digital Timer */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(24, 38, 35, 0.8)',
        border: '2px solid #2A9D8F',
        borderRadius: '30px',
        padding: '32px 20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        margin: '12px 0'
      }}>
        <div style={{ fontSize: '14px', color: '#94A3B8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          {method}
        </div>
        
        <div style={{
          fontSize: '76px',
          fontWeight: '900',
          color: '#E9C46A',
          lineHeight: '1',
          textShadow: '0 0 20px rgba(233, 196, 106, 0.3)'
        }}>
          {formatTime(seconds)}
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            style={{
              background: isRunning ? '#E76F51' : '#2A9D8F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50px',
              padding: '14px 36px',
              fontSize: '18px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
            }}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'PAUSAR' : 'INICIAR'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#94A3B8',
              borderRadius: '50px',
              padding: '14px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Extraction Parameters Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        margin: '12px 0'
      }}>
        <div style={{ background: '#14221F', border: '1px solid #2A9D8F', padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>DOSIS CAFE</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#ECFDF5', marginTop: '4px' }}>{doseIn}</div>
        </div>

        <div style={{ background: '#14221F', border: '1px solid #2A9D8F', padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>AGUA OBJETIVO</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E9C46A', marginTop: '4px' }}>{targetWater}g</div>
        </div>

        <div style={{ background: '#14221F', border: '1px solid #2A9D8F', padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>RATIO DE EXTRACCIÓN</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2A9D8F', marginTop: '4px' }}>{ratio}</div>
        </div>

        <div style={{ background: '#14221F', border: '1px solid #2A9D8F', padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>MOLIENDA & TEMP</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#ECFDF5', marginTop: '4px' }}>{grind} | {temp}°C</div>
        </div>
      </div>

      {/* Vertidos Guide */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        <span style={{ color: '#2A9D8F', fontWeight: 'bold' }}>0:00 Preinfusión ({Math.round(doseGrams * 2.5)}g)</span>
        <span style={{ color: '#E9C46A', fontWeight: 'bold' }}>0:45 Vertido 1 ({Math.round(targetWater * 0.6)}g)</span>
        <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>1:30 Vertido 2 ({targetWater}g)</span>
      </div>
    </div>
  );
}
