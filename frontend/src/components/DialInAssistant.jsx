import React, { useState } from 'react';
import { Sliders, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DialInAssistant({ onApplyRecommendation }) {
  const [selectedTaste, setSelectedTaste] = useState(null);

  const tasteOptions = [
    {
      id: 'sour',
      label: '🍋 Sub-extraído / Muy Ácido',
      desc: 'Sabor agrio, acidez punzante, final corto y poco dulzor.',
      recommendation: {
        grindAction: 'Fino',
        clicksChange: -2,
        tempAction: '+1.5°C',
        ratioAction: 'Disminuir ratio (ej: 1:16 -> 1:15)',
        tip: 'Aumenta el contacto agua-café molimiendo 2 clicks más fino en tu J-Max.'
      }
    },
    {
      id: 'bitter',
      label: '🫖 Sobre-extraído / Astringente',
      desc: 'Secuedad en boca, amargor metálico o quemado.',
      recommendation: {
        grindAction: 'Grueso',
        clicksChange: +2,
        tempAction: '-1.5°C',
        ratioAction: 'Aumentar ratio (ej: 1:15 -> 1:16)',
        tip: 'Reduce la extracción molimiendo 2 clicks más grueso o bajando la temperatura.'
      }
    },
    {
      id: 'weak',
      label: '⚡ Acuoso / Poco Cuerpo',
      desc: 'Café débil, falto de intensidad o concentración.',
      recommendation: {
        grindAction: 'Fino leve',
        clicksChange: -1,
        tempAction: 'Mantener',
        ratioAction: 'Incrementar dosis +1.0g',
        tip: 'Mantiene el ratio pero aumenta la dosis de café en gramos para mayor cuerpo.'
      }
    },
    {
      id: 'balanced',
      label: '✨ Balance Exquisito (Peak)',
      desc: 'Dulzor alto, acidez brillante y final limpio memorable.',
      recommendation: {
        grindAction: 'Mantener',
        clicksChange: 0,
        tempAction: 'Mantener',
        ratioAction: 'Guardar Receta',
        tip: '¡Receta perfecta! Guarda estos parámetros como tu receta oficial.'
      }
    }
  ];

  const currentOption = tasteOptions.find(o => o.id === selectedTaste);

  return (
    <div style={{
      background: 'var(--bg-card, #ECFDF5)',
      border: '1.5px solid var(--border-color, #A7F3D0)',
      borderRadius: '20px',
      padding: '16px',
      margin: '16px 0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '900',
        color: 'var(--color-text, #064E3B)',
        marginBottom: '6px',
        fontFamily: 'var(--font-heading)'
      }}>
        <Sliders size={16} color="var(--color-crimson, #059669)" />
        <span>ASISTENTE DE CALIBRACIÓN (DIAL-IN)</span>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--color-text-muted, #047857)', marginBottom: '12px', lineHeight: '1.3' }}>
        ¿Cómo estuvo el resultado en taza? Selecciona el perfil para recibir el diagnóstico instantáneo.
      </p>

      {/* Taste Selection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
        {tasteOptions.map((opt) => {
          const isSelected = selectedTaste === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedTaste(opt.id)}
              style={{
                padding: '8px 10px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--color-crimson)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--bg-header)' : '#FFFFFF',
                color: 'var(--color-text)',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendation Panel */}
      {currentOption && (
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border-color, #A7F3D0)',
          borderRadius: '14px',
          padding: '14px',
          marginTop: '10px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-crimson, #059669)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} />
            <span>Diagnóstico & Recomendación Barista:</span>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--color-text, #064E3B)', marginBottom: '10px', fontWeight: '600' }}>
            💡 {currentOption.recommendation.tip}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '10.5px', background: 'var(--bg-header)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              Molienda: {currentOption.recommendation.grindAction}
            </div>
            <div style={{ fontSize: '10.5px', background: 'var(--bg-header)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              Agua: {currentOption.recommendation.tempAction}
            </div>
            <div style={{ fontSize: '10.5px', background: 'var(--bg-header)', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              Dosis: {currentOption.recommendation.ratioAction}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
