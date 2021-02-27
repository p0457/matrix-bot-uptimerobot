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

// Separate function is to support POST value as well as non (which is a GET, apparently)
async function processWebhook(request: any, response: any): Promise<any> {
    const id = request.params.id;
    if (!id) {
        LogService.error("processWebhook", `id not provided`);
        return response.status(400).send();
    }
    const configRecord = config.webhooks.find((w) => { return w.guid === id; });
    if (!configRecord) {
        LogService.error("processWebhook", `Config record not found for id ${id}`);
        return response.status(204).send();
    }
    const roomIds = configRecord.room_ids;
    if (!roomIds || roomIds.length < 1) {
        LogService.error("processWebhook", `roomIds not found for id ${id}`);
        return response.status(204).send();
    }
    const query = request.query || {};
    const body = request.body || {};
    if (!query.monitorID && !body.monitorID) {
        LogService.warn("processWebhook", `Payload was invalid, ignoring: ${JSON.stringify({ id, query: request.query, body: request.body })}`);
        return response.status(406).send();
    }
    const payload = {
        port: query.port,
        monitorID: query.monitorID || body.monitorID,
        monitorURL: query.monitorURL || body.monitorURL,
        monitorFriendlyName: query.monitorFriendlyName || body.monitorFriendlyName || "Unknown",
        alertType: query.alertType || body.alertType,
        alertTypeFriendlyName: query.alertTypeFriendlyName || body.alertTypeFriendlyName || "Unknown",
        alertDetails: query.alertDetails || body.alertDetails || "Unknown",
        alertDuration: query.alertDuration || body.alertDuration,
        monitorAlertContacts: query.monitorAlertContacts || body.monitorAlertContacts,
        sslExpiryDate: query.sslExpiryDate || body.sslExpiryDate,
        sslExpiryDaysLeft: query.sslExpiryDaysLeft || body.sslExpiryDaysLeft
    };
    return webhookProcessor.processWebhook(id, roomIds, payload);
}

app.put("/webhook/:id", async (request, response) => {
    LogService.error("app.put", "Method not allowed");
    return response.status(405);
});
app.get("/webhook/:id", async (request, response) => {
    LogService.info("app.get", `Received request: ${JSON.stringify({ id: request.params.id, query: request.query, body: request.body })}`);
    return processWebhook(request, response).then(() => { return response.status(200).send(); }).catch(() => { return response.status(500).send(); });
});
app.post("/webhook/:id", async (request, response) => {
    LogService.info("app.post", `Received request: ${JSON.stringify({ id: request.params.id, query: request.query, body: request.body })}`);
    return processWebhook(request, response).then(() => { return response.status(200).send(); }).catch(() => { return response.status(500).send(); });
});
app.listen(port, () => {
    LogService.info("app.listen", `UptimeRobotBot Server running on port ${port}`);
});

async function finishInit() {
    const userId = await client.getUserId();
    LogService.info("index", `UptimeRobotBot logged in as ${userId}`);
    return client.start();
}

finishInit().then(() => LogService.info("index", "UptimeRobotBot started"));
