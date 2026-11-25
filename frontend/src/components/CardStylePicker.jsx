import React from 'react';
import { CARD_STYLE_OPTIONS } from '../utils/cardGenerator';

const ORIENTATIONS = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' }
];

const STYLE_SWATCH = {
  kissa: { bg: '#151210', dot: '#E2A96F' },
  ceramica: { bg: '#F7F0E6', dot: '#B84A2E' },
  botanico: { bg: '#EEF4EE', dot: '#23533C' },
  etiqueta: { bg: '#FBFAF8', dot: '#C23B22' },
  origen: { bg: '#EEE8DC', dot: '#8E5226' },
  stretch: { bg: '#F0EEE9', dot: '#2440E6' },
  zine: { bg: '#FBF8F1', dot: '#B3261E' },
  lata: { bg: '#2F6B3F', dot: '#FF6A1A' }
};

// Two quick choices when sharing a sticker: 8 styles with mini color swatch + orientation.
export default function CardStylePicker({ value, onChange, orientation, onOrientationChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="bt-style-picker" role="radiogroup" aria-label="Estilo del sticker">
        {CARD_STYLE_OPTIONS.map(({ id, label }) => {
          const sw = STYLE_SWATCH[id] || { bg: '#FBFAF8', dot: '#C23B22' };
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value === id}
              className={`bt-style-btn${value === id ? ' is-active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
              onClick={() => {
                try { localStorage.setItem('beantag-share-style', id); } catch (e) {}
                onChange(id);
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: sw.bg,
                  border: '1px solid rgba(128,128,128,0.35)',
                  display: 'inline-grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sw.dot }} />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {onOrientationChange && (
        <div className="bt-seg" role="radiogroup" aria-label="Orientación del sticker">
          {ORIENTATIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={orientation === id}
              className={`bt-seg-btn${orientation === id ? ' is-active' : ''}`}
              onClick={() => onOrientationChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
