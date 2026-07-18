# BeanTag: Plan de Implementación Inicial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la aplicación móvil BeanTag para gestionar lotes de café congelados en tubos de centrífuga mediante NFC, con almacenamiento en SQLite y UI responsiva en estilo Candy Claymorphism (Neón Cósmico).

**Architecture:** Una aplicación full-stack monolítica ligera. El backend en Node.js/Express provee una API REST y sirve los archivos estáticos compitados por el frontend en React (Vite). La base de datos SQLite se almacena localmente en un archivo para fácil despliegue en el VPS.

**Tech Stack:** Node.js, Express, SQLite3 (o sqlite), React, Vite, CSS Vanilla.

---

## Estructura de Archivos a Crear

```
Proyecto_cafe/
├── package.json (Configuración de arranque monorepo)
├── backend/
│   ├── package.json
│   ├── server.js (Servidor Express y API REST)
│   ├── database.js (Conexión y tablas de SQLite)
│   └── database.sqlite (Generado automáticamente)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── index.css (Estilos globales Candy Claymorphism - Neón Cósmico)
    │   ├── App.jsx (Navegación e integración de vistas)
    │   └── components/
    │       ├── Inventory.jsx (Pantalla: Mi Congelador)
    │       ├── BatchDetail.jsx (Pantalla: Ficha del Tubo / Acción / Bitácora)
    │       ├── BatchCreator.jsx (Pantalla: Crear Lote y NFC Copy)
    │       └── BrewHistory.jsx (Pantalla: Historial de Bitácoras)
```

---

## Tareas de Implementación

### Tarea 1: Inicialización del Proyecto y Configuración de Dependencias

**Files:**
- Create: `package.json`
- Create: `backend/package.json`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`

- [ ] **Paso 1: Crear el package.json de la raíz**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/package.json` para gestionar el arranque del proyecto con scripts concurrentes.
  
  ```json
  {
    "name": "beantag-root",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "install-all": "npm install && npm install --prefix backend && npm install --prefix frontend",
      "build-frontend": "npm run build --prefix frontend",
      "start": "node backend/server.js",
      "dev": "concurrently \"npm run dev --prefix frontend\" \"node backend/server.js\""
    },
    "dependencies": {
      "concurrently": "^8.2.0"
    }
  }
  ```

- [ ] **Paso 2: Crear el package.json del backend**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/backend/package.json` con dependencias mínimas para Express y SQLite.
  
  ```json
  {
    "name": "beantag-backend",
    "version": "1.0.0",
    "private": true,
    "main": "server.js",
    "scripts": {
      "start": "node server.js"
    },
    "dependencies": {
      "express": "^4.19.2",
      "cors": "^2.8.5",
      "sqlite3": "^5.1.7",
      "sqlite": "^5.1.1"
    }
  }
  ```

- [ ] **Paso 3: Crear el package.json del frontend**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/package.json` con React y Lucide React (para iconos vectoriales de apoyo, aunque usaremos también SVGs nativos).
  
  ```json
  {
    "name": "beantag-frontend",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^0.395.0"
    },
    "devDependencies": {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      "vite": "^5.3.1"
    }
  }
  ```

- [ ] **Paso 4: Crear la configuración de Vite**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/vite.config.js` configurando que la salida se compile en la carpeta publica del backend para el despliegue simplificado en VPS.
  
  ```javascript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, '../backend/public'),
      emptyOutDir: true
    }
  })
  ```

- [ ] **Paso 5: Crear el index.html base del frontend**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/index.html`.
  
  ```html
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='35' y='10' width='30' height='12' rx='4' fill='%231D4ED8' stroke='%230F081D' stroke-width='5'/><path d='M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22' fill='%2393C5FD' stroke='%230F081D' stroke-width='5'/></svg>" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <title>BeanTag</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3E8FF;">
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>
  ```

- [ ] **Paso 6: Instalar dependencias**
  
  Ejecuta la instalación en la raíz para propagar dependencias en backend y frontend.
  
  Run: `npm run install-all`
  Expected: Instalación exitosa de todos los nodos de dependencias sin fallos críticos.

- [ ] **Paso 7: Commit inicial**
  
  ```bash
  git add package.json backend/package.json frontend/package.json frontend/vite.config.js frontend/index.html
  git commit -m "chore: initialize project structure and setup packages"
  ```

