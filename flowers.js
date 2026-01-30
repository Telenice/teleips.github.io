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
    const sheetNames = ["Flowers", "Flowers To Be Ordered"];
    const PROXY_URL = "https://proxy.tele-b8d.workers.dev/";

    let allStockData = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc';

    function filterSativaIndica(val, filter) {
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
            irradiation: document.getElementById("irradiation")?.value || "",
            pack: document.getElementById("packSize")?.value || "",
            gap: document.getElementById("gap")?.value || ""
        };

        tableBody.innerHTML = "";
        allStockData.forEach(s => {
            const mSearch = !f.search || s.strain.toLowerCase().includes(f.search) || s.brand.toLowerCase().includes(f.search);
            const mStock = !f.stock || s.stockAvailability === f.stock;
            const mBrand = !f.brand || s.brand.toLowerCase() === f.brand.toLowerCase();
            const mPack = !f.pack || s.packSize === f.pack;
            const mGap = !f.gap || s.gap === f.gap;
            const mTHC = filterTHC(s.thc, f.thc);
            const mCBD = filterCBD(s.cbd, f.cbd);
            const mType = filterSativaIndica(s.sativaIndica, f.type);

            if (mSearch && mStock && mBrand && mPack && mGap && mTHC && mCBD && mType) {
                let sClass = "outOfStock";
                if (s.stockAvailability === "In Stock") sClass = "inStock";
                else if (s.stockAvailability === "To be Ordered") sClass = "toBeOrdered";
                else if (s.stockAvailability === "Near to Expiry Date") sClass = "nearExpiry";

                tableBody.innerHTML += `<tr>
                    <td class="status-cell ${sClass}"><span>${s.stockAvailability}</span></td>
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
                vA = parseFloat(vA) || 0; vB = parseFloat(vB) || 0;
            } else {
                vA = vA.toString().toLowerCase(); vB = vB.toString().toLowerCase();
            }
            return currentSortDirection === 'asc' ? (vA < vB ? -1 : 1) : (vA > vB ? -1 : 1);
        });
        renderTable();
    }

    const fetchPromises = sheetNames.map(name => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}`;
        return fetch(PROXY_URL + "?url=" + encodeURIComponent(url)).then(r => r.text());
    });

    Promise.all(fetchPromises).then(results => {
        let brands = {}, packSizes = new Set();
        const extract = (t) => JSON.parse(t.substring(t.indexOf('{'), t.lastIndexOf('}') + 1));
        
        const parse = (rows) => {
            let data = [];
            if (!rows) return data;
            rows.forEach(r => {
                if (!r.c || r.c.length < 3) return;
                const av = (r.c[1]?.v || "").toString().trim();
                const br = (r.c[2]?.v || "").toString().trim();
                if (br === "Brand" || av === "Stock Availability") return;
                const item = {
                    stockAvailability: av, brand: br, thc: r.c[3]?.v || 0, cbd: r.c[4]?.v || 0,
                    strain: (r.c[5]?.v || "").toString().trim(), packSize: (r.c[6]?.v || "").toString().trim(),
                    sativaIndica: r.c[7]?.v || "Unknown", irradiation: r.c[8]?.v || "Unknown",
                    pricePG: r.c[9]?.v || 0, gapPricePG: r.c[10]?.v || 0, gap: (r.c[9]?.v !== r.c[10]?.v) ? "Yes" : "No"
                };
                if (item.brand && item.brand !== "Unknown") {
                    data.push(item);
                    brands[item.brand.toLowerCase()] = item.brand;
                    if (item.packSize) packSizes.add(item.packSize);
                }
            });
            return data;
        };

        const f1 = parse(extract(results[0]).table.rows);
        const f2 = parse(extract(results[1]).table.rows);
        allStockData = f1.concat(f2);

        document.querySelectorAll(".filter").forEach(el => {
            el.addEventListener("input", renderTable);
            el.addEventListener("change", renderTable);
        });

        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => sortData(th.dataset.sort));
        });

        const bSel = document.getElementById("brand");
        Object.keys(brands).sort().forEach(k => bSel.add(new Option(brands[k], k)));

        const pSel = document.getElementById("packSize");
        Array.from(packSizes).sort((a,b) => parseFloat(a)-parseFloat(b)).forEach(p => pSel.add(new Option(p, p)));

        renderTable();
    });
};