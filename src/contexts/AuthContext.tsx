import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initial session fetch
        let mounted = true

        // Capture any URL hash errors immediately before Supabase clears them, just in case
        const hash = window.location.hash

        if (hash && hash.includes('error_description')) {
            const params = new URLSearchParams(hash.substring(1))
            const errorDesc = params.get('error_description')
            if (errorDesc) {
                toast.error(decodeURIComponent(errorDesc).replace(/\+/g, ' '))
                window.location.hash = '' // Clear so it doesn't stay
            }
        }

        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (mounted) {
                if (error) {
                    console.error('Session get error:', error)
                    toast.error(error.message)
                }
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
                // We do NOT set loading to false here for the initial load, 
                // because getSession is the authoritative source that properly waits for OAuth hash parsing.
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
