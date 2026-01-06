const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "../data/users.json");

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUser(uid) {
  const users = loadUsers();
  return users[uid] || null;
}

function createUser(uid, name) {
  const users = loadUsers();
  if (users[uid]) return users[uid];

  users[uid] = {
    uid,
    name,
    money: 1000,
    bank: 0,
    loan: 0,
    registeredAt: Date.now()
  };

  saveUsers(users);
  return users[uid];
}

/* 🎨 DESIGN BOX */
function box(title, lines = []) {
  let msg = `╔══════════════════╗\n`;
  msg += `║ ${title.padEnd(16)} ║\n`;
  msg += `╠══════════════════╣\n`;
  for (const line of lines) {
    msg += `║ ${line.padEnd(16)} ║\n`;
  }
  msg += `╚══════════════════╝`;
  return msg;
}

module.exports = {
  loadUsers,
  saveUsers,
  getUser,
  createUser,
  box
};