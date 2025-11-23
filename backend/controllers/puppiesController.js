const PuppiesService = require('../services/puppiesService');
const { success, error } = require('../utils/response');

module.exports = {
  async getAll(req, res) {
    try {
      success(res, await PuppiesService.getAll());
    } catch (e) {
      error(res, e);
    }
  },

  async getById(req, res) {
    try {
      success(res, await PuppiesService.getById(req.params.id));
    } catch (e) {
      error(res, e);
    }
  },

  async create(req, res) {
    try {
      success(res, await PuppiesService.create(req.body));
    } catch (e) {
      error(res, e);
    }
  },

  async update(req, res) {
    try {
      success(res, await PuppiesService.update(req.params.id, req.body));
    } catch (e) {
      error(res, e);
    }
  },

  async delete(req, res) {
    try {
      success(res, await PuppiesService.delete(req.params.id));
    } catch (e) {
      error(res, e);
    }
  },
};