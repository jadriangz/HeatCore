import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, X, Shield, Clock, ShieldAlert } from 'lucide-react'

type AuthorizedUser = {
    id: string
    email: string
    role: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function UserSettings() {
    const [users, setUsers] = useState<AuthorizedUser[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('authorized_users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error: any) {
            toast.error('Error fetching users: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('authorized_users')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            toast.success(`Usuario ${newStatus === 'approved' ? 'aprobado' : 'rechazado'} exitosamente.`)
            fetchUsers()
        } catch (error: any) {
            toast.error('Error actualizando estado: ' + error.message)
        }
    }

    const pendingUsers = users.filter(u => u.status === 'pending')
    const otherUsers = users.filter(u => u.status !== 'pending')

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h3 className="text-xl font-medium tracking-tight">Usuarios y Accesos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Administra quién tiene acceso al ERP. Las cuentas nuevas solicitarán acceso y aparecerán aquí como pendientes.
                </p>
            </div>

            {pendingUsers.length > 0 && (
                <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Solicitudes Pendientes
                            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100">{pendingUsers.length}</Badge>
                        </CardTitle>
                        <CardDescription>Estos usuarios intentaron iniciar sesión pero necesitan tu aprobación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-neutral-900 border rounded-lg shadow-sm">
                                <div>
                                    <p className="font-medium">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">Solicitado: {new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleUpdateStatus(user.id, 'approved')}
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Aprobar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Rechazar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Usuarios Activos / Historial</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : otherUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
                    ) : (
                        <div className="divide-y">
                            {otherUsers.map(user => (
                                <div key={user.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full">
                                            {user.status === 'approved' ? (
                                                <Shield className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <ShieldAlert className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{user.email}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={
                                            user.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }>
                                            {user.status === 'approved' ? 'Acceso Autorizado' : 'Acceso Denegado'}
                                        </Badge>
                                        {user.status === 'approved' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-muted-foreground hover:text-red-600"
                                                onClick={() => {
                                                    if (confirm('¿Estás seguro de revocar el acceso a este usuario?')) {
                                                        handleUpdateStatus(user.id, 'rejected')
                                                    }
                                                }}
                                            >
                                                Revocar
                                            </Button>
                                        )}
                                        {user.status === 'rejected' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-muted-foreground hover:text-green-600"
                                                onClick={() => handleUpdateStatus(user.id, 'approved')}
                                            >
                                                Re-Aprobar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
