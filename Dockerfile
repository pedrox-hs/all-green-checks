FROM node:slim

COPY . .

RUN npm install --omit=dev && \
  npm run build

ENTRYPOINT ["npm", "start"]
