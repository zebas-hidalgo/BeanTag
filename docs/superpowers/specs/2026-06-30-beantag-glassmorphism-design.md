# Especificación de Diseño: BeanTag Glassmorphism Premium

Especificación de la identidad visual de Glassmorphism Premium para la aplicación móvil-first BeanTag.

---

## 1. Dirección Estética: Glassmorphism Premium

El diseño emula placas de vidrio esmerilado translúcido flotando sobre un fondo de gradiente de color dinámico de alta saturación (Mesh Gradient).

### Paleta de Colores de Fondo (Aurora Gradient):
*   **Fondo del App-Container:** Gradiente fluido lineal de tres paradas:
    ```css
    background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #311042 100%);
    ```
    *(Un fondo azul marino oscuro abisal combinado con tintes violeta profundo para que el contraste con el vidrio blanco translúcido sea premium y legible).*
*   **Color de Texto:** Blanco Puro (`#FFFFFF`) para títulos principales, y Gris Hielo Pálido (`#E2E8F0` / `#94A3B8`) para subtítulos e indicaciones secundarias.

---

## 2. Definición de Componentes Visuales en CSS

### A. Tarjetas de Vidrio (`.candy-card`)
*   **Fondo:** `rgba(255, 255, 255, 0.08)` (muy translúcido para fundirse con el fondo).
*   **Desenfoque de Fondo:** `backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`
*   **Bordes:** `1px solid rgba(255, 255, 255, 0.15)` (un reflejo de luz brillante en el borde).
*   **Sombras:**
    ```css
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    ```
*   **Efecto Táctil (:active):** Se reduce a `scale(0.97)` y aumenta su opacidad a `rgba(255, 255, 255, 0.15)` con un desenfoque mayor.

### B. Elementos de Formulario e Inputs (`.candy-input`)
*   **Estilo:** Sunken Glass (vidrio hundido).
*   **Fondo:** `rgba(0, 0, 0, 0.2)`
*   **Bordes:** `1px solid rgba(255, 255, 255, 0.1)`
*   **Sombras:** `box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);`
*   **En Foco:** `background: rgba(0, 0, 0, 0.1); border: 1px solid rgba(139, 92, 246, 0.4);`

### C. Botones de Vidrio (`.btn-candy`)
*   **Botón Estándar:** `background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white;`
*   **Botón Primario (Purple Aurora):**
    ```css
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(124, 58, 237, 0.8));
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    ```
*   **Botón Acceso/Alerta (Orange Sunset):**
    ```css
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.6), rgba(234, 88, 12, 0.8));
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
    ```

### D. Menú de Navegación Flotante (`.nb-tabbar`)
*   **Diseño:** Barra flotante de vidrio esmerilado suspendida:
    ```css
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
    ```
*   **Tab Items:** Los ítems inactivos tienen color de texto `#94A3B8`. El ítem activo se resalta con `background: rgba(255, 255, 255, 0.1); color: #C084FC;`.

---

## 3. Control de Contenedores y Seguridad de Sangrado

*   El `.app-container` tendrá `overflow-y: auto; overflow-x: hidden;` para asegurar la contención rígida de las tarjetas difusas.
*   Se eliminan todos los rellenos y márgenes que puedan causar que los efectos de sombra difusa traspasen el marco de visualización móvil.

---

## 4. Plan de Verificación

*   Compilación completa en Vite local.
*   Verificación en la URL pública del VPS para asegurar legibilidad bajo luz solar (el vidrio oscuro abisal con letras blancas mantiene un contraste superior a 4.5:1 WCAG).
