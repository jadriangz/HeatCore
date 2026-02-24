import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ProcessReceptionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    purchaseOrder: any
    onSuccess: () => void
}

export default function ProcessReceptionDialog({ open, onOpenChange, purchaseOrder, onSuccess }: ProcessReceptionDialogProps) {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (open && purchaseOrder) {
            fetchPOItems()
            setNotes('')
        }
    }, [open, purchaseOrder])

    async function fetchPOItems() {
        setIsLoading(true)
        try {
            const [poItemsRes, recsRes] = await Promise.all([
                supabase
                    .from('purchase_order_items')
                    .select(`
                        id, 
                        quantity, 
                        unit_cost,
                        product_id,
                        product_variants:product_id ( sku, products(title) )
                    `)
                    .eq('purchase_order_id', purchaseOrder.id),
                supabase
                    .from('receptions')
                    .select('status, reception_items(product_variant_id, received_quantity)')
                    .eq('purchase_order_id', purchaseOrder.id)
                    .neq('status', 'Cancelled')
            ])

            if (poItemsRes.error) throw poItemsRes.error
            if (recsRes.error) throw recsRes.error

            // Aggregate historical received quantities
            const receivedMap: Record<string, number> = {}
            recsRes.data?.forEach(rec => {
                rec.reception_items?.forEach((ri: any) => {
                    receivedMap[ri.product_variant_id] = (receivedMap[ri.product_variant_id] || 0) + ri.received_quantity
                })
            })

            // Map data to local state where user can edit received qty and cost
            const editableItems = poItemsRes.data?.map((item: any) => {
                const totalOrdered = item.quantity;
                const totalReceived = receivedMap[item.product_id] || 0;
                const remainingToReceive = Math.max(0, totalOrdered - totalReceived);

                return {
                    product_variant_id: item.product_id,
                    title: item.product_variants?.products?.title || 'Sin Título',
                    sku: item.product_variants?.sku || '',
                    expected_quantity: remainingToReceive,
                    received_quantity: remainingToReceive, // Default to remaining
                    unit_cost: item.unit_cost // Default to expected cost
                }
            }).filter((i: any) => i.expected_quantity > 0) || []

            setItems(editableItems)
        } catch (error) {
            console.error('Error fetching PO items:', error)
            alert('Error al cargar productos de la orden')
        } finally {
            setIsLoading(false)
        }
    }

    function handleItemChange(index: number, field: string, value: number) {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    async function handleProcess() {
        if (items.length === 0) return

        setIsSaving(true)
        try {
            // Validate
            const invalidItem = items.find(i => i.received_quantity < 0 || i.unit_cost < 0)
            if (invalidItem) {
                alert('Las cantidades y costos no pueden ser negativos.')
                setIsSaving(false)
                return
            }

            // Payload for the RPC
            const payloadItems = items
                .filter(i => i.received_quantity > 0) // Only receive things actually received
                .map(i => ({
                    product_variant_id: i.product_variant_id,
                    quantity: i.received_quantity,
                    unit_cost: i.unit_cost
                }))

            if (payloadItems.length === 0) {
                alert('No hay items con cantidad a recibir mayor a 0.')
                setIsSaving(false)
                return
            }

            const { error } = await supabase.rpc('process_reception', {
                p_po_id: purchaseOrder.id,
                p_notes: notes,
                p_items: payloadItems
            })

            if (error) throw error

            alert('Recepción completada e inventario actualizado exitosamente.')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error processing reception:', error)
            alert('Error al procesar recepción: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Recepcionar Orden {purchaseOrder?.po_number}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm grid grid-cols-2 gap-2">
                            <div><span className="text-muted-foreground">Proveedor:</span> <span className="font-medium">{purchaseOrder?.suppliers?.name}</span></div>
                            <div><span className="text-muted-foreground">Fecha PO:</span> <span className="font-medium">{new Date(purchaseOrder?.created_at).toLocaleDateString()}</span></div>
                            <div><span className="text-muted-foreground">Total Esperado:</span> <span className="font-medium">${purchaseOrder?.total_cost?.toFixed(2)}</span></div>
                        </div>

                        <div>
                            <Label>Notas de Recepción</Label>
                            <Input
                                placeholder="Ej. Faltaron 2 cajas, caja dañada..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="w-[100px] text-center">Esperado</TableHead>
                                        <TableHead className="w-[120px]">Recibido</TableHead>
                                        <TableHead className="w-[140px]">Costo Real Unit.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No hay productos en esta orden.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, idx) => (
                                            <TableRow key={item.product_variant_id}>
                                                <TableCell className="font-medium">
                                                    {item.title}
                                                    <div className="text-xs text-muted-foreground">{item.sku}</div>
                                                </TableCell>
                                                <TableCell className="text-center bg-muted/10 font-medium">
                                                    {item.expected_quantity}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.received_quantity}
                                                        onChange={(e) => handleItemChange(idx, 'received_quantity', parseInt(e.target.value) || 0)}
                                                        className={`h-8 ${item.received_quantity !== item.expected_quantity ? 'border-yellow-500 bg-yellow-50' : ''}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1.5 text-muted-foreground">$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.unit_cost}
                                                            onChange={(e) => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                            className="h-8 pl-6"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
                            <strong>Nota:</strong> Al completar la recepción, se actualizarán las existencias y el <strong>Costo Promedio Ponderado</strong> de cada variante de forma automática.
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleProcess} disabled={isSaving || items.length === 0} className="bg-brand-red hover:bg-red-700 text-white">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Completar Recepción y Costear'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
