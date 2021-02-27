import * as config from "config";
import { LogConfig } from "matrix-js-snippets";

class webhooks {
    id: string;
    room_ids: string[];
}

interface IConfig {
    homeserverUrl: string;
    accessToken: string;

    port: number;

    webhooks: Array<webhooks>;

    logging: LogConfig;
}

const conf = <IConfig>config;

if (process.env["BOT_DOCKER_LOGS"]) {
    console.log("Altering log configuration to only write out to console");
    conf.logging = {
        file: "/data/logs/matrix-bot-uptimerobot.log",
        console: true,
        consoleLevel: conf.logging.consoleLevel,
        fileLevel: "error",
        writeFiles: false,
        rotate: {
            size: 0,
            count: 0,
        },
    };
}

if (process.env["BOT_PORT"]) {
    const realPort = Number(process.env["BOT_PORT"]);
    if (realPort !== Number(conf.port)) {
        console.warn("Configuration and environment variables do not agree on the webserver port. Using " + realPort);
    }

    conf.port = realPort;
}

export default conf;
