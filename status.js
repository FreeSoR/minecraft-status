const express = require("express");
const axios = require("axios");
const { status } = require("minecraft-server-util");

const app = express();

// ---- SETTINGS ----
const WEBHOOK_URL = "https://discord.com/api/webhooks/1512843513342202078/-VDQuKn1ORl6NEgUsSMGH6gSgyxR7JrLRgqWTQYc1Qut-dGXp0y6Bbhuqs0y2TaMZF38";
const SERVER_IP = "chloches.play.hosting";

// ---- keep Render alive ----
app.get("/", (req, res) => {
  res.send("Minecraft status bot is running");
});

app.listen(process.env.PORT || 3000);

// ---- state ----
let messageId = null;
let lastState = null;

console.log("Bot started");

async function updateStatus() {
  let data = null;

  // IMPORTANT FIX: treat failure as OFFLINE
  try {
    data = await status(SERVER_IP, 25565, {
      timeout: 3000
    });
  } catch (e) {
    data = null;
  }

  const isOnline = !!data;

  const online = isOnline ? "🟢 Online" : "🔴 Offline";

  // IMPORTANT FIX: safe player fallback
  const players = isOnline
    ? `${data.players.online}/${data.players.max}`
    : "0/0";

  // FIX: proper smart state tracking
  const currentState = JSON.stringify({
    online: isOnline,
    playersOnline: isOnline ? data.players.online : 0,
    playersMax: isOnline ? data.players.max : 0
  });

  if (currentState === lastState) return;
  lastState = currentState;

  const payload = {
    embeds: [
      {
        title: "🎮 Minecraft Server Status",
        color: isOnline ? 0x2ecc71 : 0xe74c3c,

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
            value: `\`${SERVER_IP}\``,
            inline: false
          },
          {
            name: "Updated",
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: false
          }
        ]
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

// run loop
setInterval(() => {
  updateStatus().catch(err => {
    console.log("Update crash:", err.message);
  });
}, 15000);

updateStatus();
