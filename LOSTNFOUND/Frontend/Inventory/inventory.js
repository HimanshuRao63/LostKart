let allItems = [];
let sortDescending = true;

// 1. Fetch approved items from backend
async function fetchItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    container.innerHTML = `
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
`;

    try {
        const response = await fetch('http://localhost:5000/api/items');
        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        allItems = await response.json();

        // Check query parameters (e.g. ?category=electronics)
        const urlParams = new URLSearchParams(window.location.search);
        const requestedCategory = (urlParams.get('category') || 'all').toLowerCase();

        const matchingBtn = Array.from(document.querySelectorAll('.cat-btn')).find(btn => {
            const onclickAttr = btn.getAttribute('onclick') || '';
            return onclickAttr.toLowerCase().includes(`'${requestedCategory}'`);
        });

        filterByCategory(requestedCategory, matchingBtn);

    } catch (error) {
        console.error('Error fetching inventory:', error);
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #e11d48; padding: 40px 0;">Failed to load items from database.</p>';
    }
}

// 2. Render item cards into the container
function displayItems(items) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fa-solid fa-box-open"></i>
            <h4>No items in this category</h4>
            <p>Check back later — new items appear after admin approval.</p>
        </div>
    `;
        return;
    }

    container.innerHTML = items.map(item => {
        const itemName = escapeHtml(item.itemName || item.title || item.category || 'Reported Item');
        const imageSrc = item.imagePath || 'https://placehold.co/400x300?text=No+Image';
        const itemLocation = escapeHtml(item.location || 'Unknown location');
        const itemCategory = escapeHtml(item.category || 'other');
        const itemType = item.status === 'lost' ? 'Lost' : 'Found';

        return `
            <div class="item-card" data-category="${itemCategory}" onclick="openItemModal('${item._id}')">
                <div class="item-image">
                    <img src="${imageSrc}" 
                         alt="${itemName}" 
                         loading="lazy"
                         onerror="this.src='https://placehold.co/400x300?text=Image+Unavailable'">
                </div>
                                <div class="item-info">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:8px;">
                        <h3 style="margin:0; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${itemName}
                        </h3>
                        <span style="font-size:10px; padding:3px 9px; border-radius:9999px; background: ${item.status === 'lost' ? '#fee2e2; color:#991b1b;' : '#dcfce7; color:#166534;'} font-weight:700; text-transform:uppercase; letter-spacing:0.03em; flex-shrink:0;">
                            ${itemType}
                        </span>
                    </div>
                    <p style="margin:0; font-size:12.5px; color:#64748b; display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-location-dot" style="color:#94a3b8; font-size:11px;"></i>
                        ${itemLocation}
                    </p>
                    <p style="margin:6px 0 0; font-size:11.5px; color:#94a3b8; display:flex; align-items:center; gap:5px;">
                        <i class="fa-regular fa-calendar" style="font-size:11px;"></i>
                        ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

// 3. Category filtering
function filterByCategory(category, clickedBtn) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    } else {
        const firstBtn = document.querySelector('.cat-btn');
        if (firstBtn) firstBtn.classList.add('active');
    }

    if (category === 'all') {
        displayItems(allItems);
    } else {
        const filtered = allItems.filter(item => {
            const cat = (item.category || '').toLowerCase();
            return cat === category.toLowerCase();
        });
        displayItems(filtered);
    }
}

