'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { buildApp } = require('../src/index')

const BASELINE = path.join(__dirname, '..', 'openapi.baseline.yaml')

function loadBaseline () {
  const content = fs.readFileSync(BASELINE, 'utf8')
  return yaml.load(content)
}

test('all paths in openapi.baseline.yaml are reachable', async (t) => {
  const spec = loadBaseline()
  const app = await buildApp({ logger: false })

  for (const [urlPath, methods] of Object.entries(spec.paths)) {
    for (const method of Object.keys(methods)) {
      const httpMethod = method.toUpperCase()

      const url = urlPath.replace(/{[^}]+}/g, 'test-id')

      await t.test(`${httpMethod} ${url} returns a non-5xx status`, async () => {
        const res = await app.inject({ method: httpMethod, url })
        assert.ok(
          res.statusCode < 500,
          `${httpMethod} ${url} returned ${res.statusCode} (expected < 500)`
        )
      })
    }
  }

  await app.close()
})
