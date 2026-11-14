document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LIVE IMAGE PREVIEW LOGIC
    // ==========================================
    const photoInput = document.getElementById('imageInput');
    const previewImg = document.getElementById('preview');

    if (photoInput && previewImg) {
        photoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block'; 
                }
                reader.readAsDataURL(file);
            } else {
                previewImg.style.display = 'none';
            }
        });
    }

    // ==========================================
    // 2. FORM SUBMISSION LOGIC
    // ==========================================
    const submitBtn = document.querySelector('.submit-btn');
    // Notice this targets 'uploadForm' instead of 'lostForm'
    const uploadForm = document.getElementById('uploadForm'); 
    
    if (submitBtn && uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("1. Found form submission started!");
            
            // Grab the specific inputs from found.html
            const locationInput = document.getElementById('location');
            const categoryInput = document.getElementById('category');
            const descInput = document.getElementById('description');

            // Basic validation
            if (!locationInput.value || !categoryInput.value || !descInput.value) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            // Construct FormData (Packages text + image together)
            const formData = new FormData();
            
            // For found items, the photo is usually required, but we check anyway
            if (photoInput.files.length > 0) {
                formData.append('image', photoInput.files[0]); 
            } else {
                showToast("Please upload a picture of the found item.", "error");
                return;
            }
            
            formData.append('location', locationInput.value);
            formData.append('category', categoryInput.value);
            formData.append('description', descInput.value);

            console.log("2. Data packaged successfully.");

            // Retrieve JWT Token
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("WARNING: No login token found. Ensure the user is logged in.");
            }

            // Change button to loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                console.log("4. Sending request to backend...");
                
                // Notice the endpoint ends in /found instead of /lost
                const response = await fetch('https://lostkart.onrender.com/api/items/found', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                console.log("5. Backend responded with status:", response.status);
                const data = await response.json();

                if (response.ok) {
                    showToast('Found item reported successfully!', "success");
                    uploadForm.reset();
                    previewImg.style.display = 'none';
                    previewImg.src = '';
                } else {
                    showToast(`Error: ${data.message || 'Failed to submit item'}`, "error");
                }

            } catch (error) {
                console.error('Fetch error:', error);
                showToast('Could not connect to the server. Is your Node backend running?', "error");
            } finally {
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Back to Home Button

document.addEventListener("DOMContentLoaded", function () {

    const backHomeBtn = document.getElementById("backHomeBtn");

    if (backHomeBtn) {
        backHomeBtn.addEventListener("click", function () {

            window.location.href = "../homepage/index.html";

        });
    }

});

