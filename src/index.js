const { ingestEmail } = require("./ingestion/emailIngestion");
const { decideAction } = require("./decision/decisionEngine");
const { escalate } = require("./escalation/escalator");
const { respond } = require("./response/responder");

function handleIncoming(email) {
  const content = ingestEmail(email);
  const action = decideAction(content);

  if (action === "escalate") {
    escalate(content);
    return "Issue escalated";
  } else {
    return respond(content);
  }
}

module.exports = { handleIncoming };