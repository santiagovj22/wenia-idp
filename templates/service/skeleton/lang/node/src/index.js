'use strict'
const telemetry = require('./telemetry')
telemetry.init()
const fastify = require('fastify')

const healthRoutes = require('./routes/health')
const itemsRoutes = require('./routes/items')


async function buildApp (opts = {}) {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
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

if (require.main === module) {

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
