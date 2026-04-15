/**
 * Sends an OCPP CALL RESULT message back to Charge Point
 * Format:
 * [3, uniqueId, payload]
 */

module.exports = function sendResponse(ws, uniqueId, payload) {

    if (!ws || ws.readyState !== ws.OPEN) {
      console.error("WebSocket not open. Cannot send response.");
      return;
    }
  
    const response = [
      3,          // MessageTypeId for CALLRESULT
      uniqueId,   // same ID received from charger request
      payload     // response payload
    ];
  
    const message = JSON.stringify(response);
  
    console.log("Sending response:", message);
  
    ws.send(message);
  
  };