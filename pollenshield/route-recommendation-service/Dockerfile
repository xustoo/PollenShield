FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY route-recommendation-service/package*.json /app/route-recommendation-service/
WORKDIR /app/route-recommendation-service
RUN npm install
COPY route-recommendation-service/tsconfig.json ./
COPY route-recommendation-service/src ./src
RUN npm run build

EXPOSE 3005
CMD ["npm", "start"]
