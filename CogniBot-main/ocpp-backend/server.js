require("dotenv").config();

const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const handleRequest = require("./handlers/requestHandler");
const db = require("./firebase");

const app = express();

app.use(cors());
app.use(express.json());

/*
========================
HEALTH CHECK ROUTE (IMPORTANT FOR RAILWAY)
========================
*/

app.get("/", (req, res) => {
  res.send("OCPP backend running successfully 🚀");
});

/*
========================
PORT CONFIG
========================
*/

const PORT = process.env.PORT || 8080;

const REMOTE_START_TIMEOUT_MS = Number(
  process.env.OCPP_REMOTE_START_TIMEOUT_MS || 20000
);

/*
========================
CREATE SHARED HTTP SERVER
========================
*/

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  skipUTF8Validation: true
});

console.log(`Server starting on port ${PORT}`);

const chargers = {};
const pendingCalls = new Map();
const stationTelemetry = new Map();

/*
========================
TELEMETRY STORAGE
========================
*/

function getTelemetry(stationId) {
  if (!stationTelemetry.has(stationId)) {
    stationTelemetry.set(stationId, {
      lastSeenAt: null,
      lastHeartbeatAt: null,
      lastStatusNotification: null,
      lastMeterValues: null,
      lastRemoteStart: null,
      lastRemoteStop: null,
    });
  }
  return stationTelemetry.get(stationId);
}

/*
========================
STATUS COMPUTATION
========================
*/

function computeStationStatus(stationId) {
  const connected = Boolean(chargers[stationId]);
  const telemetry = stationTelemetry.get(stationId) || null;

  if (!connected) {
    return { connected: false, status: "Unavailable", telemetry };
  }

  const lastStatus = telemetry?.lastStatusNotification?.status;

  if (lastStatus === "Charging") {
    return { connected: true, status: "Charging", telemetry };
  }

  if (lastStatus === "Preparing") {
    return { connected: true, status: "Preparing", telemetry };
  }

  return { connected: true, status: "Available", telemetry };
}

/*
========================
CHARGER CONNECTION
========================
*/

wss.on("connection", (ws, request) => {

  console.log("Incoming WS connection attempt:", request.url);

  const urlParts = request.url.split("/");

  let chargePointId;

  if (urlParts[1] === "ocpp") {
    chargePointId = urlParts[2];
  } else if (urlParts[1] === "ws" && urlParts[2] === "1.6") {
    chargePointId = urlParts[3];
  } else {
    chargePointId = urlParts[1];
  }

  chargers[chargePointId] = ws;

  console.log(`🔌 ChargePoint Connected: ${chargePointId}`);

  ws.on("message", async (message) => {

    try {

      const msg = JSON.parse(message.toString());

      const messageTypeId = msg[0];
      const uniqueId = msg[1];

      if (messageTypeId === 2) {

        const action = msg[2];
        const payload = msg[3] || {};

        const telemetry = getTelemetry(chargePointId);

        telemetry.lastSeenAt = new Date().toISOString();

        if (action === "Heartbeat") {
          telemetry.lastHeartbeatAt = telemetry.lastSeenAt;
        }

        if (action === "StatusNotification") {
          telemetry.lastStatusNotification = {
            at: telemetry.lastSeenAt,
            status: payload?.status,
          };
        }

        if (action === "MeterValues") {
          telemetry.lastMeterValues = payload;
        }

        await handleRequest(
          ws,
          uniqueId,
          action,
          payload,
          chargePointId
        );

      }

      if (messageTypeId === 3 || messageTypeId === 4) {

        const pending = pendingCalls.get(uniqueId);

        if (!pending) return;

        pendingCalls.delete(uniqueId);

        if (messageTypeId === 3) {
          pending.resolve(msg[2] || {});
        } else {
          pending.reject(new Error("CallError"));
        }

      }

    } catch (err) {

      console.error("Invalid message format:", err);

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

function sendCallAndAwaitResult(stationId, action, payload) {

  const charger = chargers[stationId];

  if (!charger) {
    throw new Error(`Charger not connected: ${stationId}`);
  }

  const message = [
    2,
    uuidv4(),
    action,
    payload || {}
  ];

  const uniqueId = message[1];

  const resultPromise = new Promise((resolve, reject) => {

    const timeoutId = setTimeout(() => {

      pendingCalls.delete(uniqueId);

      reject(new Error(`${action} timed out`));

    }, REMOTE_START_TIMEOUT_MS);

    pendingCalls.set(uniqueId, {

      resolve: (responsePayload) => {

        clearTimeout(timeoutId);

        resolve(responsePayload);

      },

      reject

    });

  });

  charger.send(JSON.stringify(message));

  return resultPromise;

}

/*
========================
HTTP API ROUTES
========================
*/

app.get("/stations/:stationId/status", (req, res) => {

  const stationId = req.params.stationId;

  res.json({
    stationId,
    ...computeStationStatus(stationId)
  });

});

app.post("/remote-start", async (req, res) => {

  const { stationId } = req.body;

  if (!stationId) {
    return res.status(400).json({ error: "stationId required" });
  }

  try {

    const payload =
      await sendCallAndAwaitResult(
        stationId,
        "RemoteStartTransaction",
        { connectorId: 1, idTag: "WEB_APP" }
      );

    res.json(payload);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

/*
========================
START SERVER
========================
*/

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});