---

### Tarea 2: Configuración de Base de Datos y Backend Express

**Files:**
- Create: `backend/database.js`
- Create: `backend/server.js`

- [ ] **Paso 1: Crear conector e inicialización de SQLite**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/backend/database.js`. Define las tablas de lotes y recetas según la especificación acordada.
  
  ```javascript
  const sqlite3 = require('sqlite3').verbose();
  const { open } = require('sqlite');
  const path = require('path');

  async function getDb() {
    return open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
  }

  async function initDb() {
    const db = await getDb();
    
    // Create batches table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        producer TEXT NOT NULL,
        altitude TEXT,
        variety TEXT,
        process TEXT,
        roaster TEXT,
        roaster_notes TEXT,
        dose_weight TEXT DEFAULT '20.0g',
        total_doses INTEGER NOT NULL,
        remaining_doses INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create recipes table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        method TEXT NOT NULL,
        ratio TEXT,
        grind TEXT,
        temperature TEXT,
        brew_time TEXT,
        rating INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);
    
    return db;
  }

  module.exports = { getDb, initDb };
  ```

- [ ] **Paso 2: Crear el Servidor API Express**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/backend/server.js`. Incluye todas las rutas CRUD para lotes, resta de dosis (decremento/incremento para deshacer) e historial.
  
  ```javascript
  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const { initDb, getDb } = require('./database');

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  // Serve static files from compiled React app
  app.use(express.static(path.join(__dirname, 'public')));

  // --- API ROUTES ---

  // Get all active batches
  app.get('/api/batches', async (req, res) => {
    try {
      const db = await getDb();
      const batches = await db.all('SELECT * FROM batches ORDER BY created_at DESC');
      res.json(batches);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get batch details
  app.get('/api/batches/:id', async (req, res) => {
    try {
      const db = await getDb();
      const batch = await db.get('SELECT * FROM batches WHERE id = ?', req.params.id);
      if (!batch) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }
      const recipes = await db.all('SELECT * FROM recipes WHERE batch_id = ? ORDER BY created_at DESC', req.params.id);
      res.json({ ...batch, recipes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new batch
  app.post('/api/batches', async (req, res) => {
    const { id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses } = req.body;
    if (!id || !name || !producer || !total_doses) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses]
      );
      res.status(201).json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update doses remaining (Subtract or Add/Undo)
  app.patch('/api/batches/:id/doses', async (req, res) => {
    const { change } = req.body; // expected: -1 (subtract) or +1 (undo)
    if (change !== -1 && change !== 1) {
      return res.status(400).json({ error: 'Cambio inválido' });
    }
    try {
      const db = await getDb();
      const batch = await db.get('SELECT remaining_doses, total_doses FROM batches WHERE id = ?', req.params.id);
      if (!batch) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }
      
      const newDoses = batch.remaining_doses + change;
      if (newDoses < 0 || newDoses > batch.total_doses) {
        return res.status(400).json({ error: 'Cantidad de dosis fuera de los límites' });
      }

      await db.run('UPDATE batches SET remaining_doses = ? WHERE id = ?', [newDoses, req.params.id]);
      res.json({ success: true, remaining_doses: newDoses });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save brew recipe
  app.post('/api/recipes', async (req, res) => {
    const { batch_id, method, ratio, grind, temperature, brew_time, rating, notes } = req.body;
    if (!batch_id || !method) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [batch_id, method, ratio, grind, temperature, brew_time, rating, notes]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get global recipe history
  app.get('/api/recipes', async (req, res) => {
    try {
      const db = await getDb();
      const history = await db.all(`
        SELECT r.*, b.name as batch_name, b.variety as batch_variety 
        FROM recipes r 
        JOIN batches b ON r.batch_id = b.id 
        ORDER BY r.created_at DESC
      `);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve React front for fallback routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Initialize DB and start listening
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend de BeanTag corriendo en el puerto ${PORT}`);
    });
  }).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
  });
  ```

- [ ] **Paso 3: Verificar que el servidor compile e inicie**
  
  Ejecuta el servidor en la terminal de forma básica.
  
  Run: `node backend/server.js`
  Expected: Output `Backend de BeanTag corriendo en el puerto 5000` y creación del archivo `backend/database.sqlite`. Terminar el proceso con Ctrl+C después de verificar.

- [ ] **Paso 4: Commit de base de datos y backend**
  
  ```bash
  git add backend/database.js backend/server.js
  git commit -m "feat: implement Express server and SQLite migrations"
  ```

---

### Tarea 3: CSS Global Candy Claymorphism (Neón Cósmico)

**Files:**
- Create: `frontend/src/index.css`

- [ ] **Paso 1: Escribir el CSS de Diseño Neón Cósmico**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/index.css`. Implementa todas las clases de Arcilla 3D, contornos navy, rellenos de colores pastel neón y animaciones elásticas para los steppers y botones de mantener presionado.
  
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap');

  :root {
    --color-bg: #F3E8FF;           /* Lavender Mist */
    --color-navy: #0F081D;         /* Obsidian outlines */
    --color-purple: #8B5CF6;       /* Electric Violet */
    --color-cyan: #06B6D4;         /* Cyber Cyan */
    --color-pink: #EC4899;         /* Vibrant Pink */
    --color-peach: #FED7AA;        /* Peach */
    --color-rose: #FBCFE8;         /* Candy Rose */
    --color-lime: #CCFBF1;         /* Lime */
    --color-card: #FFFFFF;
    
    --font-heading: 'Comfortaa', cursive;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    --transition-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-fast: 100ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  body {
    margin: 0;
    font-family: var(--font-body);
    background-color: var(--color-bg);
    color: var(--color-navy);
    -webkit-font-smoothing: antialiased;
    touch-action: manipulation;
  }

  /* Safe Area layout helper */
  .app-container {
    max-width: 480px;
    margin: 0 auto;
    background-color: var(--color-bg);
    min-height: 100dvh;
    box-shadow: 0px 0px 40px rgba(15, 8, 29, 0.08);
    position: relative;
    display: flex;
    flex-direction: column;
    border-left: 4px solid var(--color-navy);
    border-right: 4px solid var(--color-navy);
    box-sizing: border-box;
  }

  /* Candy 3D Elements */
  .candy-card {
    background-color: var(--color-card);
    border: 3px solid var(--color-navy);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 
      inset 3px 3px 0px rgba(255, 255, 255, 1), 
      0px 6px 0px var(--color-navy);
    position: relative;
    cursor: pointer;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .candy-card:active {
    transform: translateY(6px);
    box-shadow: 
      inset 3px 3px 0px rgba(255, 255, 255, 1),
      0px 0px 0px var(--color-navy);
  }

  /* Palette backgrounds */
  .bg-rose { background-color: var(--color-rose); }
  .bg-peach { background-color: var(--color-peach); }
  .bg-lime { background-color: var(--color-lime); }
  .bg-lavender { background-color: #E9D5FF; }

  /* App Headers */
  .app-header {
    background-color: var(--color-yellow);
    border-bottom: 4px solid var(--color-navy);
    padding: 14px 16px;
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

  /* Buttons */
  .btn-candy {
    background-color: var(--color-card);
    border: 3px solid var(--color-navy);
    border-radius: 16px;
    padding: 10px 14px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0px 4px 0px var(--color-navy);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    color: var(--color-navy);
    text-transform: uppercase;
  }

  .btn-candy:active {
    transform: translateY(4px);
    box-shadow: 0px 0px 0px var(--color-navy);
  }

  .btn-candy.primary {
    background-color: var(--color-purple);
    color: white;
    text-shadow: 1px 1px 0px var(--color-navy);
  }

  .btn-candy.accent {
    background-color: var(--color-orange);
    color: white;
    text-shadow: 1px 1px 0px var(--color-navy);
  }

  /* Form Elements */
  .form-group {
    margin-bottom: 14px;
  }

  .form-group label {
    display: block;
    font-family: var(--font-heading);
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-weight: bold;
  }

  .candy-input {
    width: 100%;
    background-color: #FFFFFF;
    border: 2.5px solid var(--color-navy);
    border-radius: 14px;
    padding: 10px 12px;
    font-family: var(--font-body);
    font-size: 13px;
    box-sizing: border-box;
    box-shadow: 0px 3px 0px var(--color-navy);
    color: var(--color-navy);
    transition: background-color 0.2s;
  }

  .candy-input:focus {
    outline: none;
    background-color: #FAF5FF;
  }

  /* Steppers */
  .stepper {
    display: flex;
    align-items: center;
    border: 2.5px solid var(--color-navy);
    border-radius: 12px;
    overflow: hidden;
    width: fit-content;
    box-shadow: 0px 3px 0px var(--color-navy);
    background-color: white;
  }

  .stepper-btn {
    background-color: var(--color-yellow);
    border: none;
    width: 36px;
    height: 36px;
    font-weight: bold;
    cursor: pointer;
    font-size: 18px;
    color: var(--color-navy);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stepper-btn:active {
    background-color: #E2B900;
  }

  .stepper-value {
    width: 44px;
    height: 36px;
    text-align: center;
    border: none;
    border-left: 2.5px solid var(--color-navy);
    border-right: 2.5px solid var(--color-navy);
    font-family: var(--font-mono);
    font-weight: bold;
    font-size: 14px;
    color: var(--color-navy);
  }

  /* Navigation tab bar */
  .nb-tabbar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    height: 76px;
    background-color: var(--color-card);
    border-top: 4px solid var(--color-navy);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 50;
    padding-bottom: 6px;
    box-sizing: border-box;
  }

  .tab-item {
    background: none;
    border: none;
    font-size: 10px;
    font-family: var(--font-heading);
    font-weight: bold;
    color: var(--color-navy);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    text-transform: uppercase;
    padding: 6px 12px;
    border-radius: 12px;
  }

  .tab-item.active {
    background-color: var(--color-yellow);
    border: 2.5px solid var(--color-navy);
    box-shadow: 0px 3px 0px var(--color-navy);
  }

  .tab-item.scan-trigger {
    transform: translateY(-16px);
  }

  .scan-ring {
    background: var(--color-orange);
    color: white;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 3.5px solid var(--color-navy);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 4px 0px var(--color-navy);
    transition: transform 0.1s;
  }

  .scan-ring:active {
    transform: translateY(4px);
    box-shadow: 0px 0px 0px var(--color-navy);
  }

  /* Bounce-pop */
  .bounce-pop {
    animation: brutal-pop 500ms var(--transition-spring);
  }

  @keyframes brutal-pop {
    0% { transform: scale(1); }
    30% { transform: scale(0.6) rotate(-8deg); }
    70% { transform: scale(1.3) rotate(8deg); }
    100% { transform: scale(1) rotate(0); }
  }

  /* Grid of 7 fields */
  .candy-fields-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .field-item {
    background-color: #FFFFFF;
    border: 2.5px solid var(--color-navy);
    border-radius: 16px;
    padding: 8px 10px;
    box-shadow: 0px 3px 0px var(--color-navy);
  }

  .field-item.full-width {
    grid-column: span 2;
  }

  .field-label {
    font-family: var(--font-heading);
    font-size: 9px;
    text-transform: uppercase;
    color: #718096;
    margin-bottom: 2px;
  }

  .field-value {
    font-size: 12px;
    font-weight: 700;
  }

  /* Toast Undo */
  .undo-toast {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%) translateY(150px);
    width: calc(100% - 32px);
    max-width: 448px;
    background-color: var(--color-green);
    color: var(--color-navy);
    border: 3px solid var(--color-navy);
    border-radius: 16px;
    padding: 10px 14px;
    box-shadow: 0px 5px 0px var(--color-navy);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 60;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    font-weight: 700;
    box-sizing: border-box;
  }

  .undo-toast.show {
    transform: translateX(-50%) translateY(0);
  }
  ```

- [ ] **Paso 2: Commit del CSS**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: implement global Cosmic Neon Candy Claymorphism design system"
  ```

---

### Tarea 4: Componentes del Frontend e Inicialización del App.jsx

**Files:**
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/components/Inventory.jsx`
- Create: `frontend/src/components/BatchDetail.jsx`
- Create: `frontend/src/components/BatchCreator.jsx`
- Create: `frontend/src/components/BrewHistory.jsx`

- [ ] **Paso 1: Crear main.jsx**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/main.jsx`.
  
  ```javascript
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App'
  import './index.css'

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  ```

- [ ] **Paso 2: Crear el componente Inventory.jsx (Lobby)**
  
  Escribe `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/components/Inventory.jsx`. Muestra la lista de lotes activos.
  
  ```javascript
  import React from 'react';

  export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
    const cardColors = ['bg-rose', 'bg-peach', 'bg-lime', 'bg-lavender'];

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Mi Congelador
        </h2>

        {batches.length === 0 ? (
          <div className="candy-card card-cream" style={{ textAlign: 'center', padding: '30px' }} onClick={onCreateTrigger}>
            <p style={{ fontWeight: 'bold' }}>¡No tienes cafés guardados!</p>
            <button className="btn-candy primary">Registrar Primer Lote</button>
          </div>
        ) : (
          batches.map((batch, index) => (
            <div 
              key={batch.id} 
              className={`candy-card ${cardColors[index % cardColors.length]}`}
              onClick={() => onSelectBatch(batch.id)}
            >
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">{batch.name}</h3>
                  <p className="card-sub">{batch.producer}</p>
                </div>
                <div className="candy-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" style={{ width: '14px', height: '14px', color: 'var(--color-orange)' }}>
                    <path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/>
                  </svg>
                  <span>{batch.remaining_doses} Dosis</span>
                </div>
              </div>
              <div>
                {batch.altitude && <span className="candy-tag">{batch.altitude}</span>}
                {batch.variety && <span className="candy-tag">{batch.variety}</span>}
                {batch.process && <span className="candy-tag">{batch.process}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  ```

- [ ] **Paso 3: Crear el componente BatchDetail.jsx**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/components/BatchDetail.jsx`. Implementa la lógica de sostener presionado (Hold timer de 800ms) para restar dosis y el recetario de V60.
  
  ```javascript
  import React, { useState, useEffect, useRef } from 'react';

  export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe }) {
    const [batch, setBatch] = useState(null);
    const [holdPct, setHoldPct] = useState(0);
    const [clicks, setClicks] = useState(22);
    const [method, setMethod] = useState('V60 (Filtrado)');
    const [ratio, setRatio] = useState('300g (1:15)');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(5);
    
    const holdTimer = useRef(null);

    useEffect(() => {
      fetch(`/api/batches/${batchId}`)
        .then(res => res.json())
        .then(data => {
          setBatch(data);
        });
    }, [batchId]);

    const startHold = () => {
      setHoldPct(0);
      holdTimer.current = setInterval(() => {
        setHoldPct(prev => {
          if (prev >= 100) {
            clearInterval(holdTimer.current);
            handleDoseDeduction();
            return 0;
          }
          return prev + 10;
        });
      }, 80);
    };

    const endHold = () => {
      clearInterval(holdTimer.current);
      setHoldPct(0);
    };

    const handleDoseDeduction = () => {
      onSubtractDose(batch.id, () => {
        // Refresh details
        setBatch(prev => ({
          ...prev,
          remaining_doses: Math.max(0, prev.remaining_doses - 1)
        }));
      });
    };

    const handleRecipeSubmit = (e) => {
      e.preventDefault();
      onSaveRecipe({
        batch_id: batch.id,
        method,
        ratio,
        grind: `${clicks} clicks`,
        temperature: '93°C',
        brew_time: '2:45 min',
        rating,
        notes
      });
      setNotes('');
    };

    if (!batch) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando detalles...</div>;

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button className="btn-candy" onClick={onBack}>← Volver</button>
          <span className="candy-badge" id="doses-detail-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/></svg>
            <span>{batch.remaining_doses} Dosis</span>
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)' }}>{batch.name}</h2>

        <div className="candy-fields-grid">
          <div class="field-item">
            <div class="field-label">Productor / Finca</div>
            <div class="field-value">{batch.producer}</div>
          </div>
          <div class="field-item">
            <div class="field-label">Tostador</div>
            <div class="field-value">{batch.roaster || 'N/A'}</div>
          </div>
          <div class="field-item">
            <div class="field-label">Altitud</div>
            <div class="field-value">{batch.altitude || 'N/A'}</div>
          </div>
          <div class="field-item">
            <div class="field-label">Varietal</div>
            <div class="field-value">{batch.variety || 'N/A'}</div>
          </div>
          <div class="field-item">
            <div class="field-label">Proceso</div>
            <div class="field-value">{batch.process || 'N/A'}</div>
          </div>
          <div class="field-item">
            <div class="field-label">Gramos</div>
            <div class="field-value">{batch.dose_weight || '20.0g'}</div>
          </div>
          <div class="field-item full-width">
            <div class="field-label">Notas del Tostador</div>
            <div class="field-value" style={{ fontStyle: 'italic' }}>{batch.roaster_notes || 'Sin notas de cata'}</div>
          </div>
        </div>

        {/* Tactile Hold Button Wrapper */}
        <div className="nb-action-wrap">
          <button 
            className="btn-candy" 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '60px', 
              backgroundColor: 'var(--color-orange)', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              border: '3.5px solid var(--color-navy)',
              boxShadow: '0px 6px 0px var(--color-navy)'
            }}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${holdPct}%`, backgroundColor: 'var(--color-green)', transition: 'width 0.1s linear' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 'bold', color: 'white', textShadow: '1.5px 1.5px 0px var(--color-navy)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '22px', height: '22px' }}><path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h15v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 3v2M10 3v2M14 3v2"/></svg>
              <span>Restar Dosis (Mantener)</span>
            </div>
          </button>
        </div>

        {/* Brew Recipe Form */}
        <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '20px' }}>📝 Bitácora de Extracción</h2>
        <div className="candy-card card-cream" style={{ cursor: 'default' }}>
          <form onSubmit={handleRecipeSubmit}>
            <div className="form-group">
              <label>Método</label>
              <select className="candy-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>V60 (Filtrado)</option>
                <option>Espresso</option>
                <option>AeroPress</option>
                <option>Prensa Francesa</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Ratio / Agua</label>
                <input className="candy-input" value={ratio} onChange={(e) => setRatio(e.target.value)} type="text" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Molienda (Clicks)</label>
                <div className="stepper">
                  <button type="button" className="stepper-btn" onClick={() => setClicks(c => Math.max(0, c - 1))}>-</button>
                  <input className="stepper-value" value={clicks} readOnly />
                  <button type="button" className="stepper-btn" onClick={() => setClicks(c => c + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Puntaje (Estrellas)</label>
              <div className="stepper">
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.max(1, r - 1))}>-</button>
                <input className="stepper-value" value={rating} readOnly />
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.min(5, r + 1))}>+</button>
              </div>
            </div>

            <div className="form-group">
              <label>Notas Personales</label>
              <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Excelente acidez a durazno." />
            </div>

            <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
          </form>
        </div>
      </div>
    );
  }
  ```

