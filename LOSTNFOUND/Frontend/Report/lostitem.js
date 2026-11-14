document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LIVE IMAGE PREVIEW LOGIC (Optional Photo)
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
    const lostForm = document.getElementById('lostForm'); 
    
    if (submitBtn && lostForm) {
        lostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("1. Lost form submission started!");
            
            // Grab all the specific inputs from Lost.html
            const nameInput = document.getElementById('item-name');
            const colourInput = document.getElementById('colour');
            const locationInput = document.getElementById('location');
            const timeInput = document.getElementById('time'); 
            const dateInput = document.getElementById('date');
            const descInput = document.getElementById('description');
            const categoryInput = document.getElementById('category');

            // Basic validation for required fields
            if (!nameInput.value || !colourInput.value || !locationInput.value || !dateInput.value || !descInput.value) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            // Construct FormData
            const formData = new FormData();
            
            // Only append image if the user selected one (since it's optional here)
            if (photoInput.files.length > 0) {
                formData.append('image', photoInput.files[0]); 
            }
            
            // Append the rest of the text data
            formData.append('itemName', nameInput.value);
            formData.append('colour', colourInput.value);
            formData.append('location', locationInput.value);
            if (timeInput.value) formData.append('time', timeInput.value);
            formData.append('date', dateInput.value);
            formData.append('description', descInput.value);
            formData.append('category', categoryInput.value);

            console.log("2. Data packaged successfully.");

            // Retrieve JWT Token
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("WARNING: No login token found. Ensure the user is logged in.");
            }

            // UI Loading State
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            try {
                console.log("4. Sending request to backend...");
                
                // Fetch request to your backend endpoint
                const response = await fetch('http://localhost:5000/api/items/lost', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                console.log("5. Backend status:", response.status);
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Lost item reported successfully!', "success");
                    lostForm.reset();
                    previewImg.style.display = 'none';
                    previewImg.src = '';
                } else {
                    showToast(`Error: ${data.message || 'Failed to submit item'}`, "error");
                }

            } catch (error) {
                console.error('Fetch error:', error);
                showToast('Could not connect to the server. Is your Node backend running?', "error");
            } finally {
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

            window.location.href = "../homepage/INDEX.html";

        });
    }

});