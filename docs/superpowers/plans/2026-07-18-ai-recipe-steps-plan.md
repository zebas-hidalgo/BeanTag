# AI Grind suggesting & Recipe Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Gemini AI suggestion with J-Max dial settings (Rotations, Numbers, Clicks) and step-by-step recipe steps, persisting them to the SQLite database and rendering them interactively in the React frontend.

**Architecture:** Update SQLite tables using migration, update backend router/Gemini prompt, update `RecipeForm` to apply suggestions to J-Max select steppers, and update `RecipeHistory` to render steps.

**Tech Stack:** React 18, Express, SQLite3, Zod.

## Global Constraints
- Target workspace: `/var/www/beantag`
- Front-end styles must maintain the Neo-Brutalist look and use standard Vanilla CSS classes from `index.css`.
- SQLite database path is `/var/www/beantag/backend/database.sqlite`.

---

### Task 1: Database Migration

**Files:**
- Modify: `/var/www/beantag/backend/database.js`

**Interfaces:**
- Consumes: SQLite database connection
- Produces: Updated database tables with `recipe_steps` and `grind_jmax` columns.

- [ ] **Step 1: Add migration statements**
Modify `/var/www/beantag/backend/database.js` inside `initDb()`:
```javascript
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN recipe_steps TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN grind_jmax TEXT;');
  } catch (e) {}
```

- [ ] **Step 2: Verify migration runs**
Restart backend: `pm2 restart beantag` and verify it boots without errors.

---

### Task 2: Gemini Prompt & Backend Save Integration

**Files:**
- Modify: `/var/www/beantag/backend/server.js`

**Interfaces:**
- Consumes: Gemini API response
- Produces: Updated routes `POST /api/recipes`, `/api/recommend-recipe`, `/api/export/json`, `/api/import/json`.

- [ ] **Step 1: Update Gemini API recommendation prompt**
Modify `/var/www/beantag/backend/server.js` prompt description in `/api/recommend-recipe` endpoint:
```javascript
  const prompt = `Eres un barista experto de café de especialidad. Analiza el siguiente lote de café:
Origen: ${origin || 'Desconocido'}
Variedad: ${variety || 'N/A'}
Proceso: ${process || 'N/A'}
Altitud: ${altitude || 'N/A'}
Nivel de tueste: ${roast_level || 'Medio'}
Notas de cata: ${roaster_notes || 'N/A'}

El usuario quiere preparar este café usando específicamente el método de extracción: "${method || 'V60 (Filtrado)'}" y una dosis exacta de café de: "${dose_in_g || '20.0'} gramos".

Genera una receta recomendada y adaptada para este método ("${method || 'V60 (Filtrado)'}") y dosis ("${dose_in_g || '20.0'}g").
Debes sugerir el ajuste de molienda exacto en el dial para el molino 1Zpresso J-Max. Considera estas referencias estimadas de J-Max según el método:
- Espresso: Rotaciones ~1, Números ~2 a ~5, Clics ~0 (ej. 1.5.0)
- Filtrado/V60: Rotaciones ~2 a ~3, Números ~0 a ~5, Clics ~0 (ej. 2.8.0 o 3.0.0)
- AeroPress: Rotaciones ~2, Números ~0 a ~5, Clics ~0 (ej. 2.2.0)
- Prensa Francesa: Rotaciones ~3 a ~4, Números ~5 a ~8, Clics ~0 (ej. 3.8.0)

Genera también una guía paso a paso clara y estructurada de preparación (mínimo 3 pasos) considerando los gramos de café y el método de extracción.

Debes responder únicamente con un objeto JSON válido con el siguiente esquema exacto (no agregues formato markdown ni bloques de código \`\`\`json, solo devuelve el string JSON crudo):
{
  "method": "${method || 'V60 (Filtrado)'}",
  "ratio": "ratio de extracción como string (ej. 1:15 o 1:16, o 1:2 para espresso)",
  "grind": "molienda sugerida en texto (ej. Fino, Medio-Fino, Medio, Medio-Grueso, Grueso)",
  "grind_jmax": {
    "rot": 1,
    "num": 5,
    "click": 0
  },
  "temperature": 94,
  "brew_time": "tiempo de extracción sugerido en formato string (ej: 2:30 o 0:30)",
  "steps": [
    "Paso 1: Muele los gramos en el ajuste indicado...",
    "Paso 2: ...",
    "Paso 3: ..."
  ],
  "notes": "Una sola frase barística ultra corta (máximo 12 palabras) que explique por qué funciona esta receta."
}`;
```

- [ ] **Step 2: Update save and select queries**
Modify `POST /api/recipes` query inside `/var/www/beantag/backend/server.js` to insert `recipe_steps` and `grind_jmax`:
```javascript
app.post('/api/recipes', async (req, res) => {
  const { batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, recipe_steps, grind_jmax } = req.body;
  
  // ...
  await db.run(
    `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, recipe_steps, grind_jmax)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, JSON.stringify(recipe_steps || []), JSON.stringify(grind_jmax || null)]
  );
  // ...
});
```

- [ ] **Step 3: Update export/import routes**
Update the `/api/export/json` and `/api/import/json` in `server.js` to handle `recipe_steps` and `grind_jmax` values.

---

### Task 3: RecipeForm.jsx Integration

**Files:**
- Modify: `/var/www/beantag/frontend/src/components/RecipeForm.jsx`

**Interfaces:**
- Consumes: Suggestion object containing J-Max numbers and recipe steps.
- Produces: Interactive suggestion component and stepper populations.

- [ ] **Step 1: Add suggested states**
Modify `RecipeForm.jsx` to declare state for AI steps:
```javascript
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [grindJmaxSuggest, setGrindJmaxSuggest] = useState(null);
```

- [ ] **Step 2: Update recommendation UI to render steps and apply suggestions**
Modify `handleApplyAiRecipe` inside `RecipeForm.jsx` to apply the suggested stepper values and save steps to state:
```javascript
  const handleApplyAiRecipe = () => {
    if (!aiRecommendation) return;
    // ...
    if (aiRecommendation.grind_jmax) {
      setJmaxRot(aiRecommendation.grind_jmax.rot || 0);
      setJmaxNum(aiRecommendation.grind_jmax.num || 0);
      setJmaxClick(aiRecommendation.grind_jmax.click || 0);
      setGrindJmaxSuggest(aiRecommendation.grind_jmax);
    }
    if (aiRecommendation.steps) {
      setRecipeSteps(aiRecommendation.steps);
    }
    // ...
  };
```

- [ ] **Step 3: Update Submit payload**
Modify the `handleRecipeSubmit` function to pass `recipe_steps: recipeSteps` and `grind_jmax: grindJmaxSuggest` inside the save payload.

---

### Task 4: RecipeHistory.jsx Integration

**Files:**
- Modify: `/var/www/beantag/frontend/src/components/RecipeHistory.jsx`

**Interfaces:**
- Consumes: `recipe_steps` array from recipe record.
- Produces: Collapsible details component displaying steps inside history.

- [ ] **Step 1: Render collapsible steps list**
Modify `RecipeHistory.jsx` list item rendering to parse and display the steps if present:
```jsx
  const renderSteps = (recipe) => {
    let steps = [];
    try {
      if (recipe.recipe_steps) {
        steps = JSON.parse(recipe.recipe_steps);
      }
    } catch(e) {}
    
    if (!Array.isArray(steps) || steps.length === 0) return null;
    return (
      <details style={{ marginTop: '10px', fontSize: '12px', borderTop: '1px dashed #ccc', paddingTop: '8px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-crimson)' }}>Ver pasos de preparación ({steps.length})</summary>
        <ol style={{ paddingLeft: '16px', margin: '6px 0', lineHeight: '1.4' }}>
          {steps.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
          ))}
        </ol>
      </details>
    );
  };
```
And render `renderSteps(recipe)` inside the card layout.
