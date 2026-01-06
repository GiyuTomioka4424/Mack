const fs = require("fs");
const path = require("path");
const { createUser, box } = require("../../utils/userHelper");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

module.exports = {
  config: {
    name: "register",
    aliases: ["reg"],
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    /* ❌ ALREADY REGISTERED */
    if (users[event.senderID]) {
      return api.sendMessage(
        "❌ You are already registered.\nUse inventory / bank / shop.",
        event.threadID
      );
    }

    const name = args.join(" ") || "User";

    // existing helper (kept)
    const user = createUser(event.senderID, name);

    /* ✅ SYNC FILE-BASED SYSTEM */
    users[event.senderID] = {
      name: user.name
    };

    balance[event.senderID] = user.money || 0;
    inventory[event.senderID] = {};

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    const msg = box("📝 REGISTERED SUCCESSFULLY", [
      `👤 Name: ${user.name}`,
      `👛 Cash: ₱${user.money}`,
      `🏦 Bank: ₱${user.bank}`,
      `💳 Loan: ₱0`,
      "",
      "🎉 You can now use:",
      "shop • inventory • slot • lotto • sabong"
    ]);

    api.sendMessage(msg, event.threadID);
  }
};