const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { initDb, getDb } = require('./database');
const {
  VALID_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
  sanitizeModel,
  clicksToJMax,
  jMaxToClicks,
  calculateDaysSinceRoast,
  isFrozenBatch,
  computeOfflineRecipe,
  computeOfflineTuning,
  callGeminiWithRetry
} = require('./aiEngine');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'beantag_secret_jwt_key_2026';
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}
try { require('dotenv').config({ path: path.join(__dirname, '../.env') }); } catch (e) {}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from compiled React app
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

app.use(authenticateToken);

// --- AUTHENTICATION ENDPOINTS ---

// Register with Email & Password
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
  }
  try {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userName = name || email.split('@')[0];

    const result = await db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), passwordHash, userName]
    );

    const user = { id: result.lastID, email: email.toLowerCase().trim(), name: userName, picture: null };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login with Email & Password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
  }
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas o cuenta de Google.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const userData = { id: user.id, email: user.email, name: user.name, picture: user.picture };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth Login / Register
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Token de Google no proporcionado.' });
  }
  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID || undefined
      });
      payload = ticket.getPayload();
    } catch (e) {
      // Fallback: Verify token directly with Google tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) throw new Error('Token de Google no válido.');
      payload = await response.json();
    }

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      return res.status(400).json({ error: 'No se pudo obtener el correo de Google.' });
    }

    const db = await getDb();
    let user = await db.get('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email.toLowerCase().trim()]);

    if (!user) {
      const result = await db.run(
        'INSERT INTO users (email, name, picture, google_id) VALUES (?, ?, ?, ?)',
        [email.toLowerCase().trim(), name || 'Usuario de Google', picture || null, googleId]
      );
      user = { id: result.lastID, email: email.toLowerCase().trim(), name: name || 'Usuario de Google', picture: picture || null };
    } else if (!user.google_id) {
      await db.run('UPDATE users SET google_id = ?, picture = COALESCE(picture, ?) WHERE id = ?', [googleId, picture, user.id]);
      user.picture = user.picture || picture;
    }

    const userData = { id: user.id, email: user.email, name: user.name, picture: user.picture };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(401).json({ error: 'Autenticación con Google fallida: ' + err.message });
  }
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  res.json({ user: req.user });
});

// Auth Configuration Endpoint
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID
  });
});

// --- API ROUTES ---

