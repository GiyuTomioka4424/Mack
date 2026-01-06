const fs = require("fs");
const PATH = "./data/users.json";

function loadUsers() {
  return JSON.parse(fs.readFileSync(PATH));
}

function saveUsers(users) {
  fs.writeFileSync(PATH, JSON.stringify(users, null, 2));
}

function getUser(uid) {
  const users = loadUsers();
  return { users, user: users[uid] };
}

module.exports = {
  loadUsers,
  saveUsers,
  getUser
};