# Design Spec: Tarjetas a Compartir Renovadas & Selector en Perfil

**Fecha**: 2026-09-10  
**Estado**: Validado con el usuario (Opción C: Todos los estilos)

---

## 1. Contexto y Objetivos

El usuario solicitó dos mejoras clave en la experiencia visual de BeanTag:
1. **Selección del estilo de inventario desde el Perfil (Settings)**:
   Mover la configuración principal de los 3 estilos de tarjetas del inventario (*🏷️ Editorial*, *📋 Lista*, *📐 Archivo*) a la pantalla de Perfil (`Settings.jsx`), permitiendo al usuario establecer su preferencia visual con tarjetas interactivas y previsualización de cada estilo.
2. **Renovación integral de las tarjetas para compartir (`cardGenerator.js`)**:
   Modernizar las imágenes generadas al compartir lotes individuales (recetas/fichas) y la carta completa del congelador, reemplazando el diseño anterior por los **3 nuevos estilos estéticos** de alta definición (Retina 2x):
   - **🏷️ Editorial**: Pasaporte / Ficha nórdica con diseño limpio, notas SCA en pasteles y tipografía editorial.
   - **🧾 Ticket Barista**: Recibo de barra de café de especialidad con parámetros técnicos exactos (micras de molienda, ratio, temperatura) y código de barras nítido.
   - **📐 Archivo Lab**: Ficha técnica de catálogo Tokyo Coffee Lab con código de espécimen, matriz monoespaciada y sello de laboratorio.

---

## 2. Arquitectura de Cambios

### 2.1 Módulo `Settings.jsx` (Pestaña "Perfil")
- **Nueva sección destacada**: `"🎛️ Estilo Visual del Inventario"`.
- **Selector en cuadrícula con 3 tarjetas interactivas**:
  - `🏷️ Editorial (Nordic Atelier)`: Respiro nórdico, chips pastel, stock minimalista.
  - `📋 Lista (Cupertino Table)`: Filas compactas (~52px), pastilla de stock y flecha indicadora.
  - `📐 Archivo (Tokyo Coffee Lab)`: Ficha técnica monoespaciada, código de lote y cuadrícula 2x2.
- **Persistencia**: Guarda directamente en `localStorage.setItem('beantag-inventory-style', style)`.
- **Feedback háptico**: Activa `navigator.vibrate(8)` y notificación toast informativa al cambiar.
- **Sincronización**: `Inventory.jsx` lee este valor y se actualiza reactivamente.

### 2.2 Módulo `cardGenerator.js` (Generador de Imágenes Canvas)
Refactorizar y expandir las funciones generadoras para soportar los 3 estilos:

#### A) `generateRecipeCardImage(recipe, style = 'editorial', incRecipe = true)`
- **Resolución**: Alta definición (840 x 840 px en 1:1 o 840 x 1050 px en formato vertical 4:5 @ 2x Retina para compartir en WhatsApp e Instagram).
- **Estilo `editorial`**:
  - Fondo cálido/nórdico (`#FAF9F6`), bordes hairline y márgenes generosos.
  - Título y finca en tipografía elegante, país con indicador de bandera, chips SCA con colores auténticos.
  - Ficha de receta limpia con método, dosis, ratio y notas de cata.
- **Estilo `ticket` (Ticket Barista 2.0)**:
  - Estética de recibo térmico de cafetería de especialidad con líneas de corte elegantes.
  - Datos de extracción detallados: cálculo automático de micras de molienda (`Femobook`, `Comandante`, `1Zpresso J-Max`), ratio `1:X`, temperatura del agua y tiempo de extracción.
  - Código de barras funcional con hash de lote (`#LOT-XXXX`).
- **Estilo `archive` (Tokyo Lab Specimen)**:
  - Ficha de archivo técnico con cuadrícula monoespaciada (`ORIGIN`, `PROCESS`, `ELEVATION`, `REST_DAYS`, `VARIETY`).
  - Identificador de espécimen (`SPECIMEN #01 // CRYO-PRESERVED`).
  - Sello de laboratorio bermellón y gráfico de balance sensorial.

#### B) `generateCoffeeMenuCardImage(batches, style = 'editorial')`
- Genera la carta de cafés congelados en los mismos 3 estilos coherentes:
  - `editorial`: Carta vertical tipo menú de cafetería de especialidad contemporánea.
  - `ticket`: Recibo de stock con desglose de lotes y tubos.
  - `archive`: Inventario de especímenes de congelador estilo laboratorio técnico.

### 2.3 Modales de Compartir (`BatchDetail.jsx` e `Inventory.jsx`)
- Actualizar los botones selectores de plantilla:
  - Cambiar los botones viejos `[ Craft | Minimal | Dark ]` por los 3 nuevos estilos:
    `[ 🏷️ Editorial ] [ 🧾 Ticket Barista ] [ 📐 Archivo Lab ]`.
- Conectar la generación de imagen directamente al estilo seleccionado.
- Mantener las funciones de Compartir Nativo (`navigator.share`), Descarga PNG y Copia de texto enriquecido.

---

## 3. Plan de Verificación

1. **Pruebas de Componentes**:
   - Abrir pestaña Perfil (`Settings.jsx`), cambiar entre Editorial, Lista y Archivo; comprobar que se guarda en `localStorage` y que el inventario se actualiza en el acto.
2. **Pruebas de Generación de Imagen**:
   - Probar compartir ficha/receta en `BatchDetail.jsx` con los 3 estilos (`editorial`, `ticket`, `archive`) y verificar resolución, textos legibles y renderizado sin cortes.
   - Probar compartir menú en `Inventory.jsx` con los 3 estilos y verificar la lista dinámica de cafés.
   - Probar descarga de PNG y copia de texto en móvil y escritorio.
3. **Build y Despliegue en VPS**:
   - `npm run build` en `frontend/` sin errores de compilación.
   - Despliegue con Zerker en `5.189.152.68`, reinicio de PM2 y prueba en vivo en `https://5.189.152.68.nip.io/beantag/`.
