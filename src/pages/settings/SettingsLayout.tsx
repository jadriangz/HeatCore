import { Outlet, Link, useLocation } from 'react-router-dom'
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function SettingsLayout() {
    const location = useLocation()

    const navItems = [
        { href: '/settings', label: 'General' },
        { href: '/settings/inventory', label: 'Inventario y Catálogos' },
        { href: '/settings/shipping', label: 'Envíos' },
    ]

    return (
        <div className="flex gap-6 w-full">
            <nav className="w-64 flex-shrink-0 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-brand-red text-white"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="flex-1">
                <Card className="p-6">
                    <Outlet />
                </Card>
            </div>
        </div>
    )
}
