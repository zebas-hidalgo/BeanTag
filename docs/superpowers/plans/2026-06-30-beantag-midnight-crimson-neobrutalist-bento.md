# Plan de Implementación: Estilo Midnight Crimson (Neo-Brutalist Bento)

Este plan detalla los cambios para rediseñar la identidad visual de la aplicación al estilo **Midnight Crimson (Neo-Brutalist Bento)** y remover el texto "BeanTag" de la cabecera, dejando solo el logo.

---

## 1. Cambios Propuestos

### A. Modificaciones en index.css (frontend/src/index.css)
Actualizar todas las variables y clases visuales al nuevo esquema:
-   `--bg-canvas: #FFF5F5` (Fondo general rosa/rubí pálido).
-   `--bg-card: #FFFFFF` (Tarjetas bento blancas puras).
-   `--color-crimson: #E53E3E` (Acento carmesí principal).
-   `--border-color: #000000` (Bordes rígidos de 2px).
-   `--color-text: #1A0505` (Texto principal carbón rojizo).
-   **Tarjetas Bento (`.candy-card`):** Bordes negros de 2px, esquinas redondeadas de 12px y sombra rígida desplazada (`box-shadow: 4px 4px 0px #000000`). En estado `:active` se desplazan 2px (`transform: translate(2px, 2px)`).
-   **Botones Bento (`.btn-candy`, `.app-bar-btn`):** Bordes de 2px, esquinas redondeadas de 8px y sombra rígida (`box-shadow: 2px 2px 0px #000000`).
-   **Navegación inferior (`.nb-tabbar`):** Pestaña activa en color carmesí.

### B. Modificaciones en App.jsx (frontend/src/App.jsx)
-   **Cabecera:** Remover la etiqueta `<span>BeanTag</span>` dentro del título principal, dejando únicamente el logo SVG.
-   Alinear el logo a la izquierda y mantener los botones `Escaneo` y `Registrar` a la derecha en la cabecera.

### C. Modificaciones en componentes visuales (BatchCreator, BatchDetail, BrewHistory, Inventory)
-   Adaptar los colores, badges y clases de tueste para usar las clases del sistema de bordes Neo-Brutalist.
-   Reemplazar las moliendas, tags y badges monocromos planos por tags de borde rígido `.mono-lbl-tag` o `.nb-tag` consistentes.

---

## 2. Plan de Verificación

1.  Compilar en local con Vite.
2.  Subir y desplegar en el VPS.
3.  Verificar visualmente que la cabecera no tiene texto y que la navegación y las tarjetas lucen el estilo Midnight Crimson con sombras rígidas.
