import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, ClipboardCheck, ArrowRightLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import ProcessReceptionDialog from "./receiving/ProcessReceptionDialog"
import ViewReceptionDialog from "./receiving/ViewReceptionDialog"

export default function Receiving() {
    const [pendingPOs, setPendingPOs] = useState<any[]>([])
    const [receptionHistory, setReceptionHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Dialog State
    const [selectedPO, setSelectedPO] = useState<any>(null)
    const [isProcessOpen, setIsProcessOpen] = useState(false)
    const [viewRec, setViewRec] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setIsLoading(true)
        try {
            const [poRes, recRes] = await Promise.all([
                supabase.from('purchase_orders')
                    .select('*, suppliers(name)')
                    .in('status', ['Sent', 'Partial'])
                    .order('created_at', { ascending: false }),
                supabase.from('receptions')
                    .select('*, purchase_orders(po_number)')
                    .order('created_at', { ascending: false })
            ])

            if (poRes.error) throw poRes.error
            if (recRes.error) throw recRes.error

            setPendingPOs(poRes.data || [])
            setReceptionHistory(recRes.data || [])
        } catch (error) {
            console.error('Error fetching receiving data:', error)
            alert('Error al cargar datos de recepciones')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredPOs = pendingPOs.filter(po =>
        po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredHistory = receptionHistory.filter(rec =>
        rec.reception_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.purchase_orders?.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function handleOpenProcess(po: any) {
        setSelectedPO(po)
        setIsProcessOpen(true)
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Recepciones (Receiving)</h1>
                <p className="text-muted-foreground mt-2">
                    Ingresa y valida inventario físico contra Órdenes de Compra y actualiza el costo ponderado.
                </p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4" />
                            Órdenes Pendientes
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4" />
                            Historial
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="pending" className="mt-0">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Orden (PO)</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredPOs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No hay órdenes de compra pendientes por recibir.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPOs.map(po => (
                                            <TableRow key={po.id}>
                                                <TableCell className="font-medium">{po.po_number}</TableCell>
                                                <TableCell>{po.suppliers?.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(po.created_at), "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        className="border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
                                                        onClick={() => handleOpenProcess(po)}
                                                    >
                                                        Recibir Inventario
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>No. Recepción</TableHead>
                                        <TableHead>PO Ref</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No hay recepciones registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredHistory.map(rec => (
                                            <TableRow key={rec.id}>
                                                <TableCell className="font-medium bg-muted/20">{rec.reception_number}</TableCell>
                                                <TableCell>{rec.purchase_orders?.po_number || '-'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(rec.received_date), "dd/MM/yyyy HH:mm", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    {rec.status === 'Cancelled' ? (
                                                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                                                            Cancelado
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                                                            Recibido
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setViewRec(rec)}>
                                                        Ver Detalles
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {selectedPO && (
                <ProcessReceptionDialog
                    open={isProcessOpen}
                    onOpenChange={setIsProcessOpen}
                    purchaseOrder={selectedPO}
                    onSuccess={fetchData}
                />
            )}

            <ViewReceptionDialog
                open={!!viewRec}
                onOpenChange={(open) => !open && setViewRec(null)}
                reception={viewRec}
            />
        </div>
    )
}
