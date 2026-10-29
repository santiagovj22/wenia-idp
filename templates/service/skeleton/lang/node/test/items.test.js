'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { buildApp } = require('../src/index')

test('items endpoints', async (t) => {
  const app = await buildApp({ logger: false })

  await t.test('GET /items returns empty array initially', async () => {
    const res = await app.inject({ method: 'GET', url: '/items' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body), [])
  })

  let createdId

  await t.test('POST /items creates an item', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { name: 'widget', description: 'A test widget' }
    })
    assert.equal(res.statusCode, 201)
    const body = JSON.parse(res.body)
    assert.ok(body.id, 'response should have an id')
    assert.equal(body.name, 'widget')
    createdId = body.id
  })

  await t.test('GET /items/:id returns the created item', async () => {
    const res = await app.inject({ method: 'GET', url: `/items/${createdId}` })
    assert.equal(res.statusCode, 200)
    assert.equal(JSON.parse(res.body).name, 'widget')
  })

  await t.test('PUT /items/:id updates the item', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/items/${createdId}`,
      payload: { name: 'updated-widget' }
    })
    assert.equal(res.statusCode, 200)
    assert.equal(JSON.parse(res.body).name, 'updated-widget')
  })

  await t.test('DELETE /items/:id removes the item', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/items/${createdId}` })
    assert.equal(res.statusCode, 204)
  })

  await t.test('GET /items/:id returns 404 after deletion', async () => {
    const res = await app.inject({ method: 'GET', url: `/items/${createdId}` })
    assert.equal(res.statusCode, 404)
    assert.equal(JSON.parse(res.body).error.code, 'NOT_FOUND')
  })

  await t.test('POST /items with empty name returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { name: '' }
    })
    assert.equal(res.statusCode, 400)
  })

  await t.test('GET /items/:id with unknown id returns 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/items/does-not-exist' })
    assert.equal(res.statusCode, 404)
  })

  await app.close()
})
