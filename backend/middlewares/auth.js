const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const [, token] = authHeader.split(' ')

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret)
    req.user = decoded // { id }
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
