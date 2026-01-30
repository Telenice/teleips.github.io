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
    }

    if(modeToggle) modeToggle.addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetNames = ["Flowers", "Flowers To Be Ordered"];
    const PROXY_URL = "https://proxy.tele-b8d.workers.dev/"; 

    const fetchPromises = sheetNames.map(sheetName => {
        const googleUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        return fetch(PROXY_URL + "?url=" + encodeURIComponent(googleUrl))
            .then(response => response.text());
    });

    function filtersativaIndica(val, filter) {
        if (!filter) return true;
        const text = val.toLowerCase();
        if (filter === "Sativa") return text.includes("sativa");
        if (filter === "Indica") return text.includes("indica");
        if (filter === "Hybrid") return text.includes("hybrid") && !text.includes("sativa") && !text.includes("indica");
        return true;
    }

    function filterTHC(thc, filter) {
        if (!filter) return true;
        const val = parseFloat(thc);
        if (filter === "0-10") return val <= 10;
        if (filter === "10-20") return val > 10 && val <= 20;
        if (filter === "20-30") return val > 20 && val <= 30;
        if (filter === "30+") return val > 30;
        return true;
    }

    function filterCBD(cbd, filter) {
        if (!filter) return true;
        if (filter === "<1") return cbd.toString().includes("<1") || parseFloat(cbd) < 1;
        if (filter === "Balanced") return parseFloat(cbd) >= 1 && !cbd.toString().includes("<");
        return true;
    }

    function filterIrradiation(val, filter) {
        if (!filter) return true;
        return filter === "Yes" ? !val.toLowerCase().includes("non") : val.toLowerCase().includes("non");
    }

    Promise.all(fetchPromises)
        .then(results => {
            let brands = {};
            let packSizes = new Set();

            const extractJSON = (text) => {
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                return JSON.parse(text.substring(start, end + 1));
            };

            const parseSheetData = (rows) => {
                let parsedData = [];
                if (!rows) return parsedData;
                rows.forEach(row => {
                    const item = {
                        stockAvailability: row.c[1]?.v || "Unknown",
                        brand: row.c[2]?.v || "Unknown",
                        thc: row.c[3]?.v || 0,
                        cbd: row.c[4]?.v || 0,
                        strain: row.c[5]?.v || "Unknown",
                        packSize: (row.c[6]?.v || "").toString().trim(),
                        sativaIndica: row.c[7]?.v || "Unknown",
                        irradiation: row.c[8]?.v || "Unknown",
                        pricePG: row.c[9]?.v || 0,
                        gapPricePG: row.c[10]?.v || 0,
                        gap: (row.c[9]?.v !== row.c[10]?.v) ? "Yes" : "No"
                    };
                    if (item.brand !== "Unknown") {
                        parsedData.push(item);
                        brands[item.brand.toLowerCase()] = item.brand;
                        if(item.packSize) packSizes.add(item.packSize);
                    }
                });
                return parsedData;
            };

            let stockData = parseSheetData(extractJSON(results[0]).table.rows);
            const toOrder = parseSheetData(extractJSON(results[1]).table.rows);
            stockData = stockData.concat(toOrder);

            const tableBody = document.querySelector("#stockTable tbody");

            function renderTable() {
                const f = {
                    search: document.querySelector("#search").value.toLowerCase(),
                    stock: document.querySelector("#stockAvailability").value,
                    brand: document.querySelector("#brand").value,
                    type: document.querySelector("#sativaIndica").value,
                    thc: document.querySelector("#thc").value,
                    cbd: document.querySelector("#cbd").value,
                    irradiation: document.querySelector("#irradiation").value,
                    pack: document.querySelector("#packSize").value,
                    gap: document.querySelector("#gap").value
                };

                tableBody.innerHTML = "";

                stockData.forEach(s => {
                    const matches = 
                        (s.strain.toLowerCase().includes(f.search) || s.brand.toLowerCase().includes(f.search)) &&
                        (!f.stock || s.stockAvailability === f.stock) &&
                        (!f.brand || s.brand.toLowerCase() === f.brand.toLowerCase()) &&
                        (!f.pack || s.packSize === f.pack) &&
                        (!f.gap || s.gap === f.gap) &&
                        filterTHC(s.thc, f.thc) &&
                        filterCBD(s.cbd, f.cbd) &&
                        filterIrradiation(s.irradiation, f.irradiation) &&
                        filtersativaIndica(s.sativaIndica, f.type);

                    if (matches) {

                        let statusClass = "outOfStock";
                        if (s.stockAvailability === "In Stock") statusClass = "inStock";
                        else if (s.stockAvailability === "To be Ordered") statusClass = "toBeOrdered";
                        else if (s.stockAvailability === "Near to Expiry Date") statusClass = "nearExpiry";

                        tableBody.innerHTML += `<tr>
                            <td class="status-cell ${statusClass}"><span>${s.stockAvailability}</span></td>
                            <td>${s.brand}</td>
                            <td>${s.thc}</td>
                            <td>${s.cbd}</td>
                            <td>${s.strain}</td>
                            <td>${s.packSize}</td>
                            <td>${s.sativaIndica}</td>
                            <td>${s.irradiation}</td>
                            <td>${s.pricePG}</td>
                            <td>${s.gapPricePG}</td>
                        </tr>`;
                    }
                });
            }

            document.querySelectorAll(".filter").forEach(el => el.addEventListener("input", renderTable));

            Object.keys(brands).sort().forEach(k => {
                const opt = new Option(brands[k], k);
                document.querySelector("#brand").add(opt);
            });
            Array.from(packSizes).sort((a,b)=>a-b).forEach(p => {
                const opt = new Option(p, p);
                document.querySelector("#packSize").add(opt);
            });

            renderTable();
        })
        .catch(err => {
            console.error(err);
            document.querySelector("#stockTable tbody").innerHTML = `<tr><td colspan="10">Error loading data.</td></tr>`;
        });
};