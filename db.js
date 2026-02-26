const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'messages.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    phone     TEXT NOT NULL,
    name      TEXT,
    body      TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    answered  INTEGER DEFAULT 0
  );
`);

/**
 * Guarda un mensaje entrante en la base de datos.
 * @param {string} phone  - Número del remitente (e.g. "5491112345678")
 * @param {string|null} name   - Nombre del contacto (puede ser null)
 * @param {string} body   - Contenido del mensaje
 * @returns {number} id del registro insertado
 */
function logMessage(phone, name, body) {
  const stmt = db.prepare(
    'INSERT INTO messages (phone, name, body) VALUES (?, ?, ?)'
  );
  const result = stmt.run(phone, name || null, body);
  return result.lastInsertRowid;
}

/**
 * Marca un mensaje como respondido.
 * @param {number} id - ID del registro en messages
 */
function markAnswered(id) {
  const stmt = db.prepare('UPDATE messages SET answered = 1 WHERE id = ?');
  stmt.run(id);
}

module.exports = { logMessage, markAnswered };
