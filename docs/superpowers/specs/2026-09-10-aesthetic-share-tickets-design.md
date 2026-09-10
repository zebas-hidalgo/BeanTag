# Design Spec: 4 Estilos Estéticos de Tickets para Compartir (BeanTag)

**Fecha**: 2026-09-10  
**Estado**: Validado con el usuario (Aplicar los 4 estilos)

---

## 1. Visión y Objetivos

Elevar la calidad visual y estética de los tickets generados al compartir cafés o recetas desde BeanTag, ofreciendo 4 estilos temáticos diferenciados que lucen espectaculares en redes sociales (WhatsApp, Instagram, Telegram) y que celebran la cultura del café de especialidad:

1. **🧾 Recibo Térmico (Tokyo Kissaten / Barista Receipt)**:
   - Estética auténtica de cafetería de Tokio con líneas punteadas, desglose tipo comanda, sello circular rojo *Hanko* de cata y código de barras.
2. **🏷️ Pasaporte Editorial (Nordic Atelier)**:
   - Estética de publicación escandinava (*Standart / Kinfolk*): tipografía serena de lujo silencioso, gráfico de balance de taza visual con puntos (`●●●●○`) y bloques limpios de receta.
3. **🎫 Tarjeta de Embarque (Coffee Boarding Pass)**:
   - Estilo billete aéreo de expedición de origen a la cava (`HUI ➔ CAV`), códigos de vuelo/lote y cupón recortable.
4. **🌑 Cyber Tokyo Lab (OLED Dark Mode)**:
   - Ficha técnica de laboratorio nocturno en negro puro (`#0D0F14`), acento lateral bermellón (`#E06C60`), matriz técnica monoespaciada y hash criptográfico.

---

## 2. Arquitectura y Renderizado en Canvas (`cardGenerator.js`)

Las tarjetas se dibujan usando Canvas 2D en alta resolución Retina 2x (ancho base 840 px, alto 580 px; renderizado a 1680x1160 px):

### 2.1 Estilo 1: `receipt` (Tokyo Kissaten)
- **Fondo**: Papel térmico cálido `#FAF8F5` con borde `#E5DFD5`.
- **Borde superior e inferior**: Perforación/corte de ticket.
- **Sello rojo Hanko**: Círculo inclinado 12° con tipografía en vermilion (`BEANTAG // SPECIALTY 88+ // VERIFIED`).
- **Líneas de comanda**: Parámetros de extracción en pares clave/valor con líneas punteadas (`MÉTODO: V60`, `RATIO: 1:15`, `MOLIENDA: 450 µm`, `TEMP: 93°C`).
- **Código de barras POS**: Renderizado de barras verticales auténticas con hash del lote.

### 2.2 Estilo 2: `editorial` (Nordic Atelier)
- **Fondo**: Marfil / avena cálido `#FDFCFA` con bordes redondeados (18px) y marco hairline `#EBE5DC`.
- **Cabecera**: `ATELIER PASSPORT // N° 024` con respiro tipográfico.
- **Gráfico de Balance**: 3 barras visuales con círculos rellenos para representar Acidez (`●●●●○`), Dulzor (`●●●●●`) y Cuerpo (`●●●○○`).
- **Matriz de Receta**: 4 bloques limpios blancos con método, dosis, ratio y molienda.
- **Pie de página**: Minimalista `BEANTAG.APP • COLD STORAGE ATELIER`.

### 2.3 Estilo 3: `boarding` (Coffee Boarding Pass)
- **Fondo**: Blanco nítido con detalles en azul tinta `#0F172A` y acento rojo carmín `#C53030`.
- **Ruta de Expedición**: De Finca a Cava con códigos tipo aeropuerto (p. ej. `HUI ➔ CAV`).
- **Bloque de Pasajero/Barista**: Dosis, ratio, molienda y temperatura en formato de billete aéreo.
- **Cupón de embarque perforado**: Línea divisoria gruesa con indicación de puerta `GATE: V60 [APPROVED]`.

### 2.4 Estilo 4: `archive` (Cyber Tokyo Lab)
- **Fondo**: Negro profundo OLED `#0D0F14` con borde gris titanio `#272C36`.
- **Franja lateral**: Acento bermellón brillante `#E06C60` en el lateral izquierdo.
- **Matriz de laboratorio 2x2**: `ORIGIN_ID`, `PROCESS_CODE`, `GRIND_TARGET` y `EXTRACTION`.
- **Etiquetas y hash**: Bloque de notas con prefijo `FLAVOR_TAGS` y código hash criptográfico.

---

## 3. Integración en la Interfaz de Usuario

### 3.1 Modales de Compartir (`BatchDetail.jsx`, `Inventory.jsx`, `BrewHistory.jsx`)
- Selector de estilo con los 4 botones claros:
  `[ 🧾 Recibo ] [ 🏷️ Editorial ] [ 🎫 Boarding Pass ] [ 🌑 Cyber Lab ]`
- Cada clic genera instantáneamente la vista previa correspondiente.
- El usuario puede compartir nativamente (`navigator.share`), descargar el PNG o copiar la ficha en texto.

---

## 4. Plan de Verificación

1. **Pruebas de Canvas**:
   - Comprobar que los 4 estilos renderizan sin errores de contexto 2D.
   - Verificar legibilidad de fuentes, alineación de sellos y códigos de barras en Retina 2x.
2. **Build y Despliegue**:
   - `npm run build` en local.
   - Push a `main` y despliegue en VPS con Zerker (`pm2 restart beantag`).
   - Verificación visual en vivo en `https://5.189.152.68.nip.io/beantag/`.
