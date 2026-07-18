import React from 'react';
import { formatLocalDateStr } from '../utils/date';

export default function RecipeHistory({ recipes }) {
  if (!recipes || recipes.length === 0) {
    return <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Ninguna extracción registrada aún.</p>;
  }
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>📖 HISTORIAL</h3>
      {recipes.map(recipe => (
        <div key={recipe.id} className="candy-card" style={{ marginBottom: '12px', background: '#FFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>{recipe.method}</span>
            <span>{"★".repeat(recipe.rating)}</span>
          </div>
          <p style={{ fontSize: '12px', color: '#777' }}>{formatLocalDateStr(recipe.created_at)}</p>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>☕ Ratio: {recipe.ratio} | Molienda: {recipe.grind}</p>
          {recipe.notes && <p style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '6px', color: '#333' }}>"{recipe.notes}"</p>}
        </div>
      ))}
    </div>
  );
}
