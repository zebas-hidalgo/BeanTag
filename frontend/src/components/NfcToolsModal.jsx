import React, { useState, useEffect } from 'react';
import { Nfc, RefreshCw, Trash2, Copy, X, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';

export default function NfcToolsModal({ onClose, showToast }) {
  const [batches, setBatches] = useState([]);
  const hasNfc = typeof window !== 'undefined' && 'NDEFReader' in window;
  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  const [activeTab, setActiveTab] = useState(hasNfc ? 'scan' : 'ios'); // 'ios' | 'scan' | 'format' | 'clone'
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        setBatches(data || []);
        if (data && data.length > 0) {
          setSelectedBatchId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyUrl = (batchId) => {
    const url = `${window.location.origin}/batch/${batchId || selectedBatchId}`;
    navigator.clipboard.writeText(url);
    if (showToast) {
      showToast('📋 URL de lote copiada al portapapeles.', { type: 'success', duration: 2500 });
    }
  };

  const handleStartScan = async () => {
    if (!hasNfc) {
      if (showToast) showToast('WebNFC directo no disponible en iOS Safari. Usa el modo iPhone.', { type: 'info' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage('Acerca la etiqueta NFC para diagnosticar...');
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.onreading = (event) => {
        let rawUrl = '';
        for (const record of event.message.records) {
          if (record.recordType === 'url') {
            const decoder = new TextDecoder();
            rawUrl = decoder.decode(record.data);
          }
        }
        setScannedData({
          serialNumber: event.serialNumber || 'N/A',
          rawUrl: rawUrl || 'Registro sin URL legible',
          timestamp: new Date().toLocaleTimeString()
        });
        setStatusMessage('✅ Etiqueta leída con éxito');
        setIsProcessing(false);
      };
    } catch (error) {
      setStatusMessage('❌ Error: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleFormatTag = async () => {
    if (!hasNfc) {
      if (showToast) showToast('Escribe /empty usando NFC Tools en iOS.', { type: 'info' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage('Acerca la etiqueta para limpiar/formatear...');
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: `${window.location.origin}/empty` }]
      });
      setStatusMessage('🎉 Etiqueta formateada y limpiada con éxito.');
      if (showToast) showToast('Etiqueta formateada.', { type: 'success' });
      setIsProcessing(false);
    } catch (error) {
      setStatusMessage('❌ Error al formatear: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleCloneBatchTag = async () => {
    if (!hasNfc) {
      handleCopyUrl(selectedBatchId);
      return;
    }
    if (!selectedBatchId) {
      if (showToast) showToast('Selecciona un lote para clonar.', { type: 'error' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage(`Acerca la etiqueta para vincular lote ${selectedBatchId}...`);
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: `${window.location.origin}/batch/${selectedBatchId}` }]
      });
      setStatusMessage(`🎉 Tag vinculado con éxito al lote: ${selectedBatchId}`);
      if (showToast) showToast(`Tag grabado con lote ${selectedBatchId}`, { type: 'success' });
      setIsProcessing(false);
    } catch (error) {
      setStatusMessage('❌ Error al clonar: ' + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(26, 5, 5, 0.75)',
      zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', boxSizing: 'border-box'
    }} onClick={onClose}>
      <div className="candy-card static" style={{
        maxWidth: '440px', width: '100%', padding: '20px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '14px',
        animation: 'softFadeIn 200ms ease-out'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Nfc size={18} color="var(--color-crimson)" />
            Herramientas NFC {isIos ? '(iPhone / iOS)' : ''}
          </h3>
          <button type="button" className="btn-candy" style={{ padding: '4px 8px', margin: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Hardware Status Banner */}
        <div style={{
          padding: '8px 12px', borderRadius: '6px', border: '2px solid var(--border-color)',
          fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: hasNfc ? '#C6F6D5' : '#EBF8FF',
          color: hasNfc ? '#22543D' : '#2B6CB0'
        }}>
          {hasNfc ? <CheckCircle size={14} /> : <Smartphone size={14} />}
          <span>
            {hasNfc 
              ? 'WebNFC Disponible Directamente (Chrome Android)' 
              : 'Lectura Nativa iOS Activada (iPhone XS / 11 / 12 / 13 / 14 / 15 / 16)'}
          </span>
        </div>

        {/* Action Tabs */}
        <div className="filter-scroll-container">
          <button
            type="button"
            className={`filter-chip ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
             Modo iPhone
          </button>
          {hasNfc && (
            <>
              <button
                type="button"
                className={`filter-chip ${activeTab === 'scan' ? 'active' : ''}`}
                onClick={() => { setActiveTab('scan'); setStatusMessage(''); }}
              >
                🔍 Diagnosticar
              </button>
              <button
                type="button"
                className={`filter-chip ${activeTab === 'format' ? 'active' : ''}`}
                onClick={() => { setActiveTab('format'); setStatusMessage(''); }}
              >
                🧹 Formatear
              </button>
              <button
                type="button"
                className={`filter-chip ${activeTab === 'clone' ? 'active' : ''}`}
                onClick={() => { setActiveTab('clone'); setStatusMessage(''); }}
              >
                📋 Clonar Lote
              </button>
            </>
          )}
        </div>

        {/* Tab 1: iOS iPhone Native Mode */}
        {activeTab === 'ios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: '6px', border: '2px solid var(--border-color)', fontSize: '11.5px', lineHeight: '1.4' }}>
              <strong style={{ color: 'var(--color-crimson)', display: 'block', marginBottom: '4px' }}>
                💡 ¿Cómo funciona el NFC en iPhone?
              </strong>
              1. En iPhone no necesitas presionar nada para leer.
              2. Acerca la parte superior trasera de tu iPhone al tag NFC.<br/>
              3. Recibirás la notificación emergente nativa de iOS para abrir la bitácora de tu café al instante.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                Copiar URL de Lote para Grabar en iPhone:
              </label>
              <select
                className="candy-input"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.coffee_name} ({b.roaster}) - ID: {b.id}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-candy primary"
                onClick={() => handleCopyUrl(selectedBatchId)}
                style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', margin: 0 }}
              >
                <Copy size={14} />
                Copiar URL del Lote ({selectedBatchId})
              </button>
            </div>

            <p style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center', lineHeight: '1.3' }}>
              Pega la URL copiada en la app gratuita <strong>NFC Tools para iPhone</strong> (App Store) o en la app <strong>Atajos</strong> de Apple para grabar frascos o tubos en 2 segundos.
            </p>
          </div>
        )}

        {/* Chrome Android / Direct WebNFC Tabs */}
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Lee el contenido RAW de cualquier etiqueta NFC cercana.
            </p>
            <button type="button" className="btn-candy primary" onClick={handleStartScan} disabled={isProcessing} style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={isProcessing ? 'spin' : ''} />
              Iniciar Escaneo Diagnóstico
            </button>
            {scannedData && (
              <div style={{ background: 'var(--bg-canvas)', padding: '10px', border: '2px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div><strong>Nº Serie:</strong> {scannedData.serialNumber}</div>
                <div><strong>URL RAW:</strong> {scannedData.rawUrl}</div>
                <div><strong>Hora:</strong> {scannedData.timestamp}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'format' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Formatea la etiqueta escribiendo un registro URL neutro (`/empty`).
            </p>
            <button type="button" className="btn-candy" onClick={handleFormatTag} disabled={isProcessing} style={{ padding: '10px', color: '#E53E3E', borderColor: '#E53E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={14} />
              Formatear & Limpiar Tag
            </button>
          </div>
        )}

        {activeTab === 'clone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Selecciona un lote y grábalo rápidamente a cualquier tag NFC cercano.
            </p>
            <select
              className="candy-input"
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name || b.coffee_name} ({b.roaster}) - ID: {b.id}
                </option>
              ))}
            </select>
            <button type="button" className="btn-candy primary" onClick={handleCloneBatchTag} disabled={isProcessing} style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Copy size={14} />
              Grabar Lote Seleccionado
            </button>
          </div>
        )}

        {statusMessage && (
          <div style={{
            padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center',
            border: '2px solid var(--border-color)', borderRadius: '4px',
            backgroundColor: 'var(--bg-card)'
          }}>
            {statusMessage}
          </div>
        )}

      </div>
    </div>
  );
}
