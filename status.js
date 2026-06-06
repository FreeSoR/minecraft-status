const express = require("express");
const axios = require("axios");
const net = require("net");
const { status } = require("minecraft-server-util");

const app = express();

// ---- SETTINGS ----
const WEBHOOK_URL = "https://discord.com/api/webhooks/1512843513342202078/-VDQuKn1ORl6NEgUsSMGH6gSgyxR7JrLRgqWTQYc1Qut-dGXp0y6Bbhuqs0y2TaMZF38";
const SERVER_IP = "chloches.play.hosting";
const PORT = 25565;

// ---- keep Render alive ----
app.get("/", (req, res) => {
  res.send("Minecraft status bot is running");
});

app.listen(process.env.PORT || 3000);

// ---- state ----
let messageId = null;
let lastState = null;

console.log("Bot started");

// 🔌 real connection check (truth source)
function checkServer(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    let done = false;

    socket.setTimeout(timeout);

    socket
      .connect(port, host, () => {
        done = true;
        socket.destroy();
        resolve(true);
      })
      .on("error", () => {
        if (!done) {
          done = true;
          resolve(false);
        }
      })
      .on("timeout", () => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(false);
        }
      });
  });
}

async function updateStatus() {
  let data = null;

  // STEP 1: real reachability check
  const isOnline = await checkServer(SERVER_IP, PORT);

  // STEP 2: only fetch status if reachable
  if (isOnline) {
    try {
      data = await status(SERVER_IP, PORT, { timeout: 3000 });
    } catch {
      data = null;
    }
  }

  // 🔥 FIXED LOGIC
  const online = isOnline ? "🟢 Online" : "🔴 Offline";

  const players =
    data && data.players
      ? `${data.players.online}/${data.players.max}`
      : "0/0";

  // SMART UPDATE (safe)
  const currentState = JSON.stringify({
    online: isOnline,
    playersOnline: data ? data.players.online : 0,
    playersMax: data ? data.players.max : 0
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
  updateStatus().catch(err => console.log("Update error:", err.message));
}, 15000);

updateStatus();
