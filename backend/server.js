const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    await db.run(
      `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses, origin, roast_level, roast_date, freeze_date]
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
  const { batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction } = req.body;
  if (!batch_id || !method) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction]
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

    await db.run(
      `UPDATE batches 
       SET name = ?, producer = ?, altitude = ?, variety = ?, process = ?, roaster = ?, roaster_notes = ?, 
           dose_weight = ?, total_doses = ?, remaining_doses = ?, origin = ?, roast_level = ?, roast_date = ?, freeze_date = ?
       WHERE id = ?`,
      [name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, newRemaining, origin, roast_level, roast_date, freeze_date, req.params.id]
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
