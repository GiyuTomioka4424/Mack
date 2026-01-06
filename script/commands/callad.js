const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const ADMIN_UID = "61562953390569";

module.exports = {
  config: {
    name: "callad",
    aliases: ["calladmin", "admin"],
    role: 0,
    cooldown: 60,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* ================= REGISTER CHECK ================= */
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    if (!users[senderID]) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "📝 REGISTRATION REQUIRED\n" +
        "╚════════════════════╝\n\n" +
        "You must register first to call an admin.\n\n" +
        "➤ Use: register",
        threadID
      );
    }

    /* ================= MESSAGE CONTENT ================= */
    const reason = args.join(" ") || "No reason provided";

    const alertMsg =
      "╔════════════════════╗\n" +
      "🚨 ADMIN ALERT 🚨\n" +
      "╚════════════════════╝\n\n" +
      `👤 User ID : ${senderID}\n` +
      `💬 Reason : ${reason}\n` +
      `📌 Thread : ${threadID}\n\n` +
      "⚠️ Please check immediately.";

    /* ================= SEND TO ADMIN ================= */
    api.sendMessage(alertMsg, ADMIN_UID);

    /* ================= CONFIRM TO USER ================= */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "📞 ADMIN CALLED\n" +
      "╚════════════════════╝\n\n" +
      "✅ Your message has been sent to the admin.\n" +
      "⏳ Please wait patiently.",
      threadID
    );
  }
};