const fs = require("fs");
const path = require("path");
const { createUser, box } = require("../../utils/userHelper");

// paths
const DATA_DIR = path.join(__dirname, "../../data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const BAL_PATH = path.join(DATA_DIR, "balance.json");
const INV_PATH = path.join(DATA_DIR, "inventory.json");

/* ================= SAFE FILE INIT ================= */
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(BAL_PATH)) {
  fs.writeFileSync(BAL_PATH, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(INV_PATH)) {
  fs.writeFileSync(INV_PATH, JSON.stringify({}, null, 2));
}

/* ================= COMMAND ================= */
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