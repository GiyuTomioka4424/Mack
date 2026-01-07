const ADMIN_UID = "61562953390569";

module.exports = {
  config: {
    name: "botnick",
    aliases: ["botname"],
    role: 0,
    cooldown: 10,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ You are not allowed to use this command.",
        threadID
      );
    }

    const newNickname = args.join(" ");
    if (!newNickname) {
      return api.sendMessage(
        "❌ Please provide a new nickname.\n\nExample:\nbotnick Macky Bot 🤖",
        threadID
      );
    }

    api.sendMessage(
      `🔄 Changing bot nickname to:\n"${newNickname}"\n\nPlease wait...`,
      threadID
    );

    api.getThreadList(100, null, ["INBOX"], async (err, threads) => {
      if (err) {
        return api.sendMessage("❌ Failed to get group list.", threadID);
      }

      let success = 0;
      let failed = 0;

      for (const thread of threads) {
        if (!thread.isGroup) continue;

        try {
          await api.changeNickname(
            newNickname,
            thread.threadID,
            api.getCurrentUserID()
          );
          success++;
        } catch {
          failed++;
        }

        // small delay to avoid rate-limit
        await new Promise(r => setTimeout(r, 250));
      }

      api.sendMessage(
        "╔════════════════════╗\n" +
        "🤖 BOT NICKNAME UPDATE\n" +
        "╚════════════════════╝\n\n" +
        `✅ Success: ${success} groups\n` +
        `❌ Failed: ${failed} groups\n\n` +
        `📛 New nickname:\n${newNickname}`,
        threadID
      );
    });
  }
};