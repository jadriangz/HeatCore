import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
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
import UserSettings from '@/pages/settings/UserSettings'
import Shipments from '@/pages/Shipments'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route index element={<ManualPOS />} />
                            <Route path="sales" element={<Sales />} />
                            <Route path="packing" element={<Packing />} />
                            <Route path="customers" element={<Customers />} />
                            <Route path="purchasing" element={<Purchasing />} />
                            <Route path="receiving" element={<Receiving />} />
                            <Route path="shipments" element={<Shipments />} />
                            <Route path="inventory" element={<InventoryPage />} />
                            <Route path="inventory/audit" element={<AuditScreen />} />
                            <Route path="inventory/log" element={<InventoryLog />} />
                            <Route path="settings" element={<SettingsLayout />}>
                                <Route index element={<div className="p-4">General Settings (Coming Soon)</div>} />
                                <Route path="users" element={<UserSettings />} />
                                <Route path="inventory" element={<InventorySettings />} />
                                <Route path="shipping" element={<div className="p-4">Shipping Settings (Coming Soon)</div>} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
