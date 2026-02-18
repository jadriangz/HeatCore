import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env.local
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
} catch (e) {
    console.log("Could not load .env.local")
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials")
    process.exit(1)
}

async function testShipping() {
    console.log("Testing Shipping Rates Function (Raw Fetch)...")
    const url = `${supabaseUrl}/functions/v1/shipping-rates`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            destination: {
                postalCode: "80000",
                country: "MX"
            },
            items: [
                { name: "Booster Box", quantity: 1, weight: 1 }
            ]
        })
    })

    // Try to parse JSON, fall back to text
    try {
        const data = await response.json()
        console.log("Status:", response.status)
        console.log("Body:", JSON.stringify(data, null, 2))
    } catch (e) {
        const text = await response.text()
        console.log("Status:", response.status)
        console.log("Body (Text):", text)
    }
}

testShipping()
