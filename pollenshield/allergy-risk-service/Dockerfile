FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY allergy-risk-service/package*.json /app/allergy-risk-service/
WORKDIR /app/allergy-risk-service
RUN npm install
COPY allergy-risk-service/tsconfig.json ./
COPY allergy-risk-service/src ./src
RUN npm run build

EXPOSE 3004
CMD ["npm", "start"]
