import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ViewPurchaseOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    purchaseOrder: any
}

export default function ViewPurchaseOrderDialog({ open, onOpenChange, purchaseOrder }: ViewPurchaseOrderDialogProps) {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && purchaseOrder) {
            fetchPOItems()
        }
    }, [open, purchaseOrder])

    async function fetchPOItems() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('purchase_order_items')
                .select(`
                    id, 
                    quantity, 
                    unit_cost,
                    tax_rate,
                    total_cost,
                    product_id,
                    product_variants:product_id ( sku, products(title) )
                `)
                .eq('purchase_order_id', purchaseOrder.id)

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching PO items:', error)
            alert('Error al cargar productos de la orden')
        } finally {
            setIsLoading(false)
        }
    }

    if (!purchaseOrder) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Detalle Orden {purchaseOrder?.po_number}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="bg-muted/30 p-4 rounded-lg border text-sm grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-xs">Proveedor</span>
                            <span className="font-semibold text-base">{purchaseOrder?.suppliers?.name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Fecha PO</span>
                            <span className="font-medium">{format(new Date(purchaseOrder?.created_at), "d MMMM yyyy, HH:mm", { locale: es })}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Estatus</span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium inline-block mt-1 ${purchaseOrder.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                purchaseOrder.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                    purchaseOrder.status === 'Received' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {purchaseOrder.status}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Total de la Orden</span>
                            <span className="font-bold text-lg text-brand-red">${purchaseOrder?.total_cost?.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-center">Cant.</TableHead>
                                    <TableHead className="text-right">Costo Unit.</TableHead>
                                    <TableHead className="text-right">IVA</TableHead>
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
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No hay productos en esta orden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.product_variants?.products?.title || 'Sin Título'}
                                                <div className="text-xs text-muted-foreground">{item.product_variants?.sku || ''}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${item.unit_cost?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {item.tax_rate}%
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${item.total_cost?.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
