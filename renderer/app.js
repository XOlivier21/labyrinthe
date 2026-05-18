const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const navContainer = document.getElementById('nav');
const userWelcome = document.getElementById('user-welcome');
const userRole = document.getElementById('user-role');
const authMessage = document.getElementById('auth-message');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');
const difficultyValue = document.getElementById('difficulty-value');
const labyrinthDifficulty = document.getElementById('labyrinth-difficulty');
const generateButton = document.getElementById('generate-button');
const saveButton = document.getElementById('save-button');
const generatedPreview = document.getElementById('generated-preview');
const labyrinthPreview = document.getElementById('labyrinth-preview');
const labyrinthList = document.getElementById('labyrinth-list');
const solveList = document.getElementById('solve-list');
const solutionPreview = document.getElementById('solution-preview');
const messageArea = document.getElementById('message-area');
const adminTab = document.getElementById('admin-tab');
const adminStats = document.getElementById('admin-stats');
const userList = document.getElementById('user-list');
const globalLabyrinthList = document.getElementById('global-labyrinth-list');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

let currentToken = localStorage.getItem('labyrinth_token');
let currentUser = null;
let generatedMazeData = null;

let isPlaying = false;
let currentPlayMaze = null;
let playerPos = null;
let playPath = [];
let playTargetElement = null;

document.addEventListener('keydown', (e) => {
  if (!isPlaying || !playerPos || !currentPlayMaze) return;
  
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }

  const maze = currentPlayMaze;
  let dx = 0, dy = 0;
  
  if (e.key === 'ArrowUp') dy = -1;
  else if (e.key === 'ArrowDown') dy = 1;
  else if (e.key === 'ArrowLeft') dx = -1;
  else if (e.key === 'ArrowRight') dx = 1;
  else return;

  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;

  if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height && maze.cells[ny][nx] !== 1) {
    playerPos.x = nx;
    playerPos.y = ny;
    playPath.push({ ...playerPos });
    
    renderMazePreview(maze, playPath, playTargetElement, true);
    
    if (playerPos.x === maze.end.x && playerPos.y === maze.end.y) {
      isPlaying = false;
      showMessage('Félicitations ! Vous avez résolu le labyrinthe en ' + (playPath.length - 1) + ' déplacements !');
    }
  }
});

function showRenameModal(currentTitle, onValidate) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal-content card';
  
  const title = document.createElement('h3');
  title.textContent = 'Renommer le labyrinthe';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  
  const row = document.createElement('div');
  row.className = 'label-row';
  
  const btnCancel = document.createElement('button');
  btnCancel.className = 'secondary';
  btnCancel.textContent = 'Annuler';
  btnCancel.onclick = () => document.body.removeChild(overlay);
  
  const btnValidate = document.createElement('button');
  btnValidate.textContent = 'Valider';
  btnValidate.onclick = () => {
    const newVal = input.value;
    document.body.removeChild(overlay);
    onValidate(newVal);
  };
  
  row.appendChild(btnCancel);
  row.appendChild(btnValidate);
  modal.appendChild(title);
  modal.appendChild(input);
  modal.appendChild(row);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  input.focus();
}

function showMessage(message) {
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.classList.remove('hidden');
  }
  if (messageArea) {
    messageArea.textContent = message;
    messageArea.classList.remove('hidden');
  }
}

function clearMessage() {
  if (authMessage) {
    authMessage.textContent = '';
    authMessage.classList.add('hidden');
  }
  if (messageArea) {
    messageArea.textContent = '';
    messageArea.classList.add('hidden');
  }
}

function setActiveTab(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== tabName);
    panel.classList.toggle('active', panel.id === tabName);
  });
}

tabs.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
    if (button.dataset.tab === 'admin-tab') {
      loadAdminData();
    }
  });
});

document.querySelectorAll('#auth-section input').forEach(input => {
  input.addEventListener('input', clearMessage);
});

labyrinthDifficulty.addEventListener('input', () => {
  difficultyValue.textContent = labyrinthDifficulty.value;
});

loginButton.addEventListener('click', async () => {
  clearMessage();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const result = await window.api.login({ email, password });
    currentToken = result.token;
    currentUser = result.user;
    localStorage.setItem('labyrinth_token', currentToken);
    enterDashboard();
  } catch (err) {
    showMessage(err.message);
  }
});

registerButton.addEventListener('click', async () => {
  clearMessage();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  try {
    const result = await window.api.register({ name, email, password });
    currentToken = result.token;
    currentUser = result.user;
    localStorage.setItem('labyrinth_token', currentToken);
    enterDashboard();
  } catch (err) {
    showMessage(err.message);
  }
});

