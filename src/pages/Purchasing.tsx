import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ShoppingBag } from "lucide-react"
import SuppliersTab from "./purchasing/SuppliersTab"
import PurchaseOrdersTab from "./purchasing/PurchaseOrdersTab"

export default function Purchasing() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Compras (Procurement)</h1>
                <p className="text-muted-foreground mt-2">
                    Gestiona proveedores y órdenes de compra para reabastecimiento.
                </p>
            </div>

            <Tabs defaultValue="po" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="po" className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Órdenes de Compra
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Proveedores
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="po" className="mt-0">
                    <PurchaseOrdersTab />
                </TabsContent>
                <TabsContent value="suppliers" className="mt-0">
                    <SuppliersTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
