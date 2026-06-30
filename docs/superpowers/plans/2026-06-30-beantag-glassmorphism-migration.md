# BeanTag Glassmorphism Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar la interfaz de BeanTag del estilo Neumorphic Soft UI al estilo Glassmorphism Premium (tarjetas esmeriladas translúcidas flotando sobre un gradiente abisal).

**Architecture:** Modificación de las clases y variables CSS en la hoja de estilos global `frontend/src/index.css` para redefinir bordes reflectores, desenfoque de fondo y paletas de color con fondo mesh oscuro.

**Tech Stack:** CSS Vanilla, React, Vite, PM2/Nginx en el VPS.

---

## Tarea 1: Gradiente de Fondo Abisal y Contenedor Principal

**Files:**
- Modify: `frontend/src/index.css:1-48`

- [ ] **Step 1: Modificar variables globales de color y estilo en `:root`**
  
  Cambia las variables `:root` en `frontend/src/index.css` para configurar el tema oscuro abisal y eliminar las variables neumórficas antiguas.
  
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap');

  :root {
    --color-bg-gradient: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #311042 100%);
    --color-bg-solid: #0F172A;
    --color-navy: #FFFFFF;           /* Texto principal en blanco para contraste en fondo oscuro */
    --color-text-muted: #94A3B8;     /* Texto secundario grisáceo */
    --color-purple: #C084FC;         /* Violeta pastel brillante */
    --color-cyan: #22D3EE;           /* Cian brillante */
    --color-pink: #F472B6;           /* Rosa brillante */
    --color-peach: #FDBA74;          /* Durazno brillante */
    --color-rose: #FDA4AF;           /* Rosa pastel brillante */
    --color-lime: #99F6E4;           /* Turquesa claro */
    --color-yellow: #FDE047;         /* Amarillo brillante */
    --color-orange: #FB923C;         /* Naranja brillante */
    --color-green: #34D399;          /* Verde brillante */
    --color-card-glass: rgba(255, 255, 255, 0.08);
    --color-card-border: rgba(255, 255, 255, 0.15);
    
    --font-heading: 'Comfortaa', cursive;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    --transition-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```

- [ ] **Step 2: Actualizar estilos de body y .app-container**
  
  Configura el fondo de la pantalla con el degradado abisal oscuro, y añade contención de bordes transparentes.
  
  ```css
  body {
    margin: 0;
    font-family: var(--font-body);
    background-color: var(--color-bg-solid);
    background-image: var(--color-bg-gradient);
    background-attachment: fixed;
    color: var(--color-navy);
    -webkit-font-smoothing: antialiased;
    touch-action: manipulation;
  }

  .app-container {
    max-width: 480px;
    margin: 0 auto;
    background: transparent; /* Permite ver el gradiente de body */
    min-height: 100dvh;
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }
  ```

- [ ] **Step 3: Commit**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: set dark aurora mesh gradient and transparent app container borders"
  ```

---

## Tarea 2: Tarjetas de Vidrio Esmerilado (Glassmorphism Cards)

**Files:**
- Modify: `frontend/src/index.css:50-90`

- [ ] **Step 1: Reconfigurar la clase .candy-card a Glassmorphism**
  
  Actualiza `.candy-card` para aplicar desenfoque de fondo y bordes reflectores.
  
  ```css
  .candy-card {
    background-color: var(--color-card-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-card-border);
    border-radius: 24px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 
      0 8px 32px 0 rgba(0, 0, 0, 0.25), 
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-sizing: border-box;
    color: white;
  }

  .candy-card:active {
    transform: scale(0.97);
    background-color: rgba(255, 255, 255, 0.14);
    box-shadow: 
      0 4px 16px 0 rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  ```

- [ ] **Step 2: Aplicar tonalidades translúcidas a las tarjetas de color**
  
  Reescribe las clases de color de tarjetas de lote para tintar suavemente el cristal sin tapar el gradiente inferior.
  
  ```css
  .bg-rose { 
    background-color: rgba(244, 63, 94, 0.08); 
    border-color: rgba(244, 63, 94, 0.25);
  }
  .bg-peach { 
    background-color: rgba(249, 115, 22, 0.08); 
    border-color: rgba(249, 115, 22, 0.25);
  }
  .bg-lime { 
    background-color: rgba(20, 184, 166, 0.08); 
    border-color: rgba(20, 184, 166, 0.25);
  }
  .bg-lavender { 
    background-color: rgba(139, 92, 246, 0.08); 
    border-color: rgba(139, 92, 246, 0.25);
  }
  ```

- [ ] **Step 3: Commit**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: implement translucent glassmorphism cards and neon color outlines"
  ```

---

## Tarea 3: Rediseño de Cabecera, Botones e Inputs de Formulario

**Files:**
- Modify: `frontend/src/index.css:91-230`

- [ ] **Step 1: Estilizar la cabecera y botones de navegación**
  
  ```css
  .app-header {
    background-color: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.2);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .app-header h1 {
    font-family: var(--font-heading);
    font-size: 20px;
    margin: 0;
    color: var(--color-navy);
  }

  .app-bar-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.1s;
    color: var(--color-navy);
    font-size: 18px;
  }

  .app-bar-btn:active {
    transform: scale(0.94);
    background-color: rgba(255, 255, 255, 0.15);
  }
  ```

- [ ] **Step 2: Estilizar botones de bitácora y steppers**
  
  ```css
  .btn-candy {
    background-color: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 12px 16px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all var(--transition-fast);
    color: var(--color-navy);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .btn-candy:active {
    transform: scale(0.96);
    background-color: rgba(255, 255, 255, 0.15);
  }

  .btn-candy.primary {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.7), rgba(126, 34, 206, 0.9));
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.35);
  }

  .btn-candy.accent {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.7), rgba(217, 119, 6, 0.9));
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
  }
  ```

- [ ] **Step 3: Estilizar Inputs y Steppers de Vidrio**
  
  ```css
  .form-group label {
    display: block;
    font-family: var(--font-heading);
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-weight: bold;
    color: var(--color-text-muted);
  }

  .candy-input {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 12px 16px;
    font-family: var(--font-body);
    font-size: 13px;
    box-sizing: border-box;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
    color: var(--color-navy);
    transition: all 0.2s;
  }

  .candy-input:focus {
    outline: none;
    background-color: rgba(0, 0, 0, 0.4);
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 8px rgba(168, 85, 247, 0.2);
  }

  /* Steppers */
  .stepper {
    display: flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 4px;
    width: fit-content;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
    background-color: rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
  }

  .stepper-btn {
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    font-size: 18px;
    color: var(--color-navy);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }

  .stepper-btn:active {
    transform: scale(0.92);
    background-color: rgba(255, 255, 255, 0.18);
  }

  .stepper-value {
    width: 44px;
    height: 32px;
    text-align: center;
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-weight: bold;
    font-size: 14px;
    color: var(--color-navy);
  }
  ```

- [ ] **Step 4: Commit**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: convert inputs, buttons, header, and steppers to dark glass style"
  ```

