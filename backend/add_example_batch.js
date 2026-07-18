const { initDb } = require('./database');

async function run() {
  const db = await initDb();
  
  const batchId = 'geisha-volcan-azul';
  
  // Clean existing example if any
  await db.run('DELETE FROM recipes WHERE batch_id = ?', [batchId]);
  await db.run('DELETE FROM batches WHERE id = ?', [batchId]);

  // Insert example batch
  await db.run(`
    INSERT INTO batches (
      id, name, producer, altitude, variety, process, roaster, roaster_notes, 
      dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    batchId,
    'Geisha Volcán Azul',
    'Alejo Castro',
    '1600m',
    'Geisha',
    'Natural Anaeróbico',
    'Origen Tostadores',
    '[Notas: 🍒 Cereza, 🌸 Jazmín, 🍯 Miel, 🍋 Cítrico] | Taza limpia con cuerpo sedoso y acidez de mandarina dulce.',
    '20.0g',
    12,
    10,
    'Costa Rica',
    'Claro',
    '2026-06-25',
    '2026-07-02'
  ]);

  console.log('Example batch inserted successfully!');

  // Insert two recipes
  await db.run(`
    INSERT INTO recipes (
      batch_id, method, ratio, grind, temperature, brew_time, rating, notes, 
      sensory_balance, sensory_body, sensory_extraction, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', '-2 days'))
  `, [
    batchId,
    'V60 (Filtrado)',
    '16',
    '1.5.0', // Rot 1, Num 5, Click 0 = (90 + 50 + 0) * 8.8 = 1232 um
    '93°C',
    '2:45',
    5,
    'Increíble dulzor y claridad. Notas florales muy pronunciadas.',
    'Dulce',
    'Sedoso',
    'En Punto'
  ]);

  await db.run(`
    INSERT INTO recipes (
      batch_id, method, ratio, grind, temperature, brew_time, rating, notes, 
      sensory_balance, sensory_body, sensory_extraction, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', '-1 day'))
  `, [
    batchId,
    'V60 (Filtrado)',
    '15',
    '1.4.2', // Rot 1, Num 4, Click 2 = (90 + 40 + 2) * 8.8 = 1161.6 um
    '92°C',
    '2:30',
    4,
    'Un poco más ligera de cuerpo. Acidez viva y brillante.',
    'Ácido',
    'Ligero',
    'En Punto'
  ]);

  console.log('Example recipes inserted successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
