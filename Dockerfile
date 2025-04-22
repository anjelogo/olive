FROM node:23-alpine-slim AS runner

WORKDIR /app

# Only copy compiled JS and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

# Start app
CMD ["node", "dist/index.js"]