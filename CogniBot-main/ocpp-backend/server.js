const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const handleRequest = require("./handlers/requestHandler");

const PORT = 9220;
const API_PORT = 9221;

const server = new WebSocket.Server({ port: PORT });

const chargers = {};

console.log(`OCPP Server running on ws://localhost:${PORT}`);


/*
========================
CHARGER CONNECTION
========================
*/

server.on("connection", (ws, request) => {

  const urlParts = request.url.split("/");

  const chargePointId = urlParts[1];

  chargers[chargePointId] = ws;

  console.log(`ChargePoint Connected: ${chargePointId}`);

  ws.on("message", async (message) => {

    try {

      const msg = JSON.parse(message.toString());

      console.log("Incoming:", msg);

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

function remoteStartTransaction(
  stationId,
  connectorId,
  idTag
) {

  const charger = chargers[stationId];

  if (!charger) {

    console.log("Charger not connected:", stationId);

    return {
      status: "Rejected"
    };

  }

  const message = [

    2,
    Date.now().toString(),
    "RemoteStartTransaction",
    {
      connectorId,
      idTag
    }

  ];

  charger.send(JSON.stringify(message));

  console.log("RemoteStartTransaction sent →", stationId);

  return {
    status: "Accepted"
  };

}


/*
========================
HTTP API FOR FRONTEND
========================
*/

const app = express();

app.use(cors());
app.use(express.json());

app.post("/remote-start", (req, res) => {

  const {
    stationId,
    connectorId,
    idTag
  } = req.body;

  const result =
    remoteStartTransaction(
      stationId,
      connectorId,
      idTag
    );

  res.json(result);

});


app.listen(API_PORT, () => {

  console.log(
    `RemoteStart API running on http://localhost:${API_PORT}`
  );

});