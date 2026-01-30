function toggleMode() {
    document.body.classList.toggle("dark-mode");
    const modeToggle = document.getElementById("modeToggle");
    modeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

window.onload = function () {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const modeToggle = document.getElementById("modeToggle");
    
    if (prefersDarkScheme) {
        document.body.classList.add("dark-mode");
        if(modeToggle) modeToggle.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if(modeToggle) modeToggle.textContent = "🌙";
    }

    if(modeToggle) modeToggle.addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetNames = ["Flowers", "Flowers To Be Ordered"];

    const PROXY_URL = "https://proxy.tele-b8d.workers.dev/"; 

    const fetchPromises = sheetNames.map(sheetName => {
        const googleUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        return fetch(PROXY_URL + "?url=" + encodeURIComponent(googleUrl))
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            });
    });

    Promise.all(fetchPromises)
        .then(results => {
            let brands = {};
            let packSizes = new Set();

            const extractJSON = (text) => {
                try {
                    const start = text.indexOf('{');
                    const end = text.lastIndexOf('}');
                    if (start === -1 || end === -1) throw new Error("Invalid JSON format from Google");
                    const jsonString = text.substring(start, end + 1);
                    return JSON.parse(jsonString);
                } catch (e) {
                    console.error("Parsing error on text:", text);
                    throw e;
                }
            };

            const jsonFlowers = extractJSON(results[0]);
            const jsonToBeOrdered = extractJSON(results[1]);

            const parseSheetData = (rows) => {
                let parsedData = [];
                if (!rows) return parsedData;

                rows.forEach(row => {
                    const stockAvailability = row.c[1]?.v || "Unknown";
                    const brand = row.c[2]?.v || "Unknown";
                    const thc = parseFloat(row.c[3]?.v) || 0;
                    const cbd = row.c[4]?.v || "Unknown";
                    const strain = row.c[5]?.v || "Unknown";
                    const packSize = (row.c[6]?.v || "Unknown").toString().trim();
                    const sativaIndica = row.c[7]?.v || "Unknown";
                    const irradiation = row.c[8]?.v || "Unknown";
                    const pricePG = row.c[9]?.v || "Unknown";
                    const gapPricePG = row.c[10]?.v || "Unknown";
                    
                    if ([stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica].includes("Unknown")) return;

                    const gap = (parseFloat(pricePG) !== parseFloat(gapPricePG)) ? "Yes" : "No";

                    const stockItem = {
                        stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, irradiation, pricePG, gapPricePG, gap
                    };
                    parsedData.push(stockItem);

                    if (brand && brand !== "Unknown") {
                        const brandLowerCase = brand.toLowerCase();
                        if (!brands[brandLowerCase]) brands[brandLowerCase] = brand;
                    }
                    if (packSize && packSize !== "Unknown") packSizes.add(packSize);
                });
                return parsedData;
            };

            let flowersData = parseSheetData(jsonFlowers.table?.rows);
            const toBeOrderedData = parseSheetData(jsonToBeOrdered.table?.rows);

            toBeOrderedData.forEach(itemToInsert => {
                const brandToFind = itemToInsert.brand;
                const lastIndex = flowersData.map(item => item.brand).lastIndexOf(brandToFind);
                if (lastIndex !== -1) {
                    flowersData.splice(lastIndex + 1, 0, itemToInsert);
                } else {
                    flowersData.push(itemToInsert);
                }
            });

            const stockData = flowersData;
            const tableBody = document.querySelector("#stockTable tbody");

            function renderTable() {
                if (!tableBody) return;

                const filters = {
                    brand: document.querySelector("[data-column='brand']")?.value,
                    stock: document.querySelector("[data-column='stockAvailability']")?.value,
                    type: document.querySelector("[data-column='sativaIndica']")?.value,
                    search: document.querySelector("#search")?.value.toLowerCase()
                };

                tableBody.innerHTML = "";

                stockData.forEach(stock => {
                    const matchesSearch = !filters.search ||
                        stock.strain.toLowerCase().includes(filters.search) ||
                        stock.brand.toLowerCase().includes(filters.search);

                    const matchesBrand = !filters.brand || stock.brand.toLowerCase() === filters.brand.toLowerCase();
                    const matchesStock = !filters.stock || stock.stockAvailability === filters.stock;

                    const matchesType = !filters.type || filtersativaIndica(stock.sativaIndica, filters.type);

                    if (matchesSearch && matchesBrand && matchesStock && matchesType) {

                        let statusClass = "outOfStock";
                        const availability = stock.stockAvailability.trim();
                        if (availability === "In Stock") statusClass = "inStock";
                        else if (availability === "To be Ordered") statusClass = "toBeOrdered";
                        else if (availability === "Near to Expiry Date") statusClass = "nearExpiry";

                        let row = `<tr>
                <td class="status-cell ${statusClass}"><span>${stock.stockAvailability}</span></td>
                <td>${stock.brand}</td>
                <td>${stock.thc}</td>
                <td>${stock.cbd}</td>
                <td>${stock.strain}</td>
                <td>${stock.packSize}</td>
                <td>${stock.sativaIndica}</td>
                <td>${stock.irradiation}</td>
                <td>${stock.pricePG}</td>
                <td>${stock.gapPricePG}</td>
            </tr>`;
                        tableBody.innerHTML += row;
                    }
                });
            }

            renderTable();

            const brandSelect = document.querySelector("#brand");
            if (brandSelect) {
                Object.keys(brands).sort().forEach(brandKey => {
                    const option = document.createElement("option");
                    option.value = brandKey;
                    option.textContent = brands[brandKey];
                    brandSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error("Critical Failure:", error);
            const tableBody = document.querySelector("#stockTable tbody");
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="11">Error: ${error.message}</td></tr>`;
        });
};