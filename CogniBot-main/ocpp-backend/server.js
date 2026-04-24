require("dotenv").config();
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const handleRequest = require("./handlers/requestHandler");
const db = require("./firebase");


const PORT = 9321;
const API_PORT = 9221;
const REMOTE_START_TIMEOUT_MS = Number(process.env.OCPP_REMOTE_START_TIMEOUT_MS || 20000);

// Some simulators/clients may send non-UTF8 text frames (or mislabeled binary frames).
// Skip UTF-8 validation so the backend doesn't drop the charger connection.
// We'll still ignore anything that isn't valid JSON/OCPP in the message handler.
const server = new WebSocket.Server({ port: PORT, skipUTF8Validation: true });

const chargers = {};
const pendingCalls = new Map();
const stationTelemetry = new Map();

function getTelemetry(stationId) {
  if (!stationTelemetry.has(stationId)) {
    stationTelemetry.set(stationId, {
      lastSeenAt: null,
      lastHeartbeatAt: null,
      lastStatusNotification: null,
      lastStartTransaction: null,
      lastMeterValues: null,
      lastRemoteStart: null,
      lastRemoteStop: null,
    });
  }
  return stationTelemetry.get(stationId);
}

function computeStationStatus(stationId) {
  const connected = Boolean(chargers[stationId]);
  const telemetry = stationTelemetry.get(stationId) || null;

  if (!connected) {
    return { connected: false, status: "Unavailable", telemetry };
  }

  const lastStatus = telemetry?.lastStatusNotification?.status;
  const meter = telemetry?.lastMeterValues;

  const sampled = Array.isArray(meter?.meterValue) ? meter.meterValue[0]?.sampledValue : null;
  const powerKw = Array.isArray(sampled)
    ? Number(sampled.find((v) => v?.measurand === "Power.Active.Import")?.value)
    : NaN;

  if (lastStatus === "Charging" || (Number.isFinite(powerKw) && powerKw > 0)) {
    return { connected: true, status: "Charging", telemetry };
  }

  // If we recently remote-started, show Preparing until the charger moves to Charging/Available
  if (telemetry?.lastRemoteStart?.status === "Accepted") {
    const startedAtMs = Date.parse(telemetry.lastRemoteStart.at || "");
    if (Number.isFinite(startedAtMs) && Date.now() - startedAtMs < 2 * 60 * 1000) {
      return { connected: true, status: "Preparing", telemetry };
    }
  }

  if (lastStatus === "Preparing") {
    return { connected: true, status: "Preparing", telemetry };
  }

  if (lastStatus === "Available") {
    return { connected: true, status: "Available", telemetry };
  }

  // Default: connected but no strong signal
  return { connected: true, status: "Available", telemetry };
}

console.log(`OCPP Server running on ws://localhost:${PORT}`);

server.on("error", (err) => {
  console.error("[WS] Server error:", err?.message || err);
});


/*
========================
CHARGER CONNECTION
========================
*/

