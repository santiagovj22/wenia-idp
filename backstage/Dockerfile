# Build context: the REPO ROOT (not backstage/).
# docker-compose.yml sets context: . and dockerfile: backstage/Dockerfile.
# This gives the runner stage access to templates/ from the repo root.

# ---- build stage ----
FROM node:22-bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests (prefixed with backstage/ since context is repo root)
COPY backstage/.yarnrc.yml backstage/package.json backstage/yarn.lock ./
COPY backstage/.yarn/ .yarn/
COPY backstage/packages/app/package.json packages/app/
COPY backstage/packages/backend/package.json packages/backend/

RUN corepack enable && yarn install --immutable

# Copy the rest of the backstage source
COPY backstage/ .

# Build the app bundle (frontend + backend)
RUN yarn tsc && yarn build:backend

# ---- production stage ----
FROM node:22-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 1001 -g root backstage
WORKDIR /app
# Give the non-root user ownership of the workdir before switching.
# WORKDIR creates /app owned by root; without this, RUN commands as backstage
# cannot write new subdirectories (e.g. packages/backend/dist/scaffolder/).
RUN chown backstage:root /app
USER backstage

# Extract the bundle (creates package.json, packages/backend/dist/, packages/app/dist/)
COPY --from=build --chown=backstage:root /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy node_modules from the build stage (externals needed by bundled code)
COPY --from=build --chown=backstage:root /app/node_modules ./node_modules

# Copy app config and catalog fixtures
COPY --chown=backstage:root backstage/app-config.yaml backstage/app-config.production.yaml ./
COPY --chown=backstage:root backstage/catalog/ ./catalog/

# Copy the service template — available from repo root since context is .
COPY --chown=backstage:root templates/ ./templates/

# Create data directory for the run log (story 3.4)
RUN mkdir -p /app/data

EXPOSE 7007

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
