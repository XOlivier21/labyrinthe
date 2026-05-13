const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  register: (payload) => ipcRenderer.invoke('register', payload),
  login: (payload) => ipcRenderer.invoke('login', payload),
  getProfile: (payload) => ipcRenderer.invoke('getProfile', payload),
  createLabyrinth: (payload) => ipcRenderer.invoke('createLabyrinth', payload),
  getLabyrinths: (payload) => ipcRenderer.invoke('getLabyrinths', payload),
  updateLabyrinth: (payload) => ipcRenderer.invoke('updateLabyrinth', payload),
  deleteLabyrinth: (payload) => ipcRenderer.invoke('deleteLabyrinth', payload),
  generateLabyrinth: (payload) => ipcRenderer.invoke('generateLabyrinth', payload),
  solveLabyrinth: (payload) => ipcRenderer.invoke('solveLabyrinth', payload),
  getAdminData: (payload) => ipcRenderer.invoke('getAdminData', payload),
  getUsers: (payload) => ipcRenderer.invoke('getUsers', payload),
  updateUser: (payload) => ipcRenderer.invoke('updateUser', payload),
  deleteUser: (payload) => ipcRenderer.invoke('deleteUser', payload),
  getAllLabyrinths: (payload) => ipcRenderer.invoke('getAllLabyrinths', payload),
  deleteLabyrinthAdmin: (payload) => ipcRenderer.invoke('deleteLabyrinthAdmin', payload)
});
