# AD-16: runs as non-root user (node uid 1000).
# K8s Service variant.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/

FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["node", "src/index.js"]
