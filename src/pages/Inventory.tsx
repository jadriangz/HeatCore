import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { Plus, ClipboardCheck, AlertTriangle, Pencil, Trash2, ArrowDownCircle, Search, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ProductForm } from "@/components/ProductForm"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"

export default function InventoryPage() {
    const [stats, setStats] = useState({
        totalVariants: 0,
        lowStock: 0,
        suppliesCount: 0,
        estimatedValue: 0
    })
    const [variants, setVariants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Product Form State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingVariant, setEditingVariant] = useState<any>(null)

    // Restock Form State
    const [isRestockOpen, setIsRestockOpen] = useState(false)
    const [restockSearch, setRestockSearch] = useState('')
    const [selectedRestockItem, setSelectedRestockItem] = useState<any>(null)
    const [restockQty, setRestockQty] = useState('')
    const [isRestocking, setIsRestocking] = useState(false)

    // Filtering & Grouping State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterSet, setFilterSet] = useState<string>('all')
    const [showLowStockOnly, setShowLowStockOnly] = useState(false)
    const [groupBy, setGroupBy] = useState<string>('none')

    const [catalogs, setCatalogs] = useState<{ product_type: any[], product_category: any[], tcg_set: any[] }>({
        product_type: [],
        product_category: [],
        tcg_set: []
    })

    // Derived Data

    const filteredVariants = variants.filter(v => {
        const matchesSearch = (v.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (v.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory === 'all' || v.category === filterCategory
        const matchesType = filterType === 'all' || v.type === filterType
        const matchesSet = filterSet === 'all' || v.raw_set_name === filterSet
        const matchesLowStock = !showLowStockOnly || v.stock < v.min_stock_level

        return matchesSearch && matchesCategory && matchesType && matchesSet && matchesLowStock
    })

    const groupedVariants = groupBy === 'none' ? null : filteredVariants.reduce((groups: any, variant) => {
        const key = variant[groupBy] || 'Sin Categoría'
        if (!groups[key]) groups[key] = []
        groups[key].push(variant)
        return groups
    }, {})

    async function initData() {
        setLoading(true)

        // 1. Fetch catalogs
        const { data: catData } = await supabase.from('system_catalogs').select('*').eq('is_active', true)
        const cats = {
            product_type: catData ? catData.filter(d => d.catalog_group === 'product_type') : [],
            product_category: catData ? catData.filter(d => d.catalog_group === 'product_category') : [],
            tcg_set: catData ? catData.filter(d => d.catalog_group === 'tcg_set') : [],
        }
        setCatalogs(cats)

        // Helper to translate internal codes
        const getName = (code: string, group: 'product_type' | 'product_category' | 'tcg_set') => {
            const match = cats[group].find(c => c.internal_code === code)
            return match ? match.name : code
        }

        // 2. Fetch inventory
        const { data: allVariants } = await supabase
            .from('product_variants')
            .select(`
                *,
                products (*),
                inventory (quantity)
            `)
            .order('sku', { ascending: true })

        if (allVariants) {
            let low = 0
            let supply = 0
            let estValue = 0

            const formatted = allVariants.map(v => {
                const stock = v.inventory?.[0]?.quantity || 0
                const minStock = v.products?.min_stock_level || 5

                if (stock < minStock) low++
                if (v.products?.type === 'supply') supply++
                if (v.products?.type === 'resale') {
                    estValue += (v.cost_price || 0) * stock
                }

                return {
                    ...v,
                    title: v.products?.title || 'Producto Desconocido',
                    type: v.products?.type || 'resale',
                    category: v.products?.category || '-',
                    type_name: getName(v.products?.type, 'product_type') || 'Producto',
                    category_name: getName(v.products?.category, 'product_category') || '-',
                    set_name: getName(v.products?.set_name, 'tcg_set') || '-',
                    raw_set_name: v.products?.set_name,
                    min_stock_level: minStock,
                    stock
                }
            })

            setStats({
                totalVariants: allVariants.length,
                lowStock: low,
                suppliesCount: supply,
                estimatedValue: estValue
            })
            setVariants(formatted)
        }
        setLoading(false)
    }

    useEffect(() => {
        initData()
    }, [])

    function handleEdit(variant: any) {
        setEditingVariant(variant)
        setIsFormOpen(true)
    }

    async function handleDelete(variant: any) {
        if (variant.stock > 0) {
            alert(`❌ No se puede eliminar "${variant.title}" porque tiene ${variant.stock} unidades en existencia. Ajusta el inventario a 0 primero.`)
            return
        }

        if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${variant.title}"? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('product_variants')
                .delete()
                .eq('id', variant.id)

            if (error) throw error

            alert('✅ Producto eliminado correctamente.')
            initData()
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    function handleCloseForm() {
        setIsFormOpen(false)
        setEditingVariant(null) // Reset on close
    }

    // Restock Logic
    const filteredRestockItems = restockSearch
        ? variants.filter(v =>
            v.sku.toLowerCase().includes(restockSearch.toLowerCase()) ||
            v.title.toLowerCase().includes(restockSearch.toLowerCase())
        ).slice(0, 5)
        : []

    async function handleRestockSubmit() {
        if (!selectedRestockItem || !restockQty) return

        const qty = parseInt(restockQty)
        if (isNaN(qty) || qty <= 0) {
            alert('Cantidad inválida')
            return
        }

        setIsRestocking(true)
        try {
            const { error } = await supabase.rpc('restock_inventory', {
                p_variant_id: selectedRestockItem.id,
                p_quantity_added: qty,
                p_reason: 'purchase'
            })

            if (error) throw error

            alert('✅ Entrada registrada correctamente')
            setIsRestockOpen(false)
            setRestockQty('')
            setSelectedRestockItem(null)
            setRestockSearch('')
            initData()
        } catch (error: any) {
            alert('Error al registrar entrada: ' + error.message)
        } finally {
            setIsRestocking(false)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Inventario e Insumos</h1>
                <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" asChild>
                        <Link to="/inventory/audit">
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Auditoría
                        </Link>
                    </Button>

                    <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                                <ArrowDownCircle className="mr-2 h-4 w-4" />
                                Registrar Entrada
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Registrar Compra / Entrada de Stock</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                {!selectedRestockItem ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Buscar Producto o Insumo</label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Escanear SKU o Buscar..."
                                                className="pl-8"
                                                value={restockSearch}
                                                onChange={e => setRestockSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        {filteredRestockItems.length > 0 && (
                                            <div className="border rounded-md divide-y mt-2 max-h-48 overflow-y-auto">
                                                {filteredRestockItems.map(item => (
                                                    <div
                                                        key={item.id}
                                                        className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                                        onClick={() => {
                                                            setSelectedRestockItem(item)
                                                            setRestockSearch('')
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="font-medium text-sm">{item.title}</div>
                                                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                                                        </div>
                                                        <div className="text-xs font-bold">Stock: {item.stock}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {restockSearch && filteredRestockItems.length === 0 && (
                                            <div className="text-sm text-muted-foreground text-center p-2">No encontrado</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                                            <div>
                                                <div className="font-bold">{selectedRestockItem.title}</div>
                                                <div className="text-xs font-mono">{selectedRestockItem.sku}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedRestockItem(null)}>Cambiar</Button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Cantidad a Agregar (+)</label>
                                            <Input
                                                type="number"
                                                placeholder="Ej. 10"
                                                className="text-lg font-bold"
                                                value={restockQty}
                                                onChange={e => setRestockQty(e.target.value)}
                                                autoFocus
                                            />
                                        </div>

                                        <Button className="w-full" onClick={handleRestockSubmit} disabled={!restockQty || isRestocking}>
                                            {isRestocking ? 'Procesando...' : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Confirmar Entrada
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isFormOpen} onOpenChange={(open: boolean) => {
                        setIsFormOpen(open)
                        if (!open) setEditingVariant(null)
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingVariant(null)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <ProductForm
                                onClose={handleCloseForm}
                                onSuccess={initData}
                                initialData={editingVariant}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card
                    className={`cursor-pointer transition-all hover:bg-slate-50 ${showLowStockOnly ? 'border-red-500 shadow-sm' : ''}`}
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Stock Bajo</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${showLowStockOnly ? 'text-red-600' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.lowStock}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-red-600/80 font-medium">
                            {showLowStockOnly ? 'Mostrando filtros. Clic para limpiar.' : 'Clic para filtrar el catálogo.'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Estimado (Costo)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.estimatedValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Calculado sobre inventario disponible para venta. Excluye insumos.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-muted/40 p-4 rounded-lg border">
                <div className="grid gap-2 flex-1 w-full md:w-auto">
                    <Label>Buscar</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="SKU, Nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-background"
                        />
                    </div>
                </div>

                <div className="grid gap-2 w-full md:w-32">
                    <Label>Categoría</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {catalogs.product_category.map(cat => (
                                <SelectItem key={cat.internal_code} value={cat.internal_code}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2 w-full md:w-32">
                    <Label>Set/Expansión</Label>
                    <Select value={filterSet} onValueChange={setFilterSet}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {catalogs.tcg_set.map(cat => (
                                <SelectItem key={cat.internal_code} value={cat.internal_code}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2 w-full md:w-32">
                    <Label>Tipo</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {catalogs.product_type.map(cat => (
                                <SelectItem key={cat.internal_code} value={cat.internal_code}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2 w-full md:w-32">
                    <Label>Agrupar por</Label>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Sin agrupar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin agrupar</SelectItem>
                            <SelectItem value="category_name">Categoría</SelectItem>
                            <SelectItem value="type_name">Tipo</SelectItem>
                            <SelectItem value="set_name">Set / Expansión</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2 pb-2 md:pb-0">
                    <Checkbox
                        id="lowStock"
                        checked={showLowStockOnly}
                        onCheckedChange={(checked) => setShowLowStockOnly(checked as boolean)}
                    />
                    <label
                        htmlFor="lowStock"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-red-600"
                    >
                        Stock Bajo
                    </label>
                </div>

                <div className="text-sm text-muted-foreground ml-auto pb-1">
                    Mostrando: <strong>{filteredVariants.length}</strong>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Catálogo Unificado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Producto</th>
                                    <th className="p-3">Punto Reorden</th>
                                    <th className="p-3 text-right">Existencia</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-4 text-center">Cargando...</td></tr>
                                ) : groupBy === 'none' ? (
                                    filteredVariants.map((v) => (
                                        <InventoryRow key={v.id} variant={v} onEdit={handleEdit} onDelete={handleDelete} />
                                    ))
                                ) : (
                                    // GROUPED LIST
                                    Object.entries(groupedVariants).map(([groupName, groupItems]: [string, any]) => (
                                        <React.Fragment key={'group-' + groupName}>
                                            <tr className="bg-muted/80">
                                                <td colSpan={6} className="p-2 px-4 font-bold text-sm text-foreground">
                                                    {groupBy === 'category_name' ? '📂' : groupBy === 'set_name' ? '📦' : '🏷️'} {groupName}
                                                    <Badge variant="outline" className="ml-2 bg-background text-xs font-normal">
                                                        {groupItems.length} items
                                                    </Badge>
                                                </td>
                                            </tr>
                                            {groupItems.map((v: any) => (
                                                <InventoryRow key={v.id} variant={v} onEdit={handleEdit} onDelete={handleDelete} />
                                            ))}
                                        </React.Fragment>
                                    ))
                                )}
                                {!loading && filteredVariants.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No se encontraron productos con los filtros actuales.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function InventoryRow({ variant, onEdit, onDelete }: { variant: any, onEdit: (v: any) => void, onDelete: (v: any) => void }) {
    return (
        <tr className="hover:bg-muted/50 transition-colors border-b last:border-0">
            <td className="p-3">
                <Badge variant={variant.type === 'supply' ? "secondary" : "outline"} className={variant.type === 'supply' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>
                    {variant.type === 'supply' ? 'INSUMO' : 'PRODUCTO'}
                </Badge>
            </td>
            <td className="p-3 font-mono text-xs text-muted-foreground">{variant.sku}</td>
            <td className="p-3 font-medium">
                {variant.title}
                <div className="flex gap-2 text-xs text-muted-foreground font-normal mt-0.5">
                    <span>{variant.category_name}</span>
                    {variant.set_name && variant.set_name !== '-' && (
                        <span>• {variant.set_name}</span>
                    )}
                </div>
            </td>
            <td className="p-3">
                <span className="text-xs font-mono bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">
                    Min: {variant.min_stock_level}
                </span>
            </td>
            <td className={`p-3 text-right font-bold ${variant.stock < variant.min_stock_level ? 'text-red-600' : ''}`}>
                {variant.stock}
            </td>
            <td className="p-3 text-right">
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(variant)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(variant)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    )
}
