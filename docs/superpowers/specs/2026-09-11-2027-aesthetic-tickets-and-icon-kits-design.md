# Especificación de Diseño: 4 Estilos de Tickets 2026/2027 y Kits de Íconos para BeanTag

- **Fecha:** 2026-09-11
- **Estado:** Validado por Usuario
- **Tema:** Rediseño estético integral de tarjetas de compartición en Canvas 2D con tendencias de diseño 2026/2027 y kits de activos especializados.

---

## 1. Visión y Objetivo

Elevar la experiencia de compartir recetas individuales y cartas de inventario en BeanTag al nivel de tostadurías de culto y marcas internacionales de café de especialidad de 2026/2027 (Kurasu Tokyo, Sey New York, Onyx Coffee Lab, Tim Wendelboe).

Se reemplazan los estilos planos y genéricos por **4 direcciones de arte premium y distintivas**, respaldadas por una arquitectura de Canvas 2D con bounding boxes dinámicos, márgenes holgados y kits de pictogramas propios que sustituyen por completo los emojis genéricos del sistema.

---

## 2. Los 4 Nuevos Estilos de Tarjetas

### Estilo 1: 📐 Blueprint Técnico (Cianotipia CAD & Patente)
- **Concepto:** Plano de ingeniería arquitectónica y dibujo de patente de cafeto.
- **Fondo:** Azul cianotipia profundo (`#07192F`) con cuadrícula técnica milimétrica al 7% de opacidad (`rgba(56, 189, 248, 0.07)`).
- **Encabezado y Patente:**
  - Título en mayúsculas técnicas con código: `// PATENT DWG: COFFEA ARABICA VAR. HEIRLOOM`.
  - Esquema anatómico vectorial del grano de café con silverskin S-crease, cotas de diámetro (`Ø 8.4mm`) y sello SCA de calidad.
- **Métricas:** 4 cajas de parámetros técnicos (`V60 CONE`, `15g → 225g`, `650 µm`, `02:45 min`) con bordes cian de 1px.
- **Flujo de Vertidos:** Barra gráfica de cotas de infusión dividida en Bloom, Vertido 2 y Vertido 3 con proporciones matemáticas.
- **Pie:** Cajetín de planos de arquitecto con título (`BEANTAG SPECIALTY BREW CAD`), código (`CAD-BT-01`) y sello `PASSED ✓`.

### Estilo 2: ⚡ Neo-Brutalist Pop (Tokyo Streetwear & Onyx)
- **Concepto:** Estilo pop-art contemporáneo de alta energía, inspirado en el diseño de tostadurías de Tokio y Berlín.
- **Fondo:** Blanco tiza (`#FFFFFF`) sobre marco off-white con sombras duras sólidas de `+4px` (`#111827`).
- **Encabezado y Stickers:**
  - Badges pop con esquinas anguladas y bordes negros gruesos (2.5px): `⚡ MICRO-LOTE #042` en Amarillo Lima Ácido (`#E2F952`) y `SCA 89.25 ★` en Naranja Seguridad (`#FF4B26`).
  - Tipografía pesada sans-serif ultra-legible en títulos con alto impacto visual.
- **Bento Grid:** Cajas asimétricas con gutters de 14px reales para Ratio, Dosis y Tiempo.
- **Notas Sensoriales:** Píldoras con sombra pop 3D (`box-shadow: 2px 2px 0 #111827`).
- **Pie:** Código de barras POS auténtico de líneas variables con leyenda `BEANTAG • CERTIFIED ROAST`.

### Estilo 3: 🔮 Holographic Aurora (Apple VisionOS / Dark Glass)
- **Concepto:** Interfaz ultra-moderna de cristal translúcido suspendido en el espacio con resplandor espectral.
- **Fondo:** Negro obsidiana profundo (`#08090E`) con resplandores radiales degradados en amatista (`#8B5CF6`) y zafiro cian (`#06B6D4`).
- **Cristal Frosted Glass:**
  - Baldosas translúcidas con fondo `rgba(255, 255, 255, 0.05)` y borde reflectante sutil `rgba(255, 255, 255, 0.12)`.
  - Orbe de café luminiscente y badge de puntuación SCA en gradiente rosa/violeta.
- **Métricas:** 3 columnas de cristal para Método, Molienda (con micrones calculados) y Agua con temperatura/ppm.
- **Cápsula de Cata:** Barra de cristal con notas descriptivas y badge esmeralda de extracción óptima.

