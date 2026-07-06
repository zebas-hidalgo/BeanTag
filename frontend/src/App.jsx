import React, { useState, useEffect, useCallback } from 'react';
import Inventory from './components/Inventory';
import BatchDetail from './components/BatchDetail';
import BatchCreator from './components/BatchCreator';
import BrewHistory from './components/BrewHistory';
import Settings from './components/Settings';

export default function App() {
  const [currentView, setCurrentView] = useState('inventory');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);
  const [batchToEdit, setBatchToEdit] = useState(null);

  // R1: Generalized Toast system (replaces all alert() calls)
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false, showUndo: false });
  const toastTimerRef = React.useRef(null);

  const showToast = useCallback((message, { type = 'info', duration = 3000, showUndo = false } = {}) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true, showUndo });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // R10: Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ visible: false, batchId: null, batchName: '' });

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
    if (batchToEdit) {
      setCurrentView('detail');
      setSelectedBatchId(batchToEdit.id);
      setBatchToEdit(null);
    } else {
      window.history.pushState({}, '', '/');
      setCurrentView('inventory');
      setSelectedBatchId(null);
      dismissToast();
    }
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
        showToast('Dosis restada con éxito.', { type: 'success', duration: 5000, showUndo: true });
        
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

  // R4: Undo without page reload — re-fetch batch data instead
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
        dismissToast();
        showToast('Dosis restaurada.', { type: 'info', duration: 2000 });
        // R4: Instead of window.location.reload(), re-fetch batches
        fetchBatches();
        // If in detail view, trigger a re-fetch via key change
        if (currentView === 'detail' && selectedBatchId === lastSubtractedBatch) {
          setSelectedBatchId(null);
          setTimeout(() => setSelectedBatchId(lastSubtractedBatch), 50);
        }
      }
    });
  };

  // R5: Save recipe with toast transition instead of alert + instant redirect
  const handleSaveRecipe = (recipePayload) => {
    fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipePayload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast('Receta guardada en la bitácora.', { type: 'success', duration: 2000 });
        setTimeout(() => {
          handleBack();
        }, 1500);
      }
    });
  };

  // R1: NFC scan with toast instead of alert
  const handleNfcScan = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        showToast('Lector NFC activado. Acerca el tag...', { type: 'info', duration: 8000 });
        ndef.onreading = (event) => {
          const message = event.message;
          for (const record of message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              const url = decoder.decode(record.data);
              const parts = url.split('/batch/');
              if (parts.length > 1) {
                const batchId = parts[1].trim();
                setSelectedBatchId(batchId);
                setCurrentView('detail');
                showToast(`Café detectado: ${batchId}`, { type: 'success', duration: 3000 });
              }
            }
          }
        };
      } catch (error) {
        showToast('Error al escanear NFC: ' + error.message, { type: 'error', duration: 4000 });
      }
    } else {
      showToast('NFC no disponible. En iPhone, acerca el tag desde la pantalla de inicio.', { type: 'info', duration: 5000 });
    }
  };

  // R10: Delete batch handler
  const handleDeleteBatch = (batchId, batchName) => {
    setDeleteModal({ visible: true, batchId, batchName });
  };

  const confirmDeleteBatch = () => {
    fetch(`/api/batches/${deleteModal.batchId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeleteModal({ visible: false, batchId: null, batchName: '' });
          showToast('Lote eliminado.', { type: 'success', duration: 2500 });
          handleBack();
        }
      });
  };

  // Toast color based on type
  const toastStyles = {
    success: { backgroundColor: '#1A0505', color: '#FFFFFF' },
    error: { backgroundColor: '#E53E3E', color: '#FFFFFF' },
    info: { backgroundColor: '#1A0505', color: '#FFFFFF' },
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{
            width: '4px',
            height: '28px',
            backgroundColor: 'var(--color-crimson)',
            marginRight: '10px',
            borderRadius: '2px'
          }} />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--color-text)',
            lineHeight: 1
          }}>BeanTag</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {currentView === 'inventory' && (
            <>
              <button className="app-bar-btn" onClick={handleNfcScan}>Escaneo</button>
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
            showToast={showToast}
          />
        )}

        {currentView === 'detail' && selectedBatchId && (
          <BatchDetail 
            key={selectedBatchId}
            batchId={selectedBatchId} 
            onBack={handleBack}
            onSubtractDose={handleSubtractDose}
            onSaveRecipe={handleSaveRecipe}
            onDeleteBatch={handleDeleteBatch}
            onEditBatch={(batch) => { setBatchToEdit(batch); setCurrentView('creator'); }}
            showToast={showToast}
          />
        )}

        {currentView === 'creator' && (
          <BatchCreator 
            batchToEdit={batchToEdit}
            onBatchCreated={() => {
              fetchBatches();
              if (batchToEdit) {
                setCurrentView('detail');
                setSelectedBatchId(batchToEdit.id);
                setBatchToEdit(null);
              } else {
                setCurrentView('inventory');
              }
            }} 
            onBack={handleBack}
            showToast={showToast}
          />
        )}

        {currentView === 'history' && (
          <BrewHistory 
            onNavigateToInventory={() => { setCurrentView('inventory'); setSelectedBatchId(null); }} 
            onSelectBatch={(id) => { setSelectedBatchId(id); setCurrentView('detail'); }}
          />
        )}

        {currentView === 'settings' && (
          <Settings showToast={showToast} />
        )}
      </main>

      {/* R1: Generalized Toast — replaces all alert() calls */}
      <div 
        className={`undo-toast ${toast.visible ? 'show' : ''}`}
        style={toast.visible ? toastStyles[toast.type] : {}}
      >
        <span>{toast.message}</span>
        {toast.showUndo && (
          <button className="undo-btn" onClick={handleUndo}>Deshacer</button>
        )}
      </div>

      {/* R10: Delete Confirmation Modal */}
      {deleteModal.visible && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', boxSizing: 'border-box'
        }}>
          <div className="candy-card static" style={{
            maxWidth: '340px', width: '100%',
            textAlign: 'center', padding: '24px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Eliminar Lote
            </h3>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'var(--color-text-muted)' }}>
              ¿Estás seguro de eliminar <strong>{deleteModal.batchName}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-candy" 
                style={{ flex: 1 }} 
                onClick={() => setDeleteModal({ visible: false, batchId: null, batchName: '' })}
              >
                Cancelar
              </button>
              <button 
                className="btn-candy primary" 
                style={{ flex: 1 }} 
                onClick={confirmDeleteBatch}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="nb-tabbar">
        <button className={`tab-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => { setCurrentView('inventory'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>
          <span>Congelador</span>
        </button>
        
        <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>
          <span>Bitácoras</span>
        </button>

        <button className={`tab-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => { setCurrentView('settings'); setSelectedBatchId(null); }}>
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L3.99 9.31a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