logoutButton.addEventListener('click', () => {
  currentToken = null;
  currentUser = null;
  localStorage.removeItem('labyrinth_token');
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
});

generateButton.addEventListener('click', async () => {
  const title = document.getElementById('labyrinth-title').value.trim() || 'Nouveau labyrinthe';
  const size = document.getElementById('labyrinth-size').value;
  const difficulty = Number(document.getElementById('labyrinth-difficulty').value);
  try {
    const maze = await window.api.generateLabyrinth({ size, difficulty, title });
    generatedMazeData = maze;
    saveButton.disabled = false;
    renderMazePreview(maze, []);
    
    isPlaying = true;
    currentPlayMaze = maze;
    playerPos = { x: maze.start.x, y: maze.start.y };
    playPath = [{ ...playerPos }];
    playTargetElement = generatedPreview;
    
    renderMazePreview(maze, playPath, playTargetElement, true);
    clearMessage();
  } catch (err) {
    showMessage(err.message);
  }
});

saveButton.addEventListener('click', async () => {
  if (!generatedMazeData) {
    showMessage('Générez d’abord un labyrinthe.');
    return;
  }
  try {
    await window.api.createLabyrinth({ token: currentToken, labyrinthData: {
      title: generatedMazeData.title,
      size: generatedMazeData.size,
      difficulty: generatedMazeData.difficulty,
      maze: generatedMazeData,
      solution: []
    }});
    showMessage('Labyrinthe enregistré.');
    saveButton.disabled = true;
    generatedMazeData = null;
    generatedPreview.innerHTML = '';
    await loadLabyrinths();
  } catch (err) {
    showMessage(err.message);
  }
});

