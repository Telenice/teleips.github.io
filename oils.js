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
        if (modeToggle) modeToggle.textContent = "☀️";
    }
    if (modeToggle) modeToggle.addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetName = "Oils";
    const PROXY_URL = "https://proxy.tele-b8d.workers.dev/";

    let allStockData = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc';

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
        if (filter === "<1") return valText.includes("<1") || parseFloat(cbd) < 1;
        if (filter === "Balanced") return parseFloat(cbd) >= 1 && !valText.includes("<");
        return true;
    }

    function renderTable() {
        const tableBody = document.querySelector("#stockTable tbody");
        if (!tableBody) return;

        const f = {
            search: document.getElementById("search")?.value.toLowerCase() || "",
            stock: document.getElementById("stockAvailability")?.value || "",
            brand: document.getElementById("brand")?.value || "",
            type: document.getElementById("sativaIndica")?.value || "",
            thc: document.getElementById("thc")?.value || "",
            cbd: document.getElementById("cbd")?.value || "",
            pack: document.getElementById("packSize")?.value || ""
        };

        tableBody.innerHTML = "";
        allStockData.forEach(s => {
            const matchesSearch = !f.search || s.strain.toLowerCase().includes(f.search) || s.brand.toLowerCase().includes(f.search);
            const matchesStock = !f.stock || s.stockAvailability === f.stock;
            const matchesBrand = !f.brand || s.brand === f.brand;
            const matchesPack = !f.pack || s.packSize === f.pack;
            const matchesType = filtersativaIndica(s.sativaIndica, f.type);
            const matchesTHC = filterTHC(s.thc, f.thc);
            const matchesCBD = filterCBD(s.cbd, f.cbd);

            if (matchesSearch && matchesStock && matchesBrand && matchesPack && matchesType && matchesTHC && matchesCBD) {
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
                    <td>${s.pricePG}</td>
                    <td>${s.gapPricePG}</td>
                </tr>`;
            }
        });
    }

    function sortData(column) {
        if (currentSortColumn === column) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            currentSortDirection = 'asc';
        }

        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === column) {
                th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });

        allStockData.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
            if (['thc', 'pricePG', 'gapPricePG'].includes(column)) {
                valA = parseFloat(valA.toString().replace(/[^\d.-]/g, '')) || 0;
                valB = parseFloat(valB.toString().replace(/[^\d.-]/g, '')) || 0;
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }
            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        renderTable();
    }

    const googleUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    fetch(PROXY_URL + "?url=" + encodeURIComponent(googleUrl))
        .then(res => res.text())
        .then(data => {
            const extractJSON = (t) => JSON.parse(t.substring(t.indexOf('{'), t.lastIndexOf('}') + 1));
            const json = extractJSON(data);
            const rows = json.table.rows;

            let brandSet = new Set();
            let packSet = new Set();

            rows.forEach(row => {
                if (!row.c || row.c.length < 3) return;
                const availText = (row.c[1]?.v || "").toString().trim();
                const brandText = (row.c[2]?.v || "").toString().trim();
                if (brandText === "Brand" || availText === "Stock Availability") return;

                const item = {
                    stockAvailability: availText,
                    brand: brandText,
                    thc: row.c[3]?.v || 0,
                    cbd: row.c[4]?.v || 0,
                    strain: (row.c[5]?.v || "").toString().trim(),
                    packSize: (row.c[6]?.v || "").toString().trim(),
                    sativaIndica: row.c[7]?.v || "Unknown",
                    pricePG: row.c[9]?.v || 0,
                    gapPricePG: row.c[10]?.v || 0
                };

                if (item.brand && item.brand !== "Unknown") {
                    allStockData.push(item);
                    brandSet.add(item.brand);
                    if (item.packSize) packSet.add(item.packSize);
                }
            });

            document.querySelectorAll(".filter").forEach(el => {
                el.addEventListener("input", renderTable);
                el.addEventListener("change", renderTable);
            });

            document.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => sortData(th.dataset.sort));
            });

            const brandSelect = document.getElementById("brand");
            [...brandSet].sort().forEach(b => brandSelect.add(new Option(b, b)));

            const packSelect = document.getElementById("packSize");
            [...packSet].sort((a,b) => parseFloat(a) - parseFloat(b)).forEach(p => packSelect.add(new Option(p, p)));

            renderTable();
        });
};