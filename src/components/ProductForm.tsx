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
        min_stock: '5',
        image_url: '',
        set_name: ''
    })

    const [catalogs, setCatalogs] = useState<{ product_type: any[], product_category: any[], tcg_set: any[] }>({
        product_type: [],
        product_category: [],
        tcg_set: []
    })

    useEffect(() => {
        async function fetchCatalogs() {
            const { data } = await supabase.from('system_catalogs').select('*').eq('is_active', true)
            if (data) {
                setCatalogs({
                    product_type: data.filter(d => d.catalog_group === 'product_type').sort((a, b) => a.name.localeCompare(b.name)),
                    product_category: data.filter(d => d.catalog_group === 'product_category').sort((a, b) => a.name.localeCompare(b.name)),
                    tcg_set: data.filter(d => d.catalog_group === 'tcg_set').sort((a, b) => a.name.localeCompare(b.name)),
                })
            }
        }
        fetchCatalogs()
    }, [])

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
                min_stock: (initialData.products?.min_stock_level || 5).toString(),
                image_url: initialData.products?.image_url || '',
                set_name: initialData.set_name || ''
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
                        min_stock_level: parseInt(formData.min_stock),
                        image_url: formData.image_url || null,
                        set_name: formData.set_name || null
                    })
                    .eq('id', productId)

                if (prodError) throw prodError

                // 2. Update Variant
                const { error: varError } = await supabase
                    .from('product_variants')
                    .update({
                        sku: formData.sku,
                        price: parseFloat(formData.price) || 0,
                        cost_price: parseFloat(formData.cost_price) || null
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
                        min_stock_level: parseInt(formData.min_stock),
                        image_url: formData.image_url || null,
                        set_name: formData.set_name || null
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
                                <option value="">Selecciona un tipo...</option>
                                {catalogs.product_type.map(cat => (
                                    <option key={cat.internal_code} value={cat.internal_code}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Selecciona una categoría...</option>
                                {catalogs.product_category.map(cat => (
                                    <option key={cat.internal_code} value={cat.internal_code}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Set / Expansión (Solo TCG)</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-blue-600"
                                value={formData.set_name}
                                onChange={e => setFormData({ ...formData, set_name: e.target.value })}
                            >
                                <option value="">Ninguno / No Aplica</option>
                                {catalogs.tcg_set.map(cat => (
                                    <option key={cat.internal_code} value={cat.internal_code}>{cat.name}</option>
                                ))}
                            </select>
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
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium">URL de Imagen (Opcional)</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            />
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                        if (!e.target.files || e.target.files.length === 0) return;
                                        const file = e.target.files[0];
                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `product_${Date.now()}.${fileExt}`;

                                        // Upload to Supabase Storage
                                        const { error: uploadError } = await supabase.storage
                                            .from('products')
                                            .upload(fileName, file);

                                        if (uploadError) {
                                            alert('Error al subir imagen. Verifica que el bucket "products" exista y sea público.');
                                            console.error(uploadError);
                                            return;
                                        }

                                        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
                                        setFormData({ ...formData, image_url: data.publicUrl });
                                        alert('Imagen adjuntada exitosamente.');
                                    }}
                                />
                                <Button type="button" variant="secondary">Adjuntar</Button>
                            </div>
                        </div>
                        {formData.image_url && (
                            <div className="h-24 w-24 rounded border overflow-hidden">
                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
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
