FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY symptom-report-service/package*.json /app/symptom-report-service/
WORKDIR /app/symptom-report-service
RUN npm install
COPY symptom-report-service/tsconfig.json ./
COPY symptom-report-service/src ./src
RUN npm run build

EXPOSE 3003
CMD ["npm", "start"]
