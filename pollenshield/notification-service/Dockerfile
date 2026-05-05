FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY notification-service/package*.json /app/notification-service/
WORKDIR /app/notification-service
RUN npm install
COPY notification-service/tsconfig.json ./
COPY notification-service/src ./src
RUN npm run build

EXPOSE 3006
CMD ["npm", "start"]
