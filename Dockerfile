FROM node:slim

ENV NODE_ENV="production"

WORKDIR /usr/src/app

COPY . .

RUN npm ci --omit=dev && \
  npm run build && \
  npm cache clean --force

ENTRYPOINT ["npm", "--prefix", "/usr/src/app", "start"]
