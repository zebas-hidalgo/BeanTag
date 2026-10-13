const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
    await dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

async function initDb() {
  const db = await getDb();
  
  // Create batches table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      producer TEXT NOT NULL,
      altitude TEXT,
      variety TEXT,
      process TEXT,
      roaster TEXT,
      roaster_notes TEXT,
      dose_weight TEXT DEFAULT '20.0g',
      total_doses INTEGER NOT NULL,
      remaining_doses INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.exec('ALTER TABLE batches ADD COLUMN origin TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN roast_level TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN roast_date TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN freeze_date TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN total_weight_g REAL DEFAULT 0;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN remaining_weight_g REAL DEFAULT 0;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN sca_score REAL;');
  } catch (e) {}

  // Create recipes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      method TEXT NOT NULL,
      ratio TEXT,
      grind TEXT,
      temperature TEXT,
      brew_time TEXT,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
    )
  `);

  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN sensory_balance TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN sensory_body TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN sensory_extraction TEXT;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN dose_in_g REAL;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN dose_out_g REAL;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN espresso_pressure REAL;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN espresso_preinfusion INTEGER;');
  } catch (e) {}

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      picture TEXT,
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.exec('ALTER TABLE batches ADD COLUMN user_id INTEGER;');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE recipes ADD COLUMN user_id INTEGER;');
  } catch (e) {}

  await db.exec('CREATE INDEX IF NOT EXISTS idx_recipes_batch_id ON recipes(batch_id);');
  
  // Create tube_racks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tube_racks (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      name TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create tube_rack_slots table (6 slots per rack, 2x3 grid)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tube_rack_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rack_id TEXT NOT NULL,
      position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 6),
      batch_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rack_id) REFERENCES tube_racks(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
      UNIQUE(rack_id, position)
    )
  `);

  await db.exec('CREATE INDEX IF NOT EXISTS idx_tube_slots_rack ON tube_rack_slots(rack_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_tube_slots_batch ON tube_rack_slots(batch_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_tube_racks_user ON tube_racks(user_id);');

  return db;
}

module.exports = { getDb, initDb };
