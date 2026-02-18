import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ORIGIN_CONFIG } from "./config.ts"

const ENVIA_API_TOKEN = Deno.env.get('ENVIA_API_KEY')
const ENVIA_URL = "https://api.envia.com/ship/rate"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { destination, items } = await req.json()

        if (!destination || !items) {
            throw new Error('Missing destination or items')
        }

        // 1. Prepare Payload for Envia
        const payload = {
            origin: {
                name: ORIGIN_CONFIG.name,
                company: ORIGIN_CONFIG.company,
                email: ORIGIN_CONFIG.email,
                phone: ORIGIN_CONFIG.phone,
                street: ORIGIN_CONFIG.street,
                number: ORIGIN_CONFIG.number,
                district: ORIGIN_CONFIG.district,
                city: ORIGIN_CONFIG.city,
                state: ORIGIN_CONFIG.state,
                postalCode: ORIGIN_CONFIG.postalCode,
                country: ORIGIN_CONFIG.country
            },
            destination: {
                ...destination, // User provided: street, number, city, state, postalCode, country
                currency: "MXN"
            },
            packages: items.map((item: any) => ({
                content: item.name || "TCG Product",
                amount: 1, // Start simple: 1 box per item line? No, need logic.
                // For TCG, we can assume a small box or envelope if not specified is complicated.
                // Let's assume a default box for the whole order for now if items don't have dims.
                type: "box",
                dimensions: {
                    length: item.length || 10,
                    width: item.width || 10,
                    height: item.height || 1
                },
                weight: item.weight || 1
            }))
        }

        // Simplify package logic: 1 package containing total weight
        // Envia charges by dimensional weight anyway.
        const totalWeight = items.reduce((sum: number, item: any) => sum + (item.weight || 0.1) * item.quantity, 0)
        // Basic heuristics:
        // < 1kg -> Small Box
        // > 1kg -> Medium Box
        const finalPackage = {
            content: "TCG Collectibles",
            amount: 1,
            type: "box",
            dimensions: {
                length: 15,
                width: 15,
                height: 5 // Default small box
            },
            weight: totalWeight < 0.1 ? 0.1 : totalWeight
        }

        // Override payload packages to single consolidated package
        payload.packages = [finalPackage]

        console.log("Calling Envia API with:", JSON.stringify(payload))

        const response = await fetch(ENVIA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ENVIA_API_TOKEN}`
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()
        console.log("Envia Response:", JSON.stringify(data))

        if (!response.ok) {
            throw new Error(data.meta?.message || 'Error fetching rates from Envia')
        }

        if (!data.data) {
            console.error("Envia API returned unexpected format:", JSON.stringify(data))
            throw new Error('Envia API Error: ' + JSON.stringify(data))
        }

        // 2. Filter and Format Response
        const rates = data.data.map((quote: any) => ({
            carrier: quote.carrier,
            service: quote.service,
            price: quote.totalPrice,
            currency: quote.currency,
            deliveryDate: quote.deliveryEstimate,
            logo: quote.carrierLogo // If available
        })).sort((a: any, b: any) => a.price - b.price)

        return new Response(JSON.stringify(rates), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
