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
                name: destination.name || "Cliente HeatCore",
                company: destination.company || "HeatCore",
                email: destination.email || "test@test.com",
                phone: destination.phone || "8180000000",
                street: destination.street || "Conocida",
                number: destination.number || "int 1",
                district: destination.district || "Centro",
                city: destination.city || "Monterrey", // Consider that actual rate accuracy might not need exact city match if postalCode is right for Envia rates, but they are required string fields
                state: (destination.state || "NL").substring(0, 2).toUpperCase(), // Required by Envia, strictly max 2 chars
                postalCode: destination.postalCode,
                country: destination.country || "MX",
                category: 1, // 1 for b2c usually
                currency: "MXN"
            },
            packages: items.map((item: any) => ({
                content: item.name || "TCG Product",
                amount: 1,
                type: "box",
                dimensions: {
                    length: item.length || 15,
                    width: item.width || 15,
                    height: item.height || 5
                },
                weight: item.weight || 1,
                insurance: 0,
                declaredValue: 0,
                weightUnit: "KG",
                lengthUnit: "CM"
            })),
            shipment: {
                carrier: "fedex",
                type: 1
            },
            settings: {
                printFormat: "PDF",
                printSize: "STOCK_4X6",
                comments: ""
            }
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
            weight: totalWeight < 0.1 ? 0.1 : totalWeight,
            insurance: 0,
            declaredValue: 0,
            weightUnit: "KG",
            lengthUnit: "CM"
        }

        // Override payload packages to single consolidated package
        payload.packages = [finalPackage]

        console.log("Calling Envia API with:", JSON.stringify(payload))

        const response = await fetch(ENVIA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ENVIA_API_TOKEN}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify(payload)
        })

        const textStatus = response.status
        const textData = await response.text()
        console.log("Envia Status:", textStatus)
        console.log("Envia Raw Response:", textData)

        let data
        try {
            data = JSON.parse(textData)
        } catch (e) {
            throw new Error(`Envia returned Non-JSON Error [${textStatus}]: ` + textData)
        }

        if (!response.ok) {
            throw new Error(data.meta?.message || JSON.stringify(data.error) || JSON.stringify(data.messages) || JSON.stringify(data))
        }

        if (!data.data) {
            console.error("Envia API returned unexpected format:", textData)
            throw new Error('Envia API Error Format: ' + textData)
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
