const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

module.exports = {
  config: {
    name: "mineleaderboard",
    aliases: ["minetop", "topmine"],
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));

    /* REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    const list = Object.entries(users)
      .map(([uid, data]) => ({
        name: data.name || uid,
        mined: data.mined || 0
      }))
      .filter(u => u.mined > 0)
      .sort((a, b) => b.mined - a.mined)
      .slice(0, 10);

    if (list.length === 0) {
      return api.sendMessage(
        "⛏️ MINING LEADERBOARD\n\nNo mining data yet.",
        threadID
      );
    }

    let msg =
      "╔════════════════════╗\n" +
      "🏆 MINING LEADERBOARD\n" +
      "╚════════════════════╝\n\n";

    list.forEach((u, i) => {
      const medal =
        i === 0 ? "🥇" :
        i === 1 ? "🥈" :
        i === 2 ? "🥉" : "🔹";

      msg +=
        `${medal} ${i + 1}. ${u.name}\n` +
        `   💰 ₱${u.mined.toLocaleString()}\n`;
    });

    msg +=
      "\n━━━━━━━━━━━━━━━━━━\n" +
      "⛏️ Keep mining to climb the ranks!";

    api.sendMessage(msg, threadID);
  }
};