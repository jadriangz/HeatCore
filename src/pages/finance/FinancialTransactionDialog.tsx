import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from '@/contexts/AuthContext'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    accounts: any[]
}

export function FinancialTransactionDialog({ open, onOpenChange, onSuccess, accounts }: Props) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [txType, setTxType] = useState('expense') // 'expense', 'income', 'capital_injection', 'transfer'

    // Form state
    const [amount, setAmount] = useState('')
    const [concept, setConcept] = useState('')
    const [category, setCategory] = useState('')
    const [accountId, setAccountId] = useState('')
    const [provider, setProvider] = useState('')

    // Catalogs
    const [expenseCategories, setExpenseCategories] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            fetchCatalogs()
            // Reset form
            setAmount('')
            setConcept('')
            setCategory('')
            setAccountId('')
            setProvider('')
        }
    }, [open])

    async function fetchCatalogs() {
        const { data } = await supabase
            .from('system_catalogs')
            .select('*')
            .eq('catalog_group', 'expense_category')
            .order('name')
        if (data) setExpenseCategories(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !concept || !accountId || !category) return alert("Llena todos los campos obligatorios")

        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) return alert("El monto debe ser mayor a 0")

        setLoading(true)
        try {
            // Depending on TxType, we insert into financial_transactions and potentially operational_expenses
            // Income / Capital Injection
            if (txType === 'income' || txType === 'capital_injection') {
                const { error } = await supabase.from('financial_transactions').insert({
                    account_id: accountId,
                    type: txType,
                    amount: numAmount,
                    category: category,
                    concept: concept,
                    logged_by: user?.id
                })
                if (error) throw error
            }
            // Expense
            else if (txType === 'expense') {
                // Determine if this expense was paid by a company account or a partner wallet
                // If paid by partner wallet, it creates a debt from company to partner (Tricount).
                // But the ledger needs a transaction. We log it against the account that paid.
                const { data: tx, error: txError } = await supabase.from('financial_transactions').insert({
                    account_id: accountId,
                    type: 'expense',
                    amount: numAmount, // We keep the amount positive in DB, the 'type' implies negativity
                    category: category,
                    concept: concept,
                    logged_by: user?.id
                }).select().single()

                if (txError) throw txError

                // Detailed Expense Log
                const { error: expError } = await supabase.from('operational_expenses').insert({
                    transaction_id: tx.id,
                    amount: numAmount,
                    concept: concept,
                    category: category,
                    supplier_name: provider || null,
                    paid_from_account_id: accountId
                })
                if (expError) throw expError
            }
            // Transfer (Liquidación a Socios)
            else if (txType === 'transfer') {
                // Requires a source and destination, simplified for now: just log two transactions.
                // In a future robust version we can link them, for now let's just use expense/income.
                alert("Transferencias directas vendrán en la V2. Por ahora registra un Ingreso o Egreso.")
                return;
            }

            // SUCCESS
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error creating transaction:", error)
            alert("Error: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter accounts based on txType context
    // If it's an expense, anyone can pay for it (Bank, Cash, Partner Wallet)
    // If it's capital_injection, money goes INTO the company (Bank, Cash)
    // If it's income, it goes INTO the company
    const availableAccounts = accounts.filter(acc => {
        if (txType === 'income' || txType === 'capital_injection') {
            return acc.type !== 'partner_wallet' // Incomes go to the company, not to partner wallets
        }
        return true // Expenses can be paid from anywhere
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Movimiento Financiero</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label>Tipo de Movimiento</Label>
                        <Select value={txType} onValueChange={(val) => {
                            setTxType(val)
                            setAccountId('') // reset account as available ones might change
                            setCategory('')
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Egreso (Gasto Operativo)</SelectItem>
                                <SelectItem value="income">Ingreso Extraordinario</SelectItem>
                                <SelectItem value="capital_injection">Aportación de Capital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monto ($)</Label>
                            <Input
                                type="number" step="0.01" min="0.01" required
                                placeholder="0.00"
                                value={amount} onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Concepto</Label>
                        <Input
                            placeholder={txType === 'expense' ? 'Ej. Pizza para inventario' : txType === 'capital_injection' ? 'Ej. Inversión Inicial' : 'Ej. Venta en evento'}
                            required
                            value={concept} onChange={e => setConcept(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {txType === 'expense' ? (
                                    expenseCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))
                                ) : txType === 'capital_injection' ? (
                                    <SelectItem value="Aportación de Socios">Aportación de Socios</SelectItem>
                                ) : (
                                    <>
                                        <SelectItem value="Ventas">Ventas</SelectItem>
                                        <SelectItem value="Otros Ingresos">Otros Ingresos</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{(txType === 'income' || txType === 'capital_injection') ? 'Cuenta de Ingreso (A dónde entra)' : 'Cuenta de Origen (Quién pagó)'}</Label>
                        <Select value={accountId} onValueChange={setAccountId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableAccounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name} {acc.type === 'partner_wallet' ? '(Socio)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {txType === 'expense' && (
                        <div className="space-y-2">
                            <Label>Proveedor (Opcional)</Label>
                            <Input
                                placeholder="Ej. Amazon, CFE, Facebook"
                                value={provider} onChange={e => setProvider(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
