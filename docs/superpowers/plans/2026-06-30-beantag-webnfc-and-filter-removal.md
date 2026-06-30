# Plan de Implementación: Lectura Web NFC y Remoción de Filtros

Este plan detalla cómo integrar soporte de lectura de tags NFC nativa en navegadores compatibles (Web NFC API) y la remoción de la barra de filtros de tueste.

---

## 1. Cambios Propuestos

### A. Eliminar Barra de Filtros
-   **Archivo:** `frontend/src/components/Inventory.jsx`
-   **Cambio:** Quitar el div `.filter-toolbar` y el estado `roastFilter`. Solo quedará el buscador por texto (`searchQuery`) para mantener el inventario al máximo de simplicidad minimalista.

### B. Integrar Lectura Web NFC Directa en la App
-   **Archivo:** `frontend/src/App.jsx`
-   **Cambio:** Actualizar la función `triggerNfcScanSimulate` para que sea `handleNfcScan`.
    *   Si el navegador soporta `NDEFReader` (Chrome en Android, etc.), iniciará una sesión de lectura NFC nativa en segundo plano. Al aproximar un tag con una URL de lote de BeanTag, el componente parseará el ID y navegará automáticamente a la vista de detalles de dicho café.
    *   Si el navegador no lo soporta (como iOS Safari), mostrará un modal/alerta informativa indicando que en iOS los tags se leen automáticamente desde la pantalla de inicio o que requiere un navegador compatible.

---

## 2. Código de Lectura Web NFC en App.jsx

```javascript
  const handleNfcScan = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        alert('Lector NFC activado. Acerca el tag al reverso de tu teléfono...');
        ndef.onreading = (event) => {
          const message = event.message;
          for (const record of message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              const url = decoder.decode(record.data);
              // Extraer ID de la URL: http://.../batch/id
              const parts = url.split('/batch/');
              if (parts.length > 1) {
                const batchId = parts[1].trim();
                setSelectedBatchId(batchId);
                setCurrentView('detail');
                alert(`¡Café detectado: ${batchId}!`);
              }
            }
          }
        };
      } catch (error) {
        alert('Error al escanear NFC: ' + error.message);
      }
    } else {
      alert('Tu navegador o dispositivo no soporta escaneo NFC directo (Web NFC). \n\n• Si usas Android: Abre la app en Chrome.\n• Si usas iPhone: iOS no permite lectura NFC web directa por seguridad. Solo acerca el tag a tu iPhone desde la pantalla de inicio y se abrirá automáticamente.');
    }
  };
```

---

## 3. Plan de Verificación

1.  Probar la compilación Vite en local.
2.  Desplegar en el VPS.
3.  Verificar que al tocar "Escaneo" en Chrome para Android se solicita permiso para acceder al lector NFC.
