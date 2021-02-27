# matrix-bot-uptimerobot

A matrix bot that listens to custom webhooks for UptimeRobot.

This application is in no way affiliated with Uptime Robot.

# Usage

1. Configure bot offline in settings
2. Make sure port in config is forwarded
3. Invite bot to rooms designated in settings
4. Add webhook endpoint to Uptime Robot (`[BOT_DEPLOYMENT_URL]/webhook/[ID]`)
5. If using port, add `?port=[PORT]` to the end of the URL to overcome shortcoming in Uptime Robot webhook data properties available (-1 for verbose ignore)
6. Get responses to webhooks when fired

# Building your own

*Note*: You'll need to have access to an account that the bot can use to get the access token.

1. Clone this repository
2. `npm install`
3. `npm run build`
4. Copy `config/default.yaml` to `config/production.yaml`
5. Run the bot with `NODE_ENV=production node lib/index.js`

### Docker

```
A Dockerfile and docker-compose are provided.

Build the docker image:
`docker build -t matrix-bot-uptimerobot .`

Build the docker image and run docker-compose to deploy to your server:
`docker build -t matrix-bot-uptimerobot . && docker-compose run matrix-bot-uptimerobot`
```
