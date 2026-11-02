import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Nfc } from 'lucide-react';
import Inventory from './components/Inventory';
import BottomNav from './components/BottomNav';
import { apiUrl } from './utils/api';
import { normalizeTheme } from './utils/theme';
import { confirmDialog } from './utils/confirmDialog';

const BatchDetail = lazy(() => import('./components/BatchDetail'));
const BatchCreator = lazy(() => import('./components/BatchCreator'));
const BrewHistory = lazy(() => import('./components/BrewHistory'));
const Settings = lazy(() => import('./components/Settings'));
const NfcToolsModal = lazy(() => import('./components/NfcToolsModal'));
const AuthModal = lazy(() => import('./components/AuthModal'));

const getInitialRoute = () => {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const queryBatchId = searchParams.get('batch') || searchParams.get('b');
  
  let targetBatchId = null;
  if (path.includes('/batch/')) {
    const parts = path.split('/batch/');
    if (parts[1]) {
      targetBatchId = decodeURIComponent(parts[1].split('?')[0].replace(/\/$/, ''));
    }
  } else if (queryBatchId) {
    targetBatchId = decodeURIComponent(queryBatchId);
  } else if (hash && hash.includes('/batch/')) {
    const parts = hash.split('/batch/');
    if (parts[1]) {
      targetBatchId = decodeURIComponent(parts[1].split('?')[0].replace(/\/$/, ''));
    }
  } else if (hash && hash.includes('batch=')) {
    const match = hash.match(/batch=([^&]+)/);
    if (match) targetBatchId = decodeURIComponent(match[1]);
  }

  if (targetBatchId) {
    return { view: 'detail', batchId: targetBatchId };
  }
  return { view: 'inventory', batchId: null };
};

