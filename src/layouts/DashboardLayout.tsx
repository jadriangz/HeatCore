import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Package, ShoppingCart, BarChart3, Settings, Menu, LogOut, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { supabase, supabaseInitError, supabaseInitUrl } from '@/lib/supabase'
import { useEffect } from 'react'

export default function DashboardLayout() {
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const navItems = [
        { href: '/', label: 'Punto de Venta', icon: ShoppingCart },
        { href: '/packing', label: 'Empaquetado', icon: Package },
        { href: '/inventory', label: 'Inventarios', icon: BarChart3 },
        { href: '/settings', label: 'Configuración', icon: Settings },
    ]

    const [debugInfo, setDebugInfo] = useState<{ url: string, status: string }>({ url: 'Checking...', status: 'Testing...' })

    // TEMPORARY DEBUG: Check Supabase Connection


    useEffect(() => {
        const checkConnection = async () => {
            // Use the exported initUrl if available, otherwise check client
            // @ts-ignore
            const url = supabaseInitUrl || supabase.supabaseUrl || 'Unknown'

            if (supabaseInitError) {
                setDebugInfo({ url, status: `Init Fail: ${supabaseInitError}` })
                return
            }

            try {
                const { count, error } = await supabase.from('product_variants').select('*', { count: 'exact', head: true })
                if (error) {
                    setDebugInfo({ url, status: `DB Error: ${error.message}` })
                } else {
                    setDebugInfo({ url, status: `Connected! (Count: ${count})` })
                }
            } catch (e: any) {
                setDebugInfo({ url, status: `Crash: ${e.message}` })
            }
        }
        checkConnection()
    }, [])

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans relative">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-card border-r border-border transition-all duration-300 flex flex-col shadow-sm z-10",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                    {isSidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                <Flame className="h-6 w-6 text-primary fill-primary/20" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">HeatCore</span>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto">
                        <Menu className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    !isSidebarOpen && "justify-center"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}>
                        <LogOut className="h-5 w-5 mr-2" />
                        {isSidebarOpen && "Logout"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-14 border-b bg-card flex items-center px-6">
                    <h2 className="font-semibold text-lg">
                        {navItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}
                    </h2>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>

            {/* DEBUG FOOTER */}
            <div className="fixed bottom-0 right-0 bg-black text-white text-xs p-2 m-2 rounded opacity-80 pointer-events-none z-50 font-mono">
                <div>URL: {debugInfo.url}</div>
                <div>Status: {debugInfo.status}</div>
            </div>
        </div>
    )
}
