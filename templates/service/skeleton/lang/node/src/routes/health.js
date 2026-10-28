'use strict'
// AD-16: GET /health — every combination must expose this.

async function healthRoutes (app) {
  app.get('/health', async (_req, _reply) => {
    return { status: 'ok' }
  })
}

module.exports = healthRoutes
