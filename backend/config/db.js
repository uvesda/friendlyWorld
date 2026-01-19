const { Pool } = require('pg')

// Получаем DATABASE_URL из переменных окружения
// Supabase предоставляет строку подключения в формате:
// postgresql://postgres:[password]@[host]:[port]/postgres
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL не установлена. Используется SQLite для локальной разработки.')
  // Fallback на SQLite для локальной разработки
  const sqlite3 = require('sqlite3').verbose()
  const path = require('path')
  const dbPath = path.resolve(__dirname, '../database.sqlite')
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Ошибка подключения к SQLite:', err)
    else console.log('SQLite подключена (локальная разработка)')
  })
  module.exports = db
} else {
  // PostgreSQL для продакшена
  let poolConfig
  
  try {
    // Парсим connection string для добавления опций
    const url = new URL(databaseUrl)
    
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1) || 'postgres',
      user: url.username || 'postgres',
      password: url.password,
      ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
      // Принудительно используем IPv4 (важно для Render.com)
      family: 4, // 4 = IPv4, 6 = IPv6, 0 = автоматически
    }
    
    console.log(`🔌 Подключение к PostgreSQL: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`)
  } catch (err) {
    // Если парсинг не удался, используем connectionString напрямую
    console.warn('⚠️ Не удалось распарсить DATABASE_URL, используем напрямую')
    poolConfig = {
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
    }
  }

  const pool = new Pool(poolConfig)

  pool.on('connect', (client) => {
    console.log('✅ PostgreSQL подключена (Supabase)')
    console.log(`   Host: ${client.host}, Database: ${client.database}`)
  })

  pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message)
    console.error('   Code:', err.code)
    if (err.address) console.error('   Address:', err.address)
  })

  // Тестируем подключение при инициализации
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Тест подключения к PostgreSQL успешен')
    })
    .catch((err) => {
      console.error('❌ Тест подключения к PostgreSQL не удался:', err.message)
      console.error('   Проверьте DATABASE_URL и доступность базы данных')
    })

  // Создаем обертку для совместимости с SQLite API
  const db = {
    // Эмуляция db.run() для SQLite
    run: function (query, params, callback) {
      // Если callback - это функция, значит это старый API
      if (typeof params === 'function') {
        callback = params
        params = []
      }

      const convertedQuery = convertQuery(query)
      const convertedParams = convertParams(params)

      pool
        .query(convertedQuery, convertedParams)
        .then((result) => {
          // Эмулируем this.lastID и this.changes
          const mockThis = {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount || 0,
          }
          if (callback) callback(null, mockThis)
        })
        .catch((err) => {
          if (callback) callback(err)
          else console.error('DB Error:', err)
        })
    },

    // Эмуляция db.get() для SQLite
    get: function (query, params, callback) {
      if (typeof params === 'function') {
        callback = params
        params = []
      }

      const convertedQuery = convertQuery(query)
      const convertedParams = convertParams(params)

      pool
        .query(convertedQuery, convertedParams)
        .then((result) => {
          if (callback) callback(null, result.rows[0] || null)
        })
        .catch((err) => {
          if (callback) callback(err)
          else console.error('DB Error:', err)
        })
    },

    // Эмуляция db.all() для SQLite
    all: function (query, params, callback) {
      if (typeof params === 'function') {
        callback = params
        params = []
      }

      const convertedQuery = convertQuery(query)
      const convertedParams = convertParams(params)

      pool
        .query(convertedQuery, convertedParams)
        .then((result) => {
          if (callback) callback(null, result.rows || [])
        })
        .catch((err) => {
          if (callback) callback(err)
          else console.error('DB Error:', err)
        })
    },

    // Эмуляция db.serialize() для SQLite (не нужна для PostgreSQL, но оставляем для совместимости)
    serialize: function (callback) {
      if (callback) callback()
    },

    // Прямой доступ к pool для продвинутых запросов
    query: (query, params) => {
      const convertedQuery = convertQuery(query)
      const convertedParams = convertParams(params)
      return pool.query(convertedQuery, convertedParams)
    },
  }

  // Функция для конвертации SQLite синтаксиса в PostgreSQL
  function convertQuery(query) {
    if (!query) return query

    // Если запрос уже использует $1, $2, $3 (PostgreSQL синтаксис), не конвертируем
    if (query.includes('$1')) return query

    // Заменяем ? на $1, $2, $3...
    let paramIndex = 1
    return query.replace(/\?/g, () => `$${paramIndex++}`)
  }

  // Функция для конвертации параметров (если нужно)
  function convertParams(params) {
    return params || []
  }

  module.exports = db
}
