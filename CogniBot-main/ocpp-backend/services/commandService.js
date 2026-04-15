const { v4: uuidv4 } = require("uuid");

function remoteStartTransaction(ws, idTag = "TEST_USER") {

  const message = [
    2,
    uuidv4(),
    "RemoteStartTransaction",
    {
      idTag
    }
  ];

  ws.send(JSON.stringify(message));
}


function remoteStopTransaction(ws, transactionId) {

  const message = [
    2,
    uuidv4(),
    "RemoteStopTransaction",
    {
      transactionId
    }
  ];

  ws.send(JSON.stringify(message));
}


module.exports = {
  remoteStartTransaction,
  remoteStopTransaction
};
