FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY environmental-data-service/package*.json /app/environmental-data-service/
WORKDIR /app/environmental-data-service
RUN npm install
COPY environmental-data-service/tsconfig.json ./
COPY environmental-data-service/src ./src
RUN npm run build

EXPOSE 3002
CMD ["npm", "start"]
