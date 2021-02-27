import { AutojoinRoomsMixin, AutojoinUpgradedRoomsMixin, MatrixClient, SimpleRetryJoinStrategy } from "matrix-bot-sdk";
import config from "./config";
import { LogService } from "matrix-js-snippets";
import { WebhookProcessor } from "./WebhookProcessor";

LogService.configure(config.logging);
const client = new MatrixClient(config.homeserverUrl, config.accessToken);
const webhookProcessor = new WebhookProcessor(client);

AutojoinRoomsMixin.setupOnClient(client);
AutojoinUpgradedRoomsMixin.setupOnClient(client);
client.setJoinStrategy(new SimpleRetryJoinStrategy());

const express = require("express");
let app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const port = config.port;

app.post("/webhook/:id", async (request, response) => {
    const id = request.params.id;
    if (!id) return response.status(400).send();
    const configRecord = config.webhooks.find((w) => { return w.guid === id; });
    if (!configRecord) return response.status(204).send();
    const roomId = configRecord.room_id;
    if (!roomId) return response.status(204).send();
    if (!request.query.monitorID) {
        LogService.warn("app.post", `Payload was invalid, ignoring: ${JSON.stringify({ request })}`);
        return response.status(406).send();
    }
    const payload = {
        monitorID: request.query.monitorID,
        monitorURL: request.query.monitorURL,
        monitorFriendlyName: request.query.monitorFriendlyName,
        alertType: request.query.alertType,
        alertTypeFriendlyName: request.query.alertTypeFriendlyName,
        alertDetails: request.query.alertDetails,
        alertDuration: request.query.alertDuration,
        monitorAlertContacts: request.query.monitorAlertContacts,
        sslExpiryDate: request.query.sslExpiryDate,
        sslExpiryDaysLeft: request.query.sslExpiryDaysLeft
    };
    return webhookProcessor.processWebhook(id, roomId, payload).then(() => { return response.status(200).send(); }).catch(() => { return response.status(500).send(); });
});

app.listen(port, () => {
    LogService.info("index", `UptimeRobotBot Server running on port ${port}`);
});

async function finishInit() {
    const userId = await client.getUserId();
    LogService.info("index", `UptimeRobotBot logged in as ${userId}`);
    return client.start();
}

finishInit().then(() => LogService.info("index", "UptimeRobotBot started"));
