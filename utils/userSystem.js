const fs = require("fs");
const path = "./data/users.json";

function loadUsers() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  return JSON.parse(fs.readFileSync(path));
}

function saveUsers(users) {
  fs.writeFileSync(path, JSON.stringify(users, null, 2));
}

function isRegistered(userID) {
  const users = loadUsers();
  return users[userID] !== undefined;
}

function registerUser(userID, name) {
  const users = loadUsers();

  if (users[userID]) return false;

  users[userID] = {
    name,
    cash: 1000,
    bank: 0
  };

  saveUsers(users);
  return true;
}

module.exports = {
  isRegistered,
  registerUser,
  loadUsers,
  saveUsers
};