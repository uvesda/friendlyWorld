const SessionsModel = require('../models/sessionsModels');

module.exports = {
    async createSession(userId) {
        return await SessionsModel.createSession(userId)
    },
    
    async getSession(sessionId) {
        return await SessionsModel.getSession(sessionId)
    },

    async deleteSession(sessionId) {
        return await SessionsModel.deleteSession(sessionId)
    },
}