document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profileForm");
    const resetBtn = document.getElementById("resetbtn");
    const messageBox = document.getElementById("profileMessage");
    const backHomeBtn = document.getElementById("backHomeBtn");
    const saveBtn = profileForm.querySelector(".save-btn");

    const API_URL = "https://lostkart.onrender.com/api/user/profile";
    const fieldIds = ["name", "email", "mobile", "rollno", "course"];
    let originalValues = {};

    // Read cached user object from localStorage
    function getSavedProfile() {
        try {
            const raw =
                localStorage.getItem("lostkartUser") ||
                localStorage.getItem("user") ||
                localStorage.getItem("currentUser");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed.user ? parsed.user : parsed;
        } catch (error) {
            console.error("Error reading profile from localStorage:", error);
            return null;
        }
    }

    // Retrieve JWT token from localStorage or inside saved user object
    function getAuthToken() {
        const directToken =
            localStorage.getItem("token") ||
            localStorage.getItem("jwt_token") ||
            localStorage.getItem("authToken");

        if (directToken && directToken !== "undefined" && directToken !== "null") {
            return directToken;
        }

        try {
            const raw =
                localStorage.getItem("lostkartUser") ||
                localStorage.getItem("user");
            if (raw) {
                const parsed = JSON.parse(raw);
                return parsed.token || parsed.jwt || parsed.accessToken || null;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    // Save updated profile back to localStorage
    function saveProfileToLocal(updatedFields) {
        const current = getSavedProfile() || {};
        const merged = {
            ...current,
            ...updatedFields
        };

        localStorage.setItem("lostkartUser", JSON.stringify(merged));
        if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(merged));
        }
        return merged;
    }

    // Display messages
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = "message " + type;
    }

    // Tool 1: Adds the red border and text
    function setFieldError(id, message) {
        const field = document.getElementById(id);
        if (!field) return;
        const group = field.closest('.form-group');
        if (!group) return;

        group.classList.add('has-error');

        let err = group.querySelector('.form-error');
        if (!err) {
            err = document.createElement('span');
            err.className = 'form-error';
            group.appendChild(err);
        }
        err.textContent = message;
    }

    // Tool 2: Removes the red border and text
    function clearFieldErrors() {
        document.querySelectorAll('.form-group.has-error').forEach(g => {
            g.classList.remove('has-error');
            const err = g.querySelector('.form-error');
            if (err) err.remove();
        });
    }


    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "message";
    }

    // Save the current field values as the reset point
    function takeSnapshot() {
        originalValues = {};
        fieldIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) originalValues[id] = el.value;
        });
    }

    // Enable or disable a field
    function setEditable(id, editable) {
        const field = document.getElementById(id);
        const button = document.querySelector('.edit-btn[data-edit="' + id + '"]');

        if (!field || !button) return;

        field.readOnly = !editable;
        button.classList.toggle("active", editable);
        button.textContent = editable ? "✓" : "✎";
        button.title = editable ? "Finish editing" : "Edit this field";
    }

    // Lock all editable fields back to read-only
    function lockAllFields() {
        fieldIds.forEach(function (id) {
            setEditable(id, false);
        });
    }

    // Populate form inputs from a user object
    function populateFields(user) {
        document.getElementById("name").value =
            user.name || user.fullName || user.username || "";

        document.getElementById("email").value =
            user.email || "";

        document.getElementById("mobile").value =
            user.mobile || user.phone || user.phoneNumber || user.mobileNumber || user.contactNumber || "";

        document.getElementById("rollno").value =
            user.rollno || user.rollNo || user.rollNumber || "";

        // ✅ Safe guard — matches the pattern used for other optional fields
        const courseEl = document.getElementById("course");
        if (courseEl) {
            courseEl.value = user.course || user.department || user.branch || "";
        }

        lockAllFields();
        takeSnapshot();
    }

    // 1. Load Profile on Page Open
    async function loadProfile() {
        const localUser = getSavedProfile();
        const token = getAuthToken();

        // Immediately show local data if available so fields aren't blank
        if (localUser) {
            populateFields(localUser);
        }

        // Fetch fresh data from backend if token or user ID/email exists
        const userId = localUser && (localUser._id || localUser.id || localUser.userId);
        const userEmail = localUser && localUser.email;

        if (!token && !userId && !userEmail) {
            if (!localUser) {
                takeSnapshot();
                showMessage("No saved profile found. Please register or sign in first.", "info");
            }
            return;
        }

        try {
            const queryParams = new URLSearchParams();
            if (userId) queryParams.set("userId", userId);
            if (userEmail) queryParams.set("email", userEmail);

            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
                method: "GET",
                headers: headers
            });

            if (response.ok) {
                const dbUser = await response.json();
                const merged = saveProfileToLocal(dbUser);
                populateFields(merged);
            }
        } catch (error) {
            console.warn("Backend profile fetch skipped or offline, using local profile:", error);
        }
    }

    // 2. Edit Button Click Handlers (✎ / ✓)
    document.querySelectorAll(".edit-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const id = button.dataset.edit;
            const field = document.getElementById(id);

            if (!field) return;

            clearMessage();

            if (field.readOnly) {
                setEditable(id, true);
                field.focus();
            } else {
                setEditable(id, false);
            }
        });
    });

    // 3. Save Changes Button (Form Submit)
    profileForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessage();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const mobile = document.getElementById("mobile").value.trim();
        const rollno = document.getElementById("rollno").value.trim();
        // const course = document.getElementById("course").value.trim();

        // Validate editable fields (Email & Mobile)

        clearFieldErrors(); // Clears any old red boxes first

        if (!email) {
            setFieldError("email", "Email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError("email", "Enter a valid email address.");
            return;
        }

        if (!mobile) {
            setFieldError("mobile", "Mobile number is required.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            setFieldError("mobile", "Enter a valid 10-digit mobile number.");
            return;
        }

        const localUser = getSavedProfile() || {};
        const token = getAuthToken();

        const payload = {
            userId: localUser._id || localUser.id || localUser.userId || null,
            originalEmail: originalValues.email || localUser.email || email,
            name: name || localUser.name || "",
            email: email,
            mobile: mobile,
            phone: mobile,
            rollno: rollno || localUser.rollno || localUser.rollNo || "",
            rollNo: rollno || localUser.rollno || localUser.rollNo || "",
            // course: course || localUser.course || ""
        };

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(API_URL, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || "Server rejected the update.");
            }

            // Update localStorage and form snapshot with database response
            const updatedUser = saveProfileToLocal({
                ...payload,
                ...(result.user || {})
            });

            populateFields(updatedUser);
            showToast("Your profile has been updated successfully!", "success");

        } catch (error) {
            console.error("Profile update failed:", error);

            // Always update localStorage so changes persist in the browser
            const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
            if (isNetworkError) {
                const updatedLocal = saveProfileToLocal(payload);
                populateFields(updatedLocal);
                showMessage("Server unreachable — changes saved locally for now.", "info");
            } else {
                showToast(error.message || "Could not update profile.", "error");
            }
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
        }
    });

    // 4. Reset Button
    resetBtn.addEventListener("click", function () {
        clearMessage();

        fieldIds.forEach(function (id) {
            const field = document.getElementById(id);
            if (field) {
                field.value = originalValues[id] || "";
            }
            setEditable(id, false);
        });

        showMessage("Fields have been reset to the last saved values.", "info");
    });

    // 5. Back to Home Button
    if (backHomeBtn) {
        backHomeBtn.addEventListener("click", function () {
            window.location.href = "../INDEX.html";
        });
    }

    // Initialize the page
    loadProfile();
});