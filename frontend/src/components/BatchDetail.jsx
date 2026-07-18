import React, { useState, useEffect } from 'react';
import BatchInfo from './BatchInfo';
import RecipeForm from './RecipeForm';
import RecipeHistory from './RecipeHistory';
import ShareCanvas from './ShareCanvas';
import { Edit2, Trash2 } from 'lucide-react';

export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, onEditBatch, showToast }) {
  const [batch, setBatch] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`api/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        if (active) setBatch(data);
      });
    return () => { active = false; };
  }, [batchId]);

  if (!batch) return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="candy-card skeleton-card" style={{ cursor: 'default', height: i === 1 ? '80px' : '120px' }}>
          <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '90%', height: '10px', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '40%', height: '10px', marginTop: '6px' }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <BatchInfo 
        batch={batch} 
        onBack={onBack} 
        onSubtractDose={onSubtractDose}
        onSaveRecipe={onSaveRecipe}
        showToast={showToast}
        setBatch={setBatch}
      />
      
      <RecipeForm 
        batch={batch}
        onSaveRecipe={onSaveRecipe}
        showToast={showToast}
        setBatch={setBatch}
      />

      <RecipeHistory recipes={batch.recipes} />
      
      <ShareCanvas />

      <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
        <button type="button" className="btn-candy" onClick={() => onEditBatch(batch)} style={{ flex: 1, fontSize: '11px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Edit2 size={14} strokeWidth={2.5} />
          Editar Lote
        </button>
        <button type="button" className="btn-candy" onClick={() => onDeleteBatch(batch.id, batch.name)} style={{ flex: 1, margin: 0, color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Trash2 size={14} strokeWidth={2.5} />
          Eliminar Lote
        </button>
      </div>
    </div>
  );
}
