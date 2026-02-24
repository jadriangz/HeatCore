import { supabase } from './src/lib/supabase'

async function test() {
    const [poRes, recRes] = await Promise.all([
        supabase.from('purchase_orders')
            .select('*, suppliers(name)')
            .neq('status', 'Received')
            .order('created_at', { ascending: false }),
        supabase.from('receptions')
            .select('*, purchase_orders(po_number)')
            .order('created_at', { ascending: false })
    ])
    console.log('PO ERROR:', poRes.error);
    console.log('REC ERROR:', recRes.error);
}

test()
