# Especificación de Diseño: Dial-In Helper J-Max y Escritura NFC Activa

Diseño técnico para la implementación del Asistente de Calibración de Molienda (Dial-In Helper) adaptado al molino 1Zpresso J-Max y la integración activa de escritura NFC en BeanTag.

---

## 1. Objetivos

*   **Dial-In Helper J-Max:** Proveer una calculadora interactiva que analice el sabor de la extracción anterior y la desviación de tiempo de flujo para sugerir el número exacto de clics (y rotación/nomenclatura final) en un molino J-Max, con opción de precarga inmediata en una nueva receta.
*   **Escritura NFC Activa:** Mejorar la experiencia NFC con escritura nativa Web NFC (`NDEFReader`) bajo HTTPS/localhost, y añadir botones interactivos de copiado rápido y códigos QR cuando el entorno sea HTTP (IP directa del VPS).
*   **Corrección de Enrutamiento por Subruta:** Resolver la detección de rutas dinámicas de lotes (`/batch/:id`) y el historial del navegador (`pushState`) para que funcionen de forma nativa bajo el subdirectorio `/beantag/`.

---

## 2. Cambios Propuestos

### Componente Frontend: `App.jsx`
*   **Enrutamiento Relativo:** Modificar el `useEffect` de inicio para remover el prefijo del subdirectorio base de la URL (`import.meta.env.BASE_URL`) antes de analizar si la ruta coincide con `/batch/:id`.
*   **Historial de Navegación (`pushState`):** Cambiar los llamados de `window.history.pushState` para que utilicen `import.meta.env.BASE_URL` en lugar de una barra diagonal fija `/` al volver a la vista de inventario.

### Componente Frontend: `BatchDetail.jsx`
*   **Formulario del Dial-In Helper:**
    *   Dropdown para seleccionar la receta anterior base (por defecto la más reciente).
    *   Botones de selección de perfil de sabor: Ácido (Sub-extraído) y Amargo (Sobre-extraído).
    *   Casilla *"Ajustar por Tiempo"* con inputs de Tiempo Objetivo (s) y Tiempo Real (s).
    *   Lógica de Clics:
        *   Ácido: `-4 clics` base. Si hay desviación de tiempo, `-1 clic` extra por cada 2s de diferencia (hasta `-10 clics`).
        *   Amargo: `+4 clics` base. Si hay desviación de tiempo, `+1 clic` extra por cada 2s de diferencia (hasta `+10 clics`).
    *   Conversión matemática bidireccional a formato `Rotación.Número.Clic` del J-Max (1 rotación = 90 clics, 1 número = 10 clics).
    *   Botón *"Aplicar y Preparar"* que pre-llena los estados de la nueva receta (molido) y enfoca/desplaza la vista al formulario de extracción.
*   **Módulo de Grabado/Copiado NFC:**
    *   Detección nativa del soporte NFC (`'NDEFReader' in window`) y el protocolo seguro (`https:`).
    *   Si es compatible: Botón *"Vincular Tag NFC"* que abre un modal con animación de radar de escaneo y realiza la escritura.
    *   Si no es compatible: Mostrar URL de vinculación dinámica completa con botón *"Copiar Enlace"* y botón *"Mostrar QR"* que renderice un código QR dinámico de la ruta.

### Componente Frontend: `BatchCreator.jsx`
*   **Vinculación Rápida NFC:**
    *   Al guardar un lote con éxito, mostrar un banner o sección interactiva *"Vincular Tag NFC Ahora"* que permita escribir o copiar la URL del nuevo lote de forma inmediata.

---

## 3. Plan de Verificación

### Pruebas Manuales
1.  **Enrutamiento bajo Subruta:**
    *   Navegar a `http://5.189.152.68/beantag/batch/<id>` y certificar que la aplicación carga directamente en la vista de detalle del lote y que volver atrás nos lleva a `http://5.189.152.68/beantag/`.
2.  **Cálculos del Dial-In Helper:**
    *   Ingresar molienda base `J-Max: 1.5.8`. Seleccionar sabor "Amargo/Lento" y diferencia de tiempo que añada `+4 clics`. Verificar que la sugerencia calculada sea exactamente `J-Max: 1.6.2`.
    *   Presionar *"Aplicar"* y certificar que el valor del formulario se actualiza y la vista hace scroll al formulario.
3.  **Funciones NFC:**
    *   En HTTP: Verificar que se muestra el botón de copiado rápido, el banner de aclaración de HTTPS y el código QR.
    *   En localhost/HTTPS: Verificar que el botón de escritura de etiquetas NFC funciona, abre la animación de escaneo y escribe la URL formateada correctamente.
