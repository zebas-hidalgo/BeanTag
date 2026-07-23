import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Plus, ScanLine, Package, BookOpen, Settings as SettingsIcon, Nfc } from 'lucide-react';
import Inventory from './components/Inventory';
import BatchDetail from './components/BatchDetail';
import BatchCreator from './components/BatchCreator';
import BrewHistory from './components/BrewHistory';
import Settings from './components/Settings';
import NfcToolsModal from './components/NfcToolsModal';

export default function App() {
  const [currentView, setCurrentView] = useState('inventory');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [prefillRecipe, setPrefillRecipe] = useState(null);
  const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);
  const [batchToEdit, setBatchToEdit] = useState(null);
  const [showNfcTools, setShowNfcTools] = useState(false);

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

  const handleSelectBatch = (batchOrId, options = {}) => {
    const id = typeof batchOrId === 'object' && batchOrId !== null ? batchOrId.id : batchOrId;
    setSelectedBatchId(id);
    setPrefillRecipe(options && options.prefillRecipe ? options.prefillRecipe : null);
    setCurrentView('detail');
  };

  const handleBack = () => {
    if (batchToEdit) {
      setCurrentView('detail');
      setSelectedBatchId(batchToEdit.id);
      setBatchToEdit(null);
    } else {
      window.history.pushState({}, '', '/');
      setCurrentView('inventory');
      setSelectedBatchId(null);
      setPrefillRecipe(null);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Tiny Variant 3 Logo */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={{ width: '24px', height: '24px' }}>
            <rect x="35" y="15" width="135" height="175" rx="10" fill="#000000"/>
            <rect x="30" y="10" width="135" height="175" rx="10" fill="#F4A261" stroke="#000000" stroke-width="6"/>
            <circle cx="97" cy="30" r="10" fill="#FFF5F5" stroke="#000000" stroke-width="4"/>
            <g transform="translate(68, 60)">
              <path d="M5 5 H 35 C 50 5, 50 30, 35 30 C 50 30, 50 55, 30 55 H 5 Z" fill="none" stroke="#000000" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
              <path d="M5 5 V 55" fill="none" stroke="#000000" stroke-width="12" stroke-linecap="round"/>
              <path d="M55 40 C 63 40, 68 45, 68 52 C 68 60, 63 65, 55 65 C 47 65, 42 60, 42 52 C 42 45, 47 40, 55 40 Z" fill="#E76F51" stroke="#000000" stroke-width="3"/>
              <line x1="51" y1="61" x2="59" y2="44" stroke="#000000" stroke-width="3"/>
            </g>
          </svg>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--color-header-text)',
            lineHeight: 1
          }}>BeanTag</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {currentView === 'inventory' && (
            <button className="app-bar-btn" onClick={() => setCurrentView('creator')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} strokeWidth={2.5} />
              Registrar
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        {currentView === 'inventory' && (
          <Inventory 
            batches={batches} 
            onSelectBatch={handleSelectBatch} 
            onCreateTrigger={() => setCurrentView('creator')}
            showToast={showToast}
          />
        )}

        {currentView === 'detail' && selectedBatchId && (
          <BatchDetail 
            key={selectedBatchId}
            batchId={selectedBatchId} 
            prefillRecipe={prefillRecipe}
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
          <Settings showToast={showToast} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} theme={theme} setTheme={setTheme} />
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

      {showNfcTools && (
        <NfcToolsModal onClose={() => setShowNfcTools(false)} showToast={showToast} />
      )}

      <nav className="nb-tabbar">
        <button className={`tab-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => { setCurrentView('inventory'); setSelectedBatchId(null); }}>
          <Package size={22} strokeWidth={2.5} />
          <span>Congelador</span>
        </button>
        
        <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
          <BookOpen size={22} strokeWidth={2.5} />
          <span>Bitácoras</span>
        </button>

        <button className={`tab-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => { setCurrentView('settings'); setSelectedBatchId(null); }}>
          <SettingsIcon size={22} strokeWidth={2.5} />
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