- [ ] **Paso 4: Crear el componente BatchCreator.jsx**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/components/BatchCreator.jsx`.
  
  ```javascript
  import React, { useState } from 'react';

  export default function BatchCreator({ onBatchCreated, onBack }) {
    const [name, setName] = useState('');
    const [producer, setProducer] = useState('');
    const [altitude, setAltitude] = useState('');
    const [variety, setVariety] = useState('');
    const [process, setProcess] = useState('');
    const [roaster, setRoaster] = useState('');
    const [notes, setNotes] = useState('');
    const [totalDoses, setTotalDoses] = useState(12);
    const [doseWeight, setDoseWeight] = useState('20.0g');
    const [generatedUrl, setGeneratedUrl] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      // Generate safe unique slug ID from name
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const payload = {
        id, name, producer, altitude, variety, process, roaster, roaster_notes: notes, dose_weight: doseWeight, total_doses: totalDoses
      };

      fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Set URL for copying to NFC tag
          const host = window.location.origin;
          setGeneratedUrl(`${host}/batch/${id}`);
          if (onBatchCreated) onBatchCreated();
        }
      });
    };

    const copyUrl = () => {
      navigator.clipboard.writeText(generatedUrl);
      alert('¡Enlace único copiado al portapapeles!');
    };

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button className="btn-candy" onClick={onBack}>✕ Cancelar</button>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Registrar Lote</h2>
        <div className="candy-card card-cream" style={{ cursor: 'default' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Café</label>
              <input className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" />
            </div>
            
            <div className="form-group">
              <label>Productor / Finca</label>
              <input className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Altitud</label>
                <input className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Varietal</label>
                <input className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Proceso</label>
                <input className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico Natural" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tostador</label>
                <input className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" />
              </div>
            </div>

            <div className="form-group">
              <label>Notas de Cata (Tostador)</label>
              <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cantidad de Tubos</label>
                <div className="stepper">
                  <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => Math.max(1, d - 1))}>-</button>
                  <input className="stepper-value" value={totalDoses} readOnly />
                  <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => d + 1)}>+</button>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Gramos por Tubo</label>
                <input className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" />
              </div>
            </div>

            <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '10px' }}>Crear Lote y Obtener Link</button>
          </form>
        </div>

        {generatedUrl && (
          <div className="candy-card card-yellow" style={{ cursor: 'default', marginTop: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', marginTop: 0 }}>Enlace Único de Lote NFC</h3>
            <p style={{ fontSize: '11px', marginTop: 0 }}>Escribe este enlace en tus tags NFC usando la app "NFC Tools":</p>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="candy-input" value={generatedUrl} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', flex: 1 }} />
              <button className="btn-candy primary" style={{ margin: 0 }} onClick={copyUrl}>Copiar</button>
            </div>
            
            <div className="instr-box">
              <strong>Instrucciones NFC Tools:</strong><br />
              1. En NFC Tools, toca <strong>Escribir</strong> > <strong>Añadir un registro</strong> > <strong>URL/URI</strong> y pega el link.<br />
              2. Selecciona <strong>Escribir / Escribir múltiples</strong> y acerca el celular a todos los tubos uno por uno.
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Paso 5: Crear el componente BrewHistory.jsx**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/components/BrewHistory.jsx`.
  
  ```javascript
  import React, { useState, useEffect } from 'react';

  export default function BrewHistory() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
      fetch('/api/recipes')
        .then(res => res.json())
        .then(data => setHistory(data));
    }, []);

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Bitácoras
        </h2>

        {history.length === 0 ? (
          <div className="candy-card card-cream" style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontWeight: 'bold' }}>Aún no has registrado ninguna receta.</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="candy-card card-mint" style={{ borderLeft: '6px solid var(--color-orange)', cursor: 'default' }}>
              <div className="card-header-flex">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: '0 0 2px 0' }}>{item.method}</h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase' }}>{item.batch_name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568' }}>
                  {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '2px 0' }}><strong>Ratio:</strong> {item.ratio || 'N/A'} | <strong>Molienda:</strong> {item.grind || 'N/A'}</p>
                {item.notes && <p style={{ margin: '2px 0', fontStyle: 'italic' }}><strong>Cata:</strong> {item.notes}</p>}
                <p style={{ margin: '4px 0 0 0', color: '#EAB308', fontSize: '14px' }}>
                  {'⭐'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))} ({item.rating || 5}/5)
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  ```

- [ ] **Paso 6: Crear el App.jsx principal**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/frontend/src/App.jsx`. Configura la navegación de pestañas inferiores y la redirección de rutas `/batch/:id` (para que cuando se escanee el NFC, se cargue directamente la ficha del lote).
  
  ```javascript
  import React, { useState, useEffect } from 'react';
  import Inventory from './components/Inventory';
  import BatchDetail from './components/BatchDetail';
  import BatchCreator from './components/BatchCreator';
  import BrewHistory from './components/BrewHistory';

  export default function App() {
    const [currentView, setCurrentView] = useState('inventory');
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);

    // Fetch batches
    const fetchBatches = () => {
      fetch('/api/batches')
        .then(res => res.json())
        .then(data => setBatches(data));
    };

    useEffect(() => {
      fetchBatches();
      
      // Routing check for NFC scanning landing (/batch/:id)
      const path = window.location.pathname;
      if (path.startsWith('/batch/')) {
        const id = path.split('/')[2];
        setSelectedBatchId(id);
        setCurrentView('detail');
      }
    }, []);

    const handleBack = () => {
      // Clear URL
      window.history.pushState({}, '', '/');
      setCurrentView('inventory');
      setSelectedBatchId(null);
      fetchBatches();
    };

    const handleSubtractDose = (id, callback) => {
      fetch(`/api/batches/${id}/doses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change: -1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          callback();
          setLastSubtractedBatch(id);
          setToastMessage('Dosis restada con éxito.');
          setShowToast(true);
          
          // Trigger device vibration
          if (navigator.vibrate) {
            navigator.vibrate([70, 50, 100]);
          }

          // Bounce pop anim
          const badge = document.getElementById('doses-detail-badge');
          if (badge) {
            badge.classList.remove('bounce-pop');
            void badge.offsetWidth;
            badge.classList.add('bounce-pop');
          }
        }
      });
    };

    const handleUndo = () => {
      if (!lastSubtractedBatch) return;
      fetch(`/api/batches/${lastSubtractedBatch}/doses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change: 1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowToast(false);
          // Re-load detail state or reload completely
          if (currentView === 'detail' && selectedBatchId === lastSubtractedBatch) {
            // reload details page triggers state updates automatically
            window.location.reload();
          } else {
            fetchBatches();
          }
        }
      });
    };

    const handleSaveRecipe = (recipePayload) => {
      fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('¡Receta guardada en la bitácora!');
          handleBack();
        }
      });
    };

    const triggerNfcScanSimulate = () => {
      if (batches.length > 0) {
        setSelectedBatchId(batches[0].id);
        setCurrentView('detail');
      } else {
        alert('Por favor, registra un lote primero para simular el escaneo.');
      }
    };

    return (
      <div className="app-container">
        {/* App Bar Brand Header */}
        <header className="app-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '30px', height: '30px', filter: 'drop-shadow(0px 2px 0px var(--color-navy))' }} fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="35" y="10" width="30" height="12" rx="4" fill="#1D4ED8" stroke="#1A365D" strokeWidth="5" />
              <path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="#93C5FD" stroke="#1A365D" strokeWidth="5" />
              <ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="#B45309" stroke="#1A365D" strokeWidth="4" />
              <path d="M48.5 45C50 49 50 59 51.5 63" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" />
              <path d="M43 38a10 10 0 0 1 14 0" stroke="#1A365D" stroke-width="3" stroke-linecap="round" />
              <path d="M37 31a18 18 0 0 1 26 0" stroke="#1A365D" stroke-width="3" stroke-linecap="round" />
            </svg>
            <span>BeanTag</span>
          </h1>
          {currentView === 'inventory' && (
            <button className="app-bar-btn" onClick={() => setCurrentView('creator')}>➕</button>
          )}
        </header>

        {/* View Swapper */}
        <main style={{ flex: 1 }}>
          {currentView === 'inventory' && (
            <Inventory 
              batches={batches} 
              onSelectBatch={(id) => { setSelectedBatchId(id); setCurrentView('detail'); }} 
              onCreateTrigger={() => setCurrentView('creator')}
            />
          )}

          {currentView === 'detail' && (
            <BatchDetail 
              batchId={selectedBatchId} 
              onBack={handleBack}
              onSubtractDose={handleSubtractDose}
              onSaveRecipe={handleSaveRecipe}
            />
          )}

          {currentView === 'creator' && (
            <BatchCreator 
              onBatchCreated={fetchBatches} 
              onBack={handleBack}
            />
          )}

          {currentView === 'history' && (
            <BrewHistory />
          )}
        </main>

        {/* Undo Toast */}
        <div className={`undo-toast ${showToast ? 'show' : ''}`}>
          <span>{toastMessage}</span>
          <button className="undo-btn" onClick={handleUndo}>Deshacer</button>
        </div>

        {/* Tabbar Navigation */}
        <nav className="nb-tabbar">
          <button className={`tab-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => { setCurrentView('inventory'); setSelectedBatchId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/></svg>
            <span>Congelador</span>
          </button>
          
          <button className="tab-item scan-trigger" onClick={triggerNfcScanSimulate}>
            <div className="scan-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 17v.01" stroke-linecap="round"/><path d="M9 9a3 3 0 0 1 6 0"/><path d="M7 7a6 6 0 0 1 10 0"/></svg>
            </div>
          </button>
          
          <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 5h18"/><path d="M4 5l6 14h4l6-14"/><path d="M9 19h6v2H9z"/><path d="M12 5v14" stroke-dasharray="2 2"/></svg>
            <span>Bitácora</span>
          </button>
        </nav>
      </div>
    );
  }
  ```

- [ ] **Paso 7: Commit de componentes del frontend**
  
  ```bash
  git add frontend/src/main.jsx frontend/src/App.jsx frontend/src/components/
  git commit -m "feat: implement React UI components for Inventory, Details, Creator, and History in Candy style"
  ```

---

## Plan de Ejecución y Entrega

Una vez revisado y aprobado el plan, el ejecutor puede correr los pasos de forma secuencial.
Al finalizar, compilará el frontend con `npm run build-frontend` para comprobar que todo se compile y empaquete correctamente en `backend/public`, listo para subir a producción en el VPS.
```
