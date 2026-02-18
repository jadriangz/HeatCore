import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/ProductGrid"
import { useCart } from "@/hooks/useCart"
import { Trash2, Plus, Minus, Loader2, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"

export default function ManualPOS() {
    const {
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        total, subtotal, taxAmount, taxEnabled, setTaxEnabled
    } = useCart()
    const [isCheckingOut, setIsCheckingOut] = useState(false)

    // Shipping State
    const [zipCode, setZipCode] = useState('')
    const [shippingRates, setShippingRates] = useState<any[]>([])
    const [selectedRate, setSelectedRate] = useState<any>(null)
    const [isLoadingRates, setIsLoadingRates] = useState(false)

    async function calculateShipping() {
        if (!zipCode || zipCode.length < 5) {
            alert("Ingresa un código postal válido (5 dígitos)")
            return
        }
        if (cart.length === 0) {
            alert("Agrega productos al carrito primero")
            return
        }

        setIsLoadingRates(true)
        setShippingRates([])
        setSelectedRate(null)

        try {
            const { data, error } = await supabase.functions.invoke('shipping-rates', {
                body: {
                    destination: {
                        postalCode: zipCode,
                        country: "MX"
                    },
                    items: cart.map(item => ({
                        name: item.products?.title,
                        quantity: item.cartQuantity,
                        weight: (item.weight_grams || 100) / 1000, // Convert grams to kg
                        length: item.length_cm || 10,
                        width: item.width_cm || 10,
                        height: item.height_cm || 1
                    }))
                }
            })

            if (error) throw error

            setShippingRates(data)
        } catch (error: any) {
            console.error(error)
            alert("Error calculando envío: " + (error.message || "Unknown error"))
        } finally {
            setIsLoadingRates(false)
        }
    }

    const orderTotal = total + (selectedRate?.price || 0)

    async function handleCheckout() {
        setIsCheckingOut(true)
        try {
            const payload = {
                origin: 'manual',
                total: orderTotal,
                subtotal: subtotal,
                tax: taxAmount,
                tax_rate: taxEnabled ? 0.16 : 0,
                shipping_cost: selectedRate?.price || 0,
                shipping_carrier: selectedRate ? `${selectedRate.carrier} - ${selectedRate.service}` : null,
                items: cart.map(item => ({
                    variant_id: item.id,
                    quantity: item.cartQuantity,
                    price: item.price
                }))
            }

            const { data, error } = await supabase.rpc('create_order', { p_order_payload: payload })

            if (error) {
                alert('Error creando orden: ' + error.message)
                console.error(error)
            } else {
                console.log('Order Data:', data)
                alert('¡Orden creada exitosamente!')
                clearCart()
            }
        } catch (e) {
            console.error(e)
            alert('Ocurrió un error inesperado.')
        } finally {
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            {/* Left Panel: Product Grid */}
            <ProductGrid onAddToCart={addToCart} />

            {/* Right Panel: Cart */}
            <div className="w-96 flex flex-col">
                <Card className="flex-1 flex flex-col h-full">
                    <CardHeader className="border-b">
                        <CardTitle>Orden Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 text-center">
                                <span className="text-4xl mb-4">🛒</span>
                                <p>El carrito está vacío.</p>
                                <p className="text-sm">Escanea o selecciona productos.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-4 flex gap-3">
                                        <div className="h-16 w-12 bg-muted rounded flex-none overflow-hidden">
                                            {item.products?.image_url && (
                                                <img src={item.products.image_url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm truncate">{item.products?.title}</h4>
                                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline" size="icon" className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-sm w-4 text-center">{item.cartQuantity}</span>
                                                    <Button
                                                        variant="outline" size="icon" className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <span className="font-bold text-sm">
                                                    ${(item.price * item.cartQuantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-4 border-t bg-muted/20">
                        {/* Shipping Section */}
                        <div className="mb-4 space-y-3">
                            <div className="flex gap-2">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="zip">Código Postal</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="zip"
                                            placeholder="80000"
                                            value={zipCode}
                                            onChange={(e) => setZipCode(e.target.value)}
                                            maxLength={5}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={calculateShipping}
                                            disabled={isLoadingRates || cart.length === 0}
                                        >
                                            {isLoadingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Rates List */}
                            {shippingRates.length > 0 && (
                                <RadioGroup
                                    value={selectedRate ? JSON.stringify(selectedRate) : ""}
                                    onValueChange={(v: string) => setSelectedRate(JSON.parse(v))}
                                    className="grid gap-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-background"
                                >
                                    {shippingRates.map((rate, idx) => (
                                        <div key={idx} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                            <RadioGroupItem value={JSON.stringify(rate)} id={`r-${idx}`} />
                                            <Label htmlFor={`r-${idx}`} className="flex-1 flex justify-between cursor-pointer text-xs">
                                                <span className="font-semibold uppercase">{rate.carrier} <span className="font-normal text-muted-foreground">({rate.service})</span></span>
                                                <span className="font-bold">${rate.price.toFixed(2)}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <Label htmlFor="tax-mode" className="text-sm font-medium">Aplicar IVA (16%)</Label>
                                <Switch
                                    id="tax-mode"
                                    checked={taxEnabled}
                                    onCheckedChange={setTaxEnabled}
                                />
                            </div>

                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Impuestos ({taxEnabled ? '16%' : '0%'})</span>
                                <span>${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Envío</span>
                                <span>${selectedRate?.price.toFixed(2) || "0.00"}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total</span>
                                <span>${orderTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <Button
                            className="w-full" size="lg"
                            disabled={cart.length === 0 || isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                `Cobrar ($${orderTotal.toFixed(2)})`
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
