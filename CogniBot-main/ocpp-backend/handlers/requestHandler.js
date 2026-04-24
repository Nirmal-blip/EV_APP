const sendResponse = require("../utils/sendResponse");
const db = require("../firebase");

let nextOcppTransactionId = 1000;

module.exports = async function handleRequest(
  ws,
  uniqueId,
  action,
  payload,
  chargePointId
) {

  switch (action) {

    // ===============================
    // BootNotification
    // ===============================
    case "BootNotification":

      console.log("BootNotification received:", payload);

      const stationRefBoot = db.collection("stations").doc(chargePointId);

      const stationDocBoot = await stationRefBoot.get();

      // No Firestore station doc until admin creates it (client/admin panel).
      if (stationDocBoot.exists) {
        await stationRefBoot.set({
          isOnline: true,
          lastSeen: new Date(),
          vendor: payload.chargePointVendor,
          model: payload.chargePointModel
        }, { merge: true });
      } else {
        console.log(
          "Skipping Firestore station write (not registered by admin yet):",
          chargePointId
        );
      }

      sendResponse(ws, uniqueId, {
        status: "Accepted",
        currentTime: new Date().toISOString(),
        interval: 60
      });

      break;


    // ===============================
    // Heartbeat
    // ===============================
    case "Heartbeat":

      console.log("Heartbeat received");

      const hbRef = db.collection("stations").doc(chargePointId);
      const hbSnap = await hbRef.get();
      if (hbSnap.exists) {
        await hbRef.set({ lastSeen: new Date() }, { merge: true });
      }

      sendResponse(ws, uniqueId, {
        currentTime: new Date().toISOString()
      });

      break;


    // ===============================
    // StatusNotification
    // ===============================
    case "StatusNotification":

      console.log("StatusNotification:", payload);

      const stationRef = db.collection("stations").doc(chargePointId);

      const stationDoc = await stationRef.get();

      if (stationDoc.exists) {
        await stationRef.set({
          status: payload.status,
          connectorId: payload.connectorId,
          errorCode: payload.errorCode,
          lastSeen: new Date()
        }, { merge: true });
      } else {
        console.log(
          "Skipping Firestore station status (not registered by admin yet):",
          chargePointId
        );
      }

      sendResponse(ws, uniqueId, {});

      break;


    // ===============================
    // Authorize
    // ===============================
    case "Authorize":

      console.log("Authorize received:", payload);

      sendResponse(ws, uniqueId, {
        idTagInfo: {
          status: "Accepted"
        }
      });

      break;


    // ===============================
    // StartTransaction
    // ===============================
    case "StartTransaction":

      console.log("StartTransaction received:", payload);

      const startStationSnap = await db.collection("stations").doc(chargePointId).get();
      if (!startStationSnap.exists) {
        console.log(
          "StartTransaction: station not registered by admin, rejecting:",
          chargePointId
        );
        sendResponse(ws, uniqueId, {
          transactionId: 0,
          idTagInfo: { status: "Invalid" }
        });
        break;
      }

      const ocppTransactionId = nextOcppTransactionId++;

      await db.collection("transactions")
        .add({
          stationId: chargePointId,
          ocppTransactionId,
          connectorId: payload.connectorId,
          userId: payload.idTag,
          meterStart: payload.meterStart,
          status: "active",
          timestamp: new Date()
        });

      sendResponse(ws, uniqueId, {
        transactionId: ocppTransactionId,
        idTagInfo: {
          status: "Accepted"
        }
      });

      break;


    // ===============================
    // StopTransaction
    // ===============================
    case "StopTransaction":

      console.log("StopTransaction received:", payload);

      const incomingTransactionId = Number(payload.transactionId);
      if (Number.isFinite(incomingTransactionId)) {
        const txSnap = await db.collection("transactions")
          .where("ocppTransactionId", "==", incomingTransactionId)
          .where("status", "==", "active")
          .limit(1)
          .get();

        const txDoc = txSnap.docs[0];
        if (txDoc) {
          await txDoc.ref.update({
            meterStop: payload.meterStop,
            status: "completed",
            endedAt: new Date()
          });
        }
      }

      sendResponse(ws, uniqueId, {
        idTagInfo: {
          status: "Accepted"
        }
      });

      break;


    // ===============================
    // MeterValues
    // ===============================
    case "MeterValues":

      console.log("MeterValues:", payload);

      const mvStationRef = db.collection("stations").doc(chargePointId);
      const mvStationSnap = await mvStationRef.get();
      if (mvStationSnap.exists) {
        await db.collection("meterValues")
          .add({
            stationId: chargePointId,
            data: payload,
            timestamp: new Date()
          });
      }

      sendResponse(ws, uniqueId, {});

      break;


    // ===============================
    // Unknown message fallback
    // ===============================
    default:

      console.log("Unknown action:", action);

      sendResponse(ws, uniqueId, {});
  }

};