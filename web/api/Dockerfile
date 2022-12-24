FROM node:18-alpine3.17

RUN apk add --no-cache tzdata openssl1.1-compat-dev

WORKDIR /app

ENV NODE_ENV=production

COPY ./ .
# TODO copy yarn.lock
RUN yarn install --frozen-lockfile --production=false
RUN yarn build

EXPOSE 4000

CMD [ "yarn", "start" ]
