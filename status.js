const express = require("express");
const axios = require("axios");
const { status } = require("minecraft-server-util");

const app = express();

// ---- SETTINGS ----
const WEBHOOK_URL = "https://discord.com/api/webhooks/1512843513342202078/-VDQuKn1ORl6NEgUsSMGH6gSgyxR7JrLRgqWTQYc1Qut-dGXp0y6Bbhuqs0y2TaMZF38";
const SERVER_IP = "chloches.play.hosting";
const PORT = 25565;

// ---- keep Render alive ----
app.get("/", (req, res) => {
  res.send("Minecraft status bot running");
});

app.listen(process.env.PORT || 3000);

// ---- state ----
let messageId = null;
let lastOnline = null;

console.log("Bot started");

// ---- check server ----
async function checkServer() {
  try {
    await status(SERVER_IP, PORT, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ---- main loop ----
async function updateStatus() {
  const isOnline = await checkServer();

  // only update if state changed
  if (isOnline === lastOnline) return;
  lastOnline = isOnline;

  const payload = {
    embeds: [
      {
        title: "🎮 Minecraft Server Status",
        color: isOnline ? 0x2ecc71 : 0xe74c3c,

        fields: [
          {
            name: "Status",
            value: isOnline ? "🟢 Online" : "🔴 Offline",
            inline: true
          },
          {
            name: "Server",
            value: `\`${SERVER_IP}\``,
            inline: false
          }
        ],

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
    console.log("Error:", err.message);
  }
}

// run every 15 seconds
setInterval(updateStatus, 15000);
updateStatus();
