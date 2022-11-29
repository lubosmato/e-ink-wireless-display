FROM node:lts-alpine

ARG VITE_API_URL

WORKDIR /app

ENV NODE_ENV=production

COPY ./ .
# TODO copy yarn.lock
RUN rm -rf ./.svelte-kit/
RUN yarn install --frozen-lockfile --production=false
RUN yarn build

EXPOSE 3000

ENV VITE_API_URL=$VITE_API_URL

CMD [ "yarn", "preview", "--host", "0.0.0.0", "--port", "3000" ]
