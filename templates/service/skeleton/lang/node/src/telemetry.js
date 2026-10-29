'use strict'

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
    const { NodeSDK } = require('@opentelemetry/sdk-node')
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
    const { resourceFromAttributes } = require('@opentelemetry/resources')
    const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
    const { Resource } = require('@opentelemetry/resources')
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
    
    const sdk = new NodeSDK({
      resource: new Resource({
        'service.name': '${{ values.serviceName }}',
        'wenia.template.version': '${{ values.templateVersion }}'
      }),
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations({
        // Disable noisy instrumentations, keep HTTP and Fastify
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
      })]
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
