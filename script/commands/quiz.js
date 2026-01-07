const axios = require("axios");
const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

const CATEGORIES = [
  "gk","music","videogame","naturescience","computerscience",
  "math","mythology","sports","geography","history",
  "politics","art","celebrety","anime","cartoon"
];

module.exports = {
  config: {
    name: "quiz",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    /* 🔒 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] ??= 0;

    /* ================= LIST ================= */
    if (args[0] === "list") {
      return api.sendMessage(
        "📚 QUIZ CATEGORIES\n\n" +
        CATEGORIES.join(", "),
        threadID
      );
    }

    /* ================= TOP ================= */
    if (args[0] === "top") {
      const sorted = Object.entries(balance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (!sorted.length) {
        return api.sendMessage("No players yet.", threadID);
      }

      let msg =
        "╔════════════════════╗\n" +
        "🏆 QUIZ TOP PLAYERS\n" +
        "╚════════════════════╝\n\n";

      sorted.forEach(([uid, money], i) => {
        const name = users[uid]?.name || uid;
        msg += `${i + 1}. ${name} — ₱${money}\n`;
      });

      return api.sendMessage(msg, threadID);
    }

    /* ================= START QUIZ ================= */
    const category = args[0];

    if (!category || !CATEGORIES.includes(category)) {
      return api.sendMessage(
        "❌ Invalid category.\n\n" +
        "Use:\nquiz list\nquiz <category>",
        threadID
      );
    }

    try {
      const res = await axios.get(
        `https://new-quiz-black.vercel.app/quiz?category=${category}`
      );

      const { question, options, correct_answer_letter } = res.data;

      let msg =
        "╔════════════════════╗\n" +
        "🧠 QUIZ TIME\n" +
        "╚════════════════════╝\n\n" +
        `📚 Category: ${category}\n\n` +
        `❓ ${question}\n\n`;

      options.forEach((o, i) => {
        msg += `${String.fromCharCode(65 + i)}. ${o.answer}\n`;
      });

      msg +=
        "\nReply with:\n" +
        `quiz answer ${correct_answer_letter}`;

      api.sendMessage(msg, threadID);

      /* AUTO CHECK (SIMPLE MODE) */
      setTimeout(() => {
        api.sendMessage(
          "⏱️ Time's up!\n\n" +
          `Correct answer: ${correct_answer_letter}`,
          threadID
        );
      }, 20000);

    } catch {
      api.sendMessage(
        "❌ Failed to fetch quiz.\nTry again later.",
        threadID
      );
    }
  }
};