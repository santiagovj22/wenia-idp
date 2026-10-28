'use strict'
// AD-12: OpenTelemetry setup. Reads standard OTEL_* env vars.
// Without OTEL_EXPORTER_OTLP_ENDPOINT the exporter is disabled and the
// service logs "telemetry disabled" — it never crashes.

function init () {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    console.log(JSON.stringify({
      level: 'info',
      msg: 'telemetry disabled — set OTEL_EXPORTER_OTLP_ENDPOINT to enable',
      service: '${{ values.serviceName }}'
    }))
    return
  }

  try {
    // Dynamic require so the service starts even if the SDK isn't installed yet.
    const { NodeSDK } = require('@opentelemetry/sdk-node')
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
    const { resourceFromAttributes } = require('@opentelemetry/resources')
    const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: '${{ values.serviceName }}',
        'wenia.template.version': '${{ values.templateVersion }}'
      }),
      traceExporter: new OTLPTraceExporter()
    })
    sdk.start()
    console.log(JSON.stringify({
      level: 'info',
      msg: 'telemetry enabled',
      endpoint,
      service: '${{ values.serviceName }}'
    }))
  } catch (err) {
    console.log(JSON.stringify({
      level: 'warn',
      msg: 'telemetry SDK not available, continuing without it',
      error: err.message,
      service: '${{ values.serviceName }}'
    }))
  }
}

module.exports = { init }
