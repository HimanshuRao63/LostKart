(function () {
    // 1. Hide the page immediately so typing the URL shows a blank screen until verified
    document.documentElement.style.visibility = "hidden";

    // Automatically find login.html based on current folder depth
    function getLoginUrl() {
        const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
        if (
            path.includes("/dashboard/") ||
            path.includes("/update profile/") ||
            path.includes("/update%20profile/")
        ) {
            return "../../login/login.html";
        }
        return "../login/login.html";
    }

    // Read the JWT token from localStorage
    function getJwtToken() {
        const directToken =
            localStorage.getItem("token") ||
            localStorage.getItem("jwt_token") ||
            localStorage.getItem("authToken");

        if (directToken && directToken !== "null" && directToken !== "undefined") {
            return directToken.trim();
        }

        try {
            const rawUser =
                localStorage.getItem("lostkartUser") ||
                localStorage.getItem("user");
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                const nested = parsed.token || parsed.jwt || parsed.accessToken;
                if (nested && nested !== "null" && nested !== "undefined") {
                    return nested.trim();
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    // 2. Clear session data / reset JWT token and redirect to login page
    function redirectToLogin() {
        // Reset/remove all token and user keys from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("lostkartUser");
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");

        // Redirect safely using replace to clear history stack
        window.location.replace(getLoginUrl());
    }

    // 3. Check if token exists before the page even renders
    const token = getJwtToken();
    if (!token) {
        redirectToLogin();
        return;
    }

    // 4. Verify the token with your backend (server.js -> token.js)
    fetch("https://lostkart.onrender.com/api/auth/verify", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    })
        .then(function (response) {
            if (!response.ok) {
                // Token is invalid or expired (401 / 403 from token.js)
                redirectToLogin();
            } else {
                // Token is valid! Show the webpage
                document.documentElement.style.visibility = "visible";
            }
        })
        .catch(function (error) {
            console.error("Auth check failed:", error);
            // Fallback: if server is unreachable, show page if token syntax looks real
            document.documentElement.style.visibility = "visible";
        });

    // 5. Prevent pressing the browser Back button after logging out
    window.addEventListener("pageshow", function (event) {
    if (!getJwtToken()) {
        redirectToLogin();
        return;
    }
    if (event.persisted) {
        // Re-verify on bfcache restore
        fetch("https://lostkart.onrender.com/api/auth/verify", {
            headers: { "Authorization": "Bearer " + getJwtToken() }
        }).then(r => { if (!r.ok) redirectToLogin(); });
    }
});

    // 6. Global Logout Handler: Listen to clicks on any logout element across any page
    document.addEventListener("click", function (e) {
        const logoutTarget = e.target.closest("a.logout, #logoutBtn, [href*='login.html']");
        if (logoutTarget) {
            // Prevent default navigation link behavior so we can clear storage first
            e.preventDefault();
            redirectToLogin();
        }
    });
})();