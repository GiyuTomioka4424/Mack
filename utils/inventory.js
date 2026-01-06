"use strict";

const fs = require("fs-extra");
const path = require("path");

const invPath = path.join(__dirname, "..", "data", "inventory.json");

function loadInv() {
  try {
    return JSON.parse(fs.readFileSync(invPath, "utf8"));
  } catch {
    return {};
  }
}

function saveInv(data) {
  fs.writeFileSync(invPath, JSON.stringify(data, null, 2));
}

function hasItem(uid, item) {
  const data = loadInv();
  return data[uid]?.includes(item);
}

function addItem(uid, item) {
  const data = loadInv();
  if (!data[uid]) data[uid] = [];
  if (!data[uid].includes(item)) data[uid].push(item);
  saveInv(data);
}

module.exports = {
  hasItem,
  addItem
};