// Get all active batches (Filtered by user if authenticated, or public/unassigned)
app.get('/api/batches', async (req, res) => {
  try {
    const db = await getDb();
    let batches;
    if (req.user && req.user.id) {
      batches = await db.all('SELECT * FROM batches WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC', [req.user.id]);
    } else {
      batches = await db.all('SELECT * FROM batches ORDER BY created_at DESC');
    }
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
    const userId = req.user ? req.user.id : null;

    await db.run(
      `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses, origin, roast_level, roast_date, freeze_date, totalWeightG, totalWeightG, userId]
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
    const batch = await db.get('SELECT user_id, remaining_doses, total_doses FROM batches WHERE id = ?', req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (batch.user_id !== null && (!req.user || req.user.id !== batch.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario de este café puede modificar las dosis.' });
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
    
    // Fetch batch to get user_id and default dose weight if needed
    const batch = await db.get('SELECT user_id, dose_weight FROM batches WHERE id = ?', batch_id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (batch.user_id !== null && (!req.user || req.user.id !== batch.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario de este café puede registrar extracciones.' });
    }

    const defaultDose = parseFloat(batch.dose_weight) || 20.0;
    const doseInVal = dose_in_g !== undefined ? parseFloat(dose_in_g) : defaultDose;
    const userId = req.user ? req.user.id : (batch.user_id || null);

    await db.run('BEGIN TRANSACTION;');
    try {
      await db.run(
        `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, doseInVal, dose_out_g, espresso_pressure, espresso_preinfusion, userId]
      );

      // Subtract 1 tube (dose) and grams from batch remaining stock
      await db.run(
        'UPDATE batches SET remaining_doses = MAX(0, remaining_doses - 1), remaining_weight_g = MAX(0.0, remaining_weight_g - ?) WHERE id = ?',
        [doseInVal, batch_id]
      );

      await db.run('COMMIT;');
    } catch (dbErr) {
      await db.run('ROLLBACK;');
      throw dbErr;
    }

    const updatedBatch = await db.get('SELECT remaining_doses, remaining_weight_g FROM batches WHERE id = ?', batch_id);
    res.status(201).json({ 
      success: true, 
      remaining_doses: updatedBatch ? updatedBatch.remaining_doses : 0, 
      remaining_weight_g: updatedBatch ? updatedBatch.remaining_weight_g : 0 
    });
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
    const current = await db.get('SELECT user_id, total_doses, remaining_doses FROM batches WHERE id = ?', req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (current.user_id !== null && (!req.user || req.user.id !== current.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario puede editar este lote.' });
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

// Update brew recipe
app.put('/api/recipes/:id', async (req, res) => {
  const {
    method, ratio, grind, temperature, brew_time, rating, notes,
    sensory_balance, sensory_body, sensory_extraction,
    dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion
  } = req.body;

  if (!method) {
    return res.status(400).json({ error: 'El método es obligatorio' });
  }

  const parseNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(parseFloat(val))) ? parseFloat(val) : null;
  const parseRating = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const r = parseInt(val, 10);
    return (!isNaN(r) && r >= 1 && r <= 5) ? r : null;
  };

  try {
    const db = await getDb();
    const recipe = await db.get(
      'SELECT r.id, r.batch_id, b.user_id FROM recipes r JOIN batches b ON r.batch_id = b.id WHERE r.id = ?',
      req.params.id
    );

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    if (recipe.user_id !== null && (!req.user || req.user.id !== recipe.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario puede editar esta receta.' });
    }

    await db.run(
      `UPDATE recipes 
       SET method = ?, ratio = ?, grind = ?, temperature = ?, brew_time = ?, 
           rating = ?, notes = ?, sensory_balance = ?, sensory_body = ?, sensory_extraction = ?,
           dose_in_g = ?, dose_out_g = ?, espresso_pressure = ?, espresso_preinfusion = ?
       WHERE id = ?`,
      [
        method, ratio, grind, temperature, brew_time,
        parseRating(rating),
        notes, sensory_balance, sensory_body, sensory_extraction,
        parseNum(dose_in_g),
        parseNum(dose_out_g),
        parseNum(espresso_pressure),
        parseNum(espresso_preinfusion),
        req.params.id
      ]
    );

    const updatedRecipe = await db.get(`
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
      WHERE r.id = ?
    `, req.params.id);

    res.json({ success: true, recipe: updatedRecipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const db = await getDb();
    const recipe = await db.get('SELECT r.id, b.user_id FROM recipes r JOIN batches b ON r.batch_id = b.id WHERE r.id = ?', req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    if (recipe.user_id !== null && (!req.user || req.user.id !== recipe.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario puede eliminar recetas de este lote.' });
    }
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
    const batch = await db.get('SELECT id, user_id FROM batches WHERE id = ?', req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (batch.user_id !== null && (!req.user || req.user.id !== batch.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario puede eliminar este lote.' });
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

// CSV Export: Export all recipes joined with batch information
app.get('/api/backup/export/csv', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT 
        r.id, r.created_at, b.name as batch_name, b.roaster, b.origin, b.variety, b.process,
        r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.sensory_balance, r.sensory_body,
        r.sensory_extraction, r.dose_in_g, r.dose_out_g, r.notes
      FROM recipes r
      LEFT JOIN batches b ON r.batch_id = b.id
      ORDER BY r.created_at DESC
    `);

    const headers = [
      'ID', 'Fecha', 'Lote', 'Tostador', 'Origen', 'Variedad', 'Proceso',
      'Método', 'Ratio', 'Molienda (J-Max)', 'Temperatura', 'Tiempo Extracción',
      'Balance', 'Cuerpo', 'Resultado Sensorial', 'Dosis Entrada (g)', 'Dosis Salida (g)', 'Notas de Cata'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const cleanStr = String(str).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM para compatibilidad con Excel
    csvContent += headers.map(escapeCsv).join(',') + '\n';

    rows.forEach(r => {
      const rowData = [
        r.id, r.created_at, r.batch_name, r.roaster, r.origin, r.variety, r.process,
        r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.sensory_balance, r.sensory_body,
        r.sensory_extraction, r.dose_in_g, r.dose_out_g, r.notes
      ];
      csvContent += rowData.map(escapeCsv).join(',') + '\n';
    });

    const filename = `beantag_bitacora_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JSON Backup: Import (replace or merge) database tables
app.post('/api/backup/import', async (req, res) => {
  const { batches, recipes, mode = 'replace' } = req.body;
  if (!Array.isArray(batches) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Formato de backup inválido' });
  }
  try {
    const db = await getDb();
    
    if (mode === 'replace') {
      await db.run('DELETE FROM recipes');
      await db.run('DELETE FROM batches');
    }

    const insertBatchSql = mode === 'merge' 
      ? `INSERT OR IGNORE INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const b of batches) {
      await db.run(insertBatchSql, [
        b.id, b.name, b.producer, b.altitude, b.variety, b.process, b.roaster, b.roaster_notes, 
        b.dose_weight, b.total_doses, b.remaining_doses, b.origin, b.roast_level, b.roast_date, b.freeze_date,
        b.total_weight_g !== undefined ? b.total_weight_g : 0, 
        b.remaining_weight_g !== undefined ? b.remaining_weight_g : 0,
        b.created_at
      ]);
    }

    const insertRecipeSql = mode === 'merge'
      ? `INSERT OR IGNORE INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const r of recipes) {
      await db.run(insertRecipeSql, [
        r.id, r.batch_id, r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.rating, r.notes, 
        r.sensory_balance, r.sensory_body, r.sensory_extraction,
        r.dose_in_g, r.dose_out_g, r.espresso_pressure, r.espresso_preinfusion,
        r.created_at
      ]);
    }

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

// --- GEMINI AI CORE ENGINE (WITH RESILIENT FALLBACK) ---

function getGeminiConfig(req) {
  const apiKey = req.headers['x-gemini-key'];
  const requestedModel = req.headers['x-gemini-model'];
  const enableThinking = req.headers['x-gemini-thinking'] === 'true' || req.headers['x-gemini-thinking'] === true;

  // Sanitize model to valid Google AI Studio IDs (e.g. gemini-2.0-flash, gemini-1.5-flash)
  const model = sanitizeModel(requestedModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig = {
    responseMimeType: 'application/json'
  };

  if (enableThinking && model.includes('thinking')) {
    generationConfig.thinkingConfig = {
      thinkingBudget: 2048
    };
  }

  return { apiKey, model, url, generationConfig, enableThinking };
}

// 0. AI Connection Diagnostic Probe Endpoint
app.post('/api/test-gemini', async (req, res) => {
  const apiKey = req.headers['x-gemini-key'] || req.body?.apiKey;
  const requestedModel = req.headers['x-gemini-model'] || req.body?.model;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(400).json({ success: false, error: 'No se ingresó ninguna clave API de Gemini.' });
  }

  const model = sanitizeModel(requestedModel);
  try {
    const probePrompt = 'Responde exclusivamente con el JSON: {"status":"ok","echo":"barista_ok"}';
    const result = await callGeminiWithRetry(probePrompt, apiKey.trim(), model, false);
    return res.json({
      success: true,
      model: result._model || model,
      message: 'Conexión exitosa con Google Gemini AI 🧠'
    });
  } catch (err) {
    console.warn(`[Gemini Probe Failed] ${err.message}`);
    return res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Error al conectar con Google AI Studio'
    });
  }
});

// 1. AI Recommendation Endpoint (Gemini Flash + Offline Barista Engine Fallback)
app.post('/api/recommend-recipe', async (req, res) => {
  const { apiKey, model, enableThinking } = getGeminiConfig(req);
  const {
    origin,
    variety,
    process,
    altitude,
    roast_level,
    roaster_notes,
    method,
    dose_in_g,
    roast_date,
    freeze_date,
    sca_score,
    producer,
    batch_name,
    grinder
  } = req.body;

  const dose = parseFloat(dose_in_g) || 20.0;
  const targetMethod = method || 'V60 (Filtrado)';
  const daysSinceRoast = calculateDaysSinceRoast(roast_date);
  const isFrozen = isFrozenBatch({ freeze_date });
  const activeGrinder = (grinder || 'jmax').toLowerCase();

  // If no API key is provided, gracefully serve the offline barista calculation
  if (!apiKey) {
    const offlineRec = computeOfflineRecipe({
      origin,
      variety,
      process,
      altitude,
      roast_level,
      roaster_notes,
      method: targetMethod,
      dose_in_g: dose,
      roast_date,
      freeze_date,
      sca_score,
      producer,
      grinder: activeGrinder
    });
    offlineRec.notes = `${offlineRec.notes} (Modo Barista Offline - Configura tu API Key en Ajustes para activar Gemini)`;
    return res.json(offlineRec);
  }

  const prompt = `Eres un Barista Campeón Mundial de Café de Especialidad y Doctor en Física de Fluidos y Extracción de Café.
Analiza con máximo rigor científico y multivariable este lote de café y su equipo de molienda:

PARÁMETROS DEL CAFÉ:
- Nombre / Lote: ${batch_name || 'Café de Especialidad'}
- Origen / Terroir: ${origin || 'Desconocido'}
- Productor / Finca: ${producer || 'No especificado'}
- Variedad Genética: ${variety || 'Arábica'}
- Proceso de Beneficio: ${process || 'Lavado'}
- Altitud de Cultivo: ${altitude || '1500m'}
- Nivel de Tueste: ${roast_level || 'Medio'}
- Fecha de Tueste: ${roast_date || 'No especificada'} (${daysSinceRoast !== null ? `${daysSinceRoast} días desde tueste` : 'Reposo estándar óptimo'})
- Conservación Criogénica: ${isFrozen ? '❄️ Sí, congelado en Cava a -18°C (Frozen Bean Dosing)' : 'Temperatura ambiente'}
- Calificación SCA: ${sca_score ? `${sca_score} puntos` : 'Especialidad'}
- Notas Sensoriales del Tostador: ${roaster_notes || 'Notas de origen'}

EQUIPO Y MÉTODO:
- Método de Extracción: "${targetMethod}"
- Dosis de Café (In): "${dose}g"
- Molino Principal del Barista: "${activeGrinder}"

FÍSICA DE EXTRACCIÓN Y REGLAS CIENTÍFICAS OBLIGATORIAS:
1. DESGASIFICACIÓN Y DÍAS DE REPOSO (CINÉTICA DE CO₂):
   - Si tiene menos de 7 días de tueste (<7d): El grano está sobresaturado de CO₂ presurizado. DEBES extender el Bloom a 45-60s y/o usar 3.2x a 3.5x de agua en el bloom para evitar que el burbujeo violento genere canalizaciones ("volcano effect") y zonas secas. Abre la molienda 1 a 2 clics para evitar atascos.
   - Entre 12 y 30 días: Pico aromático ("Peak Flavor Window"). Solubilidad y desgasificación equilibradas.
   - Más de 45 días: Grano desgasificado. Para compensar la pérdida de presión aromática y volatilidad, ajusta el ratio levemente más corto (ej. 1:15 en vez de 1:16.6) y afina 1 clic la molienda.
2. DOSIS CONGELADA EN CAVA (-18°C):
   - Al moler el grano a -18°C, la matriz celular se fractura de forma frágil y más uniforme (curva unimodal con significativa reducción de finos erráticos). Permite moler 1 a 2 clics más fino sin riesgo de sobre-extracción amarga, logrando mayor TDS y claridad de taza.
3. GEOMETRÍA DE MUELAS (PLANAS VS. CÓNICAS):
   - Muelas Planas (ej. Fellow Ode Gen 2, DF64, EK43): Molienda unimodal de alta uniformidad y finos mínimos. Destaca acidez cítrica brillante, dulzor limpio y separación aromática. Tolera moliendas más cerradas.
   - Muelas Cónicas (ej. 1Zpresso J-Max/K-Ultra, Comandante C40, Femobook A2, Timemore C2/C3, Kingrinder K6): Molienda bimodal con pico secundario de finos. Aporta cuerpo untuoso, textura aterciopelada y notas chocolatadas/caramelo. Requiere cuidar el número de vertidos para no compactar el lecho.
4. CALIDAD SCA Y GENÉTICAS FLORALES:
   - Cafés SCA >= 88 o variedades delicadas (Geisha, Chiroso, Pink Bourbon, Sidra, Eugenioides, Wush Wush): No usar agitación violenta ni temperaturas extremas (>96°C) que degraden los terpenos y ésteres volátiles. Vertidos laminares suaves desde baja altura.
5. LIMITACIONES FÍSICAS DE DISPOSITIVOS:
   - AeroPress Go: Capacidad máxima de la cámara = ~215ml de agua. Si dosis * ratio > 215g, limita el agua total a 205-210g o formula método concentrado.
   - NextLevel Pulsar Mini: Gestionar válvula (🔒 cerrada para bloom con dispersor, ⚡ media 50%, 🔓 abierta para drenaje por gravedad).
   - Espresso: Molienda fina de alta precisión (850-1150 µm), 25-32 segundos, ratio 1:2.0 a 1:2.4.

Genera un JSON con esta estructura exacta (calcula y calibra cada campo rigurosamente según este lote específico):
{
  "method": "${targetMethod}",
  "ratio": "1:X (calculado según el café, reposo y método)",
  "water_total_g": 0, // Entero exacto: Math.round(dosis * ratio)
  "grind": "Descripción granulométrica y dial para ${activeGrinder} (ej. 'Medio-Fino (2.3.8)')",
  "grind_microns": "Micrones estimados (ej. '1920 µm')",
  "grind_adjustment_reason": "Explicación física concisa de la calibración según tueste, días de reposo, congelación y muelas (máx 25 palabras)",
  "jmax_rot": 0, // Entero de 0 a 3
  "jmax_num": 0, // Entero de 0 a 8
  "jmax_click": 0, // Entero de 0 a 9
  "grinders": {
    "jmax": "Formato Rot.Num.Clic (ej. '2.3.8 (2 Rot. 3 Núm. 8 Clics)')",
    "k_ultra": "Dial 0-9 con decimal (20 µm/clic, ej. '7.2 (72 clics)')",
    "ode_gen2": "Dial Fellow Ode 1-11 con subdivisiones (ej. 'Ajuste 5.1' o 'No apto para espresso')",
    "comandante": "Clics Comandante C40 (30 µm/clic, ej. '22 clics')",
    "femobook_a2": "Clics Femobook A2 (18 µm/clic, ej. '56 clics (1.4 Rot.)')",
    "kingrinder_k6": "Clics Kingrinder K6 (16 µm/clic, ej. '95 clics (1 Rot. 35 Clics)')",
    "timemore": "Clics Timemore C2/C3 (ej. '16 clics')",
    "baratza": "Ajuste Baratza Encore/ESP (ej. 'Ajuste 14')"
  },
  "active_grinder_dial": {
    "grinder_id": "${activeGrinder}",
    "grinder_name": "Nombre comercial del molino",
    "dial": "Ajuste exacto recomendado para este molino",
    "burr_type": "Geometría de muelas (Planas / Cónicas) y tamaño",
    "microns": "Micrones objetivo"
  },
  "physics_analysis": {
    "roast_and_density": "Análisis de densidad celular según altitud y desarrollo de tueste",
    "degas_and_rest": "Diagnóstico de desgasificación de CO₂ y estado de reposo / congelación",
    "burr_and_fines": "Comportamiento de finos y flujo hidrodinámico según el molino activo",
    "extraction_strategy": "Fundamento científico de la estrategia de vertidos y temperatura"
  },
  "temperature": 0, // Entero en °C (entre 87 y 96)
  "brew_time": "Tiempo total estimado (ej. '2:45 min', '1:45 min', '28s')",
  "pours": [
    // Array con las fases reales de vertido.
    // Incluye: "step", "label", "water_g", "total_water_g", "time", "description" (técnica de vertido o estado de válvula).
    // Suma de water_g = water_total_g y total_water_g del último paso = water_total_g.
  ],
  "steps": [
    // 3 a 5 pasos concretos para preparar este lote con este método y molienda
  ],
  "notes": "Perfil sensorial esperado conectando origen, proceso, tueste y notas del tostador"
}`;

  try {
    const recommendation = await callGeminiWithRetry(prompt, apiKey, model, enableThinking);
    res.json(recommendation);
  } catch (err) {
    console.warn(`[AI Recommend Fallback] Error with Gemini (${model}): ${err.message}. Serving deterministic barista recipe.`);
    const fallbackRec = computeOfflineRecipe({
      origin,
      variety,
      process,
      altitude,
      roast_level,
      roaster_notes,
      method: targetMethod,
      dose_in_g: dose,
      roast_date,
      freeze_date,
      sca_score,
      producer,
      grinder: activeGrinder
    });
    fallbackRec._error = err.message;
    fallbackRec.notes = `${fallbackRec.notes} (Receta calculada localmente: servidores de Google no disponibles o saturados)`;
    res.json(fallbackRec);
  }
});

// 2. AI Recipe Re-calibration Endpoint (Smart Tuning based on Sensory Feedback)
app.post('/api/ai/tune-recipe', async (req, res) => {
  const { apiKey, model, enableThinking } = getGeminiConfig(req);
  const {
    method,
    dose_in_g,
    ratio,
    temperature,
    jmax_rot,
    jmax_num,
    jmax_click,
    sensory_extraction,
    sensory_balance,
    sensory_body,
    user_notes,
    batch_name,
    grinder
  } = req.body;
  const dose = parseFloat(dose_in_g) || 20.0;
  const activeGrinder = (grinder || 'jmax').toLowerCase();

  // If no API key is provided, serve offline barista tuning calculation directly
  if (!apiKey) {
    const offlineTune = computeOfflineTuning({ ...req.body, grinder: activeGrinder });
    offlineTune.notes = `${offlineTune.notes} (Modo Barista Offline - Configura tu API Key en Ajustes)`;
    return res.json(offlineTune);
  }

  const prompt = `Eres un Barista Campeón Mundial de Café de Especialidad. El usuario preparó una receta de "${batch_name || 'Especialidad'}" con ${method}:
Dosis: ${dose}g, Ratio: ${ratio || '1:15'}, Temp: ${temperature || 93}°C, Molino J-Max actual: ${jmax_rot}.${jmax_num}.${jmax_click}, Molino preferido: ${activeGrinder}.

Resultado Sensorial Evaluado por el Catador:
- Extracción: ${sensory_extraction || 'Sub (Agrio)'}
- Balance: ${sensory_balance || 'Desconocido'}
- Cuerpo: ${sensory_body || 'Desconocido'}
- Notas del Barista: ${user_notes || 'Ninguna'}

REGLAS DE RECALIBRACIÓN CIENTÍFICA:
1. Si hubo SUB-EXTRACCIÓN (agrio, salado, falto de dulzor):
   - Afinar molienda (restar 3 a 6 clics en J-Max / ajustar proporcional en ${activeGrinder}).
   - Subir temperatura (+1°C a +2°C, máx 96°C).
   - Alargar tiempo de contacto o aumentar ligeramente el ratio.
2. Si hubo SOBRE-EXTRACCIÓN (amargo, astringente, seco, cenizo):
   - Abrir molienda (sumar 4 a 7 clics en J-Max / ajustar proporcional en ${activeGrinder}).
   - Reducir temperatura (-1°C a -3°C, mín 88°C).
   - Agitación más suave en los vertidos.
3. Si la extracción estuvo EN PUNTO / BALANCEADA:
   - Micro-ajuste barístico (+/- 1 clic) o ajustes finos en vertidos para resaltar perfiles aromáticos.

Genera un JSON con esta estructura exacta (calcula valores específicos para corregir este caso):
{
  "correction_reason": "Explicación barística directa de la corrección según el defecto detectado (máx 25 palabras)",
  "method": "${method}",
  "ratio": "1:X (ratio corregido)",
  "water_total_g": 0, // Entero exacto: Math.round(dosis * ratio)
  "grind": "Descripción granulometría corregida y dial ${activeGrinder}",
  "grind_microns": "Micrones estimados",
  "jmax_rot": 0, // Entero rotaciones corregido
  "jmax_num": 0, // Entero número corregido
  "jmax_click": 0, // Entero clic corregido
  "grinders": {
    "jmax": "Formato Rot.Num.Clic",
    "k_ultra": "Dial K-Ultra",
    "ode_gen2": "Dial Ode Gen 2",
    "femobook_a2": "Clics Femobook",
    "comandante": "Clics Comandante",
    "kingrinder_k6": "Clics Kingrinder",
    "timemore": "Clics Timemore",
    "baratza": "Ajuste Baratza"
  },
  "active_grinder_dial": {
    "grinder_id": "${activeGrinder}",
    "grinder_name": "Nombre del molino",
    "dial": "Ajuste corregido para este molino"
  },
  "temperature": 0, // Temperatura corregida en °C
  "brew_time": "Tiempo corregido",
  "pours": [
    // Array de etapas de vertido corregidas (con step, label, water_g, total_water_g, time, description).
    // Suma de water_g = water_total_g y total_water_g del último paso = water_total_g.
  ],
  "steps": [
    // Pasos ajustados para preparar la receta corregida
  ],
  "notes": "Resultado esperado tras la corrección"
}`;

  try {
    const tunedRecommendation = await callGeminiWithRetry(prompt, apiKey, model, enableThinking);
    res.json(tunedRecommendation);
  } catch (err) {
    console.warn(`[AI Tune Fallback] Error with Gemini (${model}): ${err.message}. Serving deterministic barista tuning.`);
    const fallbackTune = computeOfflineTuning({ ...req.body, grinder: activeGrinder });
    fallbackTune._error = err.message;
    fallbackTune.notes = `${fallbackTune.notes} (Recalibración calculada localmente: servidores de Google no disponibles o saturados)`;
    res.json(fallbackTune);
  }
});


// 3. AI Multimodal Coffee Bag / Receipt Scanner (Gemini Multimodal Vision OCR)
app.post('/api/ai/scan-bag', async (req, res) => {
  const { apiKey, model, enableThinking } = getGeminiConfig(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta la clave API de Gemini en las cabeceras' });
  }

  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Falta la imagen de la bolsa de café en base64' });
  }

  // Clean base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const prompt = `Eres un sommelier y catador Q-Grader experto en café de especialidad con visión OCR de precisión.
Analiza detenidamente la imagen adjunta de la bolsa, tarjeta o recibo de café de especialidad.
Extrae con la máxima precisión todos los datos técnicos disponibles:
- Nombre del café o lote (name)
- Productor / Finca / Cooperativa (producer)
- Origen (País, Región / Departamento / Municipio) (origin)
- Altitud en msnm con formato 'X,XXX msnm' si está presente (altitude)
- Variedad botánica (Geisha, Caturra, Castillo, Bourbon, Typica, SL28, Heirloom, etc.) (variety)
- Proceso de beneficio (Lavado, Natural, Honey, Anaeróbico, Maceración, Thermal Shock, etc.) (process)
- Tostador o marca de café (roaster)
- Nivel de tueste (Claro, Medio, Oscuro) (roast_level)
- Fecha de tueste en formato AAAA-MM-DD si es legible (roast_date)
- Notas de cata descriptivas del tostador (roaster_notes)
- Lista de descriptores individuales clasificados según la Rueda de Sabores SCA oficial (sca_flavor_tags: string[])

Devuelve OBLIGATORIAMENTE un JSON estructurado con estas claves:
{
  "name": "Nombre extraído del café",
  "producer": "Productor o Finca",
  "origin": "País, Región",
  "altitude": "1,900 msnm",
  "variety": "Variedad botánica",
  "process": "Proceso de beneficio",
  "roaster": "Nombre del Tostador",
  "roast_level": "Claro / Medio / Oscuro",
  "roast_date": "AAAA-MM-DD",
  "roaster_notes": "Notas completas del tostador",
  "sca_flavor_tags": ["Nota 1", "Nota 2", "Nota 3"]
}`;

  try {
    const multimodalContents = [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    ];

    const bagData = await callGeminiWithRetry(multimodalContents, apiKey, model, enableThinking);
    res.json(bagData);
  } catch (err) {
    console.warn(`[AI Scan-Bag Failed] ${err.message}`);
    res.status(err.status || 500).json({ error: 'Error al escanear la bolsa de café: ' + err.message });
  }
});

// 4. AI Inventory Sommelier Endpoint (Recommends Peak Coffee from Freezer Tubes)
app.post('/api/ai/sommelier', async (req, res) => {
  const { apiKey, model, enableThinking } = getGeminiConfig(req);
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta la clave API de Gemini en las cabeceras' });
  }

  const { batches, timeOfDay = 'mañana' } = req.body;
  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({ error: 'No hay lotes disponibles en el inventario para evaluar' });
  }

  const prompt = `Eres el Sommelier de Café de Especialidad personal de BeanTag.
El usuario tiene estos lotes de café con dosis congeladas al vacío en su inventario:
${JSON.stringify(batches.map(b => ({
  id: b.id,
  name: b.name,
  producer: b.producer,
  origin: b.origin,
  variety: b.variety,
  process: b.process,
  altitude: b.altitude,
  roast_level: b.roast_level,
  roast_date: b.roast_date,
  freeze_date: b.freeze_date,
  remaining_doses: b.remaining_doses,
  roaster_notes: b.roaster_notes
})), null, 2)}

Momento del día para la preparación: "${timeOfDay}".

Analiza los días de reposo (degas), notas de cata y perfil aromático.
Selecciona el mejor lote para preparar ahora mismo y genera un JSON con esta estructura:
{
  "recommended_batch_id": "ID del lote elegido",
  "recommended_batch_name": "Nombre del lote elegido",
  "badge": "Badge corto llamativo (ej: En Pico de Sabor / Día 14)",
  "headline": "Titular barístico cautivador (máx 8 palabras)",
  "reason": "Explicación del sommelier de por qué es el momento perfecto para este café (máx 35 palabras)",
  "suggested_method": "V60 (Filtrado) / Espresso / AeroPress",
  "flavor_highlight": "Perfil de sabor destacado en taza"
}`;

  try {
    const sommelierResult = await callGeminiWithRetry(prompt, apiKey, model, enableThinking);
    res.json(sommelierResult);
  } catch (err) {
    console.warn(`[AI Sommelier Failed] ${err.message}`);
    res.status(err.status || 500).json({ error: 'Error en el sommelier IA: ' + err.message });
  }
});

// Serve React front for fallback routing
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start listening
if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend de BeanTag corriendo en el puerto ${PORT}`);
    });
  }).catch(err => {
    console.error('Error al inicializar la base de datos:', err);
  });
}

module.exports = app;
