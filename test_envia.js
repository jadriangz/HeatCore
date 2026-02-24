const payload = {
    origin: {
        name: "Bodega A",
        company: "Bodega A",
        email: "jesusadrian.garza@gmail.com",
        phone: "6672110604",
        street: "De los Eucaliptos",
        number: "996",
        district: "La campiña",
        city: "Culiacán",
        state: "SI",
        postalCode: "80060",
        country: "MX"
    },
    destination: {
        name: "Test Name",
        email: "test@test.com",
        phone: "8180000000",
        street: "Conocida",
        number: "1",
        district: "Centro",
        city: "Monterrey",
        state: "NU",
        postalCode: "80000",
        country: "MX"
    },
    packages: [
        {
            content: "TCG Product",
            amount: 1,
            type: "box",
            dimensions: {
                length: 15,
                width: 15,
                height: 5
            },
            weight: 1,
            insurance: 0,
            declaredValue: 0,
            weightUnit: "KG",
            lengthUnit: "CM"
        }
    ],
    shipment: {
        carrier: "fedex",
        type: 1
    },
    settings: {
        printFormat: "PDF",
        printSize: "STOCK_4X6",
        comments: ""
    }
};

async function testExact() {
    const ENVIA_API_TOKEN = "b43ccee138472e87d32060a5f616217bb28f5fe195fccd7cda503e0760407e66";
    const ENVIA_URL = "https://api.envia.com/ship/rate/";
    try {
        const response = await fetch(ENVIA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ENVIA_API_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("STATUS:", response.status);
        if (data.error) console.log("ERROR:", data.error.message);
        else console.log("SUCCESS:", data.data.length, "rates");
    } catch (e) {
        console.error(e);
    }
}
testExact();
