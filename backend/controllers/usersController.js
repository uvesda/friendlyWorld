const SessionService = require('../services/sessionsService');
const UserService = require('../services/usersService');
const { success, error } = require('../utils/response');
const cookies = require('cookie-parser');
const SESSION_COOKIE_NAME = 'sid';

module.exports = {
    async logIn (req, res) {
        try {
            const { name, password } = req.body;
            if (!name || !password || typeof name !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid name or password' });
            }
            if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
            const existing = await UserService.findUserByName(name);
            if (existing) return res.status(409).json({ error: 'User already exists' });

            const user = await UserService.createUser(name, password);
            res.status(201).json({ id: user.id, name: user.name });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async logOut(req, res) {
        try {
            const sid = req.cookies[SESSION_COOKIE_NAME];
            if (sid) {
            await SessionService.deleteSession(sid);
            res.clearCookie(SESSION_COOKIE_NAME);
            }
            res.json({ ok: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
};