function toggleMode() {
    document.body.classList.toggle("dark-mode");
    const modeToggle = document.getElementById("modeToggle");
    modeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

window.onload = function () {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDarkScheme) {
        document.body.classList.add("dark-mode");
        document.getElementById("modeToggle").textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        document.getElementById("modeToggle").textContent = "🌙";
    }

    document.getElementById("modeToggle").addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetNames = ["Flowers", "Flowers To Be Ordered"];

    const fetchPromises = sheetNames.map(sheetName => {
        const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
        return fetch(url).then(response => response.text());
    });

    Promise.all(fetchPromises)
        .then(results => {
            let combinedRows = [];
            results.forEach(data => {
                const json = JSON.parse(data.substring(47, data.length - 2));
                if (json.table && json.table.rows) {
                    combinedRows = combinedRows.concat(json.table.rows);
                }
            });

            let stockData = [];
            let brands = {};
            let packSizes = new Set();

            combinedRows.forEach(row => {
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
                
                if ([stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica].includes("Unknown")) {
                    return;
                }

                const gap = (parseFloat(pricePG) !== parseFloat(gapPricePG)) ? "Yes" : "No";

                stockData.push({
                    stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, irradiation, pricePG, gapPricePG, gap
                });

            if (brand && brand !== "Unknown") {
            const brandLowerCase = brand.toLowerCase();
            if (!brands[brandLowerCase]) {
            brands[brandLowerCase] = brand;
    }
}

            if (packSize && packSize !== "Unknown") {
                packSizes.add(packSize);
            }
        });

        stockData.sort((a, b) => {
            const brandComparison = a.brand.localeCompare(b.brand);
            if (brandComparison !== 0) {
                return brandComparison;
            }
            return a.strain.localeCompare(b.strain);
        });

            function renderTable() {
                const brandFilter = document.querySelector("[data-column='brand']").value;
                const stockAvailabilityFilter = document.querySelector("[data-column='stockAvailability']").value;
                const sativaIndicaFilter = document.querySelector("[data-column='sativaIndica']").value;
                const thcFilter = document.querySelector("[data-column='thc']").value;
                const cbdFilter = document.querySelector("[data-column='cbd']").value;
                const irradiationFilter = document.querySelector("[data-column='irradiation']").value;
                const packSizeFilter = document.querySelector("[data-column='packSize']").value;
                const gapFilter = document.querySelector("[data-column='gap']").value;
                const searchFilter = document.querySelector("#search").value.toLowerCase();

                tableBody.innerHTML = "";

                stockData.forEach(stock => {
                    const brandLowerCase = stock.brand.trim().toLowerCase();
                    const matchesSearch = !searchFilter || stock.strain.toLowerCase().includes(searchFilter) || stock.brand.toLowerCase().includes(searchFilter);

                    if ((!stockAvailabilityFilter || stock.stockAvailability.trim() === stockAvailabilityFilter.trim()) &&
                        (!sativaIndicaFilter || filtersativaIndica(stock.sativaIndica, sativaIndicaFilter)) &&
                        (!brandFilter || brandLowerCase === brandFilter) &&
                        (!thcFilter || filterTHC(stock.thc, thcFilter)) &&
                        (!cbdFilter || filterCBD(stock.cbd, cbdFilter)) &&
                        (!irradiationFilter || filterIrradiation(stock.irradiation, irradiationFilter)) &&
                        (!packSizeFilter || stock.packSize.trim() === packSizeFilter.trim()) &&
                        (!gapFilter || stock.gap === gapFilter) &&
                        matchesSearch) {

                        let stockAvailabilityClass = "";
                        switch (stock.stockAvailability.trim()) {
                            case "In Stock":
                                stockAvailabilityClass = "inStock";
                                break;
                            case "Near to Expiry Date":
                                stockAvailabilityClass = "nearExpiry";
                                break;
                            case "To be Ordered":
                                stockAvailabilityClass = "toBeOrdered";
                                break;
                            case "Out Of Stock":
                                stockAvailabilityClass = "outOfStock";
                                break;
                        }

                        let row = `<tr>
                            <td class="status-cell ${stockAvailabilityClass}"><span>${stock.stockAvailability}</span></td>
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

            function filtersativaIndica(sativaIndica, filter) {
                const isSativa = /sativa|sative/i.test(sativaIndica);
                const isIndica = /indica/i.test(sativaIndica);
                const isHybrid = /hybrid/i.test(sativaIndica);

                switch (filter) {
                    case "Sativa":
                        return isSativa;
                    case "Indica":
                        return isIndica;
                    case "Hybrid":
                        return isHybrid && !isIndica && !isSativa;
                    default:
                        return true;
                }
            }

            function filterTHC(thc, filter) {
                if (filter === "") return true;
                return filter === "0-10" && thc <= 10 ||
                    filter === "10-20" && thc >= 10 && thc <= 20 ||
                    filter === "20-30" && thc >= 20 && thc <= 30 ||
                    filter === "30+" && thc >= 30;
            }

            function filterCBD(cbd, filter) {
                if (filter === "") return true;
                if (filter === "<1") {
                    return cbd === "<1";
                } else if (filter === "Balanced") {
                    return (cbd !== "<1" && cbd !== "<0.5");
                }
                return false;
            }

            function filterIrradiation(irradiation, filter) {
                if (filter === "Yes") {
                    return /E-Beam|Gamma|Beta/.test(irradiation);
                }
                if (filter === "No") {
                    return irradiation.includes("Non");
                }
                return true;
            }

            const tableBody = document.querySelector("#stockTable tbody");

            document.querySelectorAll(".filter").forEach(element => {
                element.addEventListener("change", renderTable);
                element.addEventListener("input", renderTable);
            });

            renderTable();

            Object.keys(brands).sort().forEach(brandKey => {
                const originalBrand = brands[brandKey];
                const option = document.createElement("option");
                option.value = brandKey;
                option.textContent = originalBrand;
                document.querySelector("#brand").appendChild(option);
            });

            packSizes.forEach(packSize => {
                const option = document.createElement("option");
                option.value = packSize;
                option.textContent = packSize;
                document.querySelector("#packSize").appendChild(option);
            });
        })
        .catch(error => {
            console.error("Failed to fetch or process sheet data:", error);
            const tableBody = document.querySelector("#stockTable tbody");
            tableBody.innerHTML = `<tr><td colspan="11">Error: Could not load data from the spreadsheets. Please check the console for details.</td></tr>`;
        });
};