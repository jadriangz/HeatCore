# HeatCore - Logistics & Order Management System

HeatCore is a modern, modular ERP built specifically for TCG (Trading Card Game) operations. The core objective of HeatCore is to manage inventory with zero overselling, track shipments with high accuracy (integrating Envia.com), manage Point of Sale (POS) operations, and handle procurement and purchasing.

## Tech Stack
*   **Frontend**: React (Vite) + TypeScript
*   **Styling**: Tailwind CSS + Shadcn UI
*   **Backend & DB**: Supabase (PostgreSQL + RPCs + Edge Functions)
*   **Hosting**: Vercel (Frontend), Supabase (Backend)
*   **Logistics API**: Envia.com

---

## Current Scope & Completed Modules (As of Feb 2026)

### 1. Unified Inventory Dashboard
*   **Full CRUD**: Registration of End-Consumer Products, Operational Supplies (Boxes, Bubble Wrap), and Assets.
*   **Smart Views**: Fast filtering and stock visualization.
*   **Audit Logger**: Internal adjustments and cycle counts.

### 2. Manual Point of Sale (POS)
*   **Checkout Flow**: Cart state, tax toggles, and payment options.
*   **Logistics Flag**: Instantly determine if an order requires shipping or local delivery.
*   **Customer Linkage**: Link sales to specific CRM profiles.

### 3. CRM & Customers 
*   **Customer Profiles**: Basic tracking of contact data, loyalty codes, and purchase history.

### 4. Packing & Fulfillment (Logística)
*   **Barcode Scanning**: Anti-error verification system ensuring exactly the right products are packed.
*   **Supply Deduction**: Selection of Box/Label/Wrap deducts from raw materials and calculates the *Unit Cost Snapshot* for accurate financial logs.
*   **Shipping Quoting**: (In Progress via Edge Functions) Connecting with Envia to fetch live rates.

### 5. Procurement & Receptions
*   **Supplier Directory**: Simple management of external vendors.
*   **Purchase Orders (POs)**: Create and track supply/product orders.
*   **Smart Receiving**: Validate received goods against POs.
*   **Financial Integrity**: Calculates dynamically the **Weighted Average Cost (Costo Promedio Ponderado)** upon receiving new inventory, updating the asset value accurately. 

### 6. Advanced Logistics & Tracking
*   **Dimensional Weight Support**: Product dimensions and weights are accurately captured and calculated to provide exact volumetric weight for shipping carriers via edge functions.
*   **Shipments Dashboard**: Centralized view for all generated shipping labels and tracking numbers.

### 7. Security & Authentication
*   **Google OAuth & Email**: Managed strictly via Supabase Auth.
*   **PostgreSQL Hooks**: Custom `Before User Created` hook implements a Waitlist system. Only users pre-approved into the `authorized_users` table can successfully register.
*   **Row Level Security (RLS)**: Enforced policies to prevent anonymous queries and strictly scope data modifications to `authenticated` users.

---

## Next Steps / Upcoming Phases

### 1. Marketing & Social Analytics
*   Create automated Edge Functions to fetch daily KPI snapshots from TikTok/Youtube APIs.
*   Build a visual dashboard (`/social`) to centralize audience metrics against sales trends.

### 3. External API Integrations (Backlog)
*   **Envia.com**: Transition the `create-shipment` edge function from mock mode to live API calls for real-time label generation and carrier sync.
*   **Shopify**: Reconfigure bidirectional inventory and product sync, and set up webhooks for unfulfilled order ingestion.
*   **TikTok Shop**: Integrate TikTok Shop API for automated order ingestion and specialized TCG-set stock synchronization.

---

## Developer Guide
To start the application locally:
```bash
npm install
npm run dev
```
Env vars required: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

