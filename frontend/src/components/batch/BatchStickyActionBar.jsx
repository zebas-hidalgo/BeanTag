import React from 'react';
import { Play, Save, Share2 } from 'lucide-react';

export default function BatchStickyActionBar({
  onStartBrew,
  onSaveRecipe,
  onShareCard,
  isOwner,
  isSaving = false
}) {
  return (
    <div className="barista-sticky-bar">
      {/* Primary Action: Iniciar Extracción Live (Play) */}
      <button
        type="button"
        className="barista-btn barista-btn-primary"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(10);
          onStartBrew();
        }}
        style={{ flex: '1.4', minHeight: '46px', gap: '8px' }}
      >
        <Play size={16} fill="#FFFFFF" />
        <span>Preparar Café</span>
      </button>

      {/* Secondary Action: Guardar Bitácora (Save) */}
      {isOwner && (
        <button
          type="button"
          className="barista-btn barista-btn-secondary"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            onSaveRecipe();
          }}
          disabled={isSaving}
          style={{ flex: '1', minHeight: '46px', gap: '6px' }}
        >
          <Save size={15} />
          <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
        </button>
      )}

      {/* Tertiary Action: Compartir Tarjeta (Share) */}
      <button
        type="button"
        className="barista-btn barista-btn-ghost"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(6);
          onShareCard();
        }}
        style={{ minWidth: '44px', minHeight: '46px', padding: '0 12px' }}
        title="Compartir Tarjeta Coleccionable"
      >
        <Share2 size={17} />
      </button>
    </div>
  );
}
