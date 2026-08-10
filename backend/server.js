const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { initDb, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'beantag_secret_jwt_key_2026';
try { require('dotenv').config(); } catch (e) {}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

app.use(cors());
app.use(express.json());

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

    await db.run('BEGIN TRANSACTION;');
    try {
      await db.run(
        `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, doseInVal, dose_out_g, espresso_pressure, espresso_preinfusion]
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

// AI Recommendation Endpoint (Structured with Pours, Steps, and Calibrated Grind Settings)
app.post('/api/recommend-recipe', async (req, res) => {
  const apiKey = req.headers['x-gemini-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta la clave API de Gemini en las cabeceras' });
  }

  const { origin, variety, process, altitude, roast_level, roaster_notes, method, dose_in_g } = req.body;
  const dose = parseFloat(dose_in_g) || 20.0;
  const targetMethod = method || 'V60 (Filtrado)';

  const prompt = `Eres un Barista Campeón Mundial de Café de Especialidad y experto en física de molienda. Analiza meticulosamente el siguiente lote de café:
- Origen: ${origin || 'Desconocido'}
- Variedad: ${variety || 'N/A'}
- Proceso: ${process || 'N/A'}
- Altitud: ${altitude || 'N/A'}
- Tueste: ${roast_level || 'Medio'}
- Notas del Tostador: ${roaster_notes || 'N/A'}

El usuario desea preparar este café con el método: "${targetMethod}" y una dosis de entrada de: "${dose}g".

REGLAS MECÁNICAS EXACTAS PARA MOLINO 1ZPRESSO J-MAX (8.8 µm por Clic, 90 Clics/Rotación, 10 Clics/Número -> Formato: Rotación.Número.Clic):
- Rango Base Espresso: 1.2.5 a 1.4.2 (95 a 132 clics | ~830 µm a 1160 µm). Base habitual: 1.3.5 (125 clics = 1100 µm).
- Rango Base AeroPress / Moka: 1.8.0 a 2.1.0 (170 a 190 clics | ~1500 µm a 1670 µm).
- Rango Base V60 / Filtrado: 2.3.0 a 2.7.0 (210 a 250 clics | ~1850 µm a 2200 µm). Base habitual: 2.4.5 (225 clics = 1980 µm).
- Rango Base Prensa Francesa: 3.0.0 a 3.5.0 (270 a 320 clics | ~2370 µm a 2800 µm).

AJUSTES CIENTÍFICOS OBLIGATORIOS SEGÚN EL GRANO (Aplica sobre el Rango Base):
1. Según Tueste (Roast Level):
   - Tueste Claro (Light Roast): Granos duros y poco solubles. RESTAR 3 a 5 CLICS (molienda más fina) para maximizar extracción de azúcares.
   - Tueste Oscuro (Dark Roast): Granos porosos y muy solubles. SUMAR 4 a 6 CLICS (molienda más gruesa) para evitar amargor y fines excesivos.
2. Según Proceso (Process):
   - Natural / Anaeróbico / Maceración: Altamente solubles y producen más finos. SUMAR 3 a 5 CLICS (molienda más gruesa).
   - Lavado (Washed): Taza limpia. Mantener rango estándar o RESTAR 1 a 2 CLICS si es de alta altitud.
3. Según Altitud:
   - >1600m (Strictly Hard Bean): RESTAR 2 a 3 CLICS (más fino).

CÁLCULOS OBLIGATORIOS SEGÚN EL MÉTODO:
1. Para Espresso: Ratio 1:2 a 1:2.5 (ej. Dosis ${dose}g -> Salida ${Math.round(dose * 2.2)}g). Tiempo 25s-30s.
2. Para V60 / Filtrado / AeroPress / Prensa: Ratio 1:15 a 1:16 (ej. Dosis ${dose}g -> Agua total ${Math.round(dose * 15)}g).
3. Molinos alternativos equivalentes: Comandante C40, Timemore C2/C3, Baratza Encore.

Debes responder ÚNICAMENTE con un JSON crudo (sin formato markdown ni \`\`\`json):
{
  "method": "${targetMethod}",
  "ratio": "${targetMethod === 'Espresso' ? '1:2.2' : '1:15'}",
  "water_total_g": ${targetMethod === 'Espresso' ? Math.round(dose * 2.2) : Math.round(dose * 15)},
  "grind": "${targetMethod === 'Espresso' ? 'Espresso Fino (1.3.5)' : 'Medio-Fino (2.4.5)'}",
  "grind_microns": "${targetMethod === 'Espresso' ? '1100 µm' : '1980 µm'}",
  "grind_adjustment_reason": "Explicación barística directa del ajuste de clics según tueste, proceso y altitud (máx 20 palabras)",
  "jmax_rot": ${targetMethod === 'Espresso' ? 1 : (targetMethod.includes('Prensa') ? 3 : (targetMethod.includes('Aero') ? 1 : 2))},
  "jmax_num": ${targetMethod === 'Espresso' ? 3 : (targetMethod.includes('Prensa') ? 2 : (targetMethod.includes('Aero') ? 9 : 4))},
  "jmax_click": ${targetMethod === 'Espresso' ? 5 : (targetMethod.includes('Prensa') ? 0 : (targetMethod.includes('Aero') ? 0 : 5))},
  "grinders": {
    "jmax": "${targetMethod === 'Espresso' ? '1.3.5 (1 Rot. 3 Núm. 5 Clics)' : '2.4.5 (2 Rot. 4 Núm. 5 Clics)'}",
    "comandante": "${targetMethod === 'Espresso' ? '8-10 clics' : '22-24 clics'}",
    "timemore": "${targetMethod === 'Espresso' ? '8-9 clics' : '16-18 clics'}",
    "baratza": "${targetMethod === 'Espresso' ? 'Ajuste 4-6' : 'Ajuste 14-16'}"
  },
  "temperature": ${targetMethod === 'Espresso' ? 92 : 93},
  "brew_time": "${targetMethod === 'Espresso' ? '28s' : '2:30 min'}",
  "pours": [
    { "step": 1, "label": "${targetMethod === 'Espresso' ? 'Pre-infusión Espresso' : 'Bloom / Pre-infusión'}", "water_g": ${targetMethod === 'Espresso' ? Math.round(dose * 0.5) : 60}, "total_water_g": ${targetMethod === 'Espresso' ? Math.round(dose * 0.5) : 60}, "time": "${targetMethod === 'Espresso' ? '0s - 5s' : '0:00 - 0:45'}", "description": "${targetMethod === 'Espresso' ? 'Pre-infusión a baja presión (3 bar) para humedecer la pastilla.' : 'Verter 60g de agua en espiral para desgasificar.'}" },
    { "step": 2, "label": "${targetMethod === 'Espresso' ? 'Extracción Principal (9 bar)' : '1º Vertido Principal'}", "water_g": ${targetMethod === 'Espresso' ? Math.round(dose * 2.2 - dose * 0.5) : Math.round(dose * 15 - 60)}, "total_water_g": ${Math.round(targetMethod === 'Espresso' ? dose * 2.2 : dose * 15)}, "time": "${targetMethod === 'Espresso' ? '5s - 28s' : '0:45 - 2:30'}", "description": "${targetMethod === 'Espresso' ? 'Rampa de presión continua a 9 bar hasta alcanzar volumen objetivo.' : 'Vertido continuo en pulso medio.'}" }
  ],
  "steps": [
    "Purgar y secar el portafiltro o recipiente.",
    "Pesar ${dose}g de café y moler en J-Max a la posición calibrada (${targetMethod === 'Espresso' ? '1.3.5' : '2.4.5'}).",
    "${targetMethod === 'Espresso' ? 'Distribuir con WDT, nivelar y apisonar con 15kg de fuerza.' : 'Realizar vertidos según la tabla de tiempos y gramos.'}",
    "Extraer y disfrutar."
  ],
  "notes": "${targetMethod === 'Espresso' ? 'Espresso denso y cremoso con crema persistente y acidez dulce muy integrada.' : 'Taza limpia, brillante y balanceada.'}"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ error: errData.error?.message || 'Error con la API de Gemini' });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const recommendation = JSON.parse(text);
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la recomendación: ' + err.message });
  }
});

// AI Recipe Re-calibration Endpoint (Smart Tuning based on Sensory Feedback)
app.post('/api/ai/tune-recipe', async (req, res) => {
  const apiKey = req.headers['x-gemini-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta la clave API de Gemini en las cabeceras' });
  }

  const { method, dose_in_g, ratio, temperature, jmax_rot, jmax_num, jmax_click, sensory_extraction, sensory_balance, sensory_body, user_notes, batch_name } = req.body;
  const dose = parseFloat(dose_in_g) || 20.0;

  const prompt = `Eres un Barista Campeón Mundial de Café de Especialidad. El usuario preparó una receta de café "${batch_name || 'Especialidad'}" con ${method}:
Dosis: ${dose}g, Ratio: ${ratio || '1:15'}, Temp: ${temperature || 93}°C, Molino J-Max: ${jmax_rot}.${jmax_num}.${jmax_click}.

Resultado Sensorial Evaluado:
- Extracción: ${sensory_extraction || 'Sub (Agrio)'}
- Balance: ${sensory_balance || 'Desconocido'}
- Cuerpo: ${sensory_body || 'Desconocido'}
- Notas del Barista: ${user_notes || 'Ninguna'}

RECALIBRA científicamente la receta para corregir los defectos (${sensory_extraction}) y alcanzar la taza perfecta.
Explica la corrección física aplicada y devuelve todos los parámetros corregidos (J-Max rot/num/click, molinos alternativos, vertidos y pasos).

Debes responder ÚNICAMENTE con un JSON crudo (sin formato markdown ni \`\`\`json):
{
  "correction_reason": "Explicación barística directa de la corrección (máx 25 palabras)",
  "method": "${method}",
  "ratio": "1:16",
  "water_total_g": ${Math.round(dose * 16)},
  "grind": "Medio-Fino Corregido",
  "grind_microns": "580 µm",
  "jmax_rot": ${jmax_rot},
  "jmax_num": ${jmax_num + 1 > 8 ? 0 : jmax_num + 1},
  "jmax_click": ${jmax_click},
  "grinders": {
    "jmax": "${jmax_rot}.${jmax_num + 1 > 8 ? 0 : jmax_num + 1}.${jmax_click}",
    "comandante": "23 clics",
    "timemore": "17 clics",
    "baratza": "Ajuste 15"
  },
  "temperature": 94,
  "brew_time": "2:35",
  "pours": [
    { "step": 1, "label": "Bloom Corregido", "water_g": 60, "total_water_g": 60, "time": "0:00 - 0:45", "description": "Bloom con agitación suave para evitar canalizaciones." },
    { "step": 2, "label": "1º Vertido Principal", "water_g": 140, "total_water_g": 200, "time": "0:45 - 1:30", "description": "Vertido continuo para mantener temperatura constante." },
    { "step": 3, "label": "2º Vertido Final", "water_g": 120, "total_water_g": 320, "time": "1:30 - 2:35", "description": "Finalizar extracción y asentar cama de café." }
  ],
  "steps": [
    "Ajustar molino J-Max a la nueva posición corregida.",
    "Aumentar temperatura de agua a 94°C.",
    "Seguir la nueva secuencia de vertidos indicada."
  ],
  "notes": "Taza dulzona, bien balanceada con excelente extracción y claridad limpia."
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ error: errData.error?.message || 'Error Gemini' });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const tunedRecommendation = JSON.parse(text);
    res.json(tunedRecommendation);
  } catch (err) {
    res.status(500).json({ error: 'Error al recalibrar la receta: ' + err.message });
  }
});

// Serve React front for fallback routing
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
