        function toggleMode() {
            document.body.classList.toggle("dark-mode");
            const modeToggle = document.getElementById("modeToggle");
            if (document.body.classList.contains("dark-mode")) {
                modeToggle.textContent = "☀️";
            } else {
                modeToggle.textContent = "🌙";
            }
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

            const sheetID = "15sxwI1IGcYTz-SC9bY0dO2ipEUGVW-_O";
            const sheetName = "Flowers";
            const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
            
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    const json = JSON.parse(data.substring(47, data.length - 2));
                    const rows = json.table.rows;
                    const tableBody = document.querySelector("#stockTable tbody");

                    let stockData = [];
                    let brands = {}; 
                    let packSizes = new Set();

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
                        const t21PricePG = row.c[11]?.v || "Unknown";

                        if ([stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, pricePG, gapPricePG, t21PricePG].includes("Unknown")) {
                            return;
                        }

                        stockData.push({
                            stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, irradiation, pricePG, gapPricePG, t21PricePG
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

                    function renderTable() {
                        const stockAvailabilityFilter = document.querySelector("[data-column='stockAvailability']").value;
                        const brandFilter = document.querySelector("[data-column='brand']").value;
                        const thcFilter = document.querySelector("[data-column='thc']").value;
                        const cbdFilter = document.querySelector("[data-column='cbd']").value;
                        const irradiationFilter = document.querySelector("[data-column='irradiation']").value;
                        const packSizeFilter = document.querySelector("[data-column='packSize']").value;

                        tableBody.innerHTML = "";

                        stockData.forEach(stock => {
                            const brandLowerCase = stock.brand.trim().toLowerCase();
                            const brandFilterLowerCase = brandFilter.trim().toLowerCase();

                            if ((!stockAvailabilityFilter || stock.stockAvailability.trim() === stockAvailabilityFilter.trim()) &&
                                (!brandFilter || brandLowerCase === brandFilterLowerCase) && 
                                (!thcFilter || filterTHC(stock.thc, thcFilter)) &&
                                (!cbdFilter || filterCBD(stock.cbd, cbdFilter)) &&
                                (!irradiationFilter || filterIrradiation(stock.irradiation, irradiationFilter)) &&
                                (!packSizeFilter || stock.packSize.trim() === packSizeFilter.trim())) {

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
                        <td class="status-cell ${stockAvailabilityClass}">${stock.stockAvailability}</td>
                        <td>${stock.brand}</td>
                        <td>${stock.thc}</td>
                        <td>${stock.cbd}</td>
                        <td>${stock.strain}</td>
                        <td>${stock.packSize}</td>
                        <td>${stock.sativaIndica}</td>
                        <td>${stock.irradiation}</td>
                        <td>${stock.pricePG}</td>
                        <td>${stock.gapPricePG}</td>
                        <td>${stock.t21PricePG}</td>
                    </tr>`;

                                tableBody.innerHTML += row;
                            }
                        });
                    }


                    function filterTHC(thc, filter) {
                        if (filter === "") return true;
                        return filter === "0-10" && thc <= 10 ||
                            filter === "10-20" && thc > 10 && thc <= 20 ||
                            filter === "20-30" && thc > 20 && thc <= 30 ||
                            filter === "30+" && thc > 30;
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

                    document.querySelectorAll(".filter").forEach(select => {
                        select.addEventListener("change", renderTable);
                    });

                    renderTable();

                    Object.values(brands).forEach(brand => {
                        const option = document.createElement("option");
                        option.value = brand;
                        option.textContent = brand;
                        document.querySelector("#brand").appendChild(option);
                    });

                    packSizes.forEach(packSize => {
                        const option = document.createElement("option");
                        option.value = packSize;
                        option.textContent = packSize;
                        document.querySelector("#packSize").appendChild(option);
                    });
                });

        };

        function toggleMode() {
            document.body.classList.toggle("dark-mode");
            const mode = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
            document.getElementById("modeToggle").textContent = mode;
        }