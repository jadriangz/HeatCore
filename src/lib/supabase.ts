import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client
let initError = null
let initUrl = null

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Environment Variables')
    }
    // Trim whitespace and remove quotes just in case
    const cleanUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '')
    const cleanKey = supabaseAnonKey.trim().replace(/^["']|["']$/g, '')

    initUrl = cleanUrl
    client = createClient(cleanUrl, cleanKey)
} catch (error: any) {
    console.error('Supabase Initialization Error:', error)
    initError = error.message
    // Fallback to safe placeholder so app can launch and show ErrorBoundary
    client = createClient('https://placeholder.supabase.co', 'placeholder')
}

export const supabase = client
export const supabaseInitError = initError
export const supabaseInitUrl = initUrl
