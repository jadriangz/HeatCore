import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Scan, Box, Printer, CheckCircle2, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function Packing() {
    const [orders, setOrders] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [scanInput, setScanInput] = useState('')
    const [scannedItems, setScannedItems] = useState<Record<string, number>>({})
    const [supplies, setSupplies] = useState<any[]>([])
    const [selectedSupplies, setSelectedSupplies] = useState<any[]>([])
    const [step, setStep] = useState<'select' | 'verify' | 'pack' | 'ship'>('select')

    useEffect(() => {
        fetchOrders()
        fetchSupplies()
    }, [])

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*), customers(name)')
            .eq('status', 'paid')
            .eq('fulfillment_status', 'unfulfilled')
            .order('created_at', { ascending: true })
        setOrders(data || [])
    }

    const fetchSupplies = async () => {
        const { data } = await supabase
            .from('product_variants')
            .select('*, products!inner(type)')
            .eq('products.type', 'supply')
        setSupplies(data || [])
    }

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedOrder) return

        const item = selectedOrder.order_items.find((i: any) => i.sku === scanInput || i.barcode === scanInput)

        if (item) {
            const currentCount = scannedItems[item.sku] || 0
            if (currentCount < item.quantity) {
                setScannedItems(prev => ({ ...prev, [item.sku]: currentCount + 1 }))
                toast.success(`Verified: ${item.name}`)
                setScanInput('')
            } else {
                toast.warning(`All ${item.name} already verified!`)
            }
        } else {
            toast.error('Item not found in this order!')
        }
    }

    const isOrderVerified = () => {
        if (!selectedOrder) return false
        return selectedOrder.order_items.every((item: any) => (scannedItems[item.sku] || 0) === item.quantity)
    }

    const addSupply = (supply: any) => {
        setSelectedSupplies(prev => {
            const existing = prev.find(s => s.id === supply.id)
            if (existing) {
                return prev.map(s => s.id === supply.id ? { ...s, quantity: s.quantity + 1 } : s)
            }
            return [...prev, { ...supply, quantity: 1 }]
        })
    }

    const removeSupply = (id: string) => {
        setSelectedSupplies(prev => prev.filter(s => s.id !== id))
    }

    const generateLabel = async () => {
        if (selectedSupplies.length === 0) {
            toast.error('Please select at least one supply (e.g. Box)')
            return
        }

        const toastId = toast.loading('Connecting to Envia.com...')

        try {
            const payload = {
                order_id: selectedOrder.id,
                supplies: selectedSupplies.map(s => ({
                    variant_id: s.id,
                    quantity: s.quantity,
                    unit_cost: s.price
                })),
                carrier_service: 'Standard',
                final_weight: 1000,
                final_dimensions: { length: 20, width: 20, height: 20 }
            }

            const { error } = await supabase.functions.invoke('create-shipment', {
                body: payload
            })

            if (error) throw error

            toast.success('Label Generated & Stock Deducted!', { id: toastId })
            setStep('select')
            setSelectedOrder(null)
            fetchOrders()

        } catch (err: any) {
            console.error(err)
            toast.error('Failed to generate label: ' + err.message, { id: toastId })
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-4">
            {/* Left Order List */}
            <div className={`w-1/3 border-r bg-card flex flex-col ${step !== 'select' ? 'hidden md:flex' : ''}`}>
                <div className="p-4 border-b font-semibold flex justify-between items-center">
                    <span>Orders Ready to Pack</span>
                    <Badge variant="secondary">{orders.length}</Badge>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            onClick={() => { setSelectedOrder(order); setStep('verify'); setScannedItems({}) }}
                            className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold">#{order.order_number}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM dd')}</span>
                            </div>
                            <div className="text-sm font-medium">{order.customers?.name || order.customer_name || 'Desconocido'}</div>
                            <div className="text-xs text-muted-foreground mt-2">{order.order_items?.length} items</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Work Area */}
            <div className="flex-1 p-6 flex flex-col">
                {selectedOrder ? (
                    <div className="h-full flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">Packing Order #{selectedOrder.order_number}</h1>
                                <div className="text-muted-foreground">Customer: {selectedOrder.customers?.name || selectedOrder.customer_name || 'Desconocido'}</div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={step === 'verify' ? 'default' : 'outline'}>1. Verify</Badge>
                                <Badge variant={step === 'pack' ? 'default' : 'outline'}>2. Pack</Badge>
                                <Badge variant={step === 'ship' ? 'default' : 'outline'}>3. Ship</Badge>
                            </div>
                        </div>

                        {/* STEP 1: VERIFY */}
                        {step === 'verify' && (
                            <div className="flex-1 flex flex-col gap-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <form onSubmit={handleScan} className="flex gap-4">
                                            <Input
                                                autoFocus
                                                placeholder="Scan item barcode..."
                                                value={scanInput}
                                                onChange={e => setScanInput(e.target.value)}
                                                className="text-lg h-12"
                                            />
                                            <Button type="submit" size="lg" className="h-12"><Scan className="mr-2 h-4 w-4" /> Scan</Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <div className="space-y-2">
                                    {selectedOrder.order_items.map((item: any) => {
                                        const scanned = scannedItems[item.sku] || 0
                                        const isComplete = scanned >= item.quantity
                                        return (
                                            <div key={item.id} className={`flex justify-between items-center p-4 border rounded-lg ${isComplete ? 'bg-green-50 border-green-200' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    {isComplete ? <CheckCircle2 className="text-green-600 h-6 w-6" /> : <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300" />}
                                                    <div>
                                                        <div className="font-bold">{item.name}</div>
                                                        <div className="text-sm text-muted-foreground">{item.sku}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xl font-mono">
                                                    <span className={isComplete ? 'text-green-600' : 'text-orange-500'}>{scanned}</span>
                                                    <span className="text-muted-foreground">/{item.quantity}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-auto">
                                    <Button
                                        className="w-full h-12 text-lg"
                                        disabled={!isOrderVerified()}
                                        onClick={() => setStep('pack')}
                                    >
                                        Next: Select Packaging
                                    </Button>
                                    {!isOrderVerified() && <div className="text-center text-sm text-muted-foreground mt-2">Scan all items to proceed</div>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: PACK */}
                        {step === 'pack' && (
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="grid grid-cols-2 gap-6 h-full">
                                    {/* Supplies Selection */}
                                    <div className="border rounded-lg p-4 bg-muted/20 overflow-auto">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2"><Box className="h-4 w-4" /> Available Supplies</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {supplies.map(supply => (
                                                <Button
                                                    key={supply.id}
                                                    variant="outline"
                                                    className="h-auto flex flex-col items-start p-3 gap-1"
                                                    onClick={() => addSupply(supply)}
                                                >
                                                    <span className="font-bold text-sm w-full truncate" title={supply.sku}>{supply.sku}</span>
                                                    <span className="text-xs text-muted-foreground w-full truncate">{supply.title?.split('-')[1] || supply.sku}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Selected Packaging */}
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold mb-4 text-center">Package Contents</h3>
                                        <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center p-4 gap-2 bg-white relative">
                                            {/* Visual representation of box */}
                                            <div className="absolute inset-x-0 bottom-0 top-10 mx-auto w-3/4 border-x-2 border-b-2 border-primary/20 bg-primary/5 rounded-b-lg flex flex-col-reverse p-4 items-center justify-start gap-1">
                                                {/* Stacked items */}
                                                {selectedSupplies.map((s, i) => (
                                                    <div key={i} className="w-full bg-orange-100 border border-orange-300 rounded p-2 text-center text-xs shadow-sm">
                                                        {s.sku}
                                                        <span className="ml-2 font-bold">x{s.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-2" onClick={() => removeSupply(s.id)}>×</Button>
                                                    </div>
                                                ))}
                                                <div className="w-full bg-blue-100 border border-blue-300 rounded p-4 text-center text-sm shadow-sm font-bold flex items-center justify-center gap-2">
                                                    <Package className="h-4 w-4" /> Order Items
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <Button className="w-full h-12" onClick={() => generateLabel()}>
                                                <Printer className="mr-2 h-4 w-4" /> Generate Label & Deduct
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <Truck className="h-16 w-16 opacity-20" />
                        <p>Select an order to start packing</p>
                    </div>
                )}
            </div>
        </div>
    )
}
