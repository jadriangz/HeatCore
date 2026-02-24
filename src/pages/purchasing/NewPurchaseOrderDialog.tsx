import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface NewPurchaseOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function NewPurchaseOrderDialog({ open, onOpenChange, onSuccess }: NewPurchaseOrderDialogProps) {
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])

    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [supplierId, setSupplierId] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [notes, setNotes] = useState('')

    // Items State
    const [items, setItems] = useState<any[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    useEffect(() => {
        if (open) {
            fetchInitialData()
            // Reset state
            setSupplierId('')
            setExpectedDate('')
            setNotes('')
            setItems([])
            setProductSearch('')
        }
    }, [open])

    async function fetchInitialData() {
        setIsLoadingData(true)
        try {
            const [suppRes, prodRes] = await Promise.all([
                supabase.from('suppliers').select('id, name').order('name'),
                supabase.from('product_variants').select('id, sku, cost_price, products ( title )')
            ])

            if (suppRes.error) throw suppRes.error
            if (prodRes.error) throw prodRes.error

            setSuppliers(suppRes.data || [])

            // Map product variants to include title cleanly
            const formattedProducts = prodRes.data?.map((v: any) => ({
                id: v.id,
                sku: v.sku,
                cost_price: v.cost_price,
                title: v.products?.title || 'Variante Sin Título'
            })) || []

            setProducts(formattedProducts)
        } catch (error) {
            console.error('Error fetching data:', error)
            alert('Error al cargar datos iniciales')
        } finally {
            setIsLoadingData(false)
        }
    }

    const filteredProducts = productSearch.trim() === ''
        ? products.slice(0, 10)
        : products.filter(p => (p.title || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 10)

    const showProductSuggestions = isSearchFocused || productSearch.length > 0

    function addProductToPO(product: any) {
        if (items.some(i => i.product_id === product.id)) return // Already added
        setItems([...items, {
            product_id: product.id,
            title: product.title,
            sku: product.sku,
            quantity: 1,
            unit_cost: product.cost_price || 0,
            tax_rate: 0
        }])
        setProductSearch('')
        setIsSearchFocused(false)
    }

    function removeItem(productId: string) {
        setItems(items.filter(i => i.product_id !== productId))
    }

    function updateItemQuantity(productId: string, qty: number) {
        setItems(items.map(i => i.product_id === productId ? { ...i, quantity: qty } : i))
    }

    function updateItemCost(productId: string, cost: number) {
        setItems(items.map(i => i.product_id === productId ? { ...i, unit_cost: cost } : i))
    }

    function toggleItemTax(productId: string, applyTax: boolean) {
        setItems(items.map(i => i.product_id === productId ? { ...i, tax_rate: applyTax ? 16 : 0 } : i))
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
    const totalTax = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost * ((item.tax_rate || 0) / 100)), 0)
    const totalCost = subtotal + totalTax

    async function handleSave() {
        if (!supplierId) return alert('Selecciona un proveedor')
        if (items.length === 0) return alert('Agrega al menos un producto')

        setIsSaving(true)
        try {
            // Generate PO Number
            const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
            const nextPo = `PO-${((count || 0) + 1).toString().padStart(4, '0')}`

            // 1. Insert Purchase Order
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .insert({
                    po_number: nextPo,
                    supplier_id: supplierId,
                    status: 'Draft',
                    subtotal_amount: subtotal,
                    tax_amount: totalTax,
                    total_cost: totalCost,
                    expected_date: expectedDate || null,
                    notes: notes
                })
                .select()
                .single()

            if (poError) throw poError

            // 2. Insert Items
            const itemsToInsert = items.map(item => ({
                purchase_order_id: poData.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                tax_rate: item.tax_rate,
                tax_amount: item.quantity * item.unit_cost * ((item.tax_rate || 0) / 100)
            }))

            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            alert('Orden de Compra creada exitosamente')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error saving PO:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Nueva Orden de Compra</DialogTitle>
                </DialogHeader>

                {isLoadingData ? (
                    <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                            <div className="space-y-2">
                                <Label>Proveedor *</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Esperada</Label>
                                <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Notas</Label>
                                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Pago a contraentrega..." />
                            </div>
                        </div>

                        {/* Product Search */}
                        <div className="space-y-2 relative">
                            <Label>Agregar Productos</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar producto por nombre o SKU..."
                                    className="pl-8"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                />
                            </div>
                            {/* Search Results Dropdown */}
                            {showProductSuggestions && filteredProducts.length > 0 && (
                                <div className="absolute z-20 w-full bg-popover border shadow-md rounded-md mt-1 max-h-64 overflow-y-auto">
                                    {filteredProducts.map(fp => (
                                        <div
                                            key={fp.id}
                                            className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center text-sm border-b last:border-b-0"
                                            onClick={() => addProductToPO(fp)}
                                        >
                                            <div className="font-medium">{fp.title}</div>
                                            <div className="text-muted-foreground flex items-center gap-2">
                                                {fp.sku && <span>{fp.sku}</span>}
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Plus className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showProductSuggestions && filteredProducts.length === 0 && (
                                <div className="absolute z-20 w-full bg-popover border shadow-md rounded-md mt-1 p-4 text-center text-sm text-muted-foreground">
                                    No se encontraron productos coincidentes.
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="w-[100px]">Cantidad</TableHead>
                                        <TableHead className="w-[120px]">Costo Unit.</TableHead>
                                        <TableHead className="w-[100px]">IVA 16%</TableHead>
                                        <TableHead className="text-right w-[100px]">Subtotal</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                No hay productos en la orden. Busca y agrega arriba.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map(item => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1.5 text-muted-foreground">$</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_cost}
                                                            onChange={(e) => updateItemCost(item.product_id, parseFloat(e.target.value) || 0)}
                                                            className="h-8 pl-6"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={item.tax_rate === 16}
                                                            onCheckedChange={(c) => toggleItemTax(item.product_id, c)}
                                                        />
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {item.tax_rate === 16 ? 'Sí' : 'No'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${((item.quantity * item.unit_cost) * (1 + (item.tax_rate || 0) / 100)).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.product_id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg mt-2 space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground border-b border-muted-foreground/20 pb-2">
                                <span>IVA (16%)</span>
                                <span>${totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="font-semibold text-lg">Total Estimado</span>
                                <span className="font-bold text-2xl text-brand-red">${totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving || items.length === 0 || !supplierId} className="bg-brand-red hover:bg-red-700 text-white">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Crear Orden de Compra'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
