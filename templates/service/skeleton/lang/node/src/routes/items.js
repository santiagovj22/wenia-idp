'use strict'

const { ItemsService } = require('../service/itemsService')

const svc = new ItemsService()

async function itemsRoutes (app, opts) {
  // GET /items — list all items
  app.get('/', async (_req, reply) => {
    return reply.code(200).send(svc.list())
  })

  // POST /items — create an item
  app.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const item = svc.create(req.body)
    return reply.code(201).send(item)
  })

  // GET /items/:id — get one item
  app.get('/:id', async (req, reply) => {
    const item = svc.get(req.params.id)
    if (!item) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Item ${req.params.id} not found` } })
    }
    return reply.code(200).send(item)
  })

  // PUT /items/:id — update an item
  app.put('/:id', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    const item = svc.update(req.params.id, req.body)
    if (!item) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Item ${req.params.id} not found` } })
    }
    return reply.code(200).send(item)
  })

  // DELETE /items/:id — delete an item
  app.delete('/:id', async (req, reply) => {
    const deleted = svc.remove(req.params.id)
    if (!deleted) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Item ${req.params.id} not found` } })
    }
    return reply.code(204).send()
  })
}

module.exports = itemsRoutes
