import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, ExternalLink, ShoppingBag, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Simple Badge Component (since we might not have one yet)
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
        {children}
    </span>
)

export default function Sales() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800'
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'shipped': return 'bg-blue-100 text-blue-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getOriginIcon = (origin: string) => {
        switch (origin) {
            case 'shopify': return <ShoppingBag className="h-4 w-4 text-green-600" />
            case 'tiktok': return <span className="text-xs font-bold font-mono">TT</span>
            default: return <Globe className="h-4 w-4 text-gray-500" />
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Historial de Ventas</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar orden o cliente..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="shipped">Enviado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3">Orden</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Origen</th>
                                <th className="px-4 py-3">Estatus</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                {/* <th className="px-4 py-3 text-center">Acciones</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        Cargando ventas...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        No se encontraron ordenes.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            #{order.order_number}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{order.customer_name || 'Cliente General'}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2" title={order.origin}>
                                                {getOriginIcon(order.origin)}
                                                <span className="capitalize">{order.origin}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status === 'paid' ? 'Pagado' :
                                                    order.status === 'pending' ? 'Pendiente' :
                                                        order.status === 'shipped' ? 'Enviado' :
                                                            order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ${order.total_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        {/* 
                                        <td className="px-4 py-3 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </td>
                                        */}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
