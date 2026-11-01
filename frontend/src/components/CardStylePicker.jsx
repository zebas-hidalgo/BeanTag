import React from 'react';
import { CARD_STYLE_OPTIONS } from '../utils/cardGenerator';

const ORIENTATIONS = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' }
];

// Two quick choices when sharing a sticker: style (five) and orientation (two).
export default function CardStylePicker({ value, onChange, orientation, onOrientationChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="bt-style-picker" role="radiogroup" aria-label="Estilo del sticker">
        {CARD_STYLE_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className={`bt-style-btn${value === id ? ' is-active' : ''}`}
            onClick={() => {
              try { localStorage.setItem('beantag-share-style', id); } catch (e) {}
              onChange(id);
            }}
          >
            {label}
          </button>
        ))}
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
