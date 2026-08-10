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
      background: 'rgba(24, 38, 35, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1.5px solid rgba(42, 157, 143, 0.35)',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 4px 15px rgba(42, 157, 143, 0.15)',
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
              padding: '6px 14px',
              borderRadius: '16px',
              border: isActive ? '1px solid rgba(233, 196, 106, 0.4)' : '1px solid transparent',
              background: isActive ? 'rgba(233, 196, 106, 0.15)' : 'transparent',
              color: isActive ? '#E9C46A' : '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? '800' : '500',
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
