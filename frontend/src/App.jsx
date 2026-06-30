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
          <svg viewBox="0 0 100 100" style={{ width: '30px', height: '30px', filter: 'drop-shadow(0px 2px 0px var(--color-navy))' }} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="10" width="30" height="12" rx="4" fill="#1D4ED8" stroke="#1A365D" strokeWidth="5" />
            <path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="#93C5FD" stroke="#1A365D" strokeWidth="5" />
            <ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="#B45309" stroke="#1A365D" strokeWidth="4" />
            <path d="M48.5 45C50 49 50 59 51.5 63" stroke="#1A365D" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M43 38a10 10 0 0 1 14 0" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" />
            <path d="M37 31a18 18 0 0 1 26 0" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>BeanTag</span>
        </h1>
        {currentView === 'inventory' && (
          <button className="app-bar-btn" onClick={() => setCurrentView('creator')}>➕</button>
        )}
      </header>

      <main style={{ flex: 1 }}>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/></svg>
          <span>Congelador</span>
        </button>
        
        <button className="tab-item scan-trigger" onClick={triggerNfcScanSimulate}>
          <div className="scan-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 17v.01" stroke-linecap="round"/><path d="M9 9a3 3 0 0 1 6 0"/><path d="M7 7a6 6 0 0 1 10 0"/></svg>
          </div>
        </button>
        
        <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 5h18"/><path d="M4 5l6 14h4l6-14"/><path d="M9 19h6v2H9z"/><path d="M12 5v14" stroke-dasharray="2 2"/></svg>
          <span>Bitácora</span>
        </button>
      </nav>
    </div>
  );
}
