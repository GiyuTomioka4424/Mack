module.exports = {
  config: {
    name: "announcement",
    aliases: ["announce", "broadcast"],
    role: 0,
    cooldown: 10,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const ADMIN_UID = "61562953390569";
    const { senderID, threadID } = event;

    // 🔒 ADMIN CHECK
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ ACCESS DENIED\n\nOnly the bot admin can send announcements.",
        threadID
      );
    }

    const message = args.join(" ");
    if (!message) {
      return api.sendMessage(
        "📢 ANNOUNCEMENT USAGE\n\n" +
        "announcement <your message>\n\n" +
        "Example:\nannouncement Server maintenance at 10PM",
        threadID
      );
    }

    // GET ALL GROUP CHATS
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);

    let success = 0;
    let failed = 0;

    const announceMsg =
      "📢━━━━━━━━━━━━━━━━━━📢\n" +
      "      📣 ANNOUNCEMENT\n" +
      "📢━━━━━━━━━━━━━━━━━━📢\n\n" +
      `${message}\n\n` +
      "— Macky Bot V3 🤖";

    for (const g of groups) {
      try {
        await api.sendMessage(announceMsg, g.threadID);
        success++;
      } catch (e) {
        failed++;
      }
    }

    api.sendMessage(
      "✅ ANNOUNCEMENT SENT\n\n" +
      `📨 Sent to: ${success} groups\n` +
      `❌ Failed: ${failed}`,
      threadID
    );
  }
};