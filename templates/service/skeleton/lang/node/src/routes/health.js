'use strict'

async function healthRoutes (app) {
  app.get('/health', async (_req, _reply) => {
    return { status: 'ok' }
  })
}

module.exports = healthRoutes
