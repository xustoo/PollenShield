FROM node:20-alpine

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/src ./src

EXPOSE 5173
CMD ["npm", "run", "dev"]