// 4. Item Detail Modal
function openItemModal(itemId) {
    const item = allItems.find(i => i._id === itemId);
    if (!item) return;

    const modalImg = document.getElementById('modalItemImage');
    if (modalImg) modalImg.src = item.imagePath || 'https://placehold.co/400x300?text=No+Image';

    const modalName = document.getElementById('modalItemName');
    if (modalName) modalName.textContent = item.itemName || item.category || 'Reported Item';

    const modalType = document.getElementById('modalItemType');
    if (modalType) modalType.textContent = (item.status || 'found').toUpperCase();

    const modalCat = document.getElementById('modalItemCategory');
    if (modalCat) modalCat.textContent = item.category || 'General';

    const modalLoc = document.getElementById('modalItemLocation');
    if (modalLoc) modalLoc.textContent = item.location || 'Unknown';

    const modalCol = document.getElementById('modalItemColour');
    if (modalCol) modalCol.textContent = item.colour || 'N/A';

    const modalDate = document.getElementById('modalItemDate');
    if (modalDate) modalDate.textContent = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';

    const actionContainer = document.getElementById('modalActionContainer');
    if (actionContainer) {
        if (item.status === 'found') {
            actionContainer.innerHTML = `
    <button class="claim-btn" onclick="openClaimModal('${item._id}')">
        <i class="fa-solid fa-shield-heart me-1"></i> Claim This Item
    </button>
`;
        } else {
            actionContainer.innerHTML = '';
        }
    }

    const overlay = document.getElementById('itemModalOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeItemModal() {
    const overlay = document.getElementById('itemModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Close detail modal when clicking outside
const modalOverlay = document.getElementById('itemModalOverlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === this) closeItemModal();
    });
}

// 5. Open Verification UI Modal
function openClaimModal(itemId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Please log in first to submit an ownership claim.", "error");
        window.location.href = "../login/login.html";   // ✅ lowercase
        return;
    }

    // Look up the item safely (no string injection)
    const item = allItems.find(i => i._id === itemId);
    const itemName = item
        ? (item.itemName || item.category || 'this item')
        : 'this item';

    closeItemModal();
    document.getElementById('claimItemId').value = itemId;
    document.getElementById('modalItemNameText').innerText = itemName;  // textContent is safe
    document.getElementById('claimForm').reset();

    const claimModal = new bootstrap.Modal(document.getElementById('claimModal'));
    claimModal.show();
}

async function submitClaimForm(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const itemId = document.getElementById('claimItemId').value;

    // Use FormData for file transmission to Multer
    const formData = new FormData();
    formData.append('brand', document.getElementById('claimBrand').value.trim());
    formData.append('uniqueMarks', document.getElementById('claimUniqueMarks').value.trim());
    formData.append('distinctiveFeature', document.getElementById('claimDistinctiveFeature').value.trim());
    formData.append('contentInside', document.getElementById('claimContentInside').value.trim());
    formData.append('additionalInfo', document.getElementById('claimAdditionalInfo').value.trim());

    // File input for the bill or old photo
    const fileInput = document.getElementById('claimProofImage');
    if (fileInput && fileInput.files[0]) {
        formData.append('proofImage', fileInput.files[0]);
    }

    try {
        const res = await fetch(`http://localhost:5000/api/items/${itemId}/claim`, {
            method: 'POST',
            headers: {
                // Do NOT set 'Content-Type' here; browser sets multipart boundaries automatically
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            showToast("Your claim and proof image have been submitted! The administrator will review your details.", "success");
            const modalEl = document.getElementById('claimModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        } else {
            showToast(data.message || data.error || "Failed to submit claim.", "error");
        }
    } catch (err) {
        console.error("Claim error:", err);
        showToast("Server error while submitting claim.", "error");
    }
}

// 7. Sort toggle handler
const sortBtn = document.getElementById('sortToggleBtn');
if (sortBtn) {
    sortBtn.addEventListener('click', () => {
        sortDescending = !sortDescending;
        allItems.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return sortDescending ? dateB - dateA : dateA - dateB;
        });

        // ✅ Read category from onclick attribute (not textContent)
        const activeBtn = document.querySelector('.cat-btn.active');
        let category = 'all';
        if (activeBtn) {
            const match = (activeBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
            if (match) category = match[1];
        }
        filterByCategory(category, activeBtn);
    });
}

// 8. Sanitizer Helper
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', fetchItems);

// Back to Home Button

document.addEventListener("DOMContentLoaded", function () {

    const backHomeBtn = document.getElementById("backHomeBtn");

    if (backHomeBtn) {
        backHomeBtn.addEventListener("click", function () {

            window.location.href = "../homepage/INDEX.html";

        });
    }

});

