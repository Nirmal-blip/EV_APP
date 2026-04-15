const REMOTE_START_BASE_URL = "http://127.0.0.1:9221";

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

}

export const ocppSyncService = new OcppSyncService();