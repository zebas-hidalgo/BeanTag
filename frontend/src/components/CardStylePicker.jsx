import React from 'react';
import { CARD_STYLE_OPTIONS } from '../utils/cardGenerator';

// One decision when sharing: which of the five styles. Nothing else to configure.
export default function CardStylePicker({ value, onChange }) {
  return (
    <div className="bt-style-picker" role="radiogroup" aria-label="Estilo de tarjeta">
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
  );
}
