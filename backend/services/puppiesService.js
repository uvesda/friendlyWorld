const PuppiesModel = require('../models/puppiesModel');

module.exports = {
  async getAll() {
    return await PuppiesModel.getAll();
  },

  async getById(id) {
    return await PuppiesModel.getById(id);
  },

  async create(data) {
    return await PuppiesModel.create(data);
  },

  async update(id, data) {
    return await PuppiesModel.update(id, data);
  },

  async delete(id) {
    return await PuppiesModel.delete(id);
  },
};