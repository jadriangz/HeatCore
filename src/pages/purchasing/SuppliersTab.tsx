import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function SuppliersTab() {
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        contact_email: '',
        contact_phone: '',
        terms: '',
        notes: ''
    })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    async function fetchSuppliers() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setSuppliers(data || [])
        } catch (error: any) {
            console.error('Error fetching suppliers:', error)
            alert('Error al cargar proveedores')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSaveSupplier() {
        if (!formData.name.trim()) {
            alert('El nombre de la empresa es obligatorio')
            return
        }

        setIsSaving(true)
        try {
            if (formData.id) {
                // Edit existing
                const { error } = await supabase
                    .from('suppliers')
                    .update({
                        name: formData.name,
                        contact_email: formData.contact_email,
                        contact_phone: formData.contact_phone,
                        terms: formData.terms,
                        notes: formData.notes
                    })
                    .eq('id', formData.id)

                if (error) throw error
                alert('Proveedor actualizado exitosamente')
            } else {
                // Create new
                const { error } = await supabase
                    .from('suppliers')
                    .insert({
                        name: formData.name,
                        contact_email: formData.contact_email,
                        contact_phone: formData.contact_phone,
                        terms: formData.terms,
                        notes: formData.notes
                    })

                if (error) throw error
                alert('Proveedor creado exitosamente')
            }

            setIsCreateOpen(false)
            resetForm()
            fetchSuppliers()
        } catch (error: any) {
            console.error('Error saving supplier:', error)
            alert('Error al guardar proveedor: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteSupplier(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return

        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id)

            if (error) {
                // Integrity constraint violation if POs are assigned
                if (error.code === '23503') {
                    throw new Error('No se puede eliminar el proveedor porque tiene órdenes de compra asociadas.')
                }
                throw error
            }

            alert('Proveedor eliminado exitosamente')
            fetchSuppliers()
        } catch (error: any) {
            console.error('Error deleting supplier:', error)
            alert(error.message)
        }
    }

    function openEditDialog(supplier: any) {
        setFormData({
            id: supplier.id,
            name: supplier.name || '',
            contact_email: supplier.contact_email || '',
            contact_phone: supplier.contact_phone || '',
            terms: supplier.terms || '',
            notes: supplier.notes || ''
        })
        setIsCreateOpen(true)
    }

    function resetForm() {
        setFormData({ id: '', name: '', contact_email: '', contact_phone: '', terms: '', notes: '' })
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_email && s.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex gap-2 w-full max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proveedor..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-brand-red hover:bg-red-700 text-white gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Nuevo Proveedor</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{formData.id ? 'Editar Proveedor' : 'Registrar Proveedor'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-xs">Empresa *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Ej. Distribuidora TCG"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right text-xs">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right text-xs">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="terms" className="text-right text-xs">Términos</Label>
                                <Input
                                    id="terms"
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Ej. Crédito 30 días"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="notes" className="text-right text-xs mt-3">Notas</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveSupplier} disabled={isSaving} className="bg-brand-red hover:bg-red-700 text-white">
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : formData.id ? 'Actualizar' : 'Guardar Proveedor'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Términos</TableHead>
                                <TableHead className="text-right">Registro</TableHead>
                                <TableHead className="text-right w-[80px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No se encontraron proveedores.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((sup) => (
                                    <TableRow key={sup.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                {sup.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{sup.contact_email}</div>
                                            <div className="text-xs text-muted-foreground">{sup.contact_phone}</div>
                                        </TableCell>
                                        <TableCell>{sup.terms || '-'}</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {format(new Date(sup.created_at), "d MMM yyyy", { locale: es })}
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
                                                    <DropdownMenuItem onClick={() => openEditDialog(sup)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteSupplier(sup.id)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
