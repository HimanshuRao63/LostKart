document.addEventListener('DOMContentLoaded', () => {
    
    // Select the login button from your HTML
    const loginBtn = document.getElementById('logbtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevents default form submission behavior

            // Grab the values using the EXACT IDs from your HTML
            const email = document.getElementById("uid").value;
            const password = document.getElementById("pass").value;

            // Basic Validation
            if (!email || !password) {
                showToast("Please enter both username/email and password.", "error");
                return;
            }

            // UI Feedback: Change button text while processing
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            try {
                const response = await fetch("https://lostkart.onrender.com/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the JWT token for authentication on other pages
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("lostkartUser", JSON.stringify(data.user));

                    // Redirect to the homepage
                    window.location.href = "../homepage/INDEX.html";
                } else {
                    showToast(data.message || "Login failed ❌", "error");
                }

            } catch (error) {
                console.error("Login Error:", error);
                showToast("Server error. Is your Node backend running?", "error");
            } finally {
                // Restore button state if login fails
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
            }
        });
    }
});
