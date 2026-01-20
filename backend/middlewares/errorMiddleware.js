const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = (err, req, res, next) => {
  // Логируем для сервера
  console.error('\n=== ERROR MIDDLEWARE ===')
  console.error('Request:', req.method, req.url)
  console.error('Error:', err)
  console.error('Error name:', err.name)
  console.error('Error message:', err.message)
  console.error('Error stack:', err.stack)
  if (err.code) {
    console.error('Error code:', err.code)
  }
  if (err.status) {
    console.error('Error status:', err.status)
  }
  console.error('========================\n')

  // AppError — контролируемая ошибка
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: err.code,
      details: err.details ?? null,
    })
  }

  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: ERRORS.INVALID_TOKEN,
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: ERRORS.INVALID_TOKEN,
    })
  }

  // Неизвестная ошибка
  return res.status(500).json({
    success: false,
    error: ERRORS.SERVER_ERROR,
  })
}
