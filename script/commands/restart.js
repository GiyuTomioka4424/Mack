module.exports = {
  config: {
    name: "restart",
    aliases: ["reboot"],
    role: 1,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const ADMIN_UID = "61562953390569";

    if (event.senderID !== ADMIN_UID) {
      return api.sendMessage(
        "❌ You are not allowed to restart the bot.",
        event.threadID
      );
    }

    api.sendMessage(
      "🔄 Restarting bot...\n\n⏳ Please wait a few seconds.",
      event.threadID,
      () => {
        // give Messenger time to deliver message
        setTimeout(() => {
          process.exit(0); // Render/Replit auto-restart
        }, 2000);
      }
    );
  }
};