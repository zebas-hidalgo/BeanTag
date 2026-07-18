import React from 'react';

export default function ShareCanvas() {
  return (
    <div className="candy-card" style={{ marginBottom: '20px' }}>
      <button className="btn-candy primary" onClick={() => alert("Compartir funcionalidad (Canvas)")}>
        Compartir Lote
      </button>
    </div>
  );
}
