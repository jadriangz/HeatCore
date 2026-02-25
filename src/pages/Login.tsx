import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Flame, Loader2 } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Credenciales incorrectas.')
                }
                throw error
            }

            toast.success('¡Bienvenido a HeatCore!')
            navigate('/')
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true)
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            })

            if (error) throw error
        } catch (error: any) {
            toast.error(error.message || 'Error al conectar con Google')
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-600/20 mb-4 border border-red-500/50">
                        <Flame className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">HeatCore</h1>
                    <p className="text-neutral-400 mt-2 font-medium">Logistics & Order Management</p>
                </div>

                <Card className="border-neutral-800 bg-neutral-900/80 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-semibold tracking-tight text-white text-center">
                            Iniciar Sesión
                        </CardTitle>
                        <CardDescription className="text-neutral-400 text-center">
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full bg-white text-black hover:bg-neutral-200 border-0 h-11 relative"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || loading}
                        >
                            {googleLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2 absolute left-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continuar con Google
                                </>
                            )}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-neutral-900 px-2 text-neutral-500">O ingresa con tu correo</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-neutral-300">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@heatstore.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 h-11 focus-visible:ring-red-600 focus-visible:ring-offset-neutral-900"
                                    disabled={loading || googleLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-neutral-300">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 h-11 focus-visible:ring-red-600 focus-visible:ring-offset-neutral-900"
                                    disabled={loading || googleLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-medium transition-colors"
                                disabled={loading || googleLoading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ingresar al ERP
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-neutral-600 mt-8">
                    &copy; {new Date().getFullYear()} HeatStore TCG. Panel de acceso restringido.
                </p>
            </div>
        </div>
    )
}
