        // Function to toggle between light and dark modes
        function toggleMode() {
            document.body.classList.toggle("dark-mode");
            const modeToggle = document.getElementById("modeToggle");
            if (document.body.classList.contains("dark-mode")) {
                modeToggle.textContent = "☀️"; // Sun icon for light mode
            } else {
                modeToggle.textContent = "🌙"; // Moon icon for dark mode
            }
        }

        // Check the cookie when the page loads to apply the preferred theme
        window.onload = function () {
            // Check system's theme preference on page load
            const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

            // Apply dark mode if the system preference is dark
            if (prefersDarkScheme) {
                document.body.classList.add("dark-mode");
                document.getElementById("modeToggle").textContent = "☀️";  // Change button text to sun for dark mode
            } else {
                document.body.classList.remove("dark-mode");
                document.getElementById("modeToggle").textContent = "🌙";  // Change button text to moon for light mode
            }

            // Set event listener for the toggle button
            document.getElementById("modeToggle").addEventListener("click", toggleMode);

            // Fetch and display data from Google Sheets
            const sheetID = "15sxwI1IGcYTz-SC9bY0dO2ipEUGVW-_O";
            const sheetName = "Vapes, Pastilles and Capsules";
            const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

            fetch(url)
                .then(response => response.text())
                .then(data => {
                    const json = JSON.parse(data.substring(47, data.length - 2));
                    const rows = json.table.rows;
                    const tableBody = document.querySelector("#stockTable tbody");

                    let stockData = [];
                    let brands = {};  // Use an object to store brands with their lowercase version as key
                    let packSizes = new Set();

                    rows.forEach(row => {
                        const stockAvailability = row.c[1]?.v || "Unknown";
                        const brand = row.c[2]?.v || "Unknown";
                        const thc = parseFloat(row.c[3]?.v) || 0;
                        const cbd = row.c[4]?.v || "Unknown";
                        const strain = row.c[5]?.v || "Unknown";
                        const packSize = (row.c[6]?.v || "Unknown").toString().trim();
                        const sativaIndica = row.c[7]?.v || "Unknown";
                        const pricePG = row.c[9]?.v || "Unknown";
                        const gapPricePG = row.c[10]?.v || "Unknown";
                        const t21PricePG = row.c[11]?.v || "Unknown";

                        if ([stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, pricePG, gapPricePG, t21PricePG].includes("Unknown")) {
                            return;
                        }

                        stockData.push({
                            stockAvailability, brand, thc, cbd, strain, packSize, sativaIndica, pricePG, gapPricePG, t21PricePG
                        });

                        // Normalize brand to lowercase and store the original brand name
                        if (brand && brand !== "Unknown") {
                            const brandLowerCase = brand.toLowerCase();
                            if (!brands[brandLowerCase]) {
                                brands[brandLowerCase] = brand; // Store the original brand name with the lowercase as key
                            }
                        }

                        if (packSize && packSize !== "Unknown") {
                            packSizes.add(packSize);
                        }
                    });

                    function renderTable() {
                        const stockAvailabilityFilter = document.querySelector("[data-column='stockAvailability']").value;
                        const brandFilter = document.querySelector("[data-column='brand']").value;
                        const packSizeFilter = document.querySelector("[data-column='packSize']").value;

                        tableBody.innerHTML = "";

                        stockData.forEach(stock => {
                            // Make both brand and brandFilter lowercase for case-insensitive comparison
                            const brandLowerCase = stock.brand.trim().toLowerCase();
                            const brandFilterLowerCase = brandFilter.trim().toLowerCase();

                            if ((!stockAvailabilityFilter || stock.stockAvailability.trim() === stockAvailabilityFilter.trim()) &&
                                (!brandFilter || brandLowerCase === brandFilterLowerCase) &&  // Case-insensitive comparison
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
                        <td>${stock.pricePG}</td>
                        <td>${stock.gapPricePG}</td>
                        <td>${stock.t21PricePG}</td>
                    </tr>`;

                                tableBody.innerHTML += row;
                            }
                        });
                    }

                    document.querySelectorAll(".filter").forEach(select => {
                        select.addEventListener("change", renderTable);
                    });

                    renderTable();

                    // Add brand options to the dropdown with original case
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