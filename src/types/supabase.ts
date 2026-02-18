export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string
                    created_at: string
                    title: string
                    description: string | null
                    base_sku: string | null
                    category: string | null
                    image_url: string | null
                    type: 'resale' | 'supply' | 'asset'
                    min_stock_level: number
                }
                Insert: {
                    id?: string
                    created_at?: string
                    title: string
                    description?: string | null
                    base_sku?: string | null
                    category?: string | null
                    image_url?: string | null
                    type?: 'resale' | 'supply' | 'asset'
                    min_stock_level?: number
                }
                Update: {
                    id?: string
                    created_at?: string
                    title?: string
                    description?: string | null
                    base_sku?: string | null
                    category?: string | null
                    image_url?: string | null
                    type?: 'resale' | 'supply' | 'asset'
                    min_stock_level?: number
                }
            }
            product_variants: {
                Row: {
                    id: string
                    product_id: string
                    sku: string
                    barcode: string | null
                    set_name: string | null
                    rarity: string | null
                    variant_condition: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG' | 'Sealed'
                    language: 'English' | 'Japanese' | 'Spanish'
                    is_foil: boolean
                    weight_grams: number
                    length_cm: number
                    width_cm: number
                    height_cm: number
                    price: number
                    compare_at_price: number | null
                }
                Insert: {
                    id?: string
                    product_id: string
                    sku: string
                    barcode?: string | null
                    set_name?: string | null
                    rarity?: string | null
                    variant_condition?: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG' | 'Sealed'
                    language?: 'English' | 'Japanese' | 'Spanish'
                    is_foil?: boolean
                    weight_grams?: number
                    length_cm?: number
                    width_cm?: number
                    height_cm?: number
                    price: number
                    compare_at_price?: number | null
                }
            }
            inventory: {
                Row: {
                    id: string
                    variant_id: string
                    quantity: number
                    location: string
                    last_updated: string
                }
                Insert: {
                    id?: string
                    variant_id: string
                    quantity: number
                    location?: string
                    last_updated?: string
                }
            }
            inventory_transactions: {
                Row: {
                    id: string
                    variant_id: string
                    change_amount: number
                    final_stock_snapshot: number
                    reason: string
                    reference_id: string | null
                    performed_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    variant_id: string
                    change_amount: number
                    final_stock_snapshot: number
                    reason: string
                    reference_id?: string | null
                    performed_by?: string | null
                    created_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    name: string
                    type: string
                    contact_info: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type?: string
                    contact_info?: Json | null
                    created_at?: string
                }
            }
            purchase_orders: {
                Row: {
                    id: string
                    supplier_id: string | null
                    status: string | null
                    total_cost: number | null
                    created_at: string
                }
            }
        }
    }
}
