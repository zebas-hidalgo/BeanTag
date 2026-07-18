# ☕ BeanTag - Calibración y Gestión de Café de Especialidad

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5-8E75C2?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**BeanTag** es una aplicación web progresiva (PWA) de calibración de café de especialidad y control de inventario diseñada para baristas exigentes y entusiastas del café. Fusiona una estética **Neo-Brutalista** vibrante y táctil con herramientas de Inteligencia Artificial para llevar un registro milimétrico de cada extracción y lote de café.

---

## ✨ Características Principales

*   **📦 Gestión de Inventario:** Control total de tus lotes de café (Tostador, Origen, Variedad, Proceso, Altitud, Fecha de tueste, Notas SCA y peso restante).
*   **🧪 Historial de Calibración:** Registro de recetas de extracción detallando método, molienda, ratio, temperatura del agua, tiempo y notas barísticas.
*   **🎨 Sistema de Temas Dinámicos:** Selector visual con 5 temas de fantasía Neo-Brutalistas (*Mocha Rosé, Matcha Tonic, Cyber Geisha, Tueste Dorado, Cold Brew Violet*) que tiñen toda la interfaz y el lienzo de compartido en tiempo real.
*   **🧠 Asistente Barista IA (Gemini):** Integración nativa con la API de `gemini-2.5-flash`. Diseña y autocompleta recetas recomendadas analizando el perfil del grano, el método seleccionado y la dosis exacta en gramos, devolviendo consejos concisos de barista.
*   **📸 Tarjetas de Compartido Canvas:** Generador dinámico de imágenes descargables optimizadas para Instagram, con opciones para compartir:
    *   *Grano + Receta:* Para divulgar la calibración completa y ratio exacto.
    *   *Solo Grano:* Muestra únicamente el perfil del lote de café y monta un sello brutalista de *Specialty Coffee* personalizado con tu tema de color.
*   **📱 Soporte PWA:** Diseñada con manifiesto de aplicación móvil para ser instalada en dispositivos iOS y Android con íconos premium dedicados y experiencia fluida.

---

## 🛠️ Stack Tecnológico

### Frontend
*   **React 18 (Vite)** como SPA de alto rendimiento.
*   **CSS3 Vanilla** para maquetación brutalista y diseño adaptativo libre de sobrecarga de frameworks.
*   **Lucide React** para el catálogo de iconos del sistema.
*   **HTML5 Canvas API** para la renderización de imágenes de recetas dinámicas en tiempo real.

### Backend & Almacenamiento
*   **Node.js & Express** para el servidor API REST.
*   **SQLite3** como motor de base de datos ligero, rápido y local.
*   **Google Gemini API (`gemini-2.5-flash`)** para el procesamiento inteligente de recetas.

---

## ⚙️ Instalación y Configuración Local

### Prerrequisitos
*   Node.js (versión 16 o superior)
*   npm

### 1. Clonar el Repositorio
```bash
git clone https://github.com/zebas-hidalgo/BeanTag.git
cd BeanTag
```

### 2. Instalar Dependencias
Instala las dependencias en la raíz del proyecto (que utiliza `concurrently` para orquestar ambos entornos):
```bash
npm install
```

También puedes instalar por separado si lo deseas:
```bash
# En el frontend
cd frontend && npm install

# En el backend
cd ../backend && npm install
```

### 3. Configurar Variables de Entorno (Opcional)
Crea un archivo `.env` en la carpeta `backend` si requieres configuraciones específicas de puerto:
```env
PORT=5000
```
*Nota: Tu clave API de Gemini se almacena de forma segura de manera local en el navegador (`localStorage`) a través de la interfaz de Ajustes de la aplicación, por lo que no es necesario configurarla en las variables del servidor.*

### 4. Iniciar en Desarrollo
Ejecuta el siguiente comando en la raíz del proyecto para levantar el servidor backend y el servidor de desarrollo Vite del frontend simultáneamente:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173` y el backend en `http://localhost:5000`.

---

## 🚀 Despliegue en Producción (VPS)

La aplicación incluye un script automatizado `deploy.sh` que compila el frontend, lo empaqueta y lo despliega a tu servidor VPS mediante SSH, reiniciando el proceso del servidor backend administrado por PM2:

```bash
./deploy.sh
```

---

## 🛡️ Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para obtener más detalles.

---

*Desarrollado con pasión para los amantes del café de especialidad. ☕ BeanTag APP.*
