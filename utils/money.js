"use strict";

const fs = require("fs-extra");
const path = require("path");

const moneyPath = path.join(__dirname, "..", "data", "money.json");

function loadMoney() {
  try {
    return JSON.parse(fs.readFileSync(moneyPath, "utf8"));
  } catch {
    return {};
  }
}

function saveMoney(data) {
  fs.writeFileSync(moneyPath, JSON.stringify(data, null, 2));
}

function getMoney(uid) {
  const data = loadMoney();
  if (!data[uid]) {
    data[uid] = 0;
    saveMoney(data);
  }
  return data[uid];
}

function addMoney(uid, amount) {
  const data = loadMoney();
  if (!data[uid]) data[uid] = 0;
  data[uid] += amount;
  saveMoney(data);
  return data[uid];
}

function subtractMoney(uid, amount) {
  const data = loadMoney();
  if (!data[uid] || data[uid] < amount) return false;
  data[uid] -= amount;
  saveMoney(data);
  return true;
}

module.exports = {
  getMoney,
  addMoney,
  subtractMoney
};