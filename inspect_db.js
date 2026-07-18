const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function inspect() {
  const db = await open({
    filename: path.join(__dirname, 'backend', 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log("=== SCHEMA ===");
  const schema = await db.all("PRAGMA table_info(batches)");
  console.log(JSON.stringify(schema, null, 2));

  console.log("=== ROWS ===");
  const rows = await db.all("SELECT * FROM batches");
  console.log(JSON.stringify(rows, null, 2));
}

inspect().catch(console.error);
