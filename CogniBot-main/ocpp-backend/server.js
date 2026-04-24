const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");

const handleRequest = require("./handlers/requestHandler");

const PORT = process.env.PORT || 8080;

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket to same server
const wss = new WebSocket.Server({ server });

const chargers = {};

console.log(`🚀 Server starting on port ${PORT}`);

/*
========================
CHARGER CONNECTION
========================
*/

wss.on("connection", (ws, request) => {

  console.log("🔥 New WS Connection:", request.url);

  const urlParts = request.url.split("/");
  const chargePointId = urlParts[1] || "unknown";

  chargers[chargePointId] = ws;

  console.log(`⚡ ChargePoint Connected: ${chargePointId}`);

  ws.on("message", async (message) => {
    try {
      const msg = JSON.parse(message.toString());

      console.log("📩 Incoming:", msg);

      const messageTypeId = msg[0];
      const uniqueId = msg[1];
      const action = msg[2];
      const payload = msg[3] || {};

      if (messageTypeId === 2) {
        await handleRequest(
          ws,
          uniqueId,
          action,
          payload,
          chargePointId
        );
      }

    } catch (err) {
      console.error("❌ Invalid message:", err);
    }
  });

  ws.on("close", () => {
    delete chargers[chargePointId];
    console.log(`❌ ChargePoint Disconnected: ${chargePointId}`);
  });

});

/*
========================
REMOTE START FUNCTION
========================
*/

function remoteStartTransaction(stationId, connectorId, idTag) {

  const charger = chargers[stationId];

  if (!charger) {
    console.log("⚠️ Charger not connected:", stationId);
    return { status: "Rejected" };
  }

  const message = [
    2,
    Date.now().toString(),
    "RemoteStartTransaction",
    { connectorId, idTag }
  ];

  charger.send(JSON.stringify(message));

  console.log("🚀 RemoteStart sent →", stationId);

  return { status: "Accepted" };
}

/*
========================
HTTP API
========================
*/

app.post("/remote-start", (req, res) => {

  const { stationId, connectorId, idTag } = req.body;

  const result = remoteStartTransaction(
    stationId,
    connectorId,
    idTag
  );

  res.json(result);

});

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/*
========================
START SERVER (IMPORTANT)
========================
*/

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});