const { createClient } = require('@supabase/supabase-js')

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('=== SUPABASE CONFIG ===')
console.log('SUPABASE_URL exists:', !!supabaseUrl)
console.log('SUPABASE_ANON_KEY exists:', !!supabaseKey)
if (supabaseUrl) {
  console.log('SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...')
}
console.log('=======================')

let supabase = null

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client initialized successfully')
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
