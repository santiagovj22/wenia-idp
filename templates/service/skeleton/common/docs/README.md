# ${{ values.serviceName }}

${{ values.description }}

**Owner:** ${{ values.owner }}
**Language:** ${{ values.language }}
**Type:** ${{ values.serviceType }}
**Template version:** ${{ values.templateVersion }}

---

## Develop

### Prerequisites
- Docker Desktop (running)
- Node.js 22 (for Node.js services)

### Run locally

```bash
cp .env.example .env          # fill in values
docker compose up --build     # starts the service
```

The service is ready when you see `Listening on port 3000`.

### Run tests

```bash
npm test
```

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Create an item
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"my-item","description":"A test item"}'

# List items
curl http://localhost:3000/items
```

---

## Verify

Run the Wenia evidence harness from the root IDP repository:

```bash
node verify/run.mjs
```

---

## Operate

See [docs/runbook.md](runbook.md) and [docs/troubleshooting.md](troubleshooting.md).

---

## Evolve

This service was generated from `${{ values.templateRef }}` version `${{ values.templateVersion }}`.

CI fixes reach this service automatically — the CI workflow calls a shared reusable workflow
(`santiagovj22/wenia-platform-workflows@v1`). See the IDP upgrade strategy for how to
apply breaking changes.
