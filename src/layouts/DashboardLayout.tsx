import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Package, ShoppingCart, BarChart3, Settings, Menu, LogOut, Flame, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'



export default function DashboardLayout() {
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const navItems = [
        { href: '/', label: 'Punto de Venta', icon: ShoppingCart },
        { href: '/sales', label: 'Ventas', icon: ClipboardList },
        { href: '/packing', label: 'Empaquetado', icon: Package },
        { href: '/inventory', label: 'Inventarios', icon: BarChart3 },
        { href: '/settings', label: 'Configuración', icon: Settings },
    ]

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
        </div>
    )
}