async function loadLabyrinths() {
  const labyrinths = await window.api.getLabyrinths({ token: currentToken });
  labyrinthList.innerHTML = labyrinths.length ? '' : '<p>Aucun labyrinthe enregistré.</p>';
  labyrinths.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'labyrinth-card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>Tailles: ${item.size} • Difficulté: ${item.difficulty}</p>
      <div class="label-row">
        <button class="view-button secondary">Voir</button>
        <button class="play-button" style="background: linear-gradient(135deg, #FBBF24, #D97706); color: #FFF; border: none;">Jouer</button>
        <button class="solve-button">Résoudre</button>
        <button class="export-button secondary">Exporter PNG</button>
        <button class="rename-button secondary">Renommer</button>
        <button class="delete-button danger">Supprimer</button>
      </div>
    `;
    card.querySelector('.view-button').addEventListener('click', () => {
      isPlaying = false;
      renderMazePreview(item.maze, item.solution || [], labyrinthPreview);
    });
    card.querySelector('.play-button').addEventListener('click', () => {
      isPlaying = true;
      currentPlayMaze = item.maze;
      playerPos = { x: item.maze.start.x, y: item.maze.start.y };
      playPath = [{ ...playerPos }];
      playTargetElement = labyrinthPreview;
      renderMazePreview(item.maze, playPath, playTargetElement, true);
      clearMessage();
      if (labyrinthPreview) labyrinthPreview.scrollIntoView({ behavior: 'smooth' });
    });
    card.querySelector('.solve-button').addEventListener('click', async () => {
      isPlaying = false;
      const solution = await window.api.solveLabyrinth({ maze: item.maze });
      renderMazePreview(item.maze, solution, labyrinthPreview);
    });
    card.querySelector('.export-button').addEventListener('click', () => {
      exportMazeToPNG(item.maze, []);
    });
    card.querySelector('.rename-button').addEventListener('click', () => {
      showRenameModal(item.title, async (newTitle) => {
        if (newTitle && newTitle.trim()) {
          try {
            if (window.api.updateLabyrinth) {
              await window.api.updateLabyrinth({
                token: currentToken,
                labyrinthId: item.id,
                updates: { title: newTitle.trim() },
              });
            } else {
              // Contournement si l'API update n'est pas encore implémentée
              const newMazeData = {
                title: newTitle.trim(),
                size: item.size,
                difficulty: item.difficulty,
                maze: { ...item.maze, title: newTitle.trim() },
                solution: item.solution || []
              };
              await window.api.createLabyrinth({ token: currentToken, labyrinthData: newMazeData });
              await window.api.deleteLabyrinth({ token: currentToken, labyrinthId: item.id });
            }
            await loadLabyrinths();
          } catch (err) {
            showMessage(err.message);
          }
        }
      });
    });
    card.querySelector('.delete-button').addEventListener('click', async () => {
      if (!confirm('Supprimer ce labyrinthe ?')) return;
      await window.api.deleteLabyrinth({ token: currentToken, labyrinthId: item.id });
      await loadLabyrinths();
    });
    labyrinthList.appendChild(card);
  });

  await populateSolveList();
}

function renderMazePreview(maze, path = [], targetElement = generatedPreview, isPlayingRender = false) {
  if (!targetElement) return;
  targetElement.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'maze-header';
  const title = document.createElement('div');
  title.className = 'maze-title';
  title.textContent = maze.title || 'Aperçu du Labyrinthe';
  const meta = document.createElement('div');
  meta.className = 'maze-meta';
  meta.textContent = `Taille : ${maze.size} – Difficulté : ${maze.difficulty}`;
  header.appendChild(title);
  header.appendChild(meta);
  targetElement.appendChild(header);

  const preview = document.createElement('div');
  preview.className = 'maze-grid';
  preview.style.gridTemplateColumns = `repeat(${maze.width}, 16px)`;
  const pathSet = new Set((path || []).map((pos) => `${pos.x}|${pos.y}`));
  for (let y = 0; y < maze.height; y += 1) {
    for (let x = 0; x < maze.width; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'maze-cell';
      if (maze.cells[y][x] === 1) {
        cell.classList.add('wall');
      } else {
        if (pathSet.has(`${x}|${y}`)) {
          cell.classList.add('path');
        }
        if (maze.start.x === x && maze.start.y === y) cell.classList.add('start');
        if (maze.end.x === x && maze.end.y === y) cell.classList.add('end');
        
        if (isPlayingRender && path && path.length) {
          const lastPos = path[path.length - 1];
          if (lastPos.x === x && lastPos.y === y) {
            cell.classList.add('player');
          }
        }
      }
      preview.appendChild(cell);
    }
  }
  targetElement.appendChild(preview);
  if (path.length) {
    const metaResult = document.createElement('p');
    metaResult.textContent = `Solution trouvée (${path.length} étapes)`;
    if (isPlayingRender) {
      metaResult.textContent = `Déplacements : ${path.length - 1}`;
    } else {
      metaResult.textContent = `Solution trouvée (${path.length} étapes)`;
    }
    metaResult.className = 'maze-meta';
    targetElement.appendChild(metaResult);
  }
}

async function enterDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  userWelcome.textContent = `Bienvenue, ${currentUser.name}`;
  userRole.textContent = `Rôle: ${currentUser.role}`;
  
  const adminTabBtn = document.querySelector('.tab[data-tab="admin-tab"]');

  if (currentUser.role !== 'admin') {
    adminTab.classList.add('hidden');
    if (adminTabBtn) adminTabBtn.classList.add('hidden');
  } else {
    adminTab.classList.remove('hidden');
    if (adminTabBtn) adminTabBtn.classList.remove('hidden');
  }
  setActiveTab('labyrinth-tab');
  await loadLabyrinths();
}

async function populateSolveList() {
  const labyrinths = await window.api.getLabyrinths({ token: currentToken });
  solveList.innerHTML = labyrinths.length ? '' : '<p>Aucun labyrinthe à résoudre.</p>';
  labyrinths.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'labyrinth-card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.size} • difficulté ${item.difficulty}</p>
      <div class="label-row">
        <button class="solve-button">Voir solution</button>
        <button class="play-button" style="background: linear-gradient(135deg, #FBBF24, #D97706); color: #FFF; border: none;">Jouer</button>
        <button class="export-button secondary hidden">Exporter PNG</button>
      </div>
    `;
    card.querySelector('.solve-button').addEventListener('click', async () => {
      isPlaying = false;
      const solution = await window.api.solveLabyrinth({ maze: item.maze });
      solutionPreview.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'maze-grid';
      container.style.gridTemplateColumns = `repeat(${item.maze.width}, 16px)`;
      const pathSet = new Set(solution.map((pos) => `${pos.x}|${pos.y}`));
      for (let y = 0; y < item.maze.height; y += 1) {
        for (let x = 0; x < item.maze.width; x += 1) {
          const cell = document.createElement('div');
          cell.className = 'maze-cell';
          if (item.maze.cells[y][x] === 1) {
            cell.classList.add('wall');
          } else {
            if (pathSet.has(`${x}|${y}`)) {
              cell.classList.add('path');
            }
            if (item.maze.start.x === x && item.maze.start.y === y) cell.classList.add('start');
            if (item.maze.end.x === x && item.maze.end.y === y) cell.classList.add('end');
          }
          container.appendChild(cell);
        }
      }
      solutionPreview.appendChild(container);
      const info = document.createElement('p');
      info.textContent = `Chemin solution: ${solution.length} cases`;
      solutionPreview.appendChild(info);
      renderMazePreview(item.maze, solution, solutionPreview);

      const exportBtn = card.querySelector('.export-button');
      exportBtn.classList.remove('hidden');
      exportBtn.onclick = () => exportMazeToPNG(item.maze, solution);
    });
    card.querySelector('.play-button').addEventListener('click', () => {
      isPlaying = true;
      currentPlayMaze = item.maze;
      playerPos = { x: item.maze.start.x, y: item.maze.start.y };
      playPath = [{ ...playerPos }];
      playTargetElement = solutionPreview;
      renderMazePreview(item.maze, playPath, playTargetElement, true);
      clearMessage();
      if (solutionPreview) solutionPreview.scrollIntoView({ behavior: 'smooth' });
      
      const exportBtn = card.querySelector('.export-button');
      exportBtn.classList.add('hidden');
    });
    solveList.appendChild(card);
  });
}

