import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, RefreshCw, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from '@/contexts/AuthContext'
import { FinancialTransactionDialog } from './FinancialTransactionDialog'

export default function Expenses() {
    const { user } = useAuth()
    const [accounts, setAccounts] = useState<any[]>([])
    const [balances, setBalances] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchAccounts(),
                fetchTransactions()
            ])
        } catch (error) {
            console.error("Error fetching financial data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAccounts = async () => {
        // Fetch raw accounts list for the forms
        const { data: accData, error: accError } = await supabase
            .from('financial_accounts')
            .select('*')
            .order('type', { ascending: true }) // company first
        if (accError) throw accError
        setAccounts(accData || [])

        // Fetch calculated balances
        const { data: balData, error: balError } = await supabase.rpc('get_financial_balances')
        if (balError) throw balError
        setBalances(balData || [])
    }

    const fetchTransactions = async () => {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select(`
                *,
                financial_accounts ( name, type )
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        setTransactions(data || [])
    }

    const companyBank = balances.find(a => a.type === 'company_bank')
    const companyCash = balances.find(a => a.type === 'company_cash')
    const partners = balances.filter(a => a.type === 'partner_wallet')

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Tesorería y Flujo de Caja</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Movimiento
                    </Button>
                </div>
            </div>

            {/* Balances Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{companyBank?.name || 'HeatCore - Banco'}</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${companyBank?.current_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Fondos empresariales
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{companyCash?.name || 'HeatCore - Efectivo'}</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${companyCash?.current_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Caja registradora
                        </p>
                    </CardContent>
                </Card>
                {partners.map(partner => (
                    <Card key={partner.account_id} className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-900">{partner.name}</CardTitle>
                            <User className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">${partner.current_balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</div>
                            <p className="text-xs text-blue-600/80 mt-1">
                                Deuda Tricount & Equity
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Transactions Log */}
            <h2 className="text-xl font-bold tracking-tight mt-8">Movimientos Recientes</h2>
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Concepto</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Cuenta Afectada</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        Cargando movimientos...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No hay movimientos recientes.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {tx.concept}
                                        </td>
                                        <td className="px-4 py-3">
                                            {tx.category}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {tx.financial_accounts?.name || 'Desconocida'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {tx.type === 'income' ? <span className="text-green-600 flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" /> Ingreso</span> :
                                                tx.type === 'expense' ? <span className="text-red-600 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> Egreso</span> :
                                                    tx.type === 'capital_injection' ? <span className="text-blue-600 flex items-center"><PiggyBank className="w-3 h-3 mr-1" /> Aportación</span> :
                                                        <span className="text-gray-600 flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> Transferencia</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            <span className={tx.type === 'expense' ? 'text-red-500' : 'text-green-600'}>
                                                {tx.type === 'expense' ? '-' : '+'}${tx.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <FinancialTransactionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchData}
                accounts={accounts}
            />
        </div>
    )
}
