'use strict'

const { ItemsRepository } = require('../repository/itemsRepository')

class ItemsService {
  constructor () {
    this._repo = new ItemsRepository()
  }

  list () {
    return this._repo.findAll()
  }

  create (data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw Object.assign(new Error('name is required'), { code: 'VALIDATION_ERROR', status: 400 })
    }
    return this._repo.save({ name: data.name.trim(), description: data.description || '' })
  }

  get (id) {
    return this._repo.findById(id) || null
  }

  update (id, data) {
    if (!this._repo.findById(id)) return null
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw Object.assign(new Error('name is required'), { code: 'VALIDATION_ERROR', status: 400 })
    }
    return this._repo.update(id, { name: data.name.trim(), description: data.description || '' })
  }

  remove (id) {
    return this._repo.delete(id)
  }
}

module.exports = { ItemsService }
