FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY ./ .
# TODO copy yarn.lock
RUN yarn install --frozen-lockfile --production=false
RUN yarn build

EXPOSE 4000

CMD [ "yarn", "start" ]
