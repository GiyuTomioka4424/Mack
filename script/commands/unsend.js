module.exports = {
  config: {
    name: "unsend",
    aliases: ["del"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID, messageReply } = event;

    /* ❌ MUST REPLY */
    if (!messageReply) {
      return api.sendMessage(
        "❌ Please reply to the bot message you want to unsend.",
        threadID
      );
    }

    /* ❌ ONLY BOT MESSAGE */
    if (messageReply.senderID !== api.getCurrentUserID()) {
      return api.sendMessage(
        "❌ You can only unsend bot messages.",
        threadID
      );
    }

    try {
      api.unsendMessage(messageReply.messageID);
    } catch (err) {
      api.sendMessage(
        "⚠️ Failed to unsend the message.",
        threadID
      );
    }
  }
};