### Estilo 4: 🏷️ Hangtag Nórdico (Atelier Sey / Tim Wendelboe)
- **Concepto:** Cartulina marfil de algodón de tostaduría artesanal con ojal metálico perforado.
- **Fondo:** Cartulina marfil sin blanquear (`#FAF7F2`) con textura sutil de papel artesanal.
- **Ojal Metálico:** Simulación fotorrealista superior con 3 anillos concéntricos (sombra profunda, bisel de acero cepillado y agujero interior).
- **Tipografía Editorial:** Encabezado centrado en serifa de alto contraste con subtítulo espaciado `SPECIALTY ROASTERY ARCHIVE`.
- **Métricas:** Parámetros de receta con ritmo vertical amplio y divisores de lino (`#E7E5E4`).
- **Cita Botánica:** Caja de notas de cata en cursiva editorial inspirada en notas de cuaderno de catador.
- **Pie:** Número de serie y sello de lacre/inspección verde oliva SCA.

---

## 3. Kits de Íconos Personalizados (Sin Emojis Genéricos)

Se destierran los emojis estándar de WhatsApp/Apple de los tickets. Cada tarjeta implementa su propia iconografía nativa:
- **Blueprint CAD:** Grano con cotas de pergamino, gotero V60 cónico en espiral, báscula milimétrica, gota molecular $ con ^{2+}, Mg^{2+}$ y cronómetro técnico.
- **Neo-Brutalist Pop:** Grano con gafas de sol oscuras, gotero pop vertiendo con relámpagos, rayo buzz, medalla estelar y llama de tueste.
- **Aurora Glass:** Grano de cristal iridiscente, gota de agua refractiva, gotero ahumado con vapor, onda espectral de TDS y estrella poligonal.
- **Hangtag Botánico:** Rama botánica de Coffea Arabica con hojas y cerezas maduras, tetera cuello de ganso de cobre, semilla germinando y sello artesanal.

---

## 4. Arquitectura de Renderizado Canvas 2D

### Dimensiones y Resolución
- **Base Canvas:** 840 px (ancho) x 580 px (alto).
- **Escala Retina:** Factor 2x (`1680 x 1160 px`), garantizando legibilidad total en pantallas de alta densidad y redes sociales.
- **Márgenes Perimetrales:** `paddingX = 36px`, `paddingY = 32px` (mínimo intocable).

### Motor de Posicionamiento Dinámico
- Eliminación de `y` fija o números mágicos. Se calcula un cursor vertical `cursorY` que avanza según el tamaño del texto y bounding box de cada elemento:
  ```javascript
  cursorY += titleHeight + spacing;
  ```
- Grillas de métricas calculadas con fórmulas de distribución proporcional:
  ```javascript
  const colWidth = (availableWidth - (gap * (cols - 1))) / cols;
  ```

### Soporte Dual
1. **Ficha de Café / Receta Individual** (`generateRecipeCardImage`): Admite selector `[Con Receta / Solo Grano]` en los 4 estilos.
2. **Carta Completa de Inventario** (`generateCoffeeMenuCardImage`): Renderiza hasta 10 cafés del inventario/congelador en formato lista de lujo en los 4 estilos.

---

## 5. Integración en Componentes React

- **Mapeo de Estilos (`normalizeCardStyle`):**
  - `blueprint` -> Blueprint Técnico
  - `neobrutalist` -> Neo-Brutalist Pop
  - `aurora` -> Holographic Aurora
  - `hangtag` -> Hangtag Nórdico
  - *Compatibilidad con estilos previos:* `receipt`/`craft` -> `blueprint`, `editorial`/`minimal` -> `hangtag`, `archive`/`dark` -> `aurora`, `boarding` -> `neobrutalist`.
- **Botones de Selector en Modales:**
  - `BatchDetail.jsx`: `[ 📐 Blueprint ] [ ⚡ Neo-Pop ] [ 🔮 Aurora ] [ 🏷️ Hangtag ]`
  - `Inventory.jsx`: `[ 📐 Blueprint ] [ ⚡ Neo-Pop ] [ 🔮 Aurora ] [ 🏷️ Hangtag ]`
  - `BrewHistory.jsx`: `[ 📐 Blueprint ] [ ⚡ Neo-Pop ] [ 🔮 Aurora ] [ 🏷️ Hangtag ]`

---

## 6. Plan de Verificación

1. **Compilación Local:** Ejecutar `npm run build` en `frontend/` sin advertencias ni errores.
2. **Pruebas Visuales:** Probar la exportación PNG y Web Share API de los 4 estilos en `BatchDetail`, `Inventory` y `BrewHistory`.
3. **Despliegue y Validación en VPS:** Ejecutar script Zerker hacia servidor de producción (`https://5.189.152.68.nip.io/beantag/`), verificar reinicio de PM2 y estado HTTP 200 OK.
