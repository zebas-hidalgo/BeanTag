# BeanTag 5 Fantasy Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 5-theme fantasy palette selection system in BeanTag with persistent theme storage.

**Architecture:** CSS custom property overrides in `src/index.css`, state management in `App.jsx`, and a Neobrutalist theme selector grid in `Settings.jsx`.

**Tech Stack:** React, Vanilla CSS variables, Vite, PM2.

## Global Constraints

- No external CSS framework dependencies.
- Persist selection in `localStorage.setItem('beantag-theme', theme)`.
- 0 build errors on `npm run build` and PM2 restart.

---

### Task 1: CSS Theme Variables in `src/index.css`

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Define the 5 fantasy themes in `src/index.css`**

```css
[data-theme="sakura"] {
  --bg-canvas: #FCE4EC;
  --bg-card: #FFFFFF;
  --color-crimson: #EC4899;
  --color-text: #4A154B;
  --color-text-muted: #8338EC;
  --bg-header: #FCE4EC;
  --color-header-text: #4A154B;
}

[data-theme="matcha"] {
  --bg-canvas: #E8F5E9;
  --bg-card: #FFFFFF;
  --color-crimson: #2E7D32;
  --color-text: #1B4332;
  --color-text-muted: #40916C;
  --bg-header: #E8F5E9;
  --color-header-text: #1B4332;
}

[data-theme="cyberpunk"] {
  --bg-canvas: #E0F7FA;
  --bg-card: #FFFFFF;
  --color-crimson: #9C27B0;
  --color-text: #102A43;
  --color-text-muted: #334E68;
  --bg-header: #E0F7FA;
  --color-header-text: #102A43;
}

[data-theme="miel"] {
  --bg-canvas: #FFF8E1;
  --bg-card: #FFFFFF;
  --color-crimson: #F59E0B;
  --color-text: #4A2C11;
  --color-text-muted: #784212;
  --bg-header: #FFF8E1;
  --color-header-text: #4A2C11;
}

[data-theme="velvet"] {
  --bg-canvas: #F3E5F5;
  --bg-card: #FFFFFF;
  --color-crimson: #8E24AA;
  --color-text: #3B1046;
  --color-text-muted: #6A1B9A;
  --bg-header: #F3E5F5;
  --color-header-text: #3B1046;
}
```

---

### Task 2: Theme State & Settings Component Integration (`App.jsx` & `Settings.jsx`)

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Add persistent `theme` state in `App.jsx` and pass down to `Settings`**

```jsx
const [theme, setTheme] = useState(() => localStorage.getItem('beantag-theme') || 'default');

useEffect(() => {
  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem('beantag-theme', theme);
}, [theme]);

// Pass to Settings:
<Settings theme={theme} setTheme={setTheme} showToast={showToast} />
```

- [ ] **Step 2: Add Neobrutalist Theme Selector Grid to `Settings.jsx`**

```jsx
<div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
  <div>
    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
      🎨 Temas Visuales de Fantasía
    </h4>
    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
      Elige una paleta Neobrutalista inspirada en el café de especialidad
    </p>
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
    {[
      { id: 'default', name: '☕ Mocha Sky' },
      { id: 'sakura', name: '🌸 Sakura V60' },
      { id: 'matcha', name: '🌿 Matcha Tonic' },
      { id: 'cyberpunk', name: '🌌 Cyber Geisha' },
      { id: 'miel', name: '🥐 Miel de Brujas' },
      { id: 'velvet', name: '🍇 Cold Velvet' }
    ].map((t) => {
      const isActive = theme === t.id;
      return (
        <button 
          key={t.id}
          type="button"
          onClick={() => { setTheme(t.id); if (showToast) showToast(`Tema ${t.name} aplicado.`, { type: 'success', duration: 2000 }); }} 
          className="btn-candy"
          style={{ 
            margin: 0, 
            fontSize: '10px', 
            padding: '8px 6px', 
            border: '2px solid var(--border-color)',
            backgroundColor: isActive ? 'var(--color-crimson)' : 'var(--bg-card)',
            color: isActive ? '#FFFFFF' : 'var(--color-text)',
            boxShadow: isActive ? 'none' : '3px 3px 0px var(--border-color)',
            transform: isActive ? 'translate(2px, 2px)' : 'none',
            fontWeight: 'bold'
          }}
        >
          {t.name}
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 3: Test Build & Restart PM2**

```bash
cd /var/www/beantag/frontend && npm run build && pm2 restart beantag
git add .
git commit -m "feat: implement 5 fantasy themes system with persistent selection in Settings"
```
