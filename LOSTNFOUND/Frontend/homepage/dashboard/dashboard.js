// DOM Element Selectors
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const reportTable = document.getElementById("reportTable");
const noResults = document.getElementById("noResults");

const totalCountEl = document.getElementById("totalCount");
const pendingCountEl = document.getElementById("pendingCount");
const approvedCountEl = document.getElementById("approvedCount");
const resolvedCountEl = document.getElementById("resolvedCount");

// Global state holding reports
let reports = [];

/**
 * 1. Fetch reports from backend API
 */
async function loadReports() {
    try {
        // Check all common token key names used in login scripts
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("jwt_token") ||
            localStorage.getItem("authToken");

        if (!token) {
            reportTable.innerHTML = "";
            noResults.style.display = "block";
            noResults.textContent = "Please log in to view your submitted reports.";
            return;
        }

        const response = await fetch("http://localhost:5000/api/items/my-reports", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const rawData = await response.json();
        const itemsArray = Array.isArray(rawData) ? rawData : (rawData.items || rawData.data || []);

        // Safely map database fields (handling verificationStatus from adminRoutes)
        reports = itemsArray.map(item => {
            const rawStatus = String(item.verificationStatus || item.status || "Pending").toLowerCase();

            // Map 'claimed' to 'Resolved' so it matches your dashboard CSS & summary card
            let displayStatus = "Pending";
            if (rawStatus === "approved") displayStatus = "Approved";
            else if (rawStatus === "rejected") displayStatus = "Rejected";
            else if (rawStatus === "resolved" || rawStatus === "claimed") displayStatus = "Resolved";

            const rawType = String(item.status || item.type || "found");
            const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();

            const rawDate = item.createdAt || item.date || item.dateLost || item.dateFound;
            const formattedDate = rawDate
                ? new Date(rawDate).toLocaleDateString("en-GB")
                : "N/A";

            return {
                name: String(item.itemName || item.title || item.name || "Unnamed Item"),
                category: String(item.category || "Other"),
                type: displayType,
                date: formattedDate,
                status: displayStatus
            };
        });

        updateSummaryCards(reports);
        renderTable(reports);

    } catch (err) {
        console.error("Error loading dashboard data:", err);
        reportTable.innerHTML = "";
        noResults.style.display = "block";
        noResults.textContent = "Could not load reports. Make sure your backend server is running on port 5000.";
    }
}

/**
 * 2. Update summary card counts
 */
function updateSummaryCards(data) {
    totalCountEl.textContent = data.length;
    pendingCountEl.textContent = data.filter(r => r.status.toLowerCase() === "pending").length;
    approvedCountEl.textContent = data.filter(r => r.status.toLowerCase() === "approved").length;
    resolvedCountEl.textContent = data.filter(r => r.status.toLowerCase() === "resolved").length;
}

/**
 * 3. Render reports to HTML table
 */
function renderTable(dataToDisplay) {
    reportTable.innerHTML = "";

    if (dataToDisplay.length === 0) {
        noResults.style.display = "block";
        noResults.innerHTML = `
    <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <h4>No reports found</h4>
        <p>Try changing the filter, or report a new item.</p>
    </div>
`;
        return;
    }

    noResults.style.display = "none";

    dataToDisplay.forEach(item => {
        const tr = document.createElement("tr");

        const typeClass = item.type.toLowerCase() === "lost" ? "lost" : "found";
        const statusClass = item.status.toLowerCase();

        tr.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td><span class="type ${typeClass}">${escapeHtml(item.type)}</span></td>
            <td>${escapeHtml(item.date)}</td>
            <td><span class="status ${statusClass}">${escapeHtml(item.status)}</span></td>
        `;

        reportTable.appendChild(tr);
    });
}

/**
 * 4. Filter and search handler
 */
function handleFilter() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();

    const filtered = reports.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" ||
            item.status.toLowerCase() === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    renderTable(filtered);
}

/**
 * Helper: Prevent XSS injection in dynamic content
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
searchInput.addEventListener("input", handleFilter);
statusFilter.addEventListener("change", handleFilter);

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadReports);