const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Middleware to strip subpath prefix /beantag if present (essential for local direct access and Vite dev server compatibility)
app.use((req, res, next) => {
  if (req.url.startsWith('/beantag')) {
    req.url = req.url.replace(/^\/beantag/, '');
    if (req.url === '') req.url = '/';
  }
  next();
});

// Serve static files from compiled React app
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Get all active batches
app.get('/api/batches', async (req, res) => {
  try {
    const db = await getDb();
    const batches = await db.all('SELECT * FROM batches ORDER BY created_at DESC');
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get batch details
app.get('/api/batches/:id', async (req, res) => {
  try {
    const db = await getDb();
    const batch = await db.get('SELECT * FROM batches WHERE id = ?', req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    const recipes = await db.all('SELECT * FROM recipes WHERE batch_id = ? ORDER BY created_at DESC', req.params.id);
    res.json({ ...batch, recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new batch
app.post('/api/batches', async (req, res) => {
  const { id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, origin, roast_level, roast_date, freeze_date } = req.body;
  if (!id || !name || !producer || !total_doses) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    const doseWeightNum = parseFloat(dose_weight) || 20.0;
    const totalWeightG = doseWeightNum * parseInt(total_doses);

    await db.run(
      `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
      [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses, origin, roast_level, roast_date, freeze_date, totalWeightG, totalWeightG]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doses remaining (Subtract or Add/Undo)
app.patch('/api/batches/:id/doses', async (req, res) => {
  const { change } = req.body; // expected: -1 (subtract) or +1 (undo)
  if (change !== -1 && change !== 1) {
    return res.status(400).json({ error: 'Cambio inválido' });
  }
  try {
    const db = await getDb();
    const batch = await db.get('SELECT remaining_doses, total_doses FROM batches WHERE id = ?', req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    
    const newDoses = batch.remaining_doses + change;
    if (newDoses < 0 || newDoses > batch.total_doses) {
      return res.status(400).json({ error: 'Cantidad de dosis fuera de los límites' });
    }

    await db.run('UPDATE batches SET remaining_doses = ? WHERE id = ?', [newDoses, req.params.id]);
    res.json({ success: true, remaining_doses: newDoses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save brew recipe
app.post('/api/recipes', async (req, res) => {
  const { 
    batch_id, method, ratio, grind, temperature, brew_time, rating, notes, 
    sensory_balance, sensory_body, sensory_extraction,
    dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion
  } = req.body;
  if (!batch_id || !method) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    
    // Fetch batch to get default dose weight if needed
    const batch = await db.get('SELECT dose_weight FROM batches WHERE id = ?', batch_id);
    const defaultDose = batch ? (parseFloat(batch.dose_weight) || 20.0) : 20.0;
    const doseInVal = dose_in_g !== undefined ? parseFloat(dose_in_g) : defaultDose;

    await db.run(
      `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, doseInVal, dose_out_g, espresso_pressure, espresso_preinfusion]
    );

    // Subtract grams from batch remaining weight
    await db.run(
      'UPDATE batches SET remaining_weight_g = MAX(0.0, remaining_weight_g - ?) WHERE id = ?',
      [doseInVal, batch_id]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get global recipe history
app.get('/api/recipes', async (req, res) => {
  try {
    const db = await getDb();
    const history = await db.all(`
      SELECT r.*, 
             b.name as batch_name, 
             b.variety as batch_variety,
             b.producer as batch_producer,
             b.altitude as batch_altitude,
             b.origin as batch_origin,
             b.roaster as batch_roaster,
             b.roast_level as batch_roast_level,
             b.roaster_notes as batch_roaster_notes,
             b.roast_date as batch_roast_date,
             b.process as batch_process
      FROM recipes r 
      JOIN batches b ON r.batch_id = b.id 
      ORDER BY r.created_at DESC
    `);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update batch details
app.put('/api/batches/:id', async (req, res) => {
  const { name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date } = req.body;
  if (!name || !producer || total_doses === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    const current = await db.get('SELECT total_doses, remaining_doses FROM batches WHERE id = ?', req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    
    // Adjust remaining doses if total_doses changed and remaining_doses is not explicitly provided
    let newRemaining = remaining_doses !== undefined ? remaining_doses : current.remaining_doses;
    if (total_doses !== current.total_doses && remaining_doses === undefined) {
      const diff = total_doses - current.total_doses;
      newRemaining = Math.max(0, current.remaining_doses + diff);
    }

    const doseWeightNum = parseFloat(dose_weight) || 20.0;
    const newTotalWeight = doseWeightNum * total_doses;
    const newRemainingWeight = doseWeightNum * newRemaining;

    await db.run(
      `UPDATE batches 
       SET name = ?, producer = ?, altitude = ?, variety = ?, process = ?, roaster = ?, roaster_notes = ?, 
           dose_weight = ?, total_doses = ?, remaining_doses = ?, origin = ?, roast_level = ?, roast_date = ?, freeze_date = ?,
           total_weight_g = ?, remaining_weight_g = ?
       WHERE id = ?`,
      [name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, newRemaining, origin, roast_level, roast_date, freeze_date, newTotalWeight, newRemainingWeight, req.params.id]
    );
    res.json({ success: true, remaining_doses: newRemaining });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM recipes WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// R10: Delete batch and its recipes
app.delete('/api/batches/:id', async (req, res) => {
  try {
    const db = await getDb();
    const batch = await db.get('SELECT id FROM batches WHERE id = ?', req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }
    await db.run('DELETE FROM recipes WHERE batch_id = ?', req.params.id);
    await db.run('DELETE FROM batches WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Backup: Export all database tables
app.get('/api/backup/export', async (req, res) => {
  try {
    const db = await getDb();
    const batches = await db.all('SELECT * FROM batches');
    const recipes = await db.all('SELECT * FROM recipes');
    res.json({ success: true, batches, recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Backup: Import and replace all database tables
app.post('/api/backup/import', async (req, res) => {
  const { batches, recipes } = req.body;
  if (!Array.isArray(batches) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Formato de backup inválido' });
  }
  try {
    const db = await getDb();
    
    // Clear current database in a transaction/sequence
    await db.run('DELETE FROM recipes');
    await db.run('DELETE FROM batches');

    // Insert imported batches
    for (const b of batches) {
      await db.run(
        `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id, b.name, b.producer, b.altitude, b.variety, b.process, b.roaster, b.roaster_notes, 
          b.dose_weight, b.total_doses, b.remaining_doses, b.origin, b.roast_level, b.roast_date, b.freeze_date,
          b.total_weight_g !== undefined ? b.total_weight_g : 0, 
          b.remaining_weight_g !== undefined ? b.remaining_weight_g : 0,
          b.created_at
        ]
      );
    }

    // Insert imported recipes
    for (const r of recipes) {
      await db.run(
        `INSERT INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id, r.batch_id, r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.rating, r.notes, 
          r.sensory_balance, r.sensory_body, r.sensory_extraction,
          r.dose_in_g, r.dose_out_g, r.espresso_pressure, r.espresso_preinfusion,
          r.created_at
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/json
app.get('/api/export/json', async (req, res) => {
  try {
    const db = await getDb();
    const batches = await db.all('SELECT * FROM batches');
    const recipes = await db.all('SELECT * FROM recipes');
    res.json({ batches, recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/json
app.post('/api/import/json', async (req, res) => {
  const { batches, recipes } = req.body;
  if (!Array.isArray(batches) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Formato de importación inválido' });
  }
  try {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    
    // Clear existing tables
    await db.run('DELETE FROM recipes');
    await db.run('DELETE FROM batches');
    
    // Insert batches
    for (const b of batches) {
      await db.run(
        `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.name, b.producer, b.altitude, b.variety, b.process, b.roaster, b.roaster_notes, b.dose_weight, b.total_doses, b.remaining_doses, b.origin, b.roast_level, b.roast_date, b.freeze_date, b.total_weight_g, b.remaining_weight_g]
      );
    }
    
    // Insert recipes
    for (const r of recipes) {
      await db.run(
        `INSERT INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.batch_id, r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.rating, r.notes, r.created_at]
      );
    }
    
    await db.run('COMMIT');
    res.json({ success: true, message: `Importados: ${batches.length} lotes y ${recipes.length} recetas.` });
  } catch (err) {
    try {
      const db = await getDb();
      await db.run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr);
    }
    res.status(500).json({ error: err.message });
  }
});


// R7: PWA manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'BeanTag',
    short_name: 'BeanTag',
    description: 'Gestión de café specialty congelado con NFC',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF5F5',
    theme_color: '#FFF5F5',
    icons: [
      {
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="35" y="10" width="30" height="12" rx="4" fill="%23E53E3E" stroke="%23000000" stroke-width="5"/><path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="%23FFFFFF" stroke="%23000000" stroke-width="5"/><ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="%23000000" stroke="%23000000" stroke-width="4"/></svg>',
        sizes: '192x192',
        type: 'image/svg+xml'
      }
    ]
  });
});

// AI Recommendation Endpoint
app.post('/api/recommend-recipe', async (req, res) => {
  const apiKey = req.headers['x-gemini-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta la clave API de Gemini en las cabeceras' });
  }

  const { origin, variety, process, altitude, roast_level, roaster_notes, method, dose_in_g } = req.body;

  const prompt = `Eres un barista experto de café de especialidad. Analiza el siguiente lote de café:
Origen: ${origin || 'Desconocido'}
Variedad: ${variety || 'N/A'}
Proceso: ${process || 'N/A'}
Altitud: ${altitude || 'N/A'}
Nivel de tueste: ${roast_level || 'Medio'}
Notas de cata: ${roaster_notes || 'N/A'}

El usuario quiere preparar este café usando específicamente el método de extracción: "${method || 'V60 (Filtrado)'}" y una dosis exacta de café de: "${dose_in_g || '20.0'} gramos".

Genera una receta recomendada y adaptada estrictamente para este método ("${method || 'V60 (Filtrado)'}") y dosis ("${dose_in_g || '20.0'}g"). Sé extremadamente conciso y directo en el campo "notes", limitándolo a una sola frase de máximo 12 palabras.
Debes responder únicamente con un objeto JSON válido con el siguiente esquema exacto (no agregues formato markdown ni bloques de código \`\`\`json, solo devuelve el string JSON crudo):
{
  "method": "${method || 'V60 (Filtrado)'}",
  "ratio": "ratio de extracción como string (ej. 1:15 o 1:16, o 1:2 para espresso)",
  "grind": "molienda sugerida (ej. Fino, Medio-Fino, Medio, Medio-Grueso, Grueso) para este método y gramaje",
  "temperature": 94,
  "brew_time": "tiempo de extracción sugerido en formato string (ej: 2:30 o 0:30)",
  "notes": "Una sola frase barística ultra corta (máximo 12 palabras) que explique por qué funciona esta receta."
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ error: errData.error?.message || 'Error con la API de Gemini' });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up markdown block format
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const recommendation = JSON.parse(text);
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la recomendación: ' + err.message });
  }
});

// Serve React front for fallback routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start listening
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend de BeanTag corriendo en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
});
