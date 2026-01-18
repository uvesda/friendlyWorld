const { createClient } = require('@supabase/supabase-js')

// Инициализация Supabase клиента
// Используем SERVICE_ROLE_KEY для бекенда - он обходит RLS политики
// Это безопасно, так как бекенд не доступен клиентам
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

console.log('=== SUPABASE CONFIG ===')
console.log('SUPABASE_URL exists:', !!supabaseUrl)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY)
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON')
if (supabaseUrl) {
  console.log('SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...')
}
console.log('=======================')

let supabase = null

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log('✅ Supabase client initialized successfully')
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✅ Using SERVICE_ROLE_KEY - RLS policies will be bypassed')
    } else {
      console.warn('⚠️ Using ANON_KEY - make sure RLS policies allow uploads')
    }
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error)
  }
} else {
  console.warn('⚠️ Supabase not configured. Missing:', {
    url: !supabaseUrl,
    key: !supabaseKey,
  })
}

module.exports = supabase
