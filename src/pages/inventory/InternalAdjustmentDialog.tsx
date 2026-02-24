import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface InternalAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function InternalAdjustmentDialog({ open, onOpenChange, onSuccess }: InternalAdjustmentDialogProps) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)

    const [qty, setQty] = useState('')
    const [type, setType] = useState('out') // 'in' or 'out'
    const [reason, setReason] = useState('Consumo Interno')
    const [isSaving, setIsSaving] = useState(false)

    // Debounced Search
    useState(() => {
        const timeout = setTimeout(async () => {
            if (search.length > 2 && !selectedItem) {
                setIsSearching(true)
                const { data } = await supabase
                    .from('product_variants')
                    .select('*, products(title)')
                    .or(`sku.ilike.%${search}%, products.title.ilike.%${search}%`)
                    .limit(5)

                // Get stock numbers for results
                if (data && data.length > 0) {
                    const variantIds = data.map(d => d.id)
                    const { data: invData } = await supabase
                        .from('inventory')
                        .select('variant_id, quantity')
                        .in('variant_id', variantIds)

                    const enriched = data.map(variant => ({
                        ...variant,
                        stock: invData?.find(i => i.variant_id === variant.id)?.quantity || 0
                    }))
                    setResults(enriched)
                } else {
                    setResults([])
                }
                setIsSearching(false)
            } else if (search.length <= 2) {
                setResults([])
            }
        }, 500)
        return () => clearTimeout(timeout)
    })

    function handleReset() {
        setSearch('')
        setResults([])
        setSelectedItem(null)
        setQty('')
        setType('out')
        setReason('Consumo Interno')
    }

    async function handleSave() {
        if (!selectedItem || !qty) return

        let numQty = parseInt(qty)
        if (isNaN(numQty) || numQty <= 0) {
            alert('La cantidad debe ser mayor a 0.')
            return
        }

        // Si es salida, el número para la BD debe ser negativo
        const finalQty = type === 'out' ? -numQty : numQty

        if (type === 'out' && selectedItem.stock < numQty) {
            if (!confirm(`Advertencia: El producto solo tiene ${selectedItem.stock} en existencia. Esto dejará el inventario en negativo. ¿Continuar?`)) {
                return
            }
        }

        setIsSaving(true)
        try {
            const { error } = await supabase.rpc('restock_inventory', {
                p_variant_id: selectedItem.id,
                p_quantity_added: finalQty,
                p_reason: reason
            })

            if (error) throw error

            alert('Ajuste registrado exitosamente.')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error recording adjustment:', error)
            alert('Error al registrar ajuste: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val)
            if (!val) handleReset()
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajuste Interno / Consumo</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {!selectedItem ? (
                        <div className="space-y-4">
                            <Label>Buscar Producto a Ajustar</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="SKU, Código o Nombre..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                                {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>

                            {results.length > 0 && (
                                <div className="border rounded-md divide-y max-h-[250px] overflow-y-auto">
                                    {results.map(item => (
                                        <div
                                            key={item.id}
                                            className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                                            onClick={() => {
                                                setSelectedItem(item)
                                                setSearch('')
                                                setResults([])
                                            }}
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{item.products?.title || 'Producto'}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku}</div>
                                            </div>
                                            <div className="text-xs font-bold text-right">
                                                Stock<br />
                                                <span className={item.stock <= 0 ? 'text-red-500' : 'text-blue-600'}>{item.stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-muted/50 border rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{selectedItem.products?.title}</div>
                                    <div className="text-sm font-mono text-muted-foreground">{selectedItem.sku}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Stock Actual</div>
                                    <div className="font-bold text-lg">{selectedItem.stock}</div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)} className="mt-[-1rem]">
                                Cambiar Producto
                            </Button>

                            <div className="space-y-3">
                                <Label>Tipo de Ajuste</Label>
                                <RadioGroup defaultValue="out" value={type} onValueChange={setType} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="out" id="r-out" />
                                        <Label htmlFor="r-out" className="text-red-600 font-medium cursor-pointer">Salida (-)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="in" id="r-in" />
                                        <Label htmlFor="r-in" className="text-green-600 font-medium cursor-pointer">Entrada (+)</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cantidad a {type === 'out' ? 'Descontar' : 'Agregar'}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ej. 1"
                                        className="text-lg font-bold"
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Motivo / Justificación</Label>
                                    <Select value={reason} onValueChange={setReason}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Motivo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {type === 'out' ? (
                                                <>
                                                    <SelectItem value="Consumo Interno">Consumo Interno (Abrir)</SelectItem>
                                                    <SelectItem value="Mermas / Dañado">Mermas / Dañado</SelectItem>
                                                    <SelectItem value="Regalo Promocional">Regalo Promocional</SelectItem>
                                                    <SelectItem value="Ajuste de Auditoría">Ajuste Negativo (Auditoría)</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="Sobrante de Auditoría">Sobrante (Auditoría)</SelectItem>
                                                    <SelectItem value="Devolución Interna">Devolución Interna</SelectItem>
                                                    <SelectItem value="Ingreso de Cartas (Singles)">Ingreso de Cartas Sueltas</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving || !selectedItem || !qty} className="bg-brand-red hover:bg-red-700 text-white">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Registrar Ajuste'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
