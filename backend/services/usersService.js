const UsersModel = require('../models/usersModels');

module.exports = {
    async createUser(name, password) {
        return await UsersModel.createUser(name, password)
    },
    
    async getUserById(id) {
        return await UsersModel.getUserById(id)
    },

    async findUserByName(name) {
        return await UsersModel.findUserByName(name)
    },

    async deleteUser(id) {
        return await UsersModel.deleteUser(id)
    },
}