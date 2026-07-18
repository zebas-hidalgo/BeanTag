const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function inspect() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Insert a test row with dates programmatically via SQLite to check if they write
  console.log("=== INSERTING TEST ROW ===");
  try {
    await db.run(
      `INSERT INTO batches (id, name, producer, total_doses, remaining_doses, roast_date, freeze_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['test-remote', 'Test Remote', 'Producer', 10, 10, '2026-07-01', '2026-07-02']
    );
    console.log("Insert successful!");
  } catch (e) {
    console.error("Insert failed:", e.message);
  }

  console.log("=== ROWS ===");
  const rows = await db.all("SELECT * FROM batches WHERE id = 'test-remote'");
  console.log(JSON.stringify(rows, null, 2));

  // Clean up
  await db.run("DELETE FROM batches WHERE id = 'test-remote'");
}

inspect().catch(console.error);
