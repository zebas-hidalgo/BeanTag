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
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '460px',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1.5px solid rgba(229, 231, 235, 0.8)',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(231, 111, 81, 0.05)',
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
            onClick={() => setCurrentView(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              background: isActive ? 'var(--color-surface-soft, #FFF0ED)' : 'transparent',
              color: isActive ? 'var(--color-crimson, #E76F51)' : '#718096',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? '900' : '600',
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
