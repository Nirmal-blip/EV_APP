const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = 9220;

const server = new WebSocket.Server({ port: PORT });

console.log(`OCPP Server running on ws://localhost:${PORT}`);

server.on("connection", (ws, request) => {
  const chargePointId = request.url.replace("/", "");

  console.log(`ChargePoint Connected: ${chargePointId}`);

  ws.on("message", (message) => {
    const msg = JSON.parse(message);

    console.log("Received:", msg);

    const [messageTypeId, uniqueId, action, payload] = msg;

    if (messageTypeId === 2) {
      handleRequest(ws, uniqueId, action, payload);
    }
  });

  ws.on("close", () => {
    console.log(`ChargePoint Disconnected: ${chargePointId}`);
  });
});

function sendResponse(ws, uniqueId, payload) {
  ws.send(JSON.stringify([3, uniqueId, payload]));
}

function handleRequest(ws, uniqueId, action, payload) {
  switch (action) {

    case "BootNotification":
      console.log("BootNotification received");

      sendResponse(ws, uniqueId, {
        status: "Accepted",
        currentTime: new Date().toISOString(),
        interval: 30
      });
      break;

    case "Heartbeat":
      console.log("Heartbeat received");

      sendResponse(ws, uniqueId, {
        currentTime: new Date().toISOString()
      });
      break;

    case "Authorize":
      console.log("Authorize request");

      sendResponse(ws, uniqueId, {
        idTagInfo: {
          status: "Accepted"
        }
      });
      break;

    case "StartTransaction":
      console.log("StartTransaction");

      sendResponse(ws, uniqueId, {
        transactionId: Math.floor(Math.random() * 10000),
        idTagInfo: {
          status: "Accepted"
        }
      });
      break;

    case "MeterValues":
      console.log("MeterValues received");

      sendResponse(ws, uniqueId, {});
      break;

    default:
      console.log("Unknown action:", action);

      sendResponse(ws, uniqueId, {});
  }
}