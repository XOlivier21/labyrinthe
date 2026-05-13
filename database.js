const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbFile = path.join(__dirname, 'labyrinth.sqlite3');
let db;

function openDb() {
  if (db) return db;
  const needInit = !fs.existsSync(dbFile);
  db = new sqlite3.Database(dbFile);
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    openDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    openDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    openDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  openDb();
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await run(`CREATE TABLE IF NOT EXISTS labyrinths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    size TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    maze TEXT NOT NULL,
    solution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`);

  const admin = await get('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!admin) {
    const defaultAdmin = {
      name: 'Administrateur',
      email: 'admin@labyrinthe.local',
      password: 'admin1234'
    };
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(defaultAdmin.password, salt);
    await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      defaultAdmin.name,
      defaultAdmin.email,
      hashed,
      'admin'
    ]);
  }
}

async function getUserByEmail(email) {
  return get('SELECT * FROM users WHERE email = ?', [email]);
}

async function getUserById(id) {
  return get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
}

async function createUser(name, email, passwordHash, role = 'user') {
  const result = await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
    name,
    email,
    passwordHash,
    role
  ]);
  return getUserById(result.lastID);
}

async function listUsers() {
  return all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
}

async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  if (updates.name) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.role) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(updates.password, salt);
    fields.push('password = ?');
    values.push(hash);
  }
  if (!fields.length) return getUserById(id);
  values.push(id);
  await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return getUserById(id);
}

async function deleteUser(id) {
  await run('DELETE FROM labyrinths WHERE user_id = ?', [id]);
  return run('DELETE FROM users WHERE id = ?', [id]);
}

async function createLabyrinth(userId, labyrinthData) {
  const result = await run(
    'INSERT INTO labyrinths (user_id, title, size, difficulty, maze, solution) VALUES (?, ?, ?, ?, ?, ?)',
    [
      userId,
      labyrinthData.title,
      labyrinthData.size,
      labyrinthData.difficulty,
      JSON.stringify(labyrinthData.maze),
      labyrinthData.solution ? JSON.stringify(labyrinthData.solution) : null
    ]
  );
  return getLabyrinthById(result.lastID);
}

async function listLabyrinthsByUser(userId) {
  const rows = await all('SELECT * FROM labyrinths WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map((row) => ({
    ...row,
    maze: JSON.parse(row.maze),
    solution: row.solution ? JSON.parse(row.solution) : null
  }));
}

async function getLabyrinthById(id) {
  const row = await get('SELECT * FROM labyrinths WHERE id = ?', [id]);
  if (!row) return null;
  return {
    ...row,
    maze: JSON.parse(row.maze),
    solution: row.solution ? JSON.parse(row.solution) : null
  };
}

async function updateLabyrinthById(id, updates) {
  const fields = [];
  const values = [];
  if (updates.title) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.size) {
    fields.push('size = ?');
    values.push(updates.size);
  }
  if (typeof updates.difficulty === 'number') {
    fields.push('difficulty = ?');
    values.push(updates.difficulty);
  }
  if (updates.maze) {
    fields.push('maze = ?');
    values.push(JSON.stringify(updates.maze));
  }
  if (updates.solution) {
    fields.push('solution = ?');
    values.push(JSON.stringify(updates.solution));
  }
  if (!fields.length) return getLabyrinthById(id);
  values.push(id);
  await run(`UPDATE labyrinths SET ${fields.join(', ')} WHERE id = ?`, values);
  return getLabyrinthById(id);
}

async function deleteLabyrinthById(id) {
  return run('DELETE FROM labyrinths WHERE id = ?', [id]);
}

async function listAllLabyrinths() {
  const rows = await all('SELECT l.*, u.name AS owner_name, u.email AS owner_email FROM labyrinths l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC');
  return rows.map((row) => ({
    ...row,
    maze: JSON.parse(row.maze),
    solution: row.solution ? JSON.parse(row.solution) : null
  }));
}

async function countUsers() {
  const row = await get('SELECT COUNT(*) AS count FROM users');
  return row ? row.count : 0;
}

async function countLabyrinthsByUser() {
  return all('SELECT u.id, u.name, u.email, COUNT(l.id) AS labyrinth_count FROM users u LEFT JOIN labyrinths l ON u.id = l.user_id GROUP BY u.id ORDER BY labyrinth_count DESC');
}

module.exports = {
  init,
  getUserByEmail,
  getUserById,
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  createLabyrinth,
  listLabyrinthsByUser,
  getLabyrinthById,
  updateLabyrinthById,
  deleteLabyrinthById,
  listAllLabyrinths,
  countUsers,
  countLabyrinthsByUser
};
