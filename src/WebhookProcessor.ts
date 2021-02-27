import { MatrixClient, RichReply } from "matrix-bot-sdk";
import { LogService } from "matrix-js-snippets";
import striptags = require("striptags");

export class WebhookProcessor {
    constructor(private client: MatrixClient) {
    }

    public processWebhook(id: string, roomIds: string[], payload: any): Promise<any> {
        try {
            let resultHtml = "";

            const enrichData = (obj) => {
                let statusColor = "#A63636";
                let statusText = "DOWN";
                let alertDuration = "0";
                if (obj.alertType === "2") {
                    statusColor = "#36A64F";
                    statusText = "UP";
                    alertDuration = convertAlertDuration(obj.alertDuration);
                }

                return {
                    statusColor,
                    statusText,
                    isUp: obj.alertType === "2",
                    port: obj.port,
                    monitorID: obj.monitorID,
                    monitorURL: obj.monitorURL,
                    monitorFriendlyName: obj.monitorFriendlyName,
                    alertDetails: obj.alertDetails,
                    alertDuration: alertDuration,
                    sslExpiryDate: obj.sslExpiryDate,
                    sslExpiryDaysLeft: obj.sslExpiryDaysLeft
                };
            };

            const convertAlertDuration = (seconds) => {
                let days = Math.floor(seconds / (3600 * 24));
                seconds -= days * 3600 * 24;
                let hours = Math.floor(seconds / 3600);
                seconds -= hours * 3600;
                let minutes = Math.floor(seconds / 60);
                seconds  -= minutes * 60;

                let result = "";
                if (days > 0) result += ` ${days} days`;
                if (hours > 0) result += ` ${hours} hours`;
                if (minutes > 0) result += ` ${minutes} minutes`;
                if (seconds > 0) result += ` ${seconds} seconds`;

                return result.trim();
            };

            const data = enrichData(payload);

            let title = `<h4>${data.monitorFriendlyName} is <u>${data.statusText}</u>!</h4>`;
            let text = ``;
            if(data.isUp && data.alertDuration) {
                text += `${data.monitorFriendlyName} was down for ${data.alertDuration}.\n`;
            } 
            text += `<b>Reason:</b> ${data.alertDetails}.`;
            if (data.sslExpiryDate && data.sslExpiryDaysLeft) {
                text += `\nSSL expires in ${data.sslExpiryDaysLeft} days!`;
            }
            const color = data.statusColor;
            const colorSquare = `<span color="${color}">█</span>`; // This is not working with custom html
            let url = "https://uptimerobot.com";
            if (data.monitorURL) url = data.monitorURL;
            if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
            if (data.port && !isNaN(data.port)) url = `${url}:${data.port}`;
            title = `<a href="${url}">${title}</a>`;

            resultHtml += `${title}${text}`;

            // Send to rooms
            roomIds.forEach((roomId) => {
                return this.client.sendMessage(roomId, {
                    msgtype: "m.notice",
                    body: striptags(resultHtml), // Fallback
                    format: "org.matrix.custom.html",
                    formatted_body: resultHtml.replace(`\n`, "<br/>")
                });
            });
        }
        catch (e) {
            LogService.error("processWebhook", `Error processing webhook: ${JSON.stringify(e)}`);
            return Promise.reject();
        }
    }
}
