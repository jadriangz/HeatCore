import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ViewReceptionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reception: any
}

export default function ViewReceptionDialog({ open, onOpenChange, reception }: ViewReceptionDialogProps) {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && reception) {
            fetchReceptionItems()
        }
    }, [open, reception])

    async function fetchReceptionItems() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('reception_items')
                .select(`
                    id, 
                    received_quantity, 
                    unit_cost,
                    product_variant_id,
                    product_variants:product_variant_id ( sku, products(title) )
                `)
                .eq('reception_id', reception.id)

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching reception items:', error)
            alert('Error al cargar detalle de recepción')
        } finally {
            setIsLoading(false)
        }
    }

    if (!reception) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Detalle de Recepción {reception?.reception_number}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="bg-muted/30 p-4 rounded-lg border text-sm grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-xs">Orden (PO) Referencia</span>
                            <span className="font-semibold text-base">{reception?.purchase_orders?.po_number || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Fecha de Ingreso</span>
                            <span className="font-medium">{format(new Date(reception?.received_date || reception?.created_at), "d MMMM yyyy, HH:mm", { locale: es })}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Notas de Bodega</span>
                            <span className="font-medium text-amber-700">{reception?.notes || 'Sin observaciones'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">Estado Físico</span>
                            {reception.status === 'Cancelled' ? (
                                <span className="px-2 py-1 text-xs rounded-full font-medium inline-block mt-1 bg-red-100 text-red-800">
                                    Cancelado
                                </span>
                            ) : (
                                <span className="px-2 py-1 text-xs rounded-full font-medium inline-block mt-1 bg-green-100 text-green-800">
                                    {reception.status}
                                </span>
                            )}
                        </div>
                        {reception.status === 'Cancelled' && reception.cancelled_at && (
                            <div>
                                <span className="text-muted-foreground block text-xs">Fecha de Reversa</span>
                                <span className="font-medium text-red-600">{format(new Date(reception.cancelled_at), "d MMMM yyyy, HH:mm", { locale: es })}</span>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Producto Ingresado</TableHead>
                                    <TableHead className="text-center">Cant. Recibida</TableHead>
                                    <TableHead className="text-right">Costo Calculado</TableHead>
                                    <TableHead className="text-right">Subtotal Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No hay productos en esta recepción.
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
                                                {item.received_quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${item.unit_cost?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${((item.received_quantity || 0) * (item.unit_cost || 0)).toFixed(2)}
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
