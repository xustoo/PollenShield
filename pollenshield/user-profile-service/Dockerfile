FROM node:20-alpine

WORKDIR /app
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
COPY user-profile-service/package*.json /app/user-profile-service/
WORKDIR /app/user-profile-service
RUN npm install
COPY user-profile-service/tsconfig.json ./
COPY user-profile-service/src ./src
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
