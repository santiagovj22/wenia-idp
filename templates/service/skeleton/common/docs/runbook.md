# Runbook — ${{ values.serviceName }}

## Health check

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

## Key metrics (New Relic)

Once telemetry is configured (`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` in `.env`):

- **Service name:** `${{ values.serviceName }}`
- **NRQL — error rate:** `SELECT percentage(count(*), WHERE error IS true) FROM Span WHERE service.name = '${{ values.serviceName }}'`
- **NRQL — latency p95:** `SELECT percentile(duration.ms, 95) FROM Span WHERE service.name = '${{ values.serviceName }}'`
- **NRQL — throughput:** `SELECT rate(count(*), 1 minute) FROM Span WHERE service.name = '${{ values.serviceName }}'`

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ECONNREFUSED` on startup | Dependency not available | Check `.env`, ensure dependencies are running |
| `400 VALIDATION_ERROR` | Invalid request body | Check the API definition; ensure required fields are present |
| `404 NOT_FOUND` | Resource does not exist | Confirm the id is correct |
| Telemetry not visible in New Relic | Missing env vars | Set `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS`; service logs `telemetry disabled` when these are absent |

## Restart

```bash
docker compose restart
```
