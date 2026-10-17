import React from 'react';
import { Package, PlusCircle, Coffee, Settings } from 'lucide-react';

export default function BottomNav({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'creator', label: 'Nuevo Café', icon: PlusCircle },
    { id: 'brews', label: 'Bitácoras', icon: Coffee },
    { id: 'settings', label: 'Perfil', icon: Settings },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 'calc(14px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 36px)',
      maxWidth: '430px',
      background: 'var(--sheet-bg, var(--barista-bg-surface, rgba(255, 255, 255, 0.88)))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 'var(--barista-radius-pill, 9999px)',
      border: '1px solid var(--barista-border-hairline, var(--border-color))',
      boxShadow: 'var(--barista-shadow-elevated, 0 12px 32px rgba(0, 0, 0, 0.14))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 6px',
      zIndex: 1000,
      boxSizing: 'border-box',
      gap: '4px'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id || (item.id === 'inventory' && currentView === 'detail');

        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (navigator.vibrate) {
                try { navigator.vibrate(6); } catch (e) {}
              }
              setCurrentView(item.id);
            }}
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 10px',
              minHeight: '46px',
              borderRadius: 'var(--barista-radius-pill, 9999px)',
              border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
              background: isActive ? 'var(--barista-bg-elevated, var(--segmented-bg))' : 'transparent',
              color: isActive ? 'var(--color-crimson)' : 'var(--barista-text-secondary, var(--color-text-muted))',
              cursor: 'pointer',
              transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease',
              boxSizing: 'border-box'
            }}
          >
            {isActive && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '4px',
                  width: '14px',
                  height: '2.5px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-crimson)'
                }}
              />
            )}
            <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
            <span style={{
              fontSize: '10.5px',
              fontWeight: isActive ? '800' : '600',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em',
              lineHeight: 1
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
