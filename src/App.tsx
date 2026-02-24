import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/layouts/DashboardLayout'
import ManualPOS from '@/pages/ManualPOS'
import InventoryPage from '@/pages/Inventory'
import InventoryLog from '@/pages/inventory/InventoryLog'
import AuditScreen from '@/pages/AuditScreen'
import Sales from '@/pages/Sales'
import Packing from '@/pages/Packing'
import Customers from '@/pages/Customers'
import Purchasing from '@/pages/Purchasing'
import Receiving from '@/pages/Receiving'
import SettingsLayout from '@/pages/settings/SettingsLayout'
import InventorySettings from '@/pages/settings/InventorySettings'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<ManualPOS />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="packing" element={<Packing />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="purchasing" element={<Purchasing />} />
                    <Route path="receiving" element={<Receiving />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="inventory/audit" element={<AuditScreen />} />
                    <Route path="inventory/log" element={<InventoryLog />} />
                    <Route path="settings" element={<SettingsLayout />}>
                        <Route index element={<div className="p-4">General Settings (Coming Soon)</div>} />
                        <Route path="inventory" element={<InventorySettings />} />
                        <Route path="shipping" element={<div className="p-4">Shipping Settings (Coming Soon)</div>} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
