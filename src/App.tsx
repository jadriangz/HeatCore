import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/layouts/DashboardLayout'
import ManualPOS from '@/pages/ManualPOS'
import InventoryPage from '@/pages/Inventory'
import AuditScreen from '@/pages/AuditScreen'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<ManualPOS />} />
                    <Route path="packing" element={<div className="p-4">Packing Dashboard (Coming Soon)</div>} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="inventory/audit" element={<AuditScreen />} />
                    <Route path="settings" element={<div className="p-4">Settings (Coming Soon)</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
