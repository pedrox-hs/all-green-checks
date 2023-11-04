FROM node:slim

COPY . .

RUN npm install --omit=dev && \
  npm run build && \
  rm -rf node_modules

ENTRYPOINT ["npm", "start"]
