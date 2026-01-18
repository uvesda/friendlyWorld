const { createClient } = require('@supabase/supabase-js')

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Supabase client initialized:', {
    url: supabaseUrl,
    hasKey: !!supabaseKey,
  })
} else {
  console.warn('Supabase not configured. Missing:', {
    url: !supabaseUrl,
    key: !supabaseKey,
  })
}

module.exports = supabase
