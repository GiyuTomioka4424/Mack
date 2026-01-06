module.exports = {
  config: {
    name: "uid",
    aliases: ["id"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const { threadID, senderID, mentions, messageReply, body } = event;

    let targetID = senderID;

    // 📌 If reply
    if (messageReply) {
      targetID = messageReply.senderID;
    }

    // 📌 If mention
    else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // 📌 If FB profile link
    else if (body) {
      const match = body.match(/facebook\.com\/(?:profile\.php\?id=)?(\d+)/);
      if (match) {
        targetID = match[1];
      }
    }

    const msg =
      "╔══════════════╗\n" +
      "🆔 USER ID\n" +
      "╚══════════════╝\n\n" +
      `👤 UID:\n${targetID}\n\n` +
      "━━━━━━━━━━━━━━\n— Macky Bot V3";

    api.sendMessage(msg, threadID);
  }
};