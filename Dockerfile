FROM node:slim

RUN mkdir -p /app
WORKDIR /app

COPY . .

RUN npm install --omit=dev && \
  npm run build

ENTRYPOINT ["node", "/app/dist/index.js"]
