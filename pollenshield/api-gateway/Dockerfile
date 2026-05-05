FROM node:20-alpine

WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install
COPY api-gateway/tsconfig.json ./
COPY api-gateway/src ./src
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

