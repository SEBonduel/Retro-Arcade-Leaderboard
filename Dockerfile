# Stage 1 : installation des dependances
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2 : image finale legere
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3001

USER node

CMD ["node", "app.js"]
