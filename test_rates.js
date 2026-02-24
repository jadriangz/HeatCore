const fs = require('fs');

function test() {
    fetch('https://xruotexuonsloutvmgjr.supabase.co/functions/v1/shipping-rates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydW90ZXh1b25zbG91dHZtZ2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODc0MDksImV4cCI6MjA4Njg2MzQwOX0.VaVINaVTZk8j1uSGsqcrx1eacbQaIcFBf4EuS879C5c'
        },
        body: JSON.stringify({
            destination: {
                name: "Test Name",
                email: "test@test.com",
                phone: "8180000000",
                street: "Conocida",
                number: "1",
                district: "Centro",
                city: "Monterrey",
                state: "NL",
                postalCode: "80000",
                country: "MX"
            },
            items: [
                {
                    name: "TCG Box",
                    quantity: 1,
                    weight: 1,
                    length: 10,
                    width: 10,
                    height: 10
                }
            ]
        })
    }).then(async res => {
        const text = await res.text();
        fs.writeFileSync('envia_error_full.txt', text);
        console.log("Wrote full response to envia_error_full.txt");
    }).catch(e => console.error(e))
}
test();
