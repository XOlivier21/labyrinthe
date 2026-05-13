const database = require('./database');

async function getAdminDashboard() {
  const totalUsers = await database.countUsers();
  const labyrinthsByUser = await database.countLabyrinthsByUser();
  const totalLabyrinths = labyrinthsByUser.reduce((sum, row) => sum + row.labyrinth_count, 0);
  return {
    totalUsers,
    totalLabyrinths,
    labyrinthsByUser
  };
}

module.exports = {
  getAdminDashboard
};
