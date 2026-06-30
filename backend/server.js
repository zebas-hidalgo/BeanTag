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
  const { id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses } = req.body;
  if (!id || !name || !producer || !total_doses) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses]
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
  const { batch_id, method, ratio, grind, temperature, brew_time, rating, notes } = req.body;
  if (!batch_id || !method) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, method, ratio, grind, temperature, brew_time, rating, notes]
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
      SELECT r.*, b.name as batch_name, b.variety as batch_variety 
      FROM recipes r 
      JOIN batches b ON r.batch_id = b.id 
      ORDER BY r.created_at DESC
    `);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
