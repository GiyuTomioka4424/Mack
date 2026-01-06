module.exports = {
  config: {
    name: "help",
    aliases: ["h", "menu"],
    role: 0,
    cooldown: 5,
    hasPrefix: true
  },

  run({ api, event }) {
    const commands = [];

    // collect unique command names
    const seen = new Set();
    global.Utils?.commands?.forEach(cmd => {
      if (!seen.has(cmd.config.name)) {
        seen.add(cmd.config.name);
        commands.push(cmd.config.name);
      }
    });

    const prefix = event.body.startsWith("/") ? "/" : "";

    let msg =
      "╔════════════════════╗\n" +
      "✨ 𝗠𝗔𝗖𝗞𝗬 𝗕𝗢𝗧 — HELP ✨\n" +
      "╚════════════════════╝\n\n";

    msg += "📌 Available Commands:\n\n";

    commands.sort().forEach((cmd, i) => {
      msg += ` ${i + 1}. ${cmd}\n`;
    });

    msg +=
      "\n━━━━━━━━━━━━━━━━━━\n" +
      "ℹ️ How to use:\n" +
      `➤ ${prefix}command\n\n` +
      "⚙️ Notes:\n" +
      "• Some commands require registration\n" +
      "• Some commands are admin-only\n\n" +
      "🤖 Macky Bot is online & ready!";

    api.sendMessage(msg, event.threadID);
  }
};