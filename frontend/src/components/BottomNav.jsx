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
      bottom: 'calc(16px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '460px',
      background: 'var(--barista-bg-surface, var(--sheet-bg, rgba(15, 23, 42, 0.94)))',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 'var(--barista-radius-pill, 9999px)',
      border: '1px solid var(--barista-border-hairline, var(--border-color))',
      boxShadow: 'var(--barista-shadow-elevated, 0 12px 30px rgba(0, 0, 0, 0.2))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '6px 8px',
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id || (item.id === 'inventory' && currentView === 'detail');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentView(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 16px',
              minHeight: '44px',
              minWidth: '64px',
              borderRadius: 'var(--barista-radius-lg, 16px)',
              border: isActive ? '1px solid var(--barista-border-active, var(--border-color))' : '1px solid transparent',
              background: isActive ? 'var(--barista-bg-elevated, var(--bg-header))' : 'transparent',
              color: isActive ? 'var(--barista-accent-honey, var(--color-crimson))' : 'var(--barista-text-secondary, var(--color-text-muted))',
              cursor: 'pointer',
              transition: 'all 0.16s ease',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
              boxSizing: 'border-box'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? '800' : '600',
              fontFamily: 'var(--font-heading)',
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
