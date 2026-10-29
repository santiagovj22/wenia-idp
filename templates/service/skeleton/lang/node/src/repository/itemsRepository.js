'use strict'

const { randomUUID } = require('crypto')

class ItemsRepository {
  constructor () {
    this._store = new Map()
  }

  findAll () {
    return Array.from(this._store.values())
  }

  findById (id) {
    return this._store.get(id) || null
  }

  save (data) {
    const item = { id: randomUUID(), ...data, createdAt: new Date().toISOString() }
    this._store.set(item.id, item)
    return item
  }

  update (id, data) {
    const existing = this._store.get(id)
    if (!existing) return null
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    this._store.set(id, updated)
    return updated
  }

  delete (id) {
    return this._store.delete(id)
  }
}

module.exports = { ItemsRepository }
