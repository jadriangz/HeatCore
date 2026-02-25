import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Package, ShoppingCart, BarChart3, Settings, LogOut, ClipboardList, Users, ShoppingBag, ClipboardCheck, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthContext'



export default function DashboardLayout() {
    const location = useLocation()
    const { signOut } = useAuth()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const navGroups = [
        {
            title: "Ventas",
            items: [
                { href: '/', label: 'Punto de Venta', icon: ShoppingCart },
                { href: '/sales', label: 'Ventas', icon: ClipboardList },
                { href: '/customers', label: 'Clientes', icon: Users },
            ]
        },
        {
            title: "Compras",
            items: [
                { href: '/purchasing', label: 'Proveedores y POs', icon: ShoppingBag },
                { href: '/receiving', label: 'Recepciones', icon: ClipboardCheck },
            ]
        },
        {
            title: "Logística e Inventario",
            items: [
                { href: '/packing', label: 'Empaquetado', icon: Package },
                { href: '/shipments', label: 'Envíos', icon: Truck },
                { href: '/inventory', label: 'Inventario y Auditoría', icon: BarChart3 },
            ]
        },
        {
            title: "Sistema",
            items: [
                { href: '/settings', label: 'Configuración', icon: Settings },
            ]
        }
    ]

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans relative">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-[#111111] text-white border-r border-[#222222] transition-all duration-300 flex flex-col shadow-sm z-10",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-20 flex items-center justify-between px-4 border-b border-[#222222]">
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <div className="bg-white rounded overflow-hidden h-14 w-14 flex-shrink-0 shadow-lg border-2 border-[#222222]">
                            <img src="/heatcore-ai-logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-black text-2xl tracking-[0.15em] bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">HeatCore</span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                    {navGroups.map((group, idx) => (
                        <div key={idx}>
                            {isSidebarOpen && (
                                <h3 className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest pl-1">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = location.pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors",
                                                isActive
                                                    ? "bg-brand-red text-white shadow-md relative"
                                                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                                                !isSidebarOpen && "justify-center"
                                            )}
                                        >
                                            {isActive && isSidebarOpen && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />
                                            )}
                                            <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-gray-400")} />
                                            {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#222222]">
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            try {
                                await signOut();
                            } catch (e) {
                                console.error('Error signing out', e);
                            }
                        }}
                        className={cn("w-full justify-start text-gray-400 hover:text-white hover:bg-white/10", !isSidebarOpen && "justify-center px-0")}
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        {isSidebarOpen && "Cerrar Sesión"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-14 border-b bg-card flex items-center px-6">
                    <h2 className="font-semibold text-lg">
                        {navGroups.flatMap(g => g.items).find(i => i.href === location.pathname)?.label || 'Dashboard'}
                    </h2>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
            <Toaster />
        </div>
    )
}
