const fs = require("fs");
const path = require("path");
const axios = require("axios");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const QUIZ_PATH = path.join(__dirname, "../../data/quiz.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(QUIZ_PATH)) fs.writeFileSync(QUIZ_PATH, "{}");

const REWARD = 500;
const TIMEOUT = 20000; // 20s

module.exports = {
  config: {
    name: "quiz",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID, body } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const quizData = JSON.parse(fs.readFileSync(QUIZ_PATH));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    /* ================= ANSWER HANDLER ================= */
    if (quizData[threadID]) {
      const answer = body.trim().toUpperCase();
      const correct = quizData[threadID].answer;

      if (!["A", "B", "C", "D"].includes(answer)) return;

      delete quizData[threadID];
      fs.writeFileSync(QUIZ_PATH, JSON.stringify(quizData, null, 2));

      if (answer === correct) {
        balance[senderID] = (balance[senderID] || 0) + REWARD;
        fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

        return api.sendMessage(
          "🎉 CORRECT ANSWER!\n\n" +
          `✅ You earned ₱${REWARD.toLocaleString()}`,
          threadID
        );
      } else {
        return api.sendMessage(
          `❌ WRONG ANSWER\n\nCorrect answer was: ${correct}`,
          threadID
        );
      }
    }

    /* ================= START QUIZ ================= */
    const category = args[0] || "anime";

    let res;
    try {
      res = await axios.get(
        `https://new-quiz-black.vercel.app/quiz?category=${category}`
      );
    } catch {
      return api.sendMessage("❌ Failed to fetch quiz.", threadID);
    }

    const q = res.data;
    if (!q || !q.options) {
      return api.sendMessage("❌ Invalid quiz data.", threadID);
    }

    const options = q.options.map(
      (o, i) => `${String.fromCharCode(65 + i)}. ${o.answer}`
    ).join("\n");

    quizData[threadID] = {
      answer: q.correct_answer_letter
    };

    fs.writeFileSync(QUIZ_PATH, JSON.stringify(quizData, null, 2));

    api.sendMessage(
      "╔════════════════════╗\n" +
      "🧠 QUIZ TIME 🧠\n" +
      "╚════════════════════╝\n\n" +
      `📚 Category: ${category}\n\n` +
      `❓ ${q.question}\n\n` +
      `${options}\n\n` +
      "✏️ Reply with: A / B / C / D\n" +
      "⏳ You have 20 seconds",
      threadID
    );

    /* ⏳ AUTO EXPIRE */
    setTimeout(() => {
      const data = JSON.parse(fs.readFileSync(QUIZ_PATH));
      if (data[threadID]) {
        delete data[threadID];
        fs.writeFileSync(QUIZ_PATH, JSON.stringify(data, null, 2));
        api.sendMessage("⌛ Quiz expired.", threadID);
      }
    }, TIMEOUT);
  }
};