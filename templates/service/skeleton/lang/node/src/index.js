'use strict'
// Story 4.2 / AD-16: Fastify service — Baseline Endpoints + health.
// AD-12: OpenTelemetry configured via environment variables.

const fastify = require('fastify')

const healthRoutes = require('./routes/health')
const itemsRoutes = require('./routes/items')
const telemetry = require('./telemetry')

async function buildApp (opts = {}) {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // JSON lines with traceId (AD-12)
      formatters: {
        log (obj) {
          return { ...obj, service: '${{ values.serviceName }}' }
        }
      }
    },
    ...opts
  })

  await app.register(healthRoutes)
  await app.register(itemsRoutes, { prefix: '/items' })

  return app
}

// Start only when invoked directly (not when required in tests).
if (require.main === module) {
  telemetry.init()
  buildApp().then(app => {
    const port = parseInt(process.env.PORT || '3000', 10)
    app.listen({ port, host: '0.0.0.0' }, (err) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
    })
  })
}

module.exports = { buildApp }
