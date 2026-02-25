import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <p className="text-sm text-neutral-500 font-medium">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        // Redirect to login page, but save the current location they were trying to go to
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
