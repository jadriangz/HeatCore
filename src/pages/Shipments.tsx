import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Search, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export default function Shipments() {
    const [shipments, setShipments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchShipments()
    }, [])

    const fetchShipments = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('shipments')
            .select('*, orders(order_number, customers(name))')
            .order('created_at', { ascending: false })
            .limit(100)

        setShipments(data || [])
        setLoading(false)
    }

    const filteredShipments = shipments.filter(s => {
        const orderNum = s.orders?.order_number || ''
        const customer = s.orders?.customers?.name || ''
        const tracking = s.tracking_number || ''
        const term = searchTerm.toLowerCase()
        return orderNum.toLowerCase().includes(term) || customer.toLowerCase().includes(term) || tracking.toLowerCase().includes(term)
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Rastreo de Envíos</h1>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder="Buscar por Orden, Guía o Cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={fetchShipments} variant="outline" disabled={loading}>
                    Actualizar
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-muted-foreground">Cargando envíos...</div>
            ) : filteredShipments.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-16 text-muted-foreground bg-muted/20 border-dashed">
                    <Truck className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg">No se encontraron envíos</p>
                    <p className="text-sm">Las guías generadas aparecerán aquí.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredShipments.map(shipment => (
                        <Card key={shipment.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
                                            <Truck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg">Guía {shipment.tracking_number || 'Pendiente'}</h3>
                                                <Badge variant={shipment.status === 'generated' ? 'default' : 'secondary'}>
                                                    {shipment.status === 'generated' ? 'Generada' : shipment.status}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Orden #{shipment.orders?.order_number} • Cliente: {shipment.orders?.customers?.name || 'Desconocido'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Creada {format(new Date(shipment.created_at), 'dd MMM yyyy, HH:mm')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                        <div className="text-right">
                                            <div className="font-medium">{shipment.carrier} - {shipment.service_level}</div>
                                            <div className="text-sm text-muted-foreground">Costo: ${shipment.shipping_cost_real}</div>
                                        </div>
                                        {shipment.label_url && (
                                            <Button variant="outline" size="sm" asChild className="w-full md:w-auto">
                                                <a href={shipment.label_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Ver Etiqueta
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
