FROM node:slim

COPY . .

RUN npm install --production && \
  npm run build && \
  rm -rf node_modules

ENTRYPOINT ["npm", "start"]
