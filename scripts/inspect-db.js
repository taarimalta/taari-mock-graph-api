const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('prisma/dev.db');
db.all('SELECT id, name FROM Animal ORDER BY name ASC, id ASC LIMIT 10;', [], (err, rows) => {
  if (err) throw err;
  console.log('First 10 animals:', rows);
  db.close();
});
