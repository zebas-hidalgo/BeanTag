# Especificación de Diseño: Sugerencia de Molienda J-Max y Receta Paso a Paso por IA

**Fecha:** 18 de Julio, 2026  
**Estado:** ✅ Aprobado por el usuario  
**Enfoque seleccionado:** Enfoque A (Persistencia JSON Estructurada en SQLite y UI React Interactiva)

---

## 1. Objetivos y Alcance
Esta especificación define la integración de la IA de Gemini para proporcionar:
1. Ajuste numérico exacto para el molino 1Zpresso J-Max (Rotaciones, Números, Clicks) aplicado de forma interactiva en la interfaz.
2. Instrucciones de preparación paso a paso personalizadas según el gramaje y el método elegido.
3. Persistencia completa de estas recetas en la base de datos local y su inclusión en las copias de seguridad.

---

## 2. Base de Datos (SQLite)
Añadiremos dos columnas a la tabla `recipes` en `/var/www/beantag/backend/database.js`:
* `recipe_steps` (TEXT): Almacena un array JSON de strings con las instrucciones.
* `grind_jmax` (TEXT): Almacena un objeto JSON con los ajustes exactos del dial `{ rot, num, click }`.

La base de datos ejecutará estas migraciones de forma segura:
```sql
ALTER TABLE recipes ADD COLUMN recipe_steps TEXT;
ALTER TABLE recipes ADD COLUMN grind_jmax TEXT;
```

---

## 3. Cambios en Backend (API Node.js)
* **`/api/recommend-recipe`**:
  Actualiza el prompt de Gemini para requerir los campos `grind_jmax` (objeto con `rot`, `num`, `click`) y `steps` (array de strings con los pasos de preparación).
* **`/api/recipes` (POST)**:
  Soporta recibir `recipe_steps` y `grind_jmax` y los inserta en la base de datos.
* **`/api/export/json` y `/api/import/json`**:
  Actualizados para incluir de forma nativa la importación/exportación de `recipe_steps` y `grind_jmax`.

---

## 4. Cambios en Frontend (React)
* **`RecipeForm.jsx`**:
  - Renderiza los pasos de la IA en una caja de texto Neo-Brutalista.
  - Al hacer clic en "Aplicar al Formulario", se actualizan los estados locales de los selectores de J-Max (`jmaxRot`, `jmaxNum`, `jmaxClick`) con los valores correspondientes.
* **`RecipeHistory.jsx`**:
  - Muestra los pasos guardados de la receta en un panel colapsable dentro del historial de preparaciones.