async function loadAdminData() {
  if (currentUser.role !== 'admin') return;
  const dashboard = await window.api.getAdminData({ token: currentToken });
  adminStats.innerHTML = `
    <div class="admin-card"><h3>Total utilisateurs</h3><p>${dashboard.totalUsers}</p></div>
    <div class="admin-card"><h3>Total labyrinthes</h3><p>${dashboard.totalLabyrinths}</p></div>
  `;
  const users = await window.api.getUsers({ token: currentToken });
  userList.innerHTML = users.length ? '' : '<p>Aucun utilisateur trouvé.</p>';
  users.forEach((user) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <h3>${user.name}</h3>
      <p>${user.email}</p>
      <p>Role: ${user.role}</p>
      <button class="delete-user">Supprimer</button>
    `;
    card.querySelector('.delete-user').addEventListener('click', async () => {
      if (!confirm('Supprimer cet utilisateur et ses labyrinthes ?')) return;
      await window.api.deleteUser({ token: currentToken, userId: user.id });
      await loadAdminData();
    });
    userList.appendChild(card);
  });
  const labyrinths = await window.api.getAllLabyrinths({ token: currentToken });
  globalLabyrinthList.innerHTML = labyrinths.length ? '' : '<p>Aucun labyrinthe global.</p>';
  labyrinths.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>Créé par ${item.owner_name} (${item.owner_email})</p>
      <p>${item.size} • difficulté ${item.difficulty}</p>
      <button class="delete-labyrinth">Supprimer</button>
    `;
    card.querySelector('.delete-labyrinth').addEventListener('click', async () => {
      if (!confirm('Supprimer ce labyrinthe ?')) return;
      await window.api.deleteLabyrinthAdmin({ token: currentToken, labyrinthId: item.id });
      await loadAdminData();
    });
    globalLabyrinthList.appendChild(card);
  });
}

async function restoreSession() {
  if (!currentToken) return;
  try {
    const profile = await window.api.getProfile({ token: currentToken });
    currentUser = profile;
    enterDashboard();
  } catch (err) {
    currentToken = null;
    localStorage.removeItem('labyrinth_token');
  }
}

restoreSession();

function exportMazeToPNG(maze, path = []) {
  const canvas = document.createElement('canvas');
  const cellSize = 20; // 20 pixels par case
  canvas.width = maze.width * cellSize;
  canvas.height = maze.height * cellSize;
  const ctx = canvas.getContext('2d');

  const pathSet = new Set((path || []).map((pos) => `${pos.x}|${pos.y}`));

  ctx.fillStyle = '#12121A'; // Arrière-plan magique sombre
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < maze.height; y += 1) {
    for (let x = 0; x < maze.width; x += 1) {
      if (maze.cells[y][x] === 1) {
        ctx.fillStyle = '#5B21B6'; // Murs magiques contrastés
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      } else {
        ctx.fillStyle = '#181825'; // Chemins très sombres
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

        if (pathSet.has(`${x}|${y}`)) {
          ctx.fillStyle = '#A78BFA'; // Violet magique (Solution)
          ctx.beginPath();
          ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }
        if (maze.start.x === x && maze.start.y === y) {
          ctx.fillStyle = '#34D399'; // Départ
          ctx.beginPath();
          ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
        if (maze.end.x === x && maze.end.y === y) {
          ctx.fillStyle = '#F43F5E'; // Arrivée
          ctx.beginPath();
          ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }

  // Simuler le téléchargement
  const link = document.createElement('a');
  link.download = `${maze.title || 'labyrinthe'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.title = "Le labyrinthe de Dédale";
const headerEl = document.querySelector('header h1');
if (headerEl) headerEl.textContent = "Le labyrinthe de Dédale";
