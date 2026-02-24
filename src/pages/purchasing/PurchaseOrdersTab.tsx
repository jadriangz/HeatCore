import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Plus, Search, FileText, MoreHorizontal, Ban } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import NewPurchaseOrderDialog from "./NewPurchaseOrderDialog"
import ViewPurchaseOrderDialog from "./ViewPurchaseOrderDialog"

export default function PurchaseOrdersTab() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [viewPO, setViewPO] = useState<any>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`
                    *,
                    suppliers ( name )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error: any) {
            console.error('Error fetching POs:', error)
            alert('Error al cargar órdenes de compra')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredOrders = orders.filter(o =>
        o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.suppliers?.name && o.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    async function handleCancelPO(po: any) {
        if (!confirm(`¿Estás seguro de que deseas cancelar la orden ${po.po_number}? Si ya fue recibida, esto revertirá el inventario.`)) return

        try {
            const { data, error } = await supabase.rpc('cancel_purchase_order', { p_po_id: po.id })

            if (error) throw error
            if (data && !data.success) {
                alert(data.message)
                return
            }
            alert('Orden de compra cancelada exitosamente')
            fetchOrders()
        } catch (error: any) {
            console.error('Error canceling PO:', error)
            alert('Error al cancelar: ' + error.message)
        }
    }
    async function handleSendPO(po: any) {
        if (!confirm(`¿Marcar la orden ${po.po_number} como Enviada al proveedor? Esto la hará disponible para Recepción.`)) return

        try {
            const { error } = await supabase
                .from('purchase_orders')
                .update({ status: 'Sent' })
                .eq('id', po.id)

            if (error) throw error
            alert('Orden marcada como Enviada')
            fetchOrders()
        } catch (error: any) {
            console.error('Error sending PO:', error)
            alert('Error al actualizar: ' + error.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex gap-2 w-full max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar PO o proveedor..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-brand-red hover:bg-red-700 text-white gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nueva Orden</span>
                </Button>
            </div>

            <NewPurchaseOrderDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchOrders}
            />

            <ViewPurchaseOrderDialog
                open={!!viewPO}
                onOpenChange={(open) => !open && setViewPO(null)}
                purchaseOrder={viewPO}
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Orden</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Estatus</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                                <TableHead className="text-right w-[80px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No se encontraron órdenes de compra.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                {order.po_number}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{order.suppliers?.name || 'Desconocido'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                                order.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'Received' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${order.total_cost?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setViewPO(order)}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Ver Detalles
                                                    </DropdownMenuItem>
                                                    {order.status === 'Draft' && (
                                                        <DropdownMenuItem onClick={() => handleSendPO(order)} className="text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Marcar como Enviada
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status !== 'Cancelled' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleCancelPO(order)}
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Cancelar
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
