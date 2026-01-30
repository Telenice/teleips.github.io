function toggleMode() {
    const body = document.body;
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    
    const modeToggle = document.getElementById("modeToggle");
    if (modeToggle) modeToggle.textContent = isDark ? "☀️" : "🌙";

    const safariMeta = document.getElementById("safari-theme");
    if (safariMeta) {
        safariMeta.setAttribute("content", isDark ? "#121212" : "#f8f9fa");
    }
}

window.onload = function () {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const modeToggle = document.getElementById("modeToggle");
    const safariMeta = document.getElementById("safari-theme");
    
    if (prefersDark) {
        document.body.classList.add("dark-mode");
        if (modeToggle) modeToggle.textContent = "☀️";
        if (safariMeta) safariMeta.setAttribute("content", "#121212");
    }

    if (modeToggle) modeToggle.addEventListener("click", toggleMode);

    const sheetID = "1H1GtXBtISAGYE54dK8466HEK1h_d9cmC";
    const sheetName = "Vapes, Pastilles and Capsules";
    const PROXY_URL = "https://proxy.tele-b8d.workers.dev/";

    let allStockData = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc';

    function normalizeNA(val) {
        if (val === null || val === undefined || val === "") return "N/A";
        const clean = val.toString().trim().toLowerCase();
        if (clean === "noapplicable" || clean === "not applicable" || clean === "n/a" || clean === "unknown") {
            return "N/A";
        }
        return val;
    }

    function filtersativaIndica(val, filter) {
        if (!filter) return true;
        const text = val.toLowerCase();
        if (filter === "Sativa") return text.includes("sativa");
        if (filter === "Indica") return text.includes("indica");
        if (filter === "Hybrid") return text.includes("hybrid") && !text.includes("sativa") && !text.includes("indica");
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
            pack: document.getElementById("packSize")?.value || ""
        };

        tableBody.innerHTML = "";
        allStockData.forEach(s => {
            const mSearch = !f.search || s.strain.toLowerCase().includes(f.search) || s.brand.toLowerCase().includes(f.search);
            const mStock = !f.stock || s.stockAvailability === f.stock;
            const mBrand = !f.brand || s.brand === f.brand;
            const mPack = !f.pack || s.packSize === f.pack;
            const mType = filtersativaIndica(s.sativaIndica, f.type);

            if (mSearch && mStock && mBrand && mPack && mType) {
                let sClass = "outOfStock";
                if (s.stockAvailability === "In Stock") sClass = "inStock";
                else if (s.stockAvailability === "To be Ordered") sClass = "toBeOrdered";
                else if (s.stockAvailability === "Near to Expiry Date") sClass = "nearExpiry";

                tableBody.innerHTML += `<tr>
                    <td class="status-cell ${sClass}"><span>${s.stockAvailability}</span></td>
                    <td>${normalizeNA(s.brand)}</td>
                    <td>${normalizeNA(s.thc)}</td>
                    <td>${normalizeNA(s.cbd)}</td>
                    <td>${normalizeNA(s.strain)}</td>
                    <td>${normalizeNA(s.packSize)}</td>
                    <td>${normalizeNA(s.sativaIndica)}</td>
                    <td>${normalizeNA(s.pricePG)}</td>
                    <td>${normalizeNA(s.gapPricePG)}</td>
                </tr>`;
            }
        });
    }

    function sortData(col) {
        if (currentSortColumn === col) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = col;
            currentSortDirection = 'asc';
        }

        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === col) th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        });

        allStockData.sort((a, b) => {
            let vA = a[col], vB = b[col];
            if (['thc', 'pricePG', 'gapPricePG'].includes(col)) {
                vA = parseFloat(vA.toString().replace(/[^\d.-]/g, '')) || 0;
                vB = parseFloat(vB.toString().replace(/[^\d.-]/g, '')) || 0;
            } else {
                vA = vA.toString().toLowerCase(); vB = vB.toString().toLowerCase();
            }
            return currentSortDirection === 'asc' ? (vA < vB ? -1 : 1) : (vA > vB ? -1 : 1);
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
                const av = (row.c[1]?.v || "").toString().trim();
                const br = (row.c[2]?.v || "").toString().trim();
                if (br === "Brand" || av === "Stock Availability") return;

                const item = {
                    stockAvailability: av, brand: br, thc: row.c[3]?.v || 0, cbd: row.c[4]?.v || 0,
                    strain: (row.c[5]?.v || "").toString().trim(), packSize: (row.c[6]?.v || "").toString().trim(),
                    sativaIndica: row.c[7]?.v || "Unknown", pricePG: row.c[9]?.v || 0, gapPricePG: row.c[10]?.v || 0
                };

                allStockData.push(item);
                if (item.brand && normalizeNA(item.brand) !== "N/A") brandSet.add(item.brand);
                if (item.packSize && normalizeNA(item.packSize) !== "N/A") packSet.add(item.packSize);
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