const fs = require("fs");
const path = require("path");

const HISTORY_PATH = path.join(__dirname, "../../data/history.json");

if (!fs.existsSync(HISTORY_PATH)) {
  fs.writeFileSync(HISTORY_PATH, "[]");
}

module.exports = {
  config: {
    name: "prefix",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const history = JSON.parse(fs.readFileSync(HISTORY_PATH));
    const userData = history.find(u => u.userid === senderID);

    const prefix = userData?.prefix;

    /* 🚫 NO PREFIX */
    if (!prefix || prefix.trim() === "") {
      return api.sendMessage(
        "🤖 PREFIX INFO\n\n" +
        "❌ This bot has **NO PREFIX**\n\n" +
        "You can use commands directly.\n" +
        "Example:\n" +
        "help • shop • inventory",
        threadID
      );
    }

    /* ✅ HAS PREFIX */
    api.sendMessage(
      "🤖 PREFIX INFO\n\n" +
      `✅ Current Prefix: ${prefix}\n\n` +
      "Example:\n" +
      `${prefix}help`,
      threadID
    );
  }
};