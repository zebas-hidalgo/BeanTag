import React, { useState, useEffect } from 'react';
import Inventory from './components/Inventory';
import BatchDetail from './components/BatchDetail';
import BatchCreator from './components/BatchCreator';
import BrewHistory from './components/BrewHistory';

export default function App() {
  const [currentView, setCurrentView] = useState('inventory');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);

  const fetchBatches = () => {
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => setBatches(data));
  };

  useEffect(() => {
    fetchBatches();
    
    const path = window.location.pathname;
    if (path.startsWith('/batch/')) {
      const id = path.split('/')[2];
      setSelectedBatchId(id);
      setCurrentView('detail');
    }
  }, []);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('inventory');
    setSelectedBatchId(null);
    fetchBatches();
  };

  const handleSubtractDose = (id, callback) => {
    fetch(`/api/batches/${id}/doses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: -1 })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        callback();
        setLastSubtractedBatch(id);
        setToastMessage('Dosis restada con éxito.');
        setShowToast(true);
        
        if (navigator.vibrate) {
          navigator.vibrate([70, 50, 100]);
        }

        const badge = document.getElementById('doses-detail-badge');
        if (badge) {
          badge.classList.remove('bounce-pop');
          void badge.offsetWidth;
          badge.classList.add('bounce-pop');
        }
      }
    });
  };

  const handleUndo = () => {
    if (!lastSubtractedBatch) return;
    fetch(`/api/batches/${lastSubtractedBatch}/doses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: 1 })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setShowToast(false);
        if (currentView === 'detail' && selectedBatchId === lastSubtractedBatch) {
          window.location.reload();
        } else {
          fetchBatches();
        }
      }
    });
  };

  const handleSaveRecipe = (recipePayload) => {
    fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipePayload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('¡Receta guardada en la bitácora!');
        handleBack();
      }
    });
  };

  const triggerNfcScanSimulate = () => {
    if (batches.length > 0) {
      setSelectedBatchId(batches[0].id);
      setCurrentView('detail');
    } else {
      alert('Por favor, registra un lote primero para simular el escaneo.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 100 100" style={{ width: '28px', height: '28px' }} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="10" width="30" height="12" rx="4" fill="#000000" stroke="#000000" strokeWidth="5" />
            <path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="#FFFFFF" stroke="#000000" strokeWidth="5" />
            <ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="#000000" stroke="#000000" strokeWidth="4" />
          </svg>
          <span>BeanTag</span>
        </h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {currentView === 'inventory' && (
            <>
              <button className="app-bar-btn" onClick={triggerNfcScanSimulate}>Escaneo</button>
              <button className="app-bar-btn" onClick={() => setCurrentView('creator')}>Registrar</button>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        {currentView === 'inventory' && (
          <Inventory 
            batches={batches} 
            onSelectBatch={(id) => { setSelectedBatchId(id); setCurrentView('detail'); }} 
            onCreateTrigger={() => setCurrentView('creator')}
          />
        )}

        {currentView === 'detail' && (
          <BatchDetail 
            batchId={selectedBatchId} 
            onBack={handleBack}
            onSubtractDose={handleSubtractDose}
            onSaveRecipe={handleSaveRecipe}
          />
        )}

        {currentView === 'creator' && (
          <BatchCreator 
            onBatchCreated={fetchBatches} 
            onBack={handleBack}
          />
        )}

        {currentView === 'history' && (
          <BrewHistory />
        )}
      </main>

      <div className={`undo-toast ${showToast ? 'show' : ''}`}>
        <span>{toastMessage}</span>
        <button className="undo-btn" onClick={handleUndo}>Deshacer</button>
      </div>

      <nav className="nb-tabbar">
        <button className={`tab-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => { setCurrentView('inventory'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>
          <span>Congelador</span>
        </button>
        
        <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>
          <span>Bitácoras</span>
        </button>
      </nav>
    </div>
  );
}
