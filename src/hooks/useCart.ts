import { useState } from 'react'
import type { Database } from '@/types/supabase'

export type CartItem = Database['public']['Tables']['product_variants']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null
    cartQuantity: number
}

type VariantWithProduct = Database['public']['Tables']['product_variants']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null
}

export function useCart() {
    const [cart, setCart] = useState<CartItem[]>([])

    const addToCart = (variant: VariantWithProduct) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === variant.id)
            if (existing) {
                return prev.map(item =>
                    item.id === variant.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                )
            }
            return [...prev, { ...variant, cartQuantity: 1 }]
        })
    }

    const removeFromCart = (variantId: string) => {
        setCart(prev => prev.filter(item => item.id !== variantId))
    }

    const updateQuantity = (variantId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === variantId) {
                    const newQuantity = Math.max(1, item.cartQuantity + delta)
                    return { ...item, cartQuantity: newQuantity }
                }
                return item
            })
        })
    }

    const [taxEnabled, setTaxEnabled] = useState(true)
    const TAX_RATE = 0.16

    const clearCart = () => setCart([])

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)
    const taxAmount = taxEnabled ? subtotal * TAX_RATE : 0
    const total = subtotal + taxAmount

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        taxAmount,
        total,
        taxEnabled,
        setTaxEnabled
    }
}
