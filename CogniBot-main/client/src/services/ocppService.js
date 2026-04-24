const REMOTE_START_BASE_URL =
  import.meta.env.VITE_OCPP_REMOTE_START_BASE_URL || "/api";

class OcppSyncService {

  constructor() {}

  /*
  ===============================
  STATION SUBSCRIPTION (not needed now)
  ===============================
  */

  async subscribeToStations() {
    // direct websocket architecture me
    // subscription ki zarurat nahi hoti
    return;
  }

  dispose() {
    return;
  }

  /*
  ===============================
  REMOTE START TRANSACTION
  ===============================
  */

  async sendRemoteStart(stationId, payload = {}) {

    const response = await fetch(

      `${REMOTE_START_BASE_URL}/remote-start`,

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          stationId,
          connectorId: payload.connectorId || 1,
          idTag: payload.idTag
        })

      }

    );

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {

      throw new Error(

        body.error ||
        `Remote start failed for ${stationId}`

      );

    }

    return body;

  }

  async sendRemoteStop(stationId, payload = {}) {

    const response = await fetch(

      `${REMOTE_START_BASE_URL}/remote-stop`,

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          stationId,
          transactionId: payload.transactionId
        })
      }

    );

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {

      throw new Error(

        body.error ||
        `Remote stop failed for ${stationId}`

      );

    }

    return body;

  }

  async fetchStationStatus(stationId) {

    const response = await fetch(
      `${REMOTE_START_BASE_URL}/stations/${encodeURIComponent(stationId)}/status`
    );

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || `Status fetch failed for ${stationId}`);
    }

    return body;

  }

}

export const ocppSyncService = new OcppSyncService();