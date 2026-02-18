import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Environment Variables')
    }
    // Trim whitespace and remove quotes just in case
    client = createClient(
        supabaseUrl.trim().replace(/^["']|["']$/g, ''),
        supabaseAnonKey.trim().replace(/^["']|["']$/g, '')
    )
} catch (error) {
    console.error('Supabase Initialization Error:', error)
    // Fallback to safe placeholder so app can launch and show ErrorBoundary
    client = createClient('https://placeholder.supabase.co', 'placeholder')
}

export const supabase = client
