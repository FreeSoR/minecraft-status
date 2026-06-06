const express = require("express");
const axios = require("axios");
const { status } = require("minecraft-server-util");

const app = express();

// ---- НАСТРОЙКИ ----
const WEBHOOK_URL = "https://discord.com/api/webhooks/1512843513342202078/-VDQuKn1ORl6NEgUsSMGH6gSgyxR7JrLRgqWTQYc1Qut-dGXp0y6Bbhuqs0y2TaMZF38";
const SERVER_IP = "chloches.play.hosting";
const PORT = null;

// ---- чтобы Render не засыпал ----
app.get("/", (req, res) => {
  res.send("Minecraft status bot is running");
});

app.listen(process.env.PORT || 3000);

// ---- логика Discord ----
let messageId = null;

console.log("Bot started");

async function updateStatus() {
  let data = null;

  try {
    data = await status("chloches.play.hosting");
  } catch (e) {
    data = null;
  }

  const online = data ? "🟢 Online" : "🔴 Offline";
  const players = data ? `${data.players.online}/${data.players.max}` : "0/0";

 const payload = {
  embeds: [
    {
      title: "🎮 Minecraft Server Status",
      color: online.includes("🟢") ? 0x2ecc71 : 0xe74c3c,

      fields: [
        {
          name: "Status",
          value: online,
          inline: true
        },
        {
          name: "Players",
          value: players,
          inline: true
        },
        {
          name: "Server IP",
          value: `\`${PORT ? `${SERVER_IP}:${PORT}` : SERVER_IP}\``,
          inline: false
        }
      ],

      footer: {
        text: "Live status via webhook"
      },

      timestamp: new Date()
    }
  ]
};

  try {
    // первый запуск — создаём сообщение
    if (!messageId) {
      const res = await axios.post(WEBHOOK_URL + "?wait=true", payload);
      messageId = res.data.id;
      console.log("Message created");
    } 
    // дальше — обновляем его
    else {
      await axios.patch(`${WEBHOOK_URL}/messages/${messageId}`, payload);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}

// обновление каждые 15 секунд
setInterval(updateStatus, 15000);
updateStatus();
