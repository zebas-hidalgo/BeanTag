# ☕ BeanTag - Calibración y Gestión de Café de Especialidad

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5-8E75C2?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Web NFC](https://img.shields.io/badge/Hardware-Web%20NFC%20%2B%20QR-FF6F00?style=for-the-badge&logo=nfc)](https://w3c.github.io/webnfc/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**BeanTag** es una aplicación web progresiva (PWA) de calibración de café de especialidad, control de inventario y gestión de extracciones diseñada para baristas exigentes y entusiastas del café. Fusiona una estética **Neo-Brutalista** vibrante con herramientas de Inteligencia Artificial, tecnologías NFC/QR y asistentes de molienda de precisión para llevar un registro milimétrico de cada extracción y lote de café.

---

## ✨ Características Principales

* **📦 Gestión de Inventario:** Control detallado de lotes de café (Tostador, Origen, Variedad, Proceso, Altitud, Fecha de tueste, Clasificación de notas SCA y peso restante en gramos).
* **📱 Integración Web NFC & Códigos QR:** Vinculación instantánea de etiquetas NFC físicas (Web NFC API) a cada lote de café. Permite escanear tags desde el smartphone para abrir directamente la ficha del grano, con opción de códigos QR de respaldo.
* **⚙️ Asistente de Dial-In (1Zpresso J-Max):** Calculadora e interfaz gráfica interactiva paso a paso para ajustar moliendas de precisión (clics, vueltas completas y espectro de partículas según el método de extracción).
* **🧠 Asistente Barista IA (Google Gemini):** Integración nativa con la API de `gemini-2.5-flash`. Analiza el perfil del grano, el método seleccionado y la dosis exacta para autocompletar y recomendar recetas de extracción optimizadas.
* **🧾 Tarjetas de Compartido Canvas (Ticket POS & Diseños HD):** Generador de imágenes descargables en tiempo real con la API de HTML5 Canvas:
  * **Ticket de Barista (POS Register):** Maquetación estilo recibo de caja vintage con textura de papel arrugado, tabla ítemizada de parámetros (Origen, Proceso, Ratio, Dosis, Tiempo) y sello brutalista SCA.
  * **Estilo Editorial & Earth:** Diseños verticales estilizados con iconos vectoriales de notas de cata y paleta de colores adaptable.
  * **Solo Grano:** Ficha técnica compacta del perfil del lote.
* **🎨 Sistema de 5 Temas de Fantasía Neo-Brutalistas:** Selector dinámico y persistente con 5 paletas de color (*Mocha Rosé, Matcha Tonic, Cyber Geisha, Tueste Dorado, Cold Brew Violet*) que tiñen la interfaz y el renderizado del lienzo.
* **📱 Soporte PWA & Subruta `/beantag/`:** Instalable en dispositivos iOS/Android como aplicación web nativa con soporte completo para navegación en subrutas de servidores web.

---

## 🛠️ Stack Tecnológico

### Frontend
* **React 18 (Vite)** como SPA de alto rendimiento y renderizado rápido.
* **CSS3 Vanilla** para maquetación Neo-Brutalista adaptativa y animaciones fluídas sin sobrecarga de librerías externas.
* **Lucide React** para la iconografía del sistema.
* **HTML5 Canvas API** para la generación dinámica de tarjetas de compartido en alta resolución.
* **Web NFC API** para lectura y escritura directa de etiquetas NFC físicas desde navegadores compatibles.

### Backend & Almacenamiento
* **Node.js & Express** para la API REST del servidor.
* **SQLite3** como base de datos ligera, confiable y de alta velocidad.
* **Google Gemini API (`gemini-2.5-flash`)** para el motor de recomendación inteligente de barismo.

---

## ⚙️ Instalación y Configuración Local

### Prerrequisitos
* Node.js (versión 16 o superior)
* npm

### 1. Clonar el Repositorio
```bash
git clone https://github.com/zebas-hidalgo/BeanTag.git
cd BeanTag
```

### 2. Instalar Dependencias
Instala las dependencias en la raíz del proyecto (utiliza `concurrently` para ejecutar frontend y backend en simultáneo):
```bash
npm install
```

O si prefieres instalarlas manualmente por separado:
```bash
# En el frontend
cd frontend && npm install

# En el backend
cd ../backend && npm install
```

### 3. Configurar Variables de Entorno (Opcional)
Puedes crear un archivo `.env` en la carpeta `backend` para modificar el puerto del servidor:
```env
PORT=5000
```
*Nota: La clave API de Gemini se configura y almacena localmente de forma segura en el navegador (`localStorage`) a través del panel de Ajustes.*

### 4. Iniciar en Entorno de Desarrollo
Ejecuta en la raíz del proyecto:
```bash
npm run dev
```

- **Frontend (Vite):** `http://localhost:5173`
- **Backend (Express):** `http://localhost:5000`

---

## 🚀 Despliegue en Producción (VPS)

El proyecto incluye el script `deploy.sh` para empaquetar, subir e implementar automáticamente las actualizaciones a un servidor VPS con Nginx y PM2:

```bash
./deploy.sh
```

---

## 🛡️ Licencia

Este proyecto está liberado bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

*Desarrollado con pasión para la comunidad del café de especialidad. ☕ BeanTag APP.*
