import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Loader2, Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import InternalAdjustmentDialog from "./InternalAdjustmentDialog"

export default function InventoryLog() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('inventory_transactions')
                .select(`
                    *,
                    product_variants ( sku, products(title) )
                `)
                .order('created_at', { ascending: false })
                .limit(200)

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching inventory logs:', error)
            alert('Error al cargar la bitácora')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLogs = transactions.filter(t =>
        t.product_variants?.products?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.product_variants?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild className="mb-1">
                    <Link to="/inventory">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Inventario
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bitácora de Movimientos</h1>
                    <p className="text-muted-foreground mt-2">
                        Historial completo de entradas, salidas, ventas y ajustes internos de inventario.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar producto o motivo..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsAdjustmentOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
                        Ajuste Interno / Consumo
                    </Button>
                </div>
            </div>

            <InternalAdjustmentDialog
                open={isAdjustmentOpen}
                onOpenChange={setIsAdjustmentOpen}
                onSuccess={fetchLogs}
            />

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Motivo / Referencia</TableHead>
                                    <TableHead className="text-right">Movimiento</TableHead>
                                    <TableHead className="text-right">Stock Final</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No hay movimientos registrados recientes.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.product_variants?.products?.title || 'Sin Título'}
                                                <div className="text-xs text-muted-foreground">{log.product_variants?.sku || ''}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{log.reason}</div>
                                                {log.reference_id && (
                                                    <div className="text-xs text-muted-foreground">Ref: {log.reference_id}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={`inline-flex items-center justify-end font-bold ${log.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {log.change_amount > 0 ? <ArrowUpCircle className="w-4 h-4 mr-1" /> : <ArrowDownCircle className="w-4 h-4 mr-1" />}
                                                    {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {log.final_stock_snapshot}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
