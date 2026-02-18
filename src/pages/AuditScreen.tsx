import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Loader2, Search, History } from "lucide-react"

export default function AuditScreen() {
    const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit')
    const [searchTerm, setSearchTerm] = useState('')
    const [variants, setVariants] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Helper to fetch inventory
    async function fetchInventory() {
        setLoading(true)
        const { data } = await supabase
            .from('product_variants')
            .select(`
                *,
                products (title, type),
                inventory (quantity)
            `)
            .order('sku', { ascending: true })

        if (data) {
            setVariants(data.map(v => ({
                ...v,
                current_stock: v.inventory?.[0]?.quantity || 0,
                // We'll track the "physical count" input separately in state if needed, 
                // but for simplicity, we can let the user type into a controlled input per row 
                // or just use an Uncontrolled input for the "New Count" to avoid massive re-renders. 
                // Let's use a local map for draft counts? 
                // For now, simpler: Input is uncontrolled or managed at row level Component? 
                // Let's Keep it simple: valid local state for inputs.
            })))
        }
        setLoading(false)
    }

    // Helper to fetch history
    async function fetchHistory() {
        setLoading(true)
        const { data } = await supabase
            .from('inventory_transactions')
            .select(`
                *,
                product_variants (
                    sku,
                    products (title)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setTransactions(data)
        setLoading(false)
    }

    useEffect(() => {
        if (activeTab === 'audit') fetchInventory()
        if (activeTab === 'history') fetchHistory()
    }, [activeTab])

    // Filter logic
    const filteredVariants = variants.filter(v =>
        v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.products?.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Row component to manage local input state
    function AuditRow({ variant, onUpdate }: { variant: any, onUpdate: () => void }) {
        const [count, setCount] = useState('')
        const [isSubmitting, setIsSubmitting] = useState(false)

        async function handleSave() {
            const qty = parseInt(count)
            if (isNaN(qty)) return // Ignore invalid

            setIsSubmitting(true)
            try {
                const { error } = await supabase.rpc('audit_inventory', {
                    p_variant_id: variant.id,
                    p_new_quantity: qty,
                    p_reason: 'audit_adjustment'
                })

                if (error) throw error

                alert('Inventario actualizado')
                setCount('') // Clear input
                onUpdate() // Refresh parent data
            } catch (e: any) {
                alert('Error: ' + e.message)
            } finally {
                setIsSubmitting(false)
            }
        }

        return (
            <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-3">
                    <div className="font-mono text-xs font-bold">{variant.sku}</div>
                    <div className="text-[10px] text-muted-foreground">{variant.products?.type}</div>
                </td>
                <td className="p-3">
                    <div className="font-medium text-sm">{variant.products?.title}</div>
                    <div className="text-xs text-muted-foreground">
                        Stock Sistema: <strong>{variant.current_stock}</strong>
                    </div>
                </td>
                <td className="p-3 w-32">
                    <Input
                        type="number"
                        placeholder={variant.current_stock.toString()}
                        className="h-9 text-center font-bold"
                        value={count}
                        onChange={e => setCount(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSave()
                        }}
                    />
                </td>
                <td className="p-3 text-right">
                    <Button
                        size="sm"
                        disabled={count === '' || isSubmitting}
                        onClick={handleSave}
                        variant={count !== '' && parseInt(count) !== variant.current_stock ? "default" : "secondary"}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajustar"}
                    </Button>
                </td>
            </tr>
        )
    }

    return (
        <div className="space-y-6 pt-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Auditoría de Inventario</h1>
                <div className="flex bg-muted p-1 rounded-lg">
                    <Button
                        variant={activeTab === 'audit' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('audit')}
                    >
                        Conteo Físico
                    </Button>
                    <Button
                        variant={activeTab === 'history' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('history')}
                    >
                        <History className="mr-2 h-4 w-4" />
                        Historial Log
                    </Button>
                </div>
            </div>

            {activeTab === 'audit' && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Escanear SKU o Buscar Nombre..." // Spanish
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-left">
                                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                    <tr>
                                        <th className="p-3">SKU</th>
                                        <th className="p-3">Producto / Sistema</th>
                                        <th className="p-3">Conteo Físico</th>
                                        <th className="p-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Cargando inventario...</td></tr>
                                    ) : filteredVariants.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No se encontraron productos.</td></tr>
                                    ) : (
                                        filteredVariants.map(v => (
                                            <AuditRow key={v.id} variant={v} onUpdate={fetchInventory} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'history' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Movimientos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Producto</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3 text-right">Cambio</th>
                                        <th className="p-3 text-right">Nuevo Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Cargando historial...</td></tr>
                                    ) : transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-muted/50">
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {new Date(t.created_at).toLocaleString('es-MX')}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{t.product_variants?.products?.title}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{t.product_variants?.sku}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.reason === 'sale' ? 'bg-green-100 text-green-800' :
                                                    t.reason === 'audit_adjustment' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {t.reason === 'audit_adjustment' ? 'Auditoría' :
                                                        t.reason === 'sale' ? 'Venta' : t.reason}
                                                </span>
                                            </td>
                                            <td className={`p-3 text-right font-bold ${t.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.change_amount > 0 ? '+' : ''}{t.change_amount}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {t.final_stock_snapshot}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
