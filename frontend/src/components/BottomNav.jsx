import React from 'react';
import { Package, Plus, Coffee, User } from 'lucide-react';

// V5: three destinations in a floating glass bar; "Nuevo café" is a floating action
// on the inventory, where new batches are added.
const NAV_ITEMS = [
  { id: 'inventory', label: 'Cava', icon: Package },
  { id: 'brews', label: 'Bitácoras', icon: Coffee },
  { id: 'settings', label: 'Perfil', icon: User },
];

export default function BottomNav({ currentView, setCurrentView }) {
  const showFab = currentView === 'inventory';

  return (
    <>
      {showFab && (
        <button
          type="button"
          className="bt-fab"
          aria-label="Registrar nuevo café"
          onClick={() => setCurrentView('creator')}
        >
          <Plus size={24} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
      <nav className="bt-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentView === id || (id === 'inventory' && (currentView === 'detail' || currentView === 'creator'));
          return (
            <button
              key={id}
              type="button"
              className={`bt-nav-btn${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setCurrentView(id)}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.9} aria-hidden="true" />
              <span className="bt-nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
