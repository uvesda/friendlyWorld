const db = require('./db')

/**
 * Migration script to populate chat_users table for existing chats
 * Run this once to ensure all existing chats have corresponding chat_users entries
 * Now optimized to check if migration is needed before running
 */
function migrateChatUsers() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First check if migration is needed
      db.get(
        `SELECT COUNT(*) as total_chats,
         (SELECT COUNT(DISTINCT chat_id) FROM chat_users) as migrated_chats
         FROM chats`,
        [],
        (err, stats) => {
          if (err) {
            console.error('Error checking migration status:', err)
            return reject(err)
          }

          // If all chats are already migrated, skip
          if (stats.total_chats === 0 || stats.migrated_chats >= stats.total_chats) {
            if (stats.total_chats > 0) {
              console.log('Chat users migration: already up to date')
            }
            return resolve()
          }

          // Get all existing chats
          db.all('SELECT id, user1_id, user2_id FROM chats', [], (err, chats) => {
            if (err) {
              console.error('Error fetching chats:', err)
              return reject(err)
            }

            if (chats.length === 0) {
              console.log('No chats to migrate')
              return resolve()
            }

            console.log(`Found ${chats.length} chats to migrate`)

            let completed = 0
            let errors = 0

            chats.forEach((chat) => {
              // Insert chat_users entries for both users if they don't exist
              const insertUser1 = new Promise((res, rej) => {
                db.run(
                  `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                  [chat.id, chat.user1_id],
                  function (err) {
                    if (err) rej(err)
                    else res()
                  }
                )
              })

              const insertUser2 = new Promise((res, rej) => {
                db.run(
                  `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                  [chat.id, chat.user2_id],
                  function (err) {
                    if (err) rej(err)
                    else res()
                  }
                )
              })

              Promise.all([insertUser1, insertUser2])
                .then(() => {
                  completed++
                  if (completed + errors === chats.length) {
                    console.log(`Migration completed: ${completed} chats migrated, ${errors} errors`)
                    resolve()
                  }
                })
                .catch((error) => {
                  console.error(`Error migrating chat ${chat.id}:`, error)
                  errors++
                  if (completed + errors === chats.length) {
                    console.log(`Migration completed: ${completed} chats migrated, ${errors} errors`)
                    resolve() // Still resolve to not block
                  }
                })
            })
          })
        }
      )
    })
  })
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
