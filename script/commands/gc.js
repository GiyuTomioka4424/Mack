module.exports = {
  config: {
    name: "gc",
    aliases: ["gclist", "groups"],
    role: 2, // admin only (change to 0 if you want everyone)
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { threadID } = event;

    if (args[0] !== "list") {
      return api.sendMessage(
        "📌 Usage:\n" +
        "gc list",
        threadID
      );
    }

    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      const groups = threads.filter(t => t.isGroup);

      if (groups.length === 0) {
        return api.sendMessage("❌ Bot is not in any group chats.", threadID);
      }

      let msg =
        "╔════════════════════╗\n" +
        "👥 GROUP CHAT LIST\n" +
        "╚════════════════════╝\n\n";

      groups.forEach((g, i) => {
        msg +=
          `${i + 1}. ${g.name || "Unnamed Group"}\n` +
          `🆔 ${g.threadID}\n\n`;
      });

      msg +=
        "━━━━━━━━━━━━━━━━━━\n" +
        `📊 Total Groups: ${groups.length}`;

      api.sendMessage(msg.trim(), threadID);
    } catch (err) {
      api.sendMessage(
        "❌ Failed to fetch group chats.\n" + err.message,
        threadID
      );
    }
  }
};