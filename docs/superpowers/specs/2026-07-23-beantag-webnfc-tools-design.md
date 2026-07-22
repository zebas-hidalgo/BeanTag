# Especificación de Diseño: Sub-proyecto B - Hub de Herramientas Avanzadas WebNFC

Este documento especifica el diseño y la arquitectura del Hub Central de Herramientas WebNFC para BeanTag, permitiendo diagnóstico, formateo/limpieza de etiquetas y duplicación de lotes en serie.

---

## 🎨 Componentes y UI

### 1. `NfcToolsModal.jsx`
* **Ubicación**: `beantag/frontend/src/components/NfcToolsModal.jsx`
* **Conexiones**: Invocado desde `Settings.jsx` y desde la barra superior de navegación en `App.jsx`.

### 2. Secciones del Modal
1. **Estado del Lector Hardware**:
   * Detección de `'NDEFReader' in window`.
   * Banner verde cuando está disponible (Chrome Android) o banner informativo cuando se encuentra en Safari/escritorio.
2. **Acciones Rápidas**:
   * **Diagnosticar Tag**: Lee los datos RAW grabados en el chip y muestra el identificador de lote o URL almacenada.
   * **Formatear / Limpiar Tag**: Sobreescribe la etiqueta con una URL neutra `https://beantag.cafe/empty`.
   * **Clonar en Serie**: Selector desplegable con los lotes del inventario para vincular rápidamente múltiples frascos o tubos.
3. **Panel de Información del Tag**:
   * Visualización tipo consola monoespaciada `JetBrains Mono` con la última etiqueta inspeccionada.

---

## ⚡ Lógica de Operaciones WebNFC

```javascript
// Diagnóstico RAW
const ndef = new window.NDEFReader();
await ndef.scan();
ndef.onreading = (event) => {
  const records = event.message.records;
  // Parse url and text data
};

// Formateo / Limpieza
await ndef.write({
  records: [{ recordType: 'url', data: 'https://beantag.cafe/empty' }]
});

// Clonación
await ndef.write({
  records: [{ recordType: 'url', data: `https://beantag.cafe/batch/${selectedBatchId}` }]
});
```

---

## 🧪 Plan de Verificación

1. **Prueba de Apertura**: Abrir y cerrar el modal desde Ajustes (`Settings.jsx`) y el botón NFC de navegación.
2. **Prueba de Modos**: Cambiar entre Diagnóstico, Formatear y Clonar verificando que los estados cambian correctamente.
3. **Fallback en Escritorio**: Verificar que en navegadores sin soporte WebNFC se muestra un mensaje informativo sin causar fallos.
4. **Verificación de Build**: Ejecutar `npm run build` en `beantag/frontend` para garantizar la validez del código.
