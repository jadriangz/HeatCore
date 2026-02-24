import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type VariantWithProduct = Database['public']['Tables']['product_variants']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null
    inventory: Database['public']['Tables']['inventory']['Row'][]
}

interface ProductGridProps {
    onAddToCart: (variant: VariantWithProduct) => void
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [variants, setVariants] = useState<VariantWithProduct[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('product_variants')
            .select(`
                *,
                products!inner (*),
                inventory (quantity)
            `)
            .eq('products.type', 'resale')

        if (error) {
            console.error('Error fetching products:', error)
        } else {
            setVariants(data as any)
        }
        setLoading(false)
    }

    const filteredVariants = variants.filter(v =>
        v.products?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex-1 flex flex-col gap-4 h-full">
            <Card className="flex-none">
                <div className="p-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        className="flex-1 border-0 shadow-none focus-visible:ring-0"
                        placeholder="Search SKU, Name, Set..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </Card>

            <div className="flex-1 overflow-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredVariants.map((variant) => {
                    const quantity = variant.inventory?.[0]?.quantity || 0
                    return (
                        <Card
                            key={variant.id}
                            className="cursor-pointer hover:border-primary transition-all active:scale-95 flex flex-col"
                            onClick={() => onAddToCart(variant)}
                        >
                            <div className="relative aspect-[2.5/3.5] bg-muted rounded-t-lg overflow-hidden">
                                {variant.products?.image_url ? (
                                    <img
                                        src={variant.products.image_url}
                                        alt={variant.products.title}
                                        className="object-cover w-full h-full"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                                )}
                                {quantity <= 2 && (
                                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        LOW STOCK
                                    </span>
                                )}
                            </div>
                            <CardHeader className="p-3 pb-0">
                                <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                                    {variant.products?.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {variant.set_name} • {variant.variant_condition}
                                </p>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 mt-auto">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">${variant.price}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Stock: {quantity}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
