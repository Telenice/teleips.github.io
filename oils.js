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
    const sheetName = "Oils";
    // FIX: Added encodeURIComponent for robust fetching
    const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            const json = JSON.parse(data.substring(47, data.length - 2));
            const rows = json.table.rows;
            const tableBody = document.querySelector("#stockTable tbody");

            let stockData = [];
            // NEW: Using a Set for simple, unique brand collection
            let brandSet = new Set();
            let packSizes = new Set();

            rows.forEach(row => {
                if (!row || !row.c) return;

                const stockAvailability = row.c[1]?.v || "Unknown";
                const brand = (row.c[2]?.v || "Unknown").trim();
                const thc = parseFloat(row.c[3]?.v) || 0;
                const cbd = row.c[4]?.v || "Unknown";
                const strain = row.c[5]?.v || "Unknown";
                const packSize = (row.c[6]?.v || "Unknown").toString().trim();
                const sativaIndica = row.c[7]?.v || "Unknown";
                const pricePG = row.c[9]?.v || "Unknown";
                const gapPricePG = row.c[10]?.v || "Unknown";

                if ([stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, pricePG, gapPricePG].includes("Unknown")) {
                    return;
                }

                stockData.push({
                    stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, pricePG, gapPricePG
                });

                // NEW: Simplified brand collection
                if (brand && brand !== "Unknown") {
                    brandSet.add(brand);
                }

                if (packSize && packSize !== "Unknown") {
                    packSizes.add(packSize);
                }
            });
            
            // NEW: Sort the data by Brand, then by Strain
            stockData.sort((a, b) => {
                const brandComparison = a.brand.localeCompare(b.brand);
                if (brandComparison !== 0) return brandComparison;
                return a.strain.localeCompare(b.strain);
            });

            function renderTable() {
                const stockAvailabilityFilter = document.querySelector("[data-column='stockAvailability']").value;
                const brandFilter = document.querySelector("[data-column='brand']").value;
                const packSizeFilter = document.querySelector("[data-column='packSize']").value;
                const searchFilter = document.querySelector("#search").value.toLowerCase();

                tableBody.innerHTML = "";

                stockData.forEach(stock => {
                    const matchesSearch = !searchFilter || stock.strain.toLowerCase().includes(searchFilter) || stock.brand.toLowerCase().includes(searchFilter);

                    // FIX: Simplified, direct comparison for brand filter
                    if ((!stockAvailabilityFilter || stock.stockAvailability.trim() === stockAvailabilityFilter.trim()) &&
                        (!brandFilter || stock.brand === brandFilter) &&
                        (!packSizeFilter || stock.packSize === packSizeFilter) &&
                        matchesSearch) {

                        let stockAvailabilityClass = "";
                        switch (stock.stockAvailability.trim()) {
                            case "In Stock": stockAvailabilityClass = "inStock"; break;
                            case "Near to Expiry Date": stockAvailabilityClass = "nearExpiry"; break;
                            case "To be Ordered": stockAvailabilityClass = "toBeOrdered"; break;
                            case "Out Of Stock": stockAvailabilityClass = "outOfStock"; break;
                        }

                        // FIX: Added <span> for status pill styling
                        let row = `<tr>
                            <td class="status-cell ${stockAvailabilityClass}"><span>${stock.stockAvailability}</span></td>
                            <td>${stock.brand}</td>
                            <td>${stock.thc}</td>
                            <td>${stock.cbd}</td>
                            <td>${stock.strain}</td>
                            <td>${stock.packSize}</td>
                            <td>${stock.sativaIndica}</td>
                            <td>${stock.pricePG}</td>
                            <td>${stock.gapPricePG}</td>
                        </tr>`;

                        tableBody.innerHTML += row;
                    }
                });
            }

            document.querySelectorAll(".filter").forEach(element => {
                element.addEventListener("change", renderTable);
                element.addEventListener("input", renderTable);
            });

            renderTable();

            // NEW: Populate dropdown from the simple Set
            const brandDropdown = document.querySelector("#brand");
            [...brandSet].sort().forEach(brand => {
                const option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandDropdown.appendChild(option);
            });

            const packSizeDropdown = document.querySelector("#packSize");
            [...packSizes].sort((a, b) => a - b).forEach(packSize => {
                const option = document.createElement("option");
                option.value = packSize;
                option.textContent = packSize;
                packSizeDropdown.appendChild(option);
            });
        });
};