export default function App() {
  const initialRoute = getInitialRoute();
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialRoute.batchId);
  const [prefillRecipe, setPrefillRecipe] = useState(null);
  const [autoStartBrew, setAutoStartBrew] = useState(false);
  const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);
  const [batchToEdit, setBatchToEdit] = useState(null);
  const [showNfcTools, setShowNfcTools] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('beantag-user')); } catch (e) { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('beantag-token') || '');

  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem('beantag-theme')));

  useEffect(() => {
    const savedTheme = normalizeTheme(localStorage.getItem('beantag-theme'));
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleThemeChange = () => {
      const updatedTheme = normalizeTheme(localStorage.getItem('beantag-theme'));
      setTheme(updatedTheme);
      document.documentElement.setAttribute('data-theme', updatedTheme);
    };

    window.addEventListener('beantag-theme-changed', handleThemeChange);
    return () => window.removeEventListener('beantag-theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('beantag-theme', theme);
    }
  }, [theme]);

  // Toast Notification System State
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info',
    showUndo: false,
    duration: 3000
  });

  const toastTimerRef = useRef(null);

  const showToast = (message, options = {}) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({
      visible: true,
      message,
      type: options.type || 'info',
      showUndo: options.showUndo || false,
      duration: options.duration || 3000
    });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, options.duration || 3000);
  };

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Delete Confirmation Modal State (R10)
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    batchId: null,
    batchName: ''
  });

  const handleAuthSuccess = (arg1, arg2) => {
    // Defensively handle both (userData, authToken) and (responseObj)
    const userData = (arg1 && arg1.user) ? arg1.user : arg1;
    const authToken = arg2 || (arg1 && arg1.token) || '';

    setCurrentUser(userData);
    setToken(authToken);

    if (userData) {
      localStorage.setItem('beantag-user', JSON.stringify(userData));
    }
    if (authToken) {
      localStorage.setItem('beantag-token', authToken);
    }

    setShowAuthModal(false);
    fetchBatches(authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('beantag-token');
    localStorage.removeItem('beantag-user');
    showToast('Has cerrado sesión.', { type: 'info', duration: 2000 });
    fetchBatches('');
  };

  const fetchBatches = (authToken = token) => {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    fetch(apiUrl('api/batches'), { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setBatches(data);
      })
      .catch(err => {
        console.error('fetchBatches error:', err);
        showToast('No se pudo cargar el inventario. Verifica tu conexión.', { type: 'error', duration: 4000 });
      });
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('beantag-token');
    if (savedToken) {
      fetch(apiUrl('api/auth/me'), {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Token expirado');
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('beantag-user', JSON.stringify(data.user));
          fetchBatches(savedToken);
        } else {
          setCurrentUser(null);
          setToken('');
          localStorage.removeItem('beantag-token');
          localStorage.removeItem('beantag-user');
          fetchBatches('');
        }
      })
      .catch((err) => {
        console.warn('Sesión no válida o expirada:', err);
        setCurrentUser(null);
        setToken('');
        localStorage.removeItem('beantag-token');
        localStorage.removeItem('beantag-user');
        fetchBatches('');
      });
    } else {
      fetchBatches('');
    }
    
    const route = getInitialRoute();
    if (route.view === 'detail' && route.batchId) {
      setSelectedBatchId(route.batchId);
      setCurrentView('detail');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      if (route.view === 'detail' && route.batchId) {
        setSelectedBatchId(route.batchId);
        setCurrentView('detail');
      } else {
        setCurrentView('inventory');
        setSelectedBatchId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectBatch = (batchOrId, options = {}) => {
    const id = typeof batchOrId === 'object' && batchOrId !== null ? batchOrId.id : batchOrId;
    setSelectedBatchId(id);
    setPrefillRecipe(options && options.prefillRecipe ? options.prefillRecipe : null);
    setAutoStartBrew(Boolean(options && options.autoStart));
    setCurrentView('detail');
  };

  const handleBack = () => {
    if (batchToEdit) {
      setCurrentView('detail');
      setSelectedBatchId(batchToEdit.id);
      setBatchToEdit(null);
    } else {
      window.history.pushState({}, '', '/beantag/');
      setCurrentView('inventory');
      setSelectedBatchId(null);
      setPrefillRecipe(null);
      dismissToast();
    }
    fetchBatches();
  };

  const handleSubtractDose = (id, callback) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    fetch(apiUrl(`api/batches/${id}/doses`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ change: -1 })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al restar dosis');
      }
      return data;
    })
    .then(data => {
      if (data.success) {
        if (callback) callback(data);
        fetchBatches();
        setLastSubtractedBatch(id);
        showToast('Dosis restada con éxito.', { type: 'success', duration: 5000, showUndo: true });
        
        const badge = document.getElementById('doses-detail-badge');
        if (badge) {
          badge.classList.remove('bounce-pop');
          void badge.offsetWidth;
          badge.classList.add('bounce-pop');
        }
      }
    })
    .catch(err => {
      showToast(err.message, { type: 'error', duration: 4000 });
    });
  };

  // R4: Undo without page reload — re-fetch batch data instead
  const handleUndo = () => {
    if (!lastSubtractedBatch) return;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    fetch(apiUrl(`api/batches/${lastSubtractedBatch}/doses`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ change: 1 })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al restaurar dosis');
      }
      return data;
    })
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
    })
    .catch(err => {
      showToast(err.message, { type: 'error', duration: 4000 });
    });
  };

  // R5: Save recipe with toast transition + automatic tube deduction
  // opts.stay: the brew guide keeps the user on screen (it shows its own confirmation + undo)
  const handleSaveRecipe = (recipePayload, opts = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(apiUrl('api/recipes'), {
      method: 'POST',
      headers,
      body: JSON.stringify(recipePayload)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la receta');
      }
      return data;
    })
    .then(data => {
      if (data.success) {
        fetchBatches();
        if (!opts.stay) {
          showToast('Receta guardada y stock descontado del inventario.', { type: 'success', duration: 2500 });
          setTimeout(() => {
            handleBack();
          }, 1500);
        }
      }
      return data;
    })
    .catch(err => {
      showToast(err.message, { type: 'error', duration: 4000 });
      if (opts.stay) throw err;
      return null;
    });
  };

  // Undo a brew saved from the guide: delete the log entry and give the dose back
  const handleUndoRecipe = async ({ recipeId, batchId, doseG, isBag }) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    if (recipeId) {
      const del = await fetch(apiUrl(`api/recipes/${recipeId}`), { method: 'DELETE', headers });
      if (!del.ok) throw new Error('No se pudo deshacer el registro');
    }
    if (batchId) {
      const body = isBag && doseG ? { weight_change: Number(doseG) } : { change: 1 };
      const res = await fetch(apiUrl(`api/batches/${batchId}/doses`), { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('No se pudo devolver la dosis');
    }
    fetchBatches();
    showToast('Deshecho: registro borrado y dosis devuelta.', { type: 'info', duration: 2500 });
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
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(apiUrl(`api/batches/${deleteModal.batchId}`), { 
      method: 'DELETE',
      headers
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al eliminar lote');
        }
        return data;
      })
      .then(data => {
        if (data.success) {
          setDeleteModal({ visible: false, batchId: null, batchName: '' });
          showToast('Lote eliminado.', { type: 'success', duration: 2500 });
          handleBack();
        }
      })
      .catch(err => {
        showToast(err.message, { type: 'error', duration: 4000 });
      });
  };
  // Toast color based on type
  const toastStyles = {
    success: { backgroundColor: 'var(--bg-header)', color: 'var(--color-text)', border: '1.5px solid var(--border-color)' },
    error: { backgroundColor: 'var(--bad-bg)', color: 'var(--bad-text)', border: '1.5px solid #FECACA' },
    info: { backgroundColor: 'var(--bg-card)', color: 'var(--color-text)', border: '1.5px solid var(--border-color)' },
  };

  return (
    <div className="app-container">
      <header className="app-header bt-appbar">
        <button
          type="button"
          className="bt-appbar-brand"
          onClick={() => setCurrentView('inventory')}
          aria-label="Ir a mi cava"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <rect x="4" y="2.5" width="16" height="19" rx="3.5" stroke="var(--color-text)" strokeWidth="1.8" />
            <circle cx="12" cy="6" r="1.3" fill="var(--color-crimson)" />
            <ellipse cx="12" cy="13.5" rx="4.2" ry="3.2" transform="rotate(-24 12 13.5)" stroke="var(--color-crimson)" strokeWidth="1.8" />
            <path d="M9.6 15.2C11.1 13.4 12.9 13.6 14.4 11.8" stroke="var(--color-crimson)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>BeanTag</span>
        </button>
        <div className="bt-appbar-actions">
          <button
            type="button"
            className="bt-appbar-btn"
            onClick={() => setShowNfcTools(true)}
            title="Herramientas NFC"
            aria-label="Herramientas NFC"
          >
            <Nfc size={18} strokeWidth={2} />
          </button>
          {currentUser ? (
            <button
              type="button"
              className="bt-appbar-btn bt-appbar-avatar"
              onClick={async () => {
                if (await confirmDialog(`¿Cerrar la sesión de ${currentUser.name || 'tu cuenta'}?`, { okText: 'Cerrar sesión' })) handleLogout();
              }}
              title="Cerrar sesión"
              aria-label={`Cuenta de ${currentUser.name || 'usuario'}: cerrar sesión`}
            >
              {currentUser.picture ? (
                <img src={currentUser.picture} alt="" />
              ) : (
                <div className="bt-appbar-initial">{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</div>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-candy primary bt-appbar-login"
              onClick={() => setShowAuthModal(true)}
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <main 
        onScroll={(e) => {
          if (e.currentTarget.scrollLeft !== 0) {
            e.currentTarget.scrollLeft = 0;
          }
        }}
        style={{ flex: 1, position: 'relative', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
      >
        {currentView === 'inventory' && (
          <Inventory 
            batches={batches} 
            onSelectBatch={handleSelectBatch} 
            onCreateTrigger={() => {
              if (!currentUser) {
                setShowAuthModal(true);
              } else {
                setCurrentView('creator');
              }
            }}
            onSubtractDose={handleSubtractDose}
            onRefreshBatches={fetchBatches}
            showToast={showToast}
          />
        )}

        <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="barista-spinner" /></div>}>
          {currentView === 'detail' && selectedBatchId && (
            <BatchDetail 
              key={selectedBatchId}
              batchId={selectedBatchId} 
              batches={batches}
              currentUser={currentUser}
              onRequireAuth={() => setShowAuthModal(true)}
              prefillRecipe={prefillRecipe}
              autoStartBrew={autoStartBrew}
              onAutoStartHandled={() => setAutoStartBrew(false)}
              onUndoRecipe={handleUndoRecipe}
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
              onCancel={handleBack}
              showToast={showToast}
            />
          )}

          {currentView === 'brews' && (
            <BrewHistory 
              batches={batches}
              onSelectBatch={handleSelectBatch}
              onNavigateToInventory={() => setCurrentView('inventory')}
              showToast={showToast}
            />
          )}

          {currentView === 'settings' && (
            <Settings 
              theme={theme}
              setTheme={setTheme}
              currentUser={currentUser}
              batches={batches}
              onLogout={handleLogout}
              showToast={showToast}
            />
          )}
        </Suspense>
      </main>

      {toast.visible && (
        <div className="toast-notification animate-entrance" role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'} style={{
          ...toastStyles[toast.type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <span>{toast.message}</span>
          {toast.showUndo && (
            <button
              type="button"
              onClick={handleUndo}
              style={{
                background: 'var(--color-crimson)',
                color: 'var(--on-accent)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--r-control)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              DESHACER
            </button>
          )}
        </div>
      )}

      {deleteModal.visible && (
        <div className="bento-modal-overlay" style={{ zIndex: 'var(--z-modal)' }} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" onKeyDown={(e) => { if (e.key === 'Escape') setDeleteModal({ visible: false, batchId: null, batchName: '' }); }} tabIndex={-1} ref={(el) => el && el.focus()}>
          <div className="candy-card animate-entrance" style={{ maxWidth: '340px', padding: '20px', margin: 'auto', textAlign: 'center' }}>
            <h4 id="delete-modal-title" style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>¿Eliminar este Lote?</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Se eliminará "{deleteModal.batchName}" y todo su historial de tubos. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                className="barista-btn-secondary" 
                style={{ flex: 1, margin: 0, textAlign: 'center' }} 
                onClick={() => setDeleteModal({ visible: false, batchId: null, batchName: '' })}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="barista-btn-danger" 
                style={{ flex: 1 }} 
                onClick={confirmDeleteBatch}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {showNfcTools && (
          <NfcToolsModal batches={batches} onClose={() => setShowNfcTools(false)} showToast={showToast} />
        )}

        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            onSuccess={handleAuthSuccess} 
            showToast={showToast} 
          />
        )}
      </Suspense>

      {/* Genjutsu Floating Bottom Navigation Bar */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}
