import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Package, User, MapPin, Truck } from 'lucide-react'

interface ViewOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: any | null
}

export default function ViewOrderDialog({ open, onOpenChange, order }: ViewOrderDialogProps) {
    const [orderItems, setOrderItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && order?.id) {
            fetchOrderDetails(order.id)
        } else {
            setOrderItems([])
        }
    }, [open, order])

    async function fetchOrderDetails(orderId: string) {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId)

            if (error) throw error
            setOrderItems(data || [])
        } catch (error) {
            console.error('Error fetching order items:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!order) return null

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800'
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'shipped': return 'bg-blue-100 text-blue-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const translateStatus = (status: string) => {
        switch (status) {
            case 'paid': return 'Pagado'
            case 'pending': return 'Pendiente'
            case 'shipped': return 'Enviado'
            case 'cancelled': return 'Cancelado'
            default: return status
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mt-2">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Package className="h-6 w-6 text-brand-red" />
                            Orden #{order.order_number}
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Badge className={getStatusColor(order.status)}>
                                {translateStatus(order.status)}
                            </Badge>
                            <Badge variant={order.fulfillment_status === 'fulfilled' ? 'default' : 'secondary'} className="bg-gray-200 text-black">
                                {order.fulfillment_status === 'fulfilled' ? 'Entregada' :
                                    order.fulfillment_status === 'partial' ? 'Parcial' : 'Pend. Empaque'}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Creada el {format(new Date(order.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                    {/* Detalles del Cliente */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                        <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                            <User className="h-4 w-4" />
                            Cliente
                        </h3>
                        {order.customer_id ? (
                            <div className="text-sm space-y-1">
                                <p className="font-medium">{order.customers?.name || order.customer_name}</p>
                                <p className="text-muted-foreground">{order.customers?.email || order.customer_email || 'Sin correo'}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Público General</p>
                        )}
                    </div>

                    {/* Detalles de Envío/Logística */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                        <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                            <Truck className="h-4 w-4" />
                            Logística
                        </h3>
                        <div className="text-sm space-y-1">
                            <p><span className="text-muted-foreground">Método de Pago:</span> <span className="capitalize">{order.payment_method}</span></p>
                            <p><span className="text-muted-foreground">Tipo de Entrega:</span> {order.requires_shipping ? 'Envío Especial' : 'Entrega Directa'}</p>
                            {order.requires_shipping && order.shipping_carrier && (
                                <p><span className="text-muted-foreground">Transportista:</span> {order.shipping_carrier}</p>
                            )}
                            {order.requires_shipping && order.shipping_address && (
                                <div className="mt-2 text-xs bg-white p-2 border rounded">
                                    <div className="font-semibold flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" /> Dirección:</div>
                                    <p>{order.shipping_address.street} {order.shipping_address.exterior_number} {order.shipping_address.interior_number}</p>
                                    <p>{order.shipping_address.neighborhood}, C.P. {order.shipping_address.postal_code}</p>
                                    <p>{order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.country}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Productos */}
                <div className="mt-2">
                    <h3 className="font-semibold mb-3">Productos</h3>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Precio Un.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : orderItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No se encontraron productos en esta orden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orderItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{item.sku}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Totales */}
                <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal:</span>
                            <span>${Number(order.total_amount - (order.shipping_cost_charged || 0) - (order.tax_amount || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Impuestos:</span>
                            <span>${Number(order.tax_amount || 0).toFixed(2)}</span>
                        </div>
                        {order.requires_shipping && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Envío:</span>
                                <span>${Number(order.shipping_cost_charged || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                            <span>Total:</span>
                            <span>${Number(order.total_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
