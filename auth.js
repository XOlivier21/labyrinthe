const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./database');

const JWT_SECRET = 'labyrinthe_secret_2026';
const JWT_EXPIRES_IN = '7d';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function registerUser({ name, email, password }) {
  const existing = await database.getUserByEmail(email.toLowerCase());
  if (existing) {
    throw new Error('Cet email est déjà utilisé.');
  }
  const passwordHash = await hashPassword(password);
  const user = await database.createUser(name, email.toLowerCase(), passwordHash, 'user');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

async function loginUser({ email, password }) {
  const user = await database.getUserByEmail(email.toLowerCase());
  if (!user) {
    throw new Error('Email ou mot de passe incorrect.');
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Email ou mot de passe incorrect.');
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  hashPassword
};
