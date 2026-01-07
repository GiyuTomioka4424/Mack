const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

/* ❌ DISALLOWED NAMES */
const BLOCKED_NAMES = [
  "user",
  "admin",
  "administrator",
  "bot",
  "system",
  "moderator",
  "owner",
  "support",
  "null",
  "undefined"
];

module.exports = {
  config: {
    name: "register",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;
    const users = JSON.parse(fs.readFileSync(USERS_PATH));

    if (users[senderID]) {
      return api.sendMessage(
        "⚠️ You are already registered.",
        threadID
      );
    }

    const name = args.join(" ").trim();

    /* ❌ EMPTY NAME */
    if (!name) {
      return api.sendMessage(
        "📝 REGISTRATION\n\n" +
        "Usage:\nregister <your name>\n\n" +
        "Example:\nregister Gab Yu",
        threadID
      );
    }

    /* ❌ LENGTH CHECK */
    if (name.length < 3 || name.length > 20) {
      return api.sendMessage(
        "❌ Invalid name length.\n\n" +
        "Name must be **3–20 characters long**.",
        threadID
      );
    }

    /* ❌ LETTERS ONLY */
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return api.sendMessage(
        "❌ Invalid name.\n\n" +
        "Only letters and spaces are allowed.",
        threadID
      );
    }

    /* ❌ BLOCKED WORDS */
    const normalized = name.toLowerCase().replace(/\s+/g, "");
    if (BLOCKED_NAMES.includes(normalized)) {
      return api.sendMessage(
        "⛔ This name is not allowed.\n\n" +
        "Please choose a **unique personal name**.",
        threadID
      );
    }

    /* ✅ REGISTER */
    users[senderID] = {
      name,
      money: 0,
      registeredAt: Date.now()
    };

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    api.sendMessage(
      "╔════════════════════╗\n" +
      "✅ REGISTERED SUCCESSFULLY\n" +
      "╚════════════════════╝\n\n" +
      `👤 Name: ${name}\n` +
      `🆔 ID: ${senderID}\n\n` +
      "🎉 Welcome to Macky Bot!",
      threadID
    );
  }
};