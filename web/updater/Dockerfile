FROM node:lts-alpine as builder

WORKDIR /app

ENV NODE_ENV=production

COPY ./ .
RUN rm -rf ./node_modules/
RUN yarn install --frozen-lockfile --production=false
RUN yarn build

FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=pptruser --from=builder /app/ /app/

CMD [ "yarn", "start" ]
