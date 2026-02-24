import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Plus, Search, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function Customers() {
    const [customers, setCustomers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        phone: '',
        street: '',
        exterior_number: '',
        interior_number: '',
        neighborhood: '',
        city: '',
        state: '',
        postal_code: ''
    })

    useEffect(() => {
        fetchCustomers()
    }, [])

    async function fetchCustomers() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCustomers(data || [])
        } catch (error: any) {
            console.error('Error fetching customers:', error)
            alert('Error al cargar clientes')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSaveCustomer() {
        if (!formData.name.trim()) {
            alert('El nombre es obligatorio')
            return
        }

        setIsSaving(true)
        try {
            if (formData.id) {
                // Edit existing
                const { error } = await supabase
                    .from('customers')
                    .update({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        street: formData.street,
                        exterior_number: formData.exterior_number,
                        interior_number: formData.interior_number,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.postal_code,
                    })
                    .eq('id', formData.id)

                if (error) throw error
                alert('Cliente actualizado exitosamente')
            } else {
                // Create new
                const { count, error: countError } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })

                if (countError) throw countError

                const nextNum = (count || 0) + 1
                const autoCode = `HC-${nextNum.toString().padStart(4, '0')}`

                const { error } = await supabase
                    .from('customers')
                    .insert({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        street: formData.street,
                        exterior_number: formData.exterior_number,
                        interior_number: formData.interior_number,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.postal_code,
                        auto_code: autoCode
                    })

                if (error) throw error
                alert('Cliente creado exitosamente')
            }

            setIsCreateOpen(false)
            resetForm()
            fetchCustomers()
        } catch (error: any) {
            console.error('Error saving customer:', error)
            alert('Error al guardar cliente: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteCustomer(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) {
                if (error.code === '23503') {
                    throw new Error('No se puede eliminar el cliente porque tiene ventas asignadas.')
                }
                throw error
            }

            alert('Cliente eliminado exitosamente')
            fetchCustomers()
        } catch (error: any) {
            console.error('Error deleting customer:', error)
            alert(error.message)
        }
    }

    function openEditDialog(customer: any) {
        setFormData({
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            street: customer.street || '',
            exterior_number: customer.exterior_number || '',
            interior_number: customer.interior_number || '',
            neighborhood: customer.neighborhood || '',
            city: customer.city || '',
            state: customer.state || '',
            postal_code: customer.postal_code || ''
        })
        setIsCreateOpen(true)
    }

    function resetForm() {
        setFormData({ id: '', name: '', email: '', phone: '', street: '', exterior_number: '', interior_number: '', neighborhood: '', city: '', state: '', postal_code: '' })
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.auto_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona tu red de clientes, ventas históricas y lealtad.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{formData.id ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                            <h4 className="font-semibold text-sm border-b pb-1">Información de Contacto</h4>
                            <div className="space-y-2">
                                <Label>Nombre Completo *</Label>
                                <Input
                                    placeholder="Ej. Ash Ketchum"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Correo Electrónico</Label>
                                    <Input
                                        placeholder="ash@pallet.com"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono / WhatsApp</Label>
                                    <Input
                                        placeholder="123 456 7890"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h4 className="font-semibold text-sm border-b pb-1 mt-4">Dirección de Envío</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Calle</Label>
                                    <Input placeholder="Ej. Av. Universidad" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Num. Exterior</Label>
                                    <Input placeholder="123" value={formData.exterior_number} onChange={e => setFormData({ ...formData, exterior_number: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Num. Interior</Label>
                                    <Input placeholder="Apto 4" value={formData.interior_number} onChange={e => setFormData({ ...formData, interior_number: e.target.value })} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Colonia</Label>
                                    <Input placeholder="Centro" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad / Municipio</Label>
                                    <Input placeholder="Monterrey" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Input placeholder="Nuevo León" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código Postal</Label>
                                    <Input placeholder="64000" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} maxLength={5} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveCustomer} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {formData.id ? 'Guardar Cambios' : 'Guardar Cliente'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Directorio de Clientes</CardTitle>
                    <CardDescription>
                        Todos los clientes registrados en HeatCore.
                    </CardDescription>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre, código o correo..."
                            className="pl-8 max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
                            <Users className="mx-auto h-12 w-12 mb-3 opacity-20" />
                            <p>No se encontraron clientes activos.</p>
                            {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')}>Limpiar búsqueda</Button>}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead className="text-right">Compras (Histórico)</TableHead>
                                        <TableHead className="text-right">Total Gastado</TableHead>
                                        <TableHead className="text-right">Registro</TableHead>
                                        <TableHead className="text-right w-[80px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-mono text-xs font-semibold">{customer.auto_code}</TableCell>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">{customer.email || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{customer.phone || '-'}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{customer.total_purchases} orden(es)</TableCell>
                                            <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                                ${(customer.total_spent || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {format(new Date(customer.created_at), "dd MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteCustomer(customer.id)}
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
