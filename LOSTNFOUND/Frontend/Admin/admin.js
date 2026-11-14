const API_BASE = 'https://lostkart.onrender.com/api/admin';

function getAuthToken() {
    return localStorage.getItem('token') || '';
}

// Prevent XSS from user-submitted content
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Tab Switching
function switchTab(tabId) {
    document.getElementById('pending-section').classList.add('d-none');
    document.getElementById('claims-section').classList.add('d-none');
    document.getElementById('tab-pending-btn').classList.remove('active');
    document.getElementById('tab-claims-btn').classList.remove('active');

    document.getElementById(tabId).classList.remove('d-none');

    if (tabId === 'pending-section') {
        document.getElementById('tab-pending-btn').classList.add('active');
        loadPendingItems();
    } else {
        document.getElementById('tab-claims-btn').classList.add('active');
        loadClaims();
    }
}

// 1. Fetch pending items
async function loadPendingItems() {
    const tableBody = document.getElementById('pendingTableBody');
    const counter = document.getElementById('pendingCounter');

    tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-4">
            <span class="skeleton skeleton-title" style="width:50%;display:inline-block;"></span>
        </td></tr>
        <tr><td colspan="6" class="text-center py-4">
            <span class="skeleton skeleton-title" style="width:40%;display:inline-block;"></span>
        </td></tr>
        <tr><td colspan="6" class="text-center py-4">
            <span class="skeleton skeleton-title" style="width:45%;display:inline-block;"></span>
        </td></tr>
    `;

    try {
        const token = getAuthToken();

        const res = await fetch(`${API_BASE}/items/pending`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-danger py-4">
                <strong>Access Denied:</strong> Your session has expired. Redirecting to login...
            </td>
        </tr>
    `;
            setTimeout(function () {
                localStorage.clear();
                window.location.replace('../../login/login.html');
            }, 2000);
            return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const items = await res.json();
        counter.innerText = `${items.length} Pending`;

        if (items.length === 0) {
            tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="py-4">
                <div class="empty-state">
                    <i class="fa-solid fa-clipboard-check"></i>
                    <h4>All caught up!</h4>
                    <p>No items are pending approval right now.</p>
                </div>
            </td>
        </tr>
    `;
            return;
        }

        tableBody.innerHTML = items.map(item => {
            const img = /^https?:\/\//.test(item.imagePath || '')
                ? item.imagePath
                : 'https://placehold.co/100x100?text=No+Photo';
            const reporterName = item.reportedBy ? escapeHtml(item.reportedBy.name || "unknown") : 'Guest / Not recorded';
            const typeClass = item.status === 'lost' ? 'bg-danger' : 'bg-success';
            const title = escapeHtml(item.itemName || item.category || 'Reported Item');
            const dateReported = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';

            return `
                <tr>
                    <td>
                        <a href="${img}" target="_blank">
                            <img src="${img}" alt="${title}" class="item-thumb" onerror="this.src='https://placehold.co/100x100?text=No+Photo'">
                        </a>
                    </td>
                    <td><span class="badge ${typeClass}">${item.status.toUpperCase()}</span></td>
                    <td>
                        <strong>${title}</strong><br>
                        <small class="text-muted">Category: ${escapeHtml(item.category || 'N/A')}</small><br>
                        <small>${escapeHtml(item.description || 'No description provided')}</small>
                        ${item.secretIdentifier ? `<br><small class="text-primary"><strong>Secret:</strong> ${escapeHtml(item.secretIdentifier)}</small>` : ''}
                    </td>
                    <td>
                        <i class="fa-solid fa-location-dot text-danger"></i> ${escapeHtml(item.location || 'Unknown')}<br>
                        <small class="text-muted"><i class="fa-solid fa-calendar"></i> ${dateReported}</small>
                    </td>
                    <td><small><strong>${reporterName}</strong></small></td>
                    <td>
                        <div class="d-flex flex-column gap-1" style="min-width: 175px;">
                            <!-- Option 1: Show original uploaded photo -->
                            <button class="btn btn-sm btn-success text-start" onclick="reviewItem('${item._id}', 'approved', true)">
                                <i class="fa-solid fa-image me-1"></i> Approve (Show Photo)
                            </button>

                            <!-- Option 2: Hide original photo (uses placeholder) -->
                            <button class="btn btn-sm btn-warning text-dark text-start" onclick="reviewItem('${item._id}', 'approved', false)">
                                <i class="fa-solid fa-eye-slash me-1"></i> Approve (Hide Photo)
                            </button>

                            <!-- Option 3: Reject -->
                            <button class="btn btn-sm btn-outline-danger text-start" onclick="reviewItem('${item._id}', 'rejected')">
                                <i class="fa-solid fa-xmark me-1"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load pending items:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load items. Make sure your server is running on port 5000.</td></tr>`;
    }
}

// 2. Approve or Reject an item with showImage flag
async function reviewItem(id, status, showImage = true) {
    let rejectionReason = '';

    if (status === 'rejected') {
        rejectionReason = prompt("Reason for rejection (e.g. duplicate, spam, unclear details):");
        if (!rejectionReason) return;
    } else {
        const modeText = showImage ? "with its uploaded photo visible" : "with the photo HIDDEN (default placeholder)";
        if (!confirm(`Approve this item ${modeText}?`)) return;
    }

    try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/items/${id}/moderate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status,
                showImage,
                rejectionReason
            })
        });

        const data = await res.json();
        if (res.ok) {
            showToast(status === 'approved'
                ? `Item Approved! Photo visibility: ${showImage ? 'Original Photo' : 'Hidden Placeholder'}.`
                : 'Item Rejected.', "success");
            loadPendingItems();
        } else {
            showToast(data.message || 'Error updating item.', "error");
        }
    } catch (err) {
        console.error("Action error:", err);
        showToast("Failed to communicate with server.", "error");
    }
}


// 4. Decide Claim
async function handleClaimDecision(claimId, status) {
    let adminNotes = '';
    if (status === 'rejected') {
        adminNotes = prompt("Enter reason for rejecting this claim:");
        if (!adminNotes) return;
    } else {
        if (!confirm("Verify this claim? The item will be marked as claimed and removed from public inventory.")) return;
    }

    try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/claims/${claimId}/decide`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, adminNotes })
        });

        if (res.ok) {
            showToast(`Claim ${status === 'verified' ? 'Verified! Item removed from public inventory.' : 'Rejected.'}`, "success");
            loadClaims();
        } else {
            const err = await res.json();
            showToast(err.message || 'Action failed.', "error");
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadClaims() {
    const container = document.getElementById('claimsContainer');
    const counter = document.getElementById('claimsCounter');

    try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/claims`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // ✅ Check 401/403 BEFORE the generic throw
        if (res.status === 401 || res.status === 403) {
            container.innerHTML = `<div class="p-4 text-center text-danger bg-white rounded shadow-sm">
        Access Denied. Your session has expired. Redirecting to login...</div>`;
            setTimeout(function () {
                localStorage.clear();
                window.location.replace('../../login/login.html');
            }, 2000);
            return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const claims = await res.json();
        counter.innerText = `${claims.length} Claims`;

        if (claims.length === 0) {
            container.innerHTML = `
        <div class="empty-state bg-white rounded shadow-sm">
            <i class="fa-solid fa-clipboard-check"></i>
            <h4>No claims to review</h4>
            <p>When users claim found items, they'll appear here.</p>
        </div>
    `;
            return;
        }

        container.innerHTML = claims.map(claim => {
            const item = claim.itemId || {};
            const claimant = claim.claimantId || {};
            const itemImg = item.imagePath || 'https://placehold.co/100x100?text=No+Photo';

            // Displays Cloudinary image stored in LO$TKART/claims_proof
            const proofDisplay = claim.proofImageUrl ? `
                <div class="mt-2 p-2 border rounded bg-light">
                    <small class="text-muted d-block fw-bold mb-1"><i class="fa-solid fa-paperclip"></i> Attached Bill / Old Photo:</small>
                    <a href="${claim.proofImageUrl}" target="_blank">
                        <img src="${claim.proofImageUrl}" style="max-height: 100px; max-width: 150px; border-radius: 6px; border: 1px solid #ccc; object-fit: cover;">
                    </a>
                    <div style="font-size: 11px;" class="text-primary mt-1">Click image to view full-resolution</div>
                </div>
            ` : '<div class="mt-2 text-muted small"><em>No proof document attached.</em></div>';

            let statusBadge = '<span class="badge bg-warning text-dark">Under Review</span>';
            if (claim.status === 'verified') statusBadge = '<span class="badge bg-success">Verified & Claimed</span>';
            if (claim.status === 'rejected') statusBadge = '<span class="badge bg-danger">Rejected</span>';

            return `
                <div class="claim-card p-3 mb-3 border rounded bg-white shadow-sm">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <div>
                            <h5 class="m-0">${escapeHtml(item.itemName || 'Found Item Claim')}</h5>
                            <small class="text-muted">Submitted on: ${new Date(claim.createdAt).toLocaleString()}</small>
                        </div>
                        <div>${statusBadge}</div>
                    </div>

                    <div class="row">
                        <!-- Founder / Item Details -->
                        <div class="col-md-5 border-end">
                            <h6 class="text-primary"><i class="fa-solid fa-box"></i> Found Item Data</h6>
                            <div class="d-flex gap-3 mt-2">
                                <img src="${itemImg}" class="item-thumb" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                                <div>
                                    <p class="mb-1"><strong>Location:</strong> ${escapeHtml(item.location || 'N/A')}</p>
                                    <p class="mb-1"><strong>Category:</strong> ${escapeHtml(item.category || 'N/A')}</p>
                                    <small class="text-muted d-block">${escapeHtml(item.description || 'No description')}</small>
                                </div>
                            </div>
                            ${item.secretIdentifier ? `
                                <div class="mt-2 p-2 rounded secret-box">
                                    <strong><i class="fa-solid fa-key"></i> Founder Secret:</strong> ${escapeHtml(item.secretIdentifier)}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Claimant Details & Stored Verification Proof -->
                        <div class="col-md-7">
                            <h6 class="text-primary"><i class="fa-solid fa-user-check"></i> Claimant Identity & Proof</h6>
                            <div class="bg-light p-2 rounded mb-2 small">
                                <strong>Claimant:</strong> ${escapeHtml(claimant.name || 'N/A')} (Roll No: ${escapeHtml(claimant.rollNo || 'N/A')}) | 
                                <strong>Phone:</strong> ${escapeHtml(claimant.phone || 'N/A')} | 
                                <strong>Email:</strong> ${escapeHtml(claimant.email || 'N/A')}
                            </div>

                            <!-- The 5 Verification Fields (Permanently kept in MongoDB) -->
                            <div class="bg-white p-3 border rounded small">
                                <p class="mb-1"><strong>1. Brand:</strong> ${escapeHtml(claim.brand || '<span class="text-muted">Not specified</span>')}</p>
                                <p class="mb-1"><strong>2. Unique Marks:</strong> <span class="bg-warning-subtle text-dark px-1 rounded">${escapeHtml(claim.uniqueMarks || 'N/A')}</span></p>
                                <p class="mb-1"><strong>3. Distinctive Feature:</strong> <span class="bg-warning-subtle text-dark px-1 rounded">${escapeHtml(claim.distinctiveFeature || 'N/A')}</span></p>
                                <p class="mb-1"><strong>4. Content Inside:</strong> ${escapeHtml(claim.contentInside || '<span class="text-muted">None specified</span>')}</p>
                                <p class="mb-0"><strong>5. Additional Info:</strong> ${escapeHtml(claim.additionalInfo || '<span class="text-muted">None</span>')}</p>
                            </div>

                            ${proofDisplay}

                            <div class="mt-3 text-end">
                                ${claim.status === 'pending' ? `
                                    <button class="btn btn-sm btn-success me-2" onclick="handleClaimDecision('${claim._id}', 'verified')">
                                        <i class="fa-solid fa-check"></i> Verify & Hand Over
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="handleClaimDecision('${claim._id}', 'rejected')">
                                        <i class="fa-solid fa-xmark"></i> Reject Claim
                                    </button>
                                ` : `
                                    <small class="text-muted"><i class="fa-solid fa-lock"></i> Resolved. Verification audit log retained in database.</small>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load claims:', error);
        container.innerHTML = `<div class="p-4 text-center text-danger bg-white rounded shadow-sm">Failed to load claims.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadPendingItems);