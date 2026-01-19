const db = require('./db')

/**
 * Migration script to populate chat_users table for existing chats
 * Run this once to ensure all existing chats have corresponding chat_users entries
 * Now optimized to check if migration is needed before running
 */
async function migrateChatUsers() {
  const isPostgreSQL = !!process.env.DATABASE_URL

  try {
    // First check if migration is needed
    let stats
    if (isPostgreSQL) {
      try {
        const result = await db.query(
          `SELECT COUNT(*) as total_chats,
           (SELECT COUNT(DISTINCT chat_id) FROM chat_users) as migrated_chats
           FROM chats`
        )
        stats = result.rows[0]
      } catch (err) {
        // Если таблицы еще не созданы, просто пропускаем миграцию
        if (err.code === '42P01' || err.message.includes('does not exist')) {
          console.log('⚠️ Таблицы еще не созданы, миграция пропущена')
          return
        }
        throw err
      }
    } else {
      stats = await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.get(
            `SELECT COUNT(*) as total_chats,
             (SELECT COUNT(DISTINCT chat_id) FROM chat_users) as migrated_chats
             FROM chats`,
            [],
            (err, row) => {
              if (err) {
                // Если таблицы еще не созданы, просто пропускаем миграцию
                if (err.message.includes('does not exist')) {
                  console.log('⚠️ Таблицы еще не созданы, миграция пропущена')
                  return resolve({ total_chats: 0, migrated_chats: 0 })
                }
                return reject(err)
              }
              resolve(row)
            }
          )
        })
      })
    }

    // If all chats are already migrated, skip
    const totalChats = parseInt(stats.total_chats) || 0
    const migratedChats = parseInt(stats.migrated_chats) || 0

    if (totalChats === 0 || migratedChats >= totalChats) {
      if (totalChats > 0) {
        console.log('✅ Chat users migration: already up to date')
      }
      return
    }

    // Get all existing chats
    let chats
    if (isPostgreSQL) {
      const result = await db.query('SELECT id, user1_id, user2_id FROM chats')
      chats = result.rows
    } else {
      chats = await new Promise((resolve, reject) => {
        db.all('SELECT id, user1_id, user2_id FROM chats', [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    }

    if (chats.length === 0) {
      console.log('ℹ️ No chats to migrate')
      return
    }

    console.log(`🔄 Found ${chats.length} chats to migrate`)

    let completed = 0
    let errors = 0

    // Мигрируем все чаты параллельно
    const migrations = chats.map(async (chat) => {
      try {
        // Insert chat_users entries for both users if they don't exist
        if (isPostgreSQL) {
          await db.query(
            `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) ON CONFLICT (chat_id, user_id) DO NOTHING`,
            [chat.id, chat.user1_id]
          )
          await db.query(
            `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) ON CONFLICT (chat_id, user_id) DO NOTHING`,
            [chat.id, chat.user2_id]
          )
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chat.id, chat.user1_id],
              (err) => (err ? reject(err) : resolve())
            )
          })
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chat.id, chat.user2_id],
              (err) => (err ? reject(err) : resolve())
            )
          })
        }
        completed++
      } catch (error) {
        console.error(`❌ Error migrating chat ${chat.id}:`, error.message)
        errors++
      }
    })

    await Promise.all(migrations)

    console.log(`✅ Migration completed: ${completed} chats migrated, ${errors} errors`)
  } catch (err) {
    // Если таблицы еще не созданы, это не критично
    if (err.code === '42P01' || err.message.includes('does not exist')) {
      console.log('⚠️ Таблицы еще не созданы, миграция будет выполнена позже')
      return
    }
    throw err
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateChatUsers()
    .then(() => {
      console.log('Migration finished')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}

module.exports = migrateChatUsers
