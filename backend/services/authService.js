const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')
const RefreshTokenModel = require('../models/refreshTokenModel')
const jwtConfig = require('../config/jwt')

function generateAccessToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  })
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn,
  })
}

module.exports = {
  async register(data) {
    const user = await UserModel.create({
      ...data,
      password: await bcrypt.hash(data.password, 10),
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await RefreshTokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return { user, accessToken, refreshToken }
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email)
    if (!user) throw new Error('Invalid credentials')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid credentials')

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await RefreshTokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    }
  },

  async refresh(refreshToken) {
    const stored = await RefreshTokenModel.find(refreshToken)
    if (!stored) throw new Error('Invalid refresh token')

    jwt.verify(refreshToken, jwtConfig.refresh.secret)

    const accessToken = jwt.sign(
      { id: stored.user_id },
      jwtConfig.access.secret,
      { expiresIn: jwtConfig.access.expiresIn }
    )

    return { accessToken }
  },

  async logout(refreshToken) {
    await RefreshTokenModel.delete(refreshToken)
    return true
  },
}
