const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
  await db.run('PRAGMA foreign_keys = ON;');
  return db;
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
  
  return db;
}

module.exports = { getDb, initDb };
