'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { buildApp } = require('../src/index')

test('GET /health returns 200 and status ok', async () => {
  const app = await buildApp({ logger: false })
  const res = await app.inject({ method: 'GET', url: '/health' })
  assert.equal(res.statusCode, 200)
  assert.deepEqual(JSON.parse(res.body), { status: 'ok' })
  await app.close()
})
