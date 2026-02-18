import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface ProductFormProps {
    onClose: () => void
    onSuccess: () => void
    initialData?: any // If provided, we are in EDIT mode
}

export function ProductForm({ onClose, onSuccess, initialData }: ProductFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        sku: '',
        type: 'resale',
        cost_price: '', // Added cost_price to state
        price: '',
        category: '',
        min_stock: '5'
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.products?.title || initialData.title || '',
                sku: initialData.sku || '',
                type: initialData.products?.type || 'resale',
                cost_price: initialData.cost_price?.toString() || '', // Set cost_price from initialData
                // specific variant price, or falls back
                price: initialData.price?.toString() || '',
                category: initialData.products?.category || '',
                min_stock: (initialData.products?.min_stock_level || 5).toString()
            })
        }
    }, [initialData])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            if (initialData) {
                // --- UPDATE MODE ---
                const productId = initialData.product_id
                const variantId = initialData.id

                // 1. Update Product (Parent)
                const { error: prodError } = await supabase
                    .from('products')
                    .update({
                        title: formData.title,
                        // base_sku: formData.sku, // Keep base SKU stable or update? Let's update for now
                        type: formData.type as any,
                        category: formData.category,
                        min_stock_level: parseInt(formData.min_stock)
                    })
                    .eq('id', productId)

                if (prodError) throw prodError

                // 2. Update Variant
                const { error: varError } = await supabase
                    .from('product_variants')
                    .update({
                        sku: formData.sku,
                        price: parseFloat(formData.price) || 0,
                        cost_price: parseFloat(formData.cost_price) || null // Update cost_price
                    })
                    .eq('id', variantId)

                if (varError) throw varError

                alert('¡Producto Actualizado Corretamente!')
            } else {
                // --- CREATE MODE ---
                // 1. Create Product
                const { data: product, error: prodError } = await supabase
                    .from('products')
                    .insert({
                        title: formData.title,
                        base_sku: formData.sku,
                        type: formData.type as any,
                        category: formData.category,
                        min_stock_level: parseInt(formData.min_stock)
                    })
                    .select()
                    .single()

                if (prodError) throw prodError

                // 2. Create Default Variant
                const { error: varError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id: product.id,
                        sku: formData.sku,
                        price: parseFloat(formData.price) || 0,
                        cost_price: parseFloat(formData.cost_price) || null, // Insert cost_price
                        weight_grams: 100,
                        variant_condition: 'Sealed' // Default for sealed products
                    })

                if (varError) throw varError

                alert('¡Producto Creado Exitosamente!')
            }

            onSuccess()
            onClose()
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-lg mx-auto border-0 shadow-none">
            <CardHeader className="px-0">
                <CardTitle>{initialData ? 'Editar Producto' : 'Nuevo Producto / Insumo'}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="resale">Producto (Venta)</option>
                                <option value="supply">Insumo Operativo</option>
                                <option value="asset">Activo / Equipo</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <Input
                                placeholder="ej. Booster Box, ETB, Micas"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                            required
                            placeholder="ej. Pokémon 151 Elite Trainer Box"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SKU</label>
                            <Input
                                required
                                placeholder="Código Único"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {formData.type === 'supply' ? 'Costo (Est)' : 'Precio Venta'}
                            </label>
                            <Input
                                type="number" step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Costo Unitario
                            </label>
                            <Input
                                type="number" step="0.01"
                                placeholder="0.00"
                                value={formData.cost_price}
                                onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-600">Punto de Reorden (Stock Mín)</label>
                        <Input
                            type="number"
                            placeholder="5"
                            value={formData.min_stock}
                            onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                            className="border-blue-200 bg-blue-50"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Alerta cuando la existencia sea menor a este número.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Guardar Cambios' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
