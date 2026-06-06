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
let lastState = null;

console.log("Bot started");

async function updateStatus() {
  let data = null;
  let ping = "N/A";

  try {
    const start = Date.now();
    data = await status(SERVER_IP);
    ping = Date.now() - start + "ms";
  } catch (e) {
    data = null;
    ping = "N/A";
  }

  const online = data ? "🟢 Online" : "🔴 Offline";
  const players = data ? `${data.players.online}/${data.players.max}` : "0/0";

  const currentState = JSON.stringify({
    online: !!data,
    players: data ? data.players.online : 0,
    ping
  });

  if (currentState === lastState) return;
  lastState = currentState;

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
            name: "Ping",
            value: ping,
            inline: true
          },
          {
            name: "Players",
            value: players,
            inline: true
          },
          {
            name: "Server IP",
            value: `\`${SERVER_IP}\``,
            inline: false
          },
          {
            name: "Updated",
            value: "just now",
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
    if (!messageId) {
      const res = await axios.post(WEBHOOK_URL + "?wait=true", payload);
      messageId = res.data.id;
      console.log("Message created");
    } else {
      await axios.patch(`${WEBHOOK_URL}/messages/${messageId}`, payload);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}

// обновление каждые 15 секунд
setInterval(updateStatus, 15000);
updateStatus();
