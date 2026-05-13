function generateMaze(size, difficulty, title = 'Labyrinthe') {
  const dimensions = {
    small: { width: 15, height: 11 },
    medium: { width: 29, height: 21 },
    large: { width: 41, height: 31 }
  };
  const { width, height } = dimensions[size] || dimensions.medium;
  
  const grid = Array.from({ length: height }, () => Array(width).fill(1));
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  function carvePath(x, y) {
    visited[y][x] = true;
    const directions = [
      { dx: 0, dy: -2 }, // up
      { dx: 2, dy: 0 },  // right
      { dx: 0, dy: 2 },  // down
      { dx: -2, dy: 0 }  // left
    ].sort(() => Math.random() - 0.5);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[ny][nx]) {
        grid[y + dy / 2][x + dx / 2] = 0;
        grid[ny][nx] = 0;
        carvePath(nx, ny);
      }
    }
  }

  grid[1][1] = 0;
  carvePath(1, 1);

  const start = { x: 1, y: 1 };
  const end = { x: width - 2, y: height - 2 };
  grid[start.y][start.x] = 0;
  grid[end.y][end.x] = 0;

  const maze = {
    title,
    width,
    height,
    size,
    difficulty,
    start,
    end,
    cells: grid
  };

  return maze;
}

function solveMaze(maze) {
  const { width, height, start, end, cells } = maze;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
  visited[start.y][start.x] = true;
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  while (queue.length) {
    const current = queue.shift();
    if (current.x === end.x && current.y === end.y) {
      return current.path;
    }
    for (const direction of directions) {
      const nx = current.x + direction.dx;
      const ny = current.y + direction.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx] && cells[ny][nx] === 0) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
      }
    }
  }

  return [];
}

module.exports = {
  generateMaze,
  solveMaze
};
