FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
# Bundled public-domain Bible text, read from memory at startup.
COPY --from=build /app/data ./data
USER node
CMD ["node", "--enable-source-maps", "dist/server.js"]
