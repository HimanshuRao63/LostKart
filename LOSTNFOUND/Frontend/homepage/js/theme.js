(function () {
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }

    // Function to toggle theme
    window.toggleTheme = function () {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        if (currentTheme === "dark") {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
            updateIcon("light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            updateIcon("dark");
        }
    };

    function updateIcon(theme) {
        const icons = document.querySelectorAll(".theme-toggle i");
        icons.forEach(icon => {
            if (theme === "dark") {
                icon.className = "fa-solid fa-sun";
            } else {
                icon.className = "fa-solid fa-moon";
            }
        });
    }

    // Set correct icon on load
    document.addEventListener("DOMContentLoaded", () => {
        updateIcon(localStorage.getItem("theme") || "light");
    });
})();
