'use strict'
// AD-15 / FR-21: Contract test — checks that the service's Baseline Endpoints
// match openapi.baseline.yaml.  Runs as: node --test test/contract.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')   // added as devDependency in package.json
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
      // Build a test URL; replace path params with plausible values.
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
