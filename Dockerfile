FROM node:10-alpine

COPY . /tmp/src
WORKDIR /tmp/src
RUN apk add --no-cache make gcc g++ python ca-certificates libc-dev wget git sqlite \
    && mkdir /config \
    && mv config/* /config/ \
    && npm install \
    && npm run build \
    && mv lib/ /matrix-bot-uptimerobot/ \
    && mv node_modules / \
    && cd / \
    && rm -rf /tmp/*

WORKDIR /

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/config

# We want to make sure that the user can't configure these wrong
ENV BOT_DOCKER_LOGS=true
ENV BOT_PORT=33001

CMD node /matrix-bot-uptimerobot/index.js

EXPOSE 33001