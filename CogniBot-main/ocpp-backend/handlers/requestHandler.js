const sendResponse = require("../utils/sendResponse");
const db = require("../firebase");

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

      const stationDataBoot = stationDocBoot.data();

      // agar station exist nahi karta ya location missing hai
      if (!stationDocBoot.exists || !stationDataBoot?.lat) {

        console.log("Creating/updating dummy station with location:", chargePointId);

        await stationRefBoot.set({
          name: chargePointId,

          lat: 23.0225,
          lng: 72.5714,

          availableSlots: 1,
          pricePerHour: 0,
          chargerType: "Unknown"
        }, { merge: true });

      }

      // dynamic charger info update
      await stationRefBoot.set({
        isOnline: true,
        lastSeen: new Date(),
        vendor: payload.chargePointVendor,
        model: payload.chargePointModel
      }, { merge: true });

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

      await db.collection("stations")
        .doc(chargePointId)
        .set({
          lastSeen: new Date()
        }, { merge: true });

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

      const stationData = stationDoc.data();

      // agar station exist nahi karta ya location missing hai
      if (!stationDoc.exists || !stationData?.lat) {

        console.log("Adding missing station location fields");

        await stationRef.set({
          name: chargePointId,

          lat: 23.0225,
          lng: 72.5714,

          availableSlots: 1,
          pricePerHour: 0,
          chargerType: "Unknown"
        }, { merge: true });

      }

      // dynamic status update
      await stationRef.set({
        status: payload.status,
        connectorId: payload.connectorId,
        errorCode: payload.errorCode,
        lastSeen: new Date()
      }, { merge: true });

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

      const transactionRef = await db.collection("transactions")
        .add({
          stationId: chargePointId,
          connectorId: payload.connectorId,
          userId: payload.idTag,
          meterStart: payload.meterStart,
          status: "active",
          timestamp: new Date()
        });

      sendResponse(ws, uniqueId, {
        transactionId: transactionRef.id,
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

      await db.collection("transactions")
        .doc(payload.transactionId)
        .update({
          meterStop: payload.meterStop,
          status: "completed",
          endedAt: new Date()
        });

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

      await db.collection("meterValues")
        .add({
          stationId: chargePointId,
          data: payload,
          timestamp: new Date()
        });

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