server.on("connection", (ws, request) => {

  const urlParts = request.url.split("/");

  const chargePointId =
    urlParts[1] === "ocpp"
      ? urlParts[2]
      : urlParts[1];

  chargers[chargePointId] = ws;

  console.log(`ChargePoint Connected: ${chargePointId}`);

  // Prevent malformed frames / socket errors from crashing the process
  ws.on("error", (err) => {
    console.warn(`[WS] Socket error (${chargePointId}):`, err?.message || err);
    try {
      ws.close(1007, "Invalid websocket frame");
    } catch {
      // ignore
    }
  });

  ws.on("message", async (message) => {

    try {

      const msg = JSON.parse(message.toString());

      console.log("Incoming:", msg);

      const messageTypeId = msg[0];
      const uniqueId = msg[1];

      if (messageTypeId === 2) {

        const action = msg[2];
        const payload = msg[3] || {};

        const telemetry = getTelemetry(chargePointId);
        telemetry.lastSeenAt = new Date().toISOString();
        if (action === "Heartbeat") telemetry.lastHeartbeatAt = telemetry.lastSeenAt;
        if (action === "StatusNotification") {
          telemetry.lastStatusNotification = {
            at: telemetry.lastSeenAt,
            status: payload?.status,
            connectorId: payload?.connectorId,
            errorCode: payload?.errorCode,
          };
        }
        if (action === "StartTransaction") {
          telemetry.lastStartTransaction = {
            at: telemetry.lastSeenAt,
            connectorId: payload?.connectorId,
            idTag: payload?.idTag,
            meterStart: payload?.meterStart,
            timestamp: payload?.timestamp,
          };
        }
        if (action === "MeterValues") {
          telemetry.lastMeterValues = {
            at: telemetry.lastSeenAt,
            connectorId: payload?.connectorId,
            transactionId: payload?.transactionId,
            meterValue: payload?.meterValue,
          };
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
          const errorCode = msg[2] || "CallError";
          const errorDescription = msg[3] || "Unknown charger error";
          pending.reject(new Error(`${errorCode}: ${errorDescription}`));
        }

      }

    } catch (err) {

      console.error("Invalid message format:", err);

    }

  });


  ws.on("close", () => {

    delete chargers[chargePointId];

    console.log(`ChargePoint Disconnected: ${chargePointId}`);

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

    console.log("Charger not connected:", stationId);

    const error = new Error(`Charger not connected: ${stationId}`);
    error.code = "CHARGER_NOT_CONNECTED";
    throw error;

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
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });

  charger.send(JSON.stringify(message));

  console.log(`${action} sent →`, stationId, { uniqueId });

  return resultPromise;

}


/*
========================
HTTP API FOR FRONTEND
========================
*/

const app = express();

app.use(cors());
app.use(express.json());

app.get("/debug/stations/:stationId", (req, res) => {
  const stationId = String(req.params.stationId || "").trim();
  const connected = Boolean(chargers[stationId]);
  const telemetry = stationTelemetry.get(stationId) || null;
  res.json({ stationId, connected, telemetry });
});

app.get("/stations/:stationId/status", (req, res) => {
  const stationId = String(req.params.stationId || "").trim();
  const computed = computeStationStatus(stationId);
  res.json({ stationId, ...computed });
});

async function resolveActiveTransactionId(stationId) {
  const telemetryTxId = Number(
    stationTelemetry.get(stationId)?.lastMeterValues?.transactionId
  );
  if (Number.isFinite(telemetryTxId) && telemetryTxId > 0) {
    return telemetryTxId;
  }

  // Avoid composite index requirement by not ordering.
  // We only need one active transaction id to stop charging.
  const snap = await db
    .collection("transactions")
    .where("stationId", "==", stationId)
    .where("status", "==", "active")
    .get();

  for (const doc of snap.docs) {
    const fromData = Number(doc.data()?.ocppTransactionId);
    if (Number.isFinite(fromData) && fromData > 0) {
      return fromData;
    }
  }

  return null;
}

app.post("/remote-start", async (req, res) => {

  const {
    stationId,
    connectorId,
    idTag
  } = req.body;

  if (!stationId) {
    res.status(400).json({ error: "stationId is required" });
    return;
  }

  const resolvedConnectorId = Number(connectorId || 1);
  const resolvedIdTag = String(idTag || "WEB_APP");

  console.log(`[API] /remote-start request`, {
    stationId,
    connectorId: resolvedConnectorId,
    idTag: resolvedIdTag
  });

  try {
    const payload = await sendCallAndAwaitResult(
      stationId,
      "RemoteStartTransaction",
      { connectorId: resolvedConnectorId, idTag: resolvedIdTag }
    );
    getTelemetry(stationId).lastRemoteStart = {
      at: new Date().toISOString(),
      status: payload?.status,
      connectorId: resolvedConnectorId,
      idTag: resolvedIdTag,
    };
    console.log(`[API] RemoteStartTransaction result`, { stationId, payload });
    res.status(200).json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const statusCode = error?.code === "CHARGER_NOT_CONNECTED" ? 404 : 504;
    console.warn(`[API] RemoteStartTransaction failed`, { stationId, error: message });
    res.status(statusCode).json({ error: message });
  }

});

app.post("/remote-stop", async (req, res) => {
  const { stationId, transactionId } = req.body || {};

  const resolvedStationId = String(stationId || "").trim();
  if (!resolvedStationId) {
    res.status(400).json({ error: "stationId is required" });
    return;
  }

  const resolvedTransactionId =
    transactionId ?? (await resolveActiveTransactionId(resolvedStationId));

  if (!resolvedTransactionId) {
    res.status(409).json({ error: `No active transaction found for ${resolvedStationId}` });
    return;
  }

  const numericTransactionId = Number(resolvedTransactionId);
  const payloadTransactionId = Number.isFinite(numericTransactionId)
    ? numericTransactionId
    : resolvedTransactionId;

  console.log(`[API] /remote-stop request`, {
    stationId: resolvedStationId,
    transactionId: payloadTransactionId,
  });

  try {
    const payload = await sendCallAndAwaitResult(
      resolvedStationId,
      "RemoteStopTransaction",
      { transactionId: payloadTransactionId }
    );
    getTelemetry(resolvedStationId).lastRemoteStop = {
      at: new Date().toISOString(),
      status: payload?.status,
      transactionId: payloadTransactionId,
    };
    console.log(`[API] RemoteStopTransaction result`, { stationId: resolvedStationId, payload });
    res.status(200).json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const statusCode = error?.code === "CHARGER_NOT_CONNECTED" ? 404 : 504;
    console.warn(`[API] RemoteStopTransaction failed`, { stationId: resolvedStationId, error: message });
    res.status(statusCode).json({ error: message });
  }
});


app.listen(API_PORT, () => {

  console.log(
    `HTTP API running on http://localhost:${API_PORT}`
  );

});