const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const database = require('./database');
const auth = require('./auth');
const labyrinth = require('./labyrinth');
const admin = require('./admin');

async function createWindow() {
  await database.init();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function verifyTokenOrReject(token) {
  try {
    return auth.verifyToken(token);
  } catch (err) {
    throw new Error('Token invalide ou expiré');
  }
}

ipcMain.handle('register', async (event, { name, email, password }) => {
  return auth.registerUser({ name, email, password });
});

ipcMain.handle('login', async (event, { email, password }) => {
  return auth.loginUser({ email, password });
});

ipcMain.handle('getProfile', async (event, { token }) => {
  const payload = verifyTokenOrReject(token);
  const user = await database.getUserById(payload.id);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

ipcMain.handle('createLabyrinth', async (event, { token, labyrinthData }) => {
  const payload = verifyTokenOrReject(token);
  return database.createLabyrinth(payload.id, labyrinthData);
});

ipcMain.handle('getLabyrinths', async (event, { token }) => {
  const payload = verifyTokenOrReject(token);
  return database.listLabyrinthsByUser(payload.id);
});

ipcMain.handle('updateLabyrinth', async (event, { token, labyrinthId, updates }) => {
  const payload = verifyTokenOrReject(token);
  const labyrinthItem = await database.getLabyrinthById(labyrinthId);
  if (!labyrinthItem || labyrinthItem.user_id !== payload.id) {
    throw new Error('Accès refusé');
  }
  return database.updateLabyrinthById(labyrinthId, updates);
});

ipcMain.handle('deleteLabyrinth', async (event, { token, labyrinthId }) => {
  const payload = verifyTokenOrReject(token);
  const labyrinthItem = await database.getLabyrinthById(labyrinthId);
  if (!labyrinthItem || labyrinthItem.user_id !== payload.id) {
    throw new Error('Accès refusé');
  }
  return database.deleteLabyrinthById(labyrinthId);
});

ipcMain.handle('generateLabyrinth', async (event, { size, difficulty, title }) => {
  return labyrinth.generateMaze(size, difficulty, title);
});

ipcMain.handle('solveLabyrinth', async (event, { maze }) => {
  return labyrinth.solveMaze(maze);
});

ipcMain.handle('getAdminData', async (event, { token }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return admin.getAdminDashboard();
});

ipcMain.handle('getUsers', async (event, { token }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return database.listUsers();
});

ipcMain.handle('updateUser', async (event, { token, userId, updates }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return database.updateUser(userId, updates);
});

ipcMain.handle('deleteUser', async (event, { token, userId }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return database.deleteUser(userId);
});

ipcMain.handle('getAllLabyrinths', async (event, { token }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return database.listAllLabyrinths();
});

ipcMain.handle('deleteLabyrinthAdmin', async (event, { token, labyrinthId }) => {
  const payload = verifyTokenOrReject(token);
  if (payload.role !== 'admin') {
    throw new Error('Accès administrateur requis');
  }
  return database.deleteLabyrinthById(labyrinthId);
});
