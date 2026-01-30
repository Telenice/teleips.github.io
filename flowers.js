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
            .then(response => {
                if (!response.ok) throw new Error('Network error via Proxy');
                return response.text();
            });
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
        const valText = cbd.toString().toLowerCase();
        if (filter === "<1") return valText.includes("<1") || valText.includes("<0.5") || parseFloat(cbd) < 1;
        if (filter === "Balanced") return parseFloat(cbd) >= 1 && !valText.includes("<");
        return true;
    }

    function filterIrradiation(val, filter) {
        if (!filter) return true;
        const isNon = val.toLowerCase().includes("non");
        return filter === "Yes" ? !isNon : isNon;
    }

    Promise.all(fetchPromises)
        .then(results => {
            let brands = {};
            let packSizes = new Set();
            let allStockData = [];

            const extractJSON = (text) => {
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                if (start === -1) throw new Error("Google returned an invalid format. Check if the sheet is 'Published to the Web'.");
                return JSON.parse(text.substring(start, end + 1));
            };

            const parseSheetData = (rows) => {
                let parsedData = [];
                if (!rows) return parsedData;
                rows.forEach(row => {
                    if (!row.c || !row.c[2]) return;

                    const item = {
                        stockAvailability: row.c[1]?.v || "Unknown",
                        brand: (row.c[2]?.v || "Unknown").trim(),
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

            const flowers = parseSheetData(extractJSON(results[0]).table.rows);
            const toOrder = parseSheetData(extractJSON(results[1]).table.rows);
            allStockData = flowers.concat(toOrder);

            const tableBody = document.querySelector("#stockTable tbody");

            function renderTable() {
                if (!tableBody) return;

                const f = {
                    search: document.getElementById("search")?.value.toLowerCase() || "",
                    stock: document.getElementById("stockAvailability")?.value || "",
                    brand: document.getElementById("brand")?.value || "",
                    type: document.getElementById("sativaIndica")?.value || "",
                    thc: document.getElementById("thc")?.value || "",
                    cbd: document.getElementById("cbd")?.value || "",
                    irradiation: document.getElementById("irradiation")?.value || "",
                    pack: document.getElementById("packSize")?.value || "",
                    gap: document.getElementById("gap")?.value || ""
                };

                tableBody.innerHTML = "";

                allStockData.forEach(s => {
                    const matchesSearch = !f.search || 
                        s.strain.toLowerCase().includes(f.search) || 
                        s.brand.toLowerCase().includes(f.search);

                    const matchesStock = !f.stock || s.stockAvailability === f.stock;
                    const matchesBrand = !f.brand || s.brand.toLowerCase() === f.brand.toLowerCase();
                    const matchesPack = !f.pack || s.packSize === f.pack;
                    const matchesGap = !f.gap || s.gap === f.gap;

                    const matchesTHC = filterTHC(s.thc, f.thc);
                    const matchesCBD = filterCBD(s.cbd, f.cbd);
                    const matchesType = filtersativaIndica(s.sativaIndica, f.type);
                    const matchesIrradiation = filterIrradiation(s.irradiation, f.irradiation);

                    if (matchesSearch && matchesStock && matchesBrand && matchesPack && matchesGap && matchesTHC && matchesCBD && matchesType && matchesIrradiation) {
                        
                        let statusClass = "outOfStock";
                        const availability = s.stockAvailability.trim();
                        if (availability === "In Stock") statusClass = "inStock";
                        else if (availability === "To be Ordered") statusClass = "toBeOrdered";
                        else if (availability === "Near to Expiry Date") statusClass = "nearExpiry";

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

            document.querySelectorAll(".filter").forEach(el => {
                el.addEventListener("input", renderTable);
                el.addEventListener("change", renderTable);
            });

            const brandSelect = document.getElementById("brand");
            Object.keys(brands).sort().forEach(k => {
                const opt = new Option(brands[k], k);
                if(brandSelect) brandSelect.add(opt);
            });

            const packSelect = document.getElementById("packSize");
            Array.from(packSizes).sort((a,b) => parseFloat(a) - parseFloat(b)).forEach(p => {
                const opt = new Option(p, p);
                if(packSelect) packSelect.add(opt);
            });

            renderTable();
        })
        .catch(err => {
            console.error("Critical Failure:", err);
            const tableBody = document.querySelector("#stockTable tbody");
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="10">Error loading data: ${err.message}. Ensure sheet is 'Published to the Web'.</td></tr>`;
        });
};