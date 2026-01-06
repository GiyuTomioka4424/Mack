const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

module.exports = {
  config: {
    name: "players",
    aliases: ["playerlist", "plist"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const users = JSON.parse(fs.readFileSync(USERS_PATH));

    const ids = Object.keys(users);

    if (ids.length === 0) {
      return api.sendMessage(
        "👥 PLAYER LIST\n\nNo registered players yet.",
        event.threadID
      );
    }

    let msg =
      "╔════════════════════╗\n" +
      "👥 REGISTERED PLAYERS 👥\n" +
      "╚════════════════════╝\n\n";

    ids.forEach((uid, index) => {
      const name = users[uid]?.name || "Unknown";
      msg += `${index + 1}. 👤 ${name}\n   🆔 ${uid}\n\n`;
    });

    msg +=
      "━━━━━━━━━━━━━━━━━━\n" +
      `📊 Total Players: ${ids.length}`;

    api.sendMessage(msg, event.threadID);
  }
};