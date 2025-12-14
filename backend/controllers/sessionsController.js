const SessionService = require('../services/sessionsService');
const UserService = require('../services/usersService');
const { success, error } = require('../utils/response');
const cookieParser = require('cookie-parser');


module.exports = {
  async authController(req, res, next) {
    console.log('ggg');
    try {
      const SESSION_COOKIE_NAME = 'sid';
      const sid = req.cookies[SESSION_COOKIE_NAME];
      console.log('кука');
      if (!sid) {
        req.user = null;
        return next();
      }
      const session = await SessionService.getSession(sid);
      if (!session) {
        req.user = null;
        return next();
      }
      const user = await UserService.getUserById(session.userId);
      if (!user) {
        await SessionService.deleteSession(sid);
        req.user = null;
        return next();
      }
      req.user = user;
      req.session = session;
      next();
    } catch (err) {
      next(err);
    }
  }
};