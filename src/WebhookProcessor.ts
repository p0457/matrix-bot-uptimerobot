import { MatrixClient, RichReply } from "matrix-bot-sdk";
import { LogService } from "matrix-js-snippets";
import striptags = require("striptags");

export class WebhookProcessor {
    constructor(private client: MatrixClient) {
    }

    public processWebhook(id: string, roomId: string, payload: any): Promise<any> {
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

            let title = `<h4><b>${data.monitorFriendlyName} is <u>${data.statusText}</u>!</b></h4>`;
            let text = ``;
            if(data.isUp) {
                text += `${data.monitorFriendlyName} was down for ${data.alertDuration}.<br/>\n`;
            } 
            text += `Reason: ${data.alertDetails}.`;
            if (data.sslExpiryDate && data.sslExpiryDaysLeft) {
                text += `<br/>\nSSL expires in ${data.sslExpiryDaysLeft} days!`;
            }
            const color = data.statusColor;
            const colorSquare = `<span color="${color}">█</span>`; // This is not working with custom html
            let url = "https://uptimerobot.com";
            if (data.monitorURL) url = data.monitorURL;
            if (!url.startsWith("http://") || !url.startsWith("https://")) url = `https://${url}`;
            title = `<a href="${url}">${title}</a>`;

            resultHtml += `${title}<br/>\n${text}`

            // Send to room
            return this.client.sendMessage(roomId, {
                msgtype: "m.notice",
                body: striptags(resultHtml), // Fallback
                format: "org.matrix.custom.html",
                formatted_body: resultHtml
            });
        }
        catch (e) {
            LogService.error("processWebhook", `Error processing webhook: ${JSON.stringify(e)}`);
            return Promise.reject();
        }
    }
}
