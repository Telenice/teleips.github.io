function toggleMode() {
    document.body.classList.toggle("dark-mode");
    const modeToggle = document.getElementById("modeToggle");
    const isDark = document.body.classList.contains("dark-mode");
    modeToggle.textContent = isDark ? "☀️" : "🌙";

    const safariMeta = document.getElementById("safari-theme");
    if (safariMeta) {
        safariMeta.setAttribute("content", isDark ? "#121212" : "#f8f9fa");
    }
}

window.onload = function () {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const modeToggle = document.getElementById("modeToggle");
    const safariMeta = document.getElementById("safari-theme");

    if (prefersDarkScheme) {
        document.body.classList.add("dark-mode");
        if (modeToggle) modeToggle.textContent = "☀️";
        if (safariMeta) safariMeta.setAttribute("content", "#121212");
    } else {
        document.body.classList.remove("dark-mode");
        if (modeToggle) modeToggle.textContent = "🌙";
        if (safariMeta) safariMeta.setAttribute("content", "#f8f9fa");
    }

    if (modeToggle) modeToggle.addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetNames = ["Flowers", "Flowers To Be Ordered"];

    const fetchPromises = sheetNames.map(sheetName => {
        const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
        return fetch(url).then(response => response.text());
    });

    Promise.all(fetchPromises)
        .then(results => {
            let brands = {};
            let packSizes = new Set();
            let stockData = [];

            const parseSheetData = (rows) => {
                let parsedData = [];
                if (!rows) return parsedData;

                rows.forEach(row => {
                    if (!row.c || row.c.length < 3) return;

                    const stockAvailability = (row.c[1]?.v || "").toString().trim();
                    const brand = (row.c[2]?.v || "").toString().trim();

                    if (brand === "Brand" || stockAvailability === "Stock Availability" || brand === "Unknown") {
                        return;
                    }

                    const thc = parseFloat(row.c[3]?.v) || 0;
                    const cbd = row.c[4]?.v || "Unknown";
                    const strain = row.c[5]?.v || "Unknown";
                    const packSize = (row.c[6]?.v || "Unknown").toString().trim();
                    const sativaIndica = row.c[7]?.v || "Unknown";
                    const irradiation = row.c[8]?.v || "Unknown";
                    const pricePG = row.c[9]?.v || "Unknown";
                    const gapPricePG = row.c[10]?.v || "Unknown";
                    
                    const gap = (parseFloat(pricePG) !== parseFloat(gapPricePG)) ? "Yes" : "No";

                    parsedData.push({
                        stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, irradiation, pricePG, gapPricePG, gap
                    });

                    const brandLowerCase = brand.toLowerCase();
                    if (!brands[brandLowerCase]) {
                        brands[brandLowerCase] = brand;
                    }

                    if (packSize && packSize !== "Unknown") {
                        packSizes.add(packSize);
                    }
                });
                return parsedData;
            };

            const jsonFlowers = JSON.parse(results[0].substring(47, results[0].length - 2));
            const jsonToBeOrdered = JSON.parse(results[1].substring(47, results[1].length - 2));

            let flowersData = parseSheetData(jsonFlowers.table?.rows);
            const toBeOrderedData = parseSheetData(jsonToBeOrdered.table?.rows);

            toBeOrderedData.forEach(item => {
                const lastIndex = flowersData.map(f => f.brand).lastIndexOf(item.brand);
                if (lastIndex !== -1) flowersData.splice(lastIndex + 1, 0, item);
                else flowersData.push(item);
            });

            stockData = flowersData;

            let currentSortColumn = null;
            let currentSortDirection = 'asc';

            function sortData(column) {
                if (currentSortColumn === column) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = column;
                    currentSortDirection = 'asc';
                }

                document.querySelectorAll('th.sortable').forEach(th => {
                    th.classList.remove('sort-asc', 'sort-desc');
                    if (th.dataset.sort === column) th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                });

                stockData.sort((a, b) => {
                    let valA = a[column], valB = b[column];
                    if (['thc', 'pricePG', 'gapPricePG'].includes(column)) {
                        valA = parseFloat(valA.toString().replace(/[^\d.-]/g, '')) || 0;
                        valB = parseFloat(valB.toString().replace(/[^\d.-]/g, '')) || 0;
                    }
                    if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
                renderTable();
            }

            document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => sortData(th.dataset.sort)));

            function renderTable() {
                const f = {
                    brand: document.querySelector("#brand").value,
                    stock: document.querySelector("#stockAvailability").value,
                    type: document.querySelector("#sativaIndica").value,
                    thc: document.querySelector("#thc").value,
                    cbd: document.querySelector("#cbd").value,
                    irr: document.querySelector("#irradiation").value,
                    pack: document.querySelector("#packSize").value,
                    gap: document.querySelector("#gap").value,
                    search: document.querySelector("#search").value.toLowerCase()
                };

                const tableBody = document.querySelector("#stockTable tbody");
                tableBody.innerHTML = "";

                stockData.forEach(stock => {
                    const matchesSearch = !f.search || stock.strain.toLowerCase().includes(f.search) || stock.brand.toLowerCase().includes(f.search);
                    if ((!f.stock || stock.stockAvailability === f.stock) &&
                        (!f.brand || stock.brand.toLowerCase() === f.brand) &&
                        (!f.type || filtersativaIndica(stock.sativaIndica, f.type)) &&
                        (!f.thc || filterTHC(stock.thc, f.thc)) &&
                        (!f.cbd || filterCBD(stock.cbd, f.cbd)) &&
                        (!f.irr || filterIrradiation(stock.irradiation, f.irr)) &&
                        (!f.pack || stock.packSize === f.pack) &&
                        (!f.gap || stock.gap === f.gap) && matchesSearch) {

                        let sClass = "";
                        switch (stock.stockAvailability.trim()) {
                            case "In Stock": sClass = "inStock"; break;
                            case "Near to Expiry Date": sClass = "nearExpiry"; break;
                            case "To be Ordered": sClass = "toBeOrdered"; break;
                            case "Out Of Stock": sClass = "outOfStock"; break;
                        }

                        tableBody.innerHTML += `<tr>
                            <td class="status-cell ${sClass}"><span>${stock.stockAvailability}</span></td>
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
                    }
                });
            }

            function filtersativaIndica(val, f) {
                if (f === "Sativa") return /sativa/i.test(val);
                if (f === "Indica") return /indica/i.test(val);
                if (f === "Hybrid") return /hybrid/i.test(val) && !/indica|sativa/i.test(val);
                return true;
            }

            function filterTHC(val, f) {
                if (f === "0-10") return val <= 10;
                if (f === "10-20") return val > 10 && val <= 20;
                if (f === "20-30") return val > 20 && val <= 30;
                if (f === "30+") return val >= 30;
                return true;
            }

            function filterCBD(val, f) {
                if (f === "<1") return /<1|1|<0.5/.test(val);
                if (f === "Balanced") return !/<1|<0.5|1/.test(val);
                return true;
            }

            function filterIrradiation(val, f) {
                if (f === "Yes") return /E-Beam|Gamma|Beta/i.test(val);
                return val.includes("Non");
            }

            document.querySelectorAll(".filter").forEach(el => {
                el.addEventListener("change", renderTable);
                el.addEventListener("input", renderTable);
            });

            Object.keys(brands).sort().forEach(k => {
                const opt = new Option(brands[k], k);
                document.querySelector("#brand").add(opt);
            });

            [...packSizes].sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(p => {
                const opt = new Option(p, p);
                document.querySelector("#packSize").add(opt);
            });

            renderTable();
        });
};