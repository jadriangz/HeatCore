import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/ProductGrid"
import { useCart } from "@/hooks/useCart"
import { Trash2, Plus, Minus, Loader2, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

export default function ManualPOS() {
    const {
        cart, addToCart, removeFromCart, updateQuantity, clearCart,
        total, subtotal, taxAmount, taxEnabled, setTaxEnabled
    } = useCart()
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [requiresShipping, setRequiresShipping] = useState(false)

    // Shipping State
    const [zipCode, setZipCode] = useState('')
    const [shippingRates, setShippingRates] = useState<any[]>([])
    const [selectedRate, setSelectedRate] = useState<any>(null)
    const [isLoadingRates, setIsLoadingRates] = useState(false)

    // Customer State
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("anonymous")
    const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
    const [newCustomer, setNewCustomer] = useState({
        name: '', email: '', phone: '', street: '', exterior_number: '', interior_number: '', neighborhood: '', city: '', state: '', postal_code: ''
    })
    const [isSavingCustomer, setIsSavingCustomer] = useState(false)

    useEffect(() => {
        fetchCustomers()
    }, [])

    useEffect(() => {
        if (selectedCustomerId !== "anonymous") {
            const customer = customers.find(c => c.id === selectedCustomerId)
            setZipCode(customer?.postal_code || '')
        } else {
            setZipCode('')
        }
    }, [selectedCustomerId, customers])

    async function fetchCustomers() {
        try {
            const { data, error } = await supabase.from('customers').select('*').order('name')
            if (error) throw error
            setCustomers(data || [])
        } catch (e) {
            console.error("Error fetching customers:", e)
        }
    }

    async function handleCreateCustomer() {
        if (!newCustomer.name.trim()) return alert('El nombre es obligatorio')
        setIsSavingCustomer(true)
        try {
            const { count, error: countError } = await supabase.from('customers').select('*', { count: 'exact', head: true })
            if (countError) throw countError
            const nextNum = (count || 0) + 1
            const autoCode = `HC-${nextNum.toString().padStart(4, '0')}`

            const { data, error } = await supabase
                .from('customers')
                .insert({
                    name: newCustomer.name,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    street: newCustomer.street,
                    exterior_number: newCustomer.exterior_number,
                    interior_number: newCustomer.interior_number,
                    neighborhood: newCustomer.neighborhood,
                    city: newCustomer.city,
                    state: newCustomer.state,
                    postal_code: newCustomer.postal_code,
                    auto_code: autoCode
                }).select().single()

            if (error) throw error

            alert('Cliente creado exitosamente')
            setIsNewCustomerOpen(false)
            setNewCustomer({ name: '', email: '', phone: '', street: '', exterior_number: '', interior_number: '', neighborhood: '', city: '', state: '', postal_code: '' })
            await fetchCustomers()
            setSelectedCustomerId(data.id)
        } catch (error: any) {
            alert('Error al crear cliente: ' + error.message)
        } finally {
            setIsSavingCustomer(false)
        }
    }

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

        let dest: any = { postalCode: zipCode, country: "MX" }
        if (selectedCustomerId !== "anonymous") {
            const cust = customers.find(c => c.id === selectedCustomerId)
            if (cust) {
                dest = {
                    name: cust.name,
                    email: cust.email,
                    phone: cust.phone,
                    street: cust.street,
                    number: cust.exterior_number,
                    district: cust.neighborhood,
                    city: cust.city,
                    state: cust.state,
                    postalCode: zipCode, // Use the input's current zip code in case they changed it
                    country: cust.country || "MX"
                }
            }
        }

        try {
            const { data, error } = await supabase.functions.invoke('shipping-rates', {
                body: {
                    destination: dest,
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
            let shippingAddress = null;
            if (requiresShipping) {
                if (selectedCustomerId !== "anonymous") {
                    const cust = customers.find(c => c.id === selectedCustomerId)
                    if (cust) {
                        shippingAddress = {
                            name: cust.name,
                            phone: cust.phone,
                            street: cust.street,
                            exterior_number: cust.exterior_number,
                            interior_number: cust.interior_number,
                            neighborhood: cust.neighborhood,
                            city: cust.city,
                            state: cust.state,
                            postal_code: zipCode, // use the zip code from state
                            country: cust.country || "MX"
                        }
                    }
                } else {
                    shippingAddress = {
                        postal_code: zipCode,
                        country: "MX"
                    }
                }
            }

            const payload = {
                origin: 'manual',
                total: orderTotal,
                subtotal: subtotal,
                tax: taxAmount,
                tax_rate: taxEnabled ? 0.16 : 0,
                shipping_cost: selectedRate?.price || 0,
                shipping_carrier: selectedRate && requiresShipping ? `${selectedRate.carrier} - ${selectedRate.service}` : null,
                customer_id: selectedCustomerId === "anonymous" ? null : selectedCustomerId,
                payment_method: paymentMethod,
                requires_shipping: requiresShipping,
                shipping_address: shippingAddress,
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
                    <CardHeader className="border-b py-3 px-4 bg-muted/10">
                        <div className="flex justify-between items-center mb-2">
                            <CardTitle className="text-lg">Orden</CardTitle>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="tax-mode" className="text-xs font-medium cursor-pointer">IVA (16%)</Label>
                                <Switch
                                    id="tax-mode"
                                    checked={taxEnabled}
                                    onCheckedChange={setTaxEnabled}
                                    className="scale-75 origin-right"
                                />
                            </div>
                        </div>
                        {/* Customer Section moved to top */}
                        <div className="flex gap-2">
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue placeholder="Seleccionar Cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anonymous">Público General</SelectItem>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.auto_code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nuevo Cliente (POS)</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                                        <h4 className="font-semibold text-sm border-b pb-1">Contacto</h4>
                                        <div className="space-y-2">
                                            <Label>Nombre Completo *</Label>
                                            <Input
                                                placeholder="Ej. Ash Ketchum"
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Correo</Label>
                                                <Input
                                                    placeholder="ash@pallet.com" type="email"
                                                    value={newCustomer.email}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Teléfono</Label>
                                                <Input
                                                    placeholder="123 456 7890"
                                                    value={newCustomer.phone}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <h4 className="font-semibold text-sm border-b pb-1 mt-4">Dirección</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label>Calle</Label>
                                                <Input value={newCustomer.street} onChange={e => setNewCustomer({ ...newCustomer, street: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Num. Ext</Label>
                                                <Input value={newCustomer.exterior_number} onChange={e => setNewCustomer({ ...newCustomer, exterior_number: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Num. Int</Label>
                                                <Input value={newCustomer.interior_number} onChange={e => setNewCustomer({ ...newCustomer, interior_number: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Colonia</Label>
                                                <Input value={newCustomer.neighborhood} onChange={e => setNewCustomer({ ...newCustomer, neighborhood: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Ciudad</Label>
                                                <Input value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Estado</Label>
                                                <Input value={newCustomer.state} onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Código Postal</Label>
                                                <Input value={newCustomer.postal_code} onChange={e => setNewCustomer({ ...newCustomer, postal_code: e.target.value })} maxLength={5} />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleCreateCustomer} disabled={isSavingCustomer}>
                                            {isSavingCustomer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Crear y Seleccionar
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
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
                        {cart.length > 0 && (
                            <div className="space-y-3 mb-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue placeholder="Pago" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Efectivo</SelectItem>
                                                <SelectItem value="transfer">Transferencia</SelectItem>
                                                <SelectItem value="card">Tarjeta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Logística</Label>
                                        <Select value={requiresShipping ? "shipping" : "pickup"} onValueChange={(val) => setRequiresShipping(val === "shipping")}>
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue placeholder="Entrega" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pickup">Entrega Tienda</SelectItem>
                                                <SelectItem value="shipping">Envío Especial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shipping Section */}
                        {requiresShipping && (
                            <div className="mb-4 space-y-3 bg-muted/20 p-3 rounded-md border">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="zip" className="sr-only">Código Postal</Label>
                                        <Input
                                            id="zip"
                                            placeholder="C.P. (Ej. 64000)"
                                            value={zipCode === 'visible' ? '' : zipCode}
                                            onChange={(e) => setZipCode(e.target.value)}
                                            maxLength={5}
                                            className="h-8 text-sm placeholder:text-muted-foreground/50"
                                        />
                                        {selectedCustomerId !== "anonymous" && (
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {customers.find(c => c.id === selectedCustomerId)?.postal_code
                                                    ? `Usando C.P. de cliente`
                                                    : "Cliente sin C.P. asignado"}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={calculateShipping}
                                        disabled={isLoadingRates || !zipCode || zipCode.length < 5}
                                        className="h-8 shadow-sm flex-none"
                                        title="Calcular Envío"
                                    >
                                        {isLoadingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

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

                        <div className="space-y-1 mb-4 text-sm mt-3 pt-3 border-t">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Impuestos ({taxEnabled ? '16%' : '0%'})</span>
                                <span>${taxAmount.toFixed(2)}</span>
                            </div>
                            {requiresShipping && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Envío</span>
                                    <span>${selectedRate?.price.toFixed(2) || "0.00"}</span>
                                </div>
                            )}
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