---

## Tarea 4: Tabbar flotante y Undo Toast en Vidrio

**Files:**
- Modify: `frontend/src/index.css:231-456`

- [ ] **Step 1: Estilizar la barra de navegación flotante y Toast de Deshacer**
  
  ```css
  .nb-tabbar {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 448px;
    height: 72px;
    background-color: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 50;
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    padding: 0 10px;
    overflow: hidden;
  }

  .tab-item {
    flex: 1;
    text-align: center;
    background: none;
    border: none;
    font-size: 10px;
    font-family: var(--font-heading);
    font-weight: bold;
    color: var(--color-text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    text-transform: uppercase;
    padding: 8px 0;
    margin: 4px;
    border-radius: 16px;
    transition: all var(--transition-fast);
  }

  .tab-item.active {
    background-color: rgba(255, 255, 255, 0.08);
    color: var(--color-purple);
  }

  .tab-item.scan-trigger {
    transform: none;
    flex: 0 0 60px;
  }

  .scan-ring {
    background: linear-gradient(135deg, var(--color-orange), var(--color-pink));
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
    transition: all 0.1s;
  }

  .scan-ring:active {
    transform: scale(0.94);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
  }

  .tab-item svg {
    width: 18px;
    height: 18px;
  }

  /* Bounce-pop */
  .bounce-pop {
    animation: soft-pop 400ms var(--transition-spring);
  }

  @keyframes soft-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  /* Grid of 7 fields */
  .candy-fields-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .field-item {
    background-color: var(--color-card-glass);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--color-card-border);
    border-radius: 16px;
    padding: 10px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  .field-item.full-width {
    grid-column: span 2;
  }

  .field-label {
    font-family: var(--font-heading);
    font-size: 9px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }

  .field-value {
    font-size: 13px;
    font-weight: 700;
  }

  /* Floating Toast Undo */
  .undo-toast {
    position: fixed;
    bottom: 96px;
    left: 50%;
    transform: translateX(-50%) translateY(150px);
    width: calc(100% - 48px);
    max-width: 416px;
    background-color: rgba(16, 185, 129, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    padding: 12px 18px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 60;
    transition: transform 0.4s var(--transition-spring);
    font-weight: 700;
    box-sizing: border-box;
    color: white;
  }

  .undo-toast.show {
    transform: translateX(-50%) translateY(0);
  }

  .undo-btn {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 6px 12px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 11px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.1s;
  }

  .undo-btn:active {
    transform: scale(0.94);
    background-color: rgba(255, 255, 255, 0.2);
  }

  /* Miscellaneous Helpers */
  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .card-title {
    font-family: var(--font-heading);
    font-size: 18px;
    margin: 0 0 4px 0;
  }

  .card-sub {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .candy-badge {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 6px 12px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .candy-tag {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 4px 10px;
    font-size: 10px;
    font-family: var(--font-mono);
    font-weight: 700;
    text-transform: uppercase;
    display: inline-block;
    margin-right: 8px;
    margin-top: 8px;
    color: var(--color-text-muted);
  }

  .instr-box {
    background-color: rgba(254, 243, 199, 0.1);
    border: 1px solid rgba(254, 243, 199, 0.2);
    border-radius: 14px;
    padding: 12px;
    font-size: 11px;
    margin-top: 14px;
    color: #FDE047;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .nb-action-wrap {
    margin: 18px 0;
    position: relative;
    box-sizing: border-box;
  }
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: convert floating tabbar, toast alerts, tags, and badges to glassmorphism styles"
  ```

---

## Tarea 5: Compilación y Despliegue en el VPS

- [ ] **Step 1: Compilar la aplicación React en local**
  
  Run: `npm run build-frontend`
  Expected: Vite compila sin errores ni warnings en consola.

- [ ] **Step 2: Ejecutar el script local de despliegue**
  
  Run: `./deploy.sh`
  Expected: PM2 reinicia el backend exitosamente en el VPS, sirviendo los nuevos assets.
