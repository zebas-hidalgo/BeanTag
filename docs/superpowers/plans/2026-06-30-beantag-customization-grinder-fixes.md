# BeanTag: Ajustes de Molino, Alineación de Tabbar y Mejoras Cafeteras

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el formateador de molienda 1zpresso J-Max (Rotación.Número.Click), corregir la alineación del menú inferior (Tabbar) y añadir mejoras de extracción cafetera avanzada (Ratio dinámico y tiempo) junto al script de auto-despliegue (`deploy.sh`) al VPS.

**Architecture:** Modificaciones en el frontend React (App, BatchDetail y CSS) y adición de script bash/expect local.

---

## Estructura de Archivos Modificados

*   `frontend/src/index.css` (Alineación rígida de columnas del Tabbar a 33.33%)
*   `frontend/src/components/BatchDetail.jsx` (Lógica de molienda J-Max de 3 steppers, cálculo de ratio en tiempo real)
*   `frontend/src/components/BrewHistory.jsx` (Visualización de molienda J-Max y parámetros adicionales)
*   `deploy.sh` (Script local para sincronización y despliegue rápido en VPS)

---

## Tareas de Implementación

### Tarea 1: Corrección de Alineación del Tabbar Inferior

**Files:**
- Modify: `frontend/src/index.css:291-314`

- [ ] **Paso 1: Aplicar alineación de tres columnas equitativas**
  
  Modifica `frontend/src/index.css` para forzar que cada ítem del menú ocupe exactamente un tercio del ancho disponible (`flex: 1`), bloqueando el botón de escaneo al centro absoluto sin importar el texto de los lados.
  
  ```css
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
    justify-content: space-between; /* Cambio de space-around a space-between */
    align-items: center;
    z-index: 50;
    padding-bottom: 6px;
    box-sizing: border-box;
  }

  .tab-item {
    flex: 1; /* Forzar 33.33% de ancho por columna */
    text-align: center;
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
    padding: 6px 0;
  }
  ```

---

### Tarea 2: Implementar Selector de Molienda 1zpresso J-Max (R.N.C)

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/BrewHistory.jsx`

- [ ] **Paso 1: Modificar interfaz de molienda en la bitácora de extracción**
  
  Reemplazar el stepper único de clicks por un selector especializado para el molino 1zpresso J-Max, utilizando tres steppers independientes:
  - **Rotaciones (R):** 0 a 4
  - **Número en dial (N):** 0 a 8
  - **Clicks adicionales (C):** 0 a 9
  
  Modifica la lógica del formulario en `BatchDetail.jsx` para almacenar el formato concatenado `R.N.C` (ej. `1.4.5` clicks) en el campo `grind` enviado a la base de datos.
  
  Código de los steppers en `BatchDetail.jsx`:
  ```javascript
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);

  // Al enviar el formulario se guarda como:
  const grindString = `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`;
  ```

---

### Tarea 3: Calculadora de Ratio y Parámetros Cafeteros Pro

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Paso 1: Agregar cálculo de ratio en vivo y tiempo de extracción**
  
  - Mostrar dinámicamente el ratio calculado (ej. `1:15` si se usan 20g de café y 300g de agua) al digitar el campo de ratio en la bitácora.
  - Añadir el campo de **Tiempo de Extracción** (stepper de segundos, ej. 150 segundos / 2:30 min) para medir la velocidad de caída.

---

### Tarea 4: Script Local de Auto-Despliegue (`deploy.sh`)

**Files:**
- Create: `deploy.sh`

- [ ] **Paso 1: Crear script local de sincronización expect**
  
  Escribe el archivo `/Users/zebas/Desktop/Proyecto_cafe/deploy.sh` para empaquetar, subir y reiniciar los servicios en tu VPS con un solo comando.
  
  ```bash
  #!/usr/bin/expect -f
  set timeout 300
  
  # 1. Comprimir en local
  exec tar --exclude="node_modules" --exclude=".git" --exclude="frontend/node_modules" --exclude="backend/node_modules" -czf /tmp/beantag_update.tar.gz -C /Users/zebas/Desktop/Proyecto_cafe .
  
  # 2. Subir archivo
  spawn scp -o StrictHostKeyChecking=no /tmp/beantag_update.tar.gz root@5.189.152.68:/root/beantag_update.tar.gz
  expect {
      "*password:" {
          send "261226Kz\r"
          exp_continue
      }
      eof
  }
  
  # 3. Extraer y compilar en VPS
  spawn ssh -o StrictHostKeyChecking=no root@5.189.152.68 "tar -xzf /root/beantag_update.tar.gz -C /var/www/beantag && cd /var/www/beantag && npm run build-frontend && pm2 restart beantag"
  expect {
      "*password:" {
          send "261226Kz\r"
          exp_continue
      }
      eof
  }
  
  puts "=== ¡Actualización subida y desplegada en tu VPS! ==="
  ```

- [ ] **Paso 2: Hacer ejecutable**
  
  Run: `chmod +x deploy.sh`
  Expected: Permisos actualizados.
