import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Loader2, Plus, Trash2, Edit2, Check, X } from "lucide-react"

type CatalogItem = {
    id: string
    catalog_group: string
    name: string
    internal_code: string
    is_active: boolean
}

export default function InventorySettings() {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<CatalogItem[]>([])
    const [newItemName, setNewItemName] = useState('')
    const [activeGroup, setActiveGroup] = useState('product_category')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

    const catalogGroups = [
        { id: 'product_category', label: 'Categorías' },
        { id: 'product_type', label: 'Tipos de Producto' },
        { id: 'tcg_set', label: 'Sets / Expansiones (TCG)' }
    ]

    useEffect(() => {
        fetchCatalogs()
    }, [])

    async function fetchCatalogs() {
        setLoading(true)
        const { data, error } = await supabase
            .from('system_catalogs')
            .select('*')
            .order('catalog_group', { ascending: true })
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching catalogs:', error)
        } else {
            setItems(data || [])
        }
        setLoading(false)
    }

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault()
        if (!newItemName.trim()) return

        // Auto-generate internal_code (lowercase, spaces to underscores)
        const internalCode = newItemName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')

        const { error } = await supabase
            .from('system_catalogs')
            .insert({
                catalog_group: activeGroup,
                name: newItemName.trim(),
                internal_code: internalCode
            })

        if (error) {
            alert('Error al agregar el elemento (El código interno podría ya existir).')
            console.error(error)
        } else {
            setNewItemName('')
            fetchCatalogs()
        }
    }

    async function handleEditSave(id: string) {
        if (!editingName.trim()) return
        const { error } = await supabase
            .from('system_catalogs')
            .update({ name: editingName.trim() })
            .eq('id', id)

        if (error) {
            console.error(error)
            alert('Error al actualizar el nombre.')
        } else {
            setEditingId(null)
            fetchCatalogs()
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar opción de la lista de selección? Los productos que ya la usen conservarán su valor en texto.')) return

        const { error } = await supabase
            .from('system_catalogs')
            .delete()
            .eq('id', id)

        if (error) {
            console.error(error)
            alert('Error al eliminar.')
        } else {
            fetchCatalogs()
        }
    }

    const filteredItems = items.filter(i => i.catalog_group === activeGroup)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Catálogos de Inventario</h3>
                <p className="text-sm text-muted-foreground">
                    Administra los menús desplegables disponibles al crear y editar productos.
                </p>
            </div>

            <div className="flex gap-2 border-b pb-4">
                {catalogGroups.map(group => (
                    <Button
                        key={group.id}
                        variant={activeGroup === group.id ? 'default' : 'outline'}
                        onClick={() => setActiveGroup(group.id)}
                        className={activeGroup === group.id ? 'bg-brand-red hover:bg-brand-red/90' : ''}
                    >
                        {group.label}
                    </Button>
                ))}
            </div>

            <div className="space-y-4">
                <form onSubmit={handleAddItem} className="flex gap-2">
                    <Input
                        placeholder="Nuevo Registro (Ej. Shining Fates)"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </form>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="border rounded-md divide-y">
                        {filteredItems.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No hay registros en este catálogo.
                            </div>
                        ) : (
                            filteredItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3">
                                    {editingId === item.id ? (
                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                            <Input
                                                value={editingName}
                                                onChange={e => setEditingName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                            />
                                            <Button size="sm" variant="ghost" className="text-green-600 h-8 px-2" onClick={() => handleEditSave(item.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-600 h-8 px-2" onClick={() => setEditingId(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">Código: {item.internal_code}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingId(item.id)
                                                        setEditingName(item.name)
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
