import React from 'react';
import { ClipboardCopy, Share2, X } from 'lucide-react';
import CardStylePicker from './CardStylePicker';
import { DEFAULT_CARD_STYLE } from '../utils/cardGenerator';
import { copyOrShareImage, STICKER_HINTS } from '../utils/clipboard';

export default function StickerShareModal({
  shareImage,
  title,
  shareTemplate,
  onChangeTemplate,
  stickerOrientation,
  onChangeOrientation,
  shareStatus,
  setShareStatus,
  onClose,
  onShareNative,
  onCopyText
}) {
  if (!shareImage) return null;

  const isError = /error|no se pudo/i.test(shareStatus || '');

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Compartir sticker'}
    >
      <div
        className="candy-card static animate-entrance"
        style={{
          maxWidth: '480px', width: '100%',
          maxHeight: 'calc(100dvh - 32px)',
          margin: 'auto',
          padding: '16px', boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', gap: '10px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '12.5px', margin: 0, color: 'var(--color-text)' }}>
              {title}
            </h3>
            <button
              type="button"
              className="bt-icon-btn"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              style={{ width: '32px', height: '32px', minHeight: '32px' }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        <CardStylePicker
          value={shareTemplate || DEFAULT_CARD_STYLE}
          onChange={onChangeTemplate}
          orientation={stickerOrientation}
          onOrientationChange={onChangeOrientation}
        />

        <div style={{
          textAlign: 'center',
          backgroundColor: 'var(--bg-canvas)',
          borderRadius: 'var(--r-control)',
          padding: '8px',
          overflow: 'hidden',
          flex: '0 1 auto',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={shareImage}
            alt="Vista previa del sticker (fondo transparente)"
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(45dvh - 50px)',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 'var(--r-control)',
              display: 'block',
              margin: '0 auto',
              background: 'repeating-conic-gradient(#D9D3CA 0% 25%, #F1EDE6 0% 50%) 50% / 24px 24px'
            }}
          />
        </div>

        {shareStatus && (
          <div style={{
            background: isError ? 'var(--barista-accent-danger-bg)' : 'var(--barista-accent-mint-bg)',
            color: isError ? 'var(--barista-accent-danger-text)' : 'var(--barista-accent-mint-text)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--r-control)',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center',
            flexShrink: 0
          }}>
            {shareStatus}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', flexShrink: 0, paddingTop: '4px' }}>
          <button
            type="button"
            className="barista-btn barista-btn-primary"
            style={{ margin: 0 }}
            onClick={async () => {
              try {
                const how = await copyOrShareImage(shareImage, 'beantag-sticker.png');
                if (STICKER_HINTS[how]) setShareStatus(STICKER_HINTS[how]);
              } catch (err) {
                setShareStatus('No se pudo copiar ni compartir: ' + (err.message || err));
              }
            }}
          >
            <ClipboardCopy size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Copiar sticker</span>
          </button>
          <button
            type="button"
            className="barista-btn barista-btn-secondary"
            style={{ margin: 0 }}
            onClick={onShareNative}
          >
            <Share2 size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Compartir</span>
          </button>
          {onCopyText && (
            <button
              type="button"
              className="barista-btn barista-btn-ghost"
              style={{ gridColumn: '1 / -1', margin: 0 }}
              onClick={onCopyText}
            >
              Copiar como texto (WhatsApp)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
