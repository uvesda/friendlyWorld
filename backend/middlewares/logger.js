module.exports = (req, res, next) => {
  console.log(`\n=== INCOMING REQUEST ===`)
  console.log(`${req.method} ${req.url}`)
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'present' : 'missing',
  })
  console.log('========================\n')
  next()
}