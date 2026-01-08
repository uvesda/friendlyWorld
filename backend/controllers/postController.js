const PostService = require('../services/postService')
const { success, error } = require('../utils/response')

module.exports = {
  async create(req, res) {
    try {
      const post = await PostService.create(req.user.id, req.body)
      success(res, post, 201)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async getAll(req, res) {
    try {
      const posts = await PostService.getAll(req.query)
      success(res, posts)
    } catch (e) {
      error(res, e)
    }
  },

  async getById(req, res) {
    try {
      const post = await PostService.getById(req.params.id)
      success(res, post)
    } catch (e) {
      error(res, e, 404)
    }
  },

  async getMyPosts(req, res) {
    try {
      const posts = await PostService.getMyPosts(req.user.id)
      success(res, posts)
    } catch (e) {
      error(res, e)
    }
  },

  async delete(req, res) {
    try {
      await PostService.delete(req.params.id, req.user.id)
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },

  async update(req, res) {
    try {
      await PostService.update(req.params.id, req.user.id, req.body)
